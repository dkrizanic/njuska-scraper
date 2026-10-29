import asyncio
from pathlib import Path
import random
import sys
from typing import Optional
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse
from playwright.async_api import BrowserContext, Page, async_playwright
from rich.console import Console

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from src.config import TargetConfig, settings
from src.database import (
    get_db_session,
    update_listing_details,
    upsert_listing_from_card,
)
from src.models import Listing, ScrapeRun, utc_now
from src.parser import has_next_page, parse_detail_page, parse_search_results_page

console = Console()

STEALTH_INIT_SCRIPT = """
Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined
});
window.chrome = {
    runtime: {}
};
Object.defineProperty(navigator, 'languages', {
    get: () => ['hr-HR', 'hr', 'en-US', 'en']
});
Object.defineProperty(navigator, 'plugins', {
    get: () => {
        const plugins = [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
            { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' }
        ];
        plugins.item = (i) => plugins[i];
        plugins.namedItem = (name) => plugins.find(p => p.name === name);
        plugins.refresh = () => {};
        return plugins;
    }
});
const getParameter = WebGLRenderingContext.prototype.getParameter;
WebGLRenderingContext.prototype.getParameter = function(parameter) {
    if (parameter === 37445) return 'Google Inc. (NVIDIA)';
    if (parameter === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)';
    return getParameter.apply(this, [parameter]);
};
if (typeof WebGL2RenderingContext !== 'undefined') {
    const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return 'Google Inc. (NVIDIA)';
        if (parameter === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)';
        return getParameter2.apply(this, [parameter]);
    };
}
"""


def build_page_url(base_url: str, page_num: int) -> str:
    """Append or update ?page=N query parameter on a Njuškalo URL."""
    if page_num <= 1:
        return base_url
    parsed = urlparse(base_url)
    query_params = parse_qs(parsed.query)
    query_params["page"] = [str(page_num)]
    new_query = urlencode(query_params, doseq=True)
    return urlunparse(parsed._replace(query=new_query))


