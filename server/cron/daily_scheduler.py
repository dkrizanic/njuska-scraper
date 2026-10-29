"""
Built-in daily cron runner for Njuškalo Real Estate Scraper.
Can be run continuously (`python server/cron/daily_scheduler.py`) or inside Docker.
"""
import asyncio
from datetime import datetime, time, timedelta
import os
from pathlib import Path
import sys

# Ensure repository root is on sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from rich.console import Console

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from src.config import load_targets
from src.database import init_db
from src.scraper import NjuskaloScraper

console = Console()


async def run_daily_loop(run_at_hour: int = 3, run_at_minute: int = 0, run_immediately: bool = False) -> None:
    init_db()
    if run_immediately:
        console.print("[bold cyan]Running initial immediate scrape...[/bold cyan]")
        targets = load_targets()
        scraper = NjuskaloScraper()
        await scraper.run_all(targets)

    while True:
        now = datetime.now()
        target_run = datetime.combine(now.date(), time(run_at_hour, run_at_minute))
        if target_run <= now:
            target_run += timedelta(days=1)

        wait_seconds = (target_run - now).total_seconds()
        console.print(
            f"\n[bold green]⏰ Next daily scrape scheduled for {target_run.strftime('%Y-%m-%d %H:%M:%S')} "
            f"(in {wait_seconds / 3600:.1f} hours)[/bold green]"
        )
        await asyncio.sleep(wait_seconds)

        try:
            console.rule(f"[bold cyan]Starting Daily Scheduled Scrape ({datetime.now().isoformat()})[/bold cyan]")
            targets = load_targets()
            scraper = NjuskaloScraper()
            await scraper.run_all(targets)
        except Exception as exc:
            console.print(f"[bold red]✖ Daily scrape failed: {exc}[/bold red]")


if __name__ == "__main__":
    asyncio.run(run_daily_loop(run_at_hour=3, run_at_minute=0, run_immediately=False))
