import asyncio
import re
import sys
import time
from decimal import Decimal
from typing import List, Optional
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from rich.console import Console

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from src.database import get_db_session, init_db, upsert_listing_from_card
from src.parser import parse_search_results_page

console = Console()

STEALTH_SCRIPT = """
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
window.chrome = { runtime: {} };
"""


def build_page_url(base_url: str, page_num: int) -> str:
    if page_num <= 1:
        return base_url
    parsed = urlparse(base_url)
    query = parse_qs(parsed.query)
    query["page"] = [str(page_num)]
    return urlunparse(parsed._replace(query=urlencode(query, doseq=True)))


async def fast_scrape_category(base_url: str, category_name: str, max_pages: int = 300) -> None:
    init_db()
    console.rule(f"[bold cyan]🚀 FAST SCRAPE: {category_name}[/bold cyan]")
    console.print(f"URL: {base_url} | Max pages: {max_pages}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        context = await browser.new_context(
            locale="hr-HR",
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        )
        page = await context.new_page()
        await page.add_init_script(STEALTH_SCRIPT)

        # Dismiss cookies on first load
        await page.goto(base_url, wait_until="domcontentloaded", timeout=45000)
        try:
            btn = page.locator("#didomi-notice-agree-button, button:has-text('Prihvati i zatvori')").first
            if await btn.is_visible(timeout=2000):
                await btn.click()
                await asyncio.sleep(0.5)
        except Exception:
            pass

        total_saved = 0
        total_new = 0

        for page_num in range(1, max_pages + 1):
            url = build_page_url(base_url, page_num)
            t0 = time.time()
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                html = await page.content()
                cards = parse_search_results_page(html, category_name=category_name)

                if not cards:
                    console.print(f"[yellow]Page {page_num}: No more cards found. Finished target![/yellow]")
                    break

                with get_db_session() as session:
                    for card in cards:
                        _, is_new, _ = upsert_listing_from_card(session, card)
                        if is_new:
                            total_new += 1
                        total_saved += 1

                elapsed = time.time() - t0
                console.print(
                    f"Page {page_num:3d}: [green]{len(cards)} cards[/green] parsed in {elapsed:.1f}s | "
                    f"Total new: [bold green]{total_new}[/bold green]"
                )

                # Light delay between pages (0.4s)
                await asyncio.sleep(0.4)

            except Exception as e:
                console.print(f"[red]Error on page {page_num}: {e}[/red]")
                await asyncio.sleep(2)

        await browser.close()
        console.print(f"\n[bold green]✔ Done {category_name}: {total_saved} processed, {total_new} newly added![/bold green]")


async def main():
    # 1. Scrape all Rental Apartments in Zagreb (approx. 150 pages = ~4,100 listings)
    await fast_scrape_category(
        "https://www.njuskalo.hr/iznajmljivanje-stanova/zagreb",
        "Najam stanova - Zagreb",
        max_pages=160,
    )
    # 2. Scrape all Apartment Sales in Zagreb (approx. 280 pages = ~7,800 listings)
    await fast_scrape_category(
        "https://www.njuskalo.hr/prodaja-stanova/zagreb",
        "Stanovi prodaja - Zagreb",
        max_pages=290,
    )


if __name__ == "__main__":
    asyncio.run(main())