class NjuskaloScraper:
    def __init__(
        self,
        headless: Optional[bool] = None,
        profile_dir: Optional[Path] = None,
    ) -> None:
        self.headless = settings.headless if headless is None else headless
        self.profile_dir = (
            Path(profile_dir) if profile_dir else Path(settings.browser_profile_dir)
        ).resolve()
        self.profile_dir.mkdir(parents=True, exist_ok=True)

    async def _random_delay(self, min_s: Optional[float] = None, max_s: Optional[float] = None) -> None:
        low = min_s if min_s is not None else settings.min_delay_seconds
        high = max_s if max_s is not None else settings.max_delay_seconds
        delay = random.uniform(low, high)
        await asyncio.sleep(delay)

    async def _dismiss_cookies(self, page: Page) -> None:
        """Accept Didomi / CMP cookie banner if shown."""
        selectors = [
            "#didomi-notice-agree-button",
            "button[id*='didomi-notice-agree']",
            "button:has-text('Prihvati i zatvori')",
            "button:has-text('Slažem se')",
        ]
        for sel in selectors:
            try:
                btn = page.locator(sel).first
                if await btn.is_visible(timeout=1500):
                    await btn.click()
                    await asyncio.sleep(0.8)
                    return
            except Exception:
                pass

    async def _is_captcha_or_block(self, page: Page) -> bool:
        """Detect ShieldSquare / Radware Bot Manager or Cloudflare challenge page."""
        try:
            title = (await page.title()).lower()
            content_sample = (await page.content())[:4000].lower()
            block_keywords = [
                "shieldsquare",
                "captcha",
                "validate.perfdrive.com",
                "just a moment...",
                "provjera sigurnosti",
                "bot manager",
            ]
            if any(k in title for k in block_keywords):
                return True
            if "validate.perfdrive.com" in content_sample or "captcha-delivery" in content_sample:
                return True
        except Exception:
            pass
        return False

    async def _navigate_and_verify(
        self, page: Page, url: str, wait_selector: Optional[str] = None
    ) -> str:
        """
        Navigate to URL, handle cookie consent, and wait if a CAPTCHA challenge appears.
        Returns page HTML content.
        """
        await page.goto(url, wait_until="domcontentloaded", timeout=settings.page_timeout_ms)
        await self._dismiss_cookies(page)

        if await self._is_captcha_or_block(page):
            console.print(
                "[bold yellow]⚠ Anti-bot / CAPTCHA challenge detected![/bold yellow]"
            )
            if self.headless:
                console.print(
                    "[red]Running in headless mode. Run with --no-headless (or HEADLESS=false in .env) "
                    "to solve the challenge once in your persistent browser profile.[/red]"
                )
            else:
                console.print(
                    "[cyan]Please solve the CAPTCHA in the opened browser window. "
                    "Waiting up to 90 seconds for it to clear...[/cyan]"
                )
                for _ in range(45):
                    await asyncio.sleep(2)
                    if not await self._is_captcha_or_block(page):
                        console.print("[bold green]✔ Challenge cleared! Continuing...[/bold green]")
                        break

        if wait_selector:
            try:
                await page.wait_for_selector(wait_selector, timeout=10000)
            except Exception:
                pass

        # Simulate light human scroll
        try:
            await page.mouse.wheel(0, random.randint(300, 700))
            await asyncio.sleep(0.4)
        except Exception:
            pass

        return await page.content()

    async def run_target(self, context: BrowserContext, target: TargetConfig) -> None:
        page = context.pages[0] if context.pages else await context.new_page()
        await page.add_init_script(STEALTH_INIT_SCRIPT)

        with get_db_session() as session:
            run_record = ScrapeRun(
                target_name=target.name,
                target_url=target.url,
                status="RUNNING",
            )
            session.add(run_record)
            session.commit()
            run_id = run_record.id

        max_pages_label = str(target.max_pages) if target.max_pages else "ALL"
        console.rule(f"[bold cyan]Scraping Target: {target.name}[/bold cyan]")
        console.print(f"URL: [underline]{target.url}[/underline] (Max pages: {max_pages_label})")

        pages_scraped = 0
        listings_found = 0
        new_listings = 0
        price_changes = 0
        details_fetched = 0
        urls_to_scrape_details: list[tuple[str, str]] = []  # (njuskalo_id, url)
        queued_detail_ids: set[str] = set()

        try:
            page_num = 1
            while True:
                if target.max_pages is not None and page_num > target.max_pages:
                    break

                page_url = build_page_url(target.url, page_num)
                console.print(f"\n[bold]→ Fetching search page {page_num}/{max_pages_label}:[/bold] {page_url}")

                html = await self._navigate_and_verify(
                    page, page_url, wait_selector="li.listing, li.EntityList-item"
                )
                cards = parse_search_results_page(html, category_name=target.name)

                if not cards:
                    console.print(
                        f"[yellow]No listing cards found on page {page_num}. Stopping pagination for this target.[/yellow]"
                    )
                    break

                pages_scraped += 1
                listings_found += len(cards)

                with get_db_session() as session:
                    for card in cards:
                        listing, is_new, price_changed = upsert_listing_from_card(session, card)
                        if is_new:
                            new_listings += 1
                        if price_changed:
                            price_changes += 1
                            console.print(
                                f"  [bold magenta]Price change detected[/bold magenta] for #{listing.njuskalo_id}: "
                                f"now {listing.price_eur} €"
                            )

                        # Queue for detail scrape if:
                        # 1. Details haven't been scraped yet
                        # 2. Price is missing on the search card (e.g. FeaturedStore banner cards)
                        # 3. Price changed on the search card
                        # 4. skip_existing_details is False or refresh_metrics is True
                        needs_detail = (
                            not listing.details_scraped
                            or listing.price_eur is None
                            or price_changed
                            or not target.skip_existing_details
                            or target.refresh_metrics
                        )
                        if target.scrape_details and needs_detail and listing.njuskalo_id not in queued_detail_ids:
                            queued_detail_ids.add(listing.njuskalo_id)
                            urls_to_scrape_details.append((listing.njuskalo_id, listing.url))

                console.print(
                    f"  [green]✔ Parsed {len(cards)} cards[/green] "
                    f"(New so far: {new_listings}, Queued for detail scrape: {len(urls_to_scrape_details)})"
                )

                if (target.max_pages is None or page_num < target.max_pages) and has_next_page(html):
                    page_num += 1
                    await self._random_delay()
                else:
                    break

            # Step 2: Visit individual listing detail pages
            if target.scrape_details and urls_to_scrape_details:
                # Prioritize cards that were missing price on the search page (e.g. FeaturedStore banner ads)
                with get_db_session() as session:
                    missing_price_ids = set(
                        r[0]
                        for r in session.query(Listing.njuskalo_id)
                        .filter(
                            Listing.njuskalo_id.in_([u[0] for u in urls_to_scrape_details]),
                            Listing.price_eur.is_(None),
                        )
                        .all()
                    )
                urls_to_scrape_details.sort(key=lambda pair: (0 if pair[0] in missing_price_ids else 1))

                if target.max_details is not None:
                    urls_to_scrape_details = urls_to_scrape_details[: target.max_details]
                console.print(
                    f"\n[bold cyan]Scraping {len(urls_to_scrape_details)} property detail pages...[/bold cyan]"
                )
                for idx, (njuskalo_id, detail_url) in enumerate(urls_to_scrape_details, start=1):
                    await self._random_delay()
                    console.print(
                        f"  [{idx}/{len(urls_to_scrape_details)}] Detail #{njuskalo_id}: {detail_url}"
                    )
                    try:
                        detail_html = await self._navigate_and_verify(
                            page,
                            detail_url,
                            wait_selector=".ClassifiedDetailSummary, .ClassifiedDetailBasicDetails, h1",
                        )
                        detail_data = parse_detail_page(detail_html, url=detail_url)

                        with get_db_session() as session:
                            listing_obj = (
                                session.query(Listing)
                                .filter(Listing.njuskalo_id == njuskalo_id)
                                .one_or_none()
                            )
                            if listing_obj:
                                detail_price_changed = update_listing_details(
                                    session, listing_obj, detail_data
                                )
                                if detail_price_changed:
                                    price_changes += 1
                                details_fetched += 1
                    except Exception as detail_err:
                        console.print(
                            f"  [red]✖ Failed to scrape detail #{njuskalo_id}: {detail_err}[/red]"
                        )

            with get_db_session() as session:
                run_rec = session.get(ScrapeRun, run_id)
                if run_rec:
                    run_rec.finished_at = utc_now()
                    run_rec.pages_scraped = pages_scraped
                    run_rec.listings_found = listings_found
                    run_rec.new_listings = new_listings
                    run_rec.price_changes = price_changes
                    run_rec.details_fetched = details_fetched
                    run_rec.status = "COMPLETED"

            console.print(
                f"\n[bold green]✔ Finished '{target.name}':[/bold green] "
                f"{listings_found} found | {new_listings} new | "
                f"{details_fetched} details enriched | {price_changes} price changes"
            )

        except Exception as exc:
            with get_db_session() as session:
                run_rec = session.get(ScrapeRun, run_id)
                if run_rec:
                    run_rec.finished_at = utc_now()
                    run_rec.pages_scraped = pages_scraped
                    run_rec.listings_found = listings_found
                    run_rec.new_listings = new_listings
                    run_rec.price_changes = price_changes
                    run_rec.details_fetched = details_fetched
                    run_rec.status = "FAILED"
                    run_rec.error_message = str(exc)
            console.print(f"[bold red]✖ Error during target '{target.name}': {exc}[/bold red]")
            raise

    async def run_all(self, targets: list[TargetConfig]) -> None:
        async with async_playwright() as p:
            context = await p.chromium.launch_persistent_context(
                user_data_dir=str(self.profile_dir),
                headless=self.headless,
                locale="hr-HR",
                timezone_id="Europe/Zagreb",
                viewport={"width": 1440, "height": 900},
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-first-run",
                    "--no-default-browser-check",
                ],
            )
            try:
                for target in targets:
                    await self.run_target(context, target)
            finally:
                await context.close()
