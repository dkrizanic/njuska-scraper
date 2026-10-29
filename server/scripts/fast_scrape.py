import asyncio
from pathlib import Path
import re
import sys
import time
from decimal import Decimal
from typing import List, Optional
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

# Ensure repository root is on sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

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
Object.defineProperty(navigator, 'languages', { get: () => ['hr-HR', 'hr', 'en-US', 'en'] });
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
    if page_num <= 1:
        return base_url
    parsed = urlparse(base_url)
    query = parse_qs(parsed.query)
    query["page"] = [str(page_num)]
    return urlunparse(parsed._replace(query=urlencode(query, doseq=True)))


async def fast_scrape_category(base_url: str, category_name: str, max_pages: int = 300) -> None:
    init_db()
    console.rule(f"[bold cyan]FAST SCRAPE: {category_name}[/bold cyan]")
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
        consecutive_empty = 0

        for current_page in range(1, max_pages + 1):
            page_url = build_page_url(base_url, current_page)
            t0 = time.time()
            try:
                await page.goto(page_url, wait_until="domcontentloaded", timeout=45000)
                html = await page.content()
                listings = parse_search_results_page(html, category_name)

                if not listings:
                    consecutive_empty += 1
                    console.print(f"[yellow]Page {current_page}: 0 listings found.[/yellow]")
                    if consecutive_empty >= 2:
                        console.print(f"[bold green]Reached end of results at page {current_page}.[/bold green]")
                        break
                    await asyncio.sleep(1.0)
                    continue

                consecutive_empty = 0
                saved = 0
                with get_db_session() as session:
                    for item in listings:
                        upsert_listing_from_card(session, item)
                        saved += 1
                    session.commit()

                total_saved += saved
                dur = time.time() - t0
                console.print(f"Page {current_page:3d} | Saved {saved:2d} ads | Total: {total_saved:5d} | {dur:.2f}s")

                await asyncio.sleep(0.4)
            except Exception as e:
                console.print(f"[bold red]Error on page {current_page}: {e}[/bold red]")
                await asyncio.sleep(2.0)

        await browser.close()
        console.print(f"[bold green]Done! Total saved for {category_name}: {total_saved}[/bold green]")


async def main():
    targets = [
        ("https://www.njuskalo.hr/prodaja-stanova/zagreb", "Stanovi Zagreb - Prodaja", 350),
        ("https://www.njuskalo.hr/iznajmljivanje-stanova/zagreb", "Stanovi Zagreb - Najam", 180),
    ]
    for url, cat, pages in targets:
        await fast_scrape_category(url, cat, max_pages=pages)


if __name__ == "__main__":
    asyncio.run(main())
