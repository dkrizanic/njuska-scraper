import asyncio
from pathlib import Path
import sys
from typing import Optional
import typer
from rich.console import Console
from rich.table import Table
from sqlalchemy import desc, func, select

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from src.config import TargetConfig, load_targets
from src.database import get_db_session, init_db
from src.models import Listing, ListingMetricHistory, PriceHistory, Seller
from src.scraper import NjuskaloScraper

app = typer.Typer(
    name="njuskalo-scraper",
    help="Njuškalo Croatia Real Estate (Nekretnine) Scraper with Playwright, PostgreSQL & Marketing Analytics",
    add_completion=False,
)
console = Console()


@app.command("init-db")
def cmd_init_db() -> None:
    """Create or update PostgreSQL tables (listings, sellers, price_history, listing_metrics_history, scrape_runs)."""
    init_db()
    console.print("[bold green]✔ PostgreSQL database schema initialized![/bold green]")


@app.command("scrape")
def cmd_scrape(
    url: Optional[str] = typer.Option(
        None, "--url", "-u", help="Scrape a specific Njuškalo URL instead of targets.yaml"
    ),
    name: str = typer.Option(
        "Custom CLI Target", "--name", "-n", help="Label for custom URL scrape"
    ),
    max_pages: Optional[int] = typer.Option(
        None, "--max-pages", "-p", help="Maximum pagination pages to crawl (omit to scrape ALL pages)"
    ),
    details: bool = typer.Option(
        True, "--details/--no-details", help="Visit listing detail pages for full specs, price, views, and seller metrics"
    ),
    max_details: Optional[int] = typer.Option(
        None, "--max-details", "-d", help="Maximum number of property detail pages to scrape per target (omit for ALL)"
    ),
    refresh_metrics: bool = typer.Option(
        False, "--refresh-metrics", help="Revisit already-scraped detail pages to snapshot updated views/visits counts"
    ),
    headless: Optional[bool] = typer.Option(
        None,
        "--headless/--no-headless",
        help="Run Chromium headless or visible",
    ),
    config_file: Path = typer.Option(
        Path("targets.yaml"), "--config", "-c", help="Path to targets YAML file"
    ),
) -> None:
    """Run the Njuškalo real estate scraper and store listings, price history, views, and sellers in PostgreSQL."""
    init_db()

    if url:
        targets = [
            TargetConfig(
                name=name,
                url=url,
                max_pages=max_pages,
                scrape_details=details,
                max_details=max_details,
                refresh_metrics=refresh_metrics,
                skip_existing_details=not refresh_metrics,
            )
        ]
    else:
        targets = load_targets(config_file)
        if not targets:
            console.print(
                f"[red]No targets found in {config_file}. Provide --url or configure targets.yaml.[/red]"
            )
            raise typer.Exit(1)
        for t in targets:
            if max_pages is not None:
                t.max_pages = max_pages
            if max_details is not None:
                t.max_details = max_details
            if refresh_metrics:
                t.refresh_metrics = True

    scraper = NjuskaloScraper(headless=headless)
    asyncio.run(scraper.run_all(targets))


@app.command("stats")
def cmd_stats(
    limit: int = typer.Option(20, "--limit", "-l", help="Number of recent listings to show")
) -> None:
    """Display summary statistics, recent real estate listings, prices, and visit counts from PostgreSQL."""
    init_db()
    with get_db_session() as session:
        total_listings = session.scalar(select(func.count(Listing.id))) or 0
        with_price = (
            session.scalar(
                select(func.count(Listing.id)).where(Listing.price_eur.is_not(None))
            )
            or 0
        )
        detailed_count = (
            session.scalar(
                select(func.count(Listing.id)).where(Listing.details_scraped.is_(True))
            )
            or 0
        )
        total_sellers = session.scalar(select(func.count(Seller.id))) or 0
        total_views = (
            session.scalar(
                select(func.sum(Listing.views_count)).where(Listing.views_count.is_not(None))
            )
            or 0
        )
        avg_views = session.scalar(
            select(func.avg(Listing.views_count)).where(Listing.views_count.is_not(None))
        )
        avg_price_eur = session.scalar(
            select(func.avg(Listing.price_eur)).where(
                Listing.price_eur.is_not(None), Listing.price_eur >= 10000
            )
        )
        avg_price_m2 = session.scalar(
            select(func.avg(Listing.price_per_m2_eur)).where(
                Listing.price_per_m2_eur.is_not(None)
            )
        )

        console.rule("[bold cyan]Njuškalo Real Estate & Platform Metrics Overview[/bold cyan]")
        console.print(f"Total Listings Stored : [bold]{total_listings}[/bold] (With Price: [bold green]{with_price}[/bold green])")
        console.print(f"Full Details Scraped  : [bold]{detailed_count}[/bold]")
        console.print(f"Unique Sellers / Users: [bold]{total_sellers}[/bold]")
        console.print(
            f"Total Ad Visits/Views : [bold]{total_views:,}[/bold]"
            + (f" (Avg: [bold]{avg_views:,.1f}[/bold] visits/listing)" if avg_views else "")
        )
        if avg_price_eur:
            console.print(f"Average Property Price: [bold]{avg_price_eur:,.0f} €[/bold]")
        if avg_price_m2:
            console.print(f"Average Price / m²    : [bold]{avg_price_m2:,.2f} €/m²[/bold]")

        recent = (
            session.execute(
                select(Listing).order_by(desc(Listing.details_scraped), desc(Listing.last_seen_at)).limit(limit)
            )
            .scalars()
            .all()
        )

        if not recent:
            console.print("\n[yellow]No listings in database yet. Run `python main.py scrape` first.[/yellow]")
            return

        table = Table(title=f"Latest {len(recent)} Real Estate Listings", show_lines=False)
        table.add_column("ID", style="cyan", no_wrap=True)
        table.add_column("Title", max_width=34)
        table.add_column("Location", max_width=22)
        table.add_column("m²", justify="right")
        table.add_column("Price (€)", justify="right", style="green")
        table.add_column("€/m²", justify="right", style="yellow")
        table.add_column("Visits", justify="right", style="magenta")
        table.add_column("Seller / User", max_width=20)

        for item in recent:
            loc = item.neighborhood or item.city or item.location_summary or "-"
            area_str = f"{item.living_area_m2:,.1f}" if item.living_area_m2 else "-"
            price_str = f"{item.price_eur:,.0f} €" if item.price_eur else "-"
            pm2_str = f"{item.price_per_m2_eur:,.0f}" if item.price_per_m2_eur else "-"
            views_str = f"{item.views_count:,}" if item.views_count is not None else "-"
            seller_str = item.seller_name or "-"

            table.add_row(
                item.njuskalo_id,
                item.title[:34],
                loc[:22],
                area_str,
                price_str,
                pm2_str,
                views_str,
                seller_str[:20],
            )

        console.print()
        console.print(table)


@app.command("marketing-metrics")
def cmd_marketing_metrics() -> None:
    """Display platform & marketing analytics: seller/agency leaderboard, top visited ads, and neighborhood averages."""
    init_db()
    with get_db_session() as session:
        console.rule("[bold magenta]Platform & Marketing Analytics[/bold magenta]")

        # 1. Seller Type Breakdown (Investors vs Agencies/Stores vs Private Users)
        type_rows = session.execute(
            select(
                Listing.seller_type,
                func.count(Listing.id).label("listings_cnt"),
                func.count(func.distinct(Listing.seller_name)).label("sellers_cnt"),
                func.sum(Listing.views_count).label("total_views"),
                func.avg(Listing.views_count).label("avg_views"),
            )
            .where(Listing.seller_type.is_not(None))
            .group_by(Listing.seller_type)
            .order_by(desc("listings_cnt"))
        ).all()

        if type_rows:
            t_table = Table(title="Platform Users & Sellers Breakdown by Type")
            t_table.add_column("User / Seller Type", style="cyan")
            t_table.add_column("Unique Accounts", justify="right")
            t_table.add_column("Active Listings", justify="right")
            t_table.add_column("Total Ad Visits", justify="right", style="magenta")
            t_table.add_column("Avg Visits / Ad", justify="right")
            for r in type_rows:
                t_table.add_row(
                    r.seller_type or "unknown",
                    str(r.sellers_cnt or 0),
                    str(r.listings_cnt or 0),
                    f"{int(r.total_views or 0):,}",
                    f"{float(r.avg_views or 0):,.1f}",
                )
            console.print(t_table)

        # 2. Top Sellers / Agencies by Listing Volume & Visits
        seller_rows = session.execute(
            select(
                Listing.seller_name,
                Listing.seller_type,
                func.count(Listing.id).label("ads_count"),
                func.sum(Listing.views_count).label("total_views"),
                func.avg(Listing.price_per_m2_eur).label("avg_pm2"),
            )
            .where(Listing.seller_name.is_not(None))
            .group_by(Listing.seller_name, Listing.seller_type)
            .order_by(desc("total_views"), desc("ads_count"))
            .limit(10)
        ).all()

        if seller_rows:
            s_table = Table(title="Top 10 Sellers / Agencies by Total Ad Visits")
            s_table.add_column("Seller / Agency Name", style="bold")
            s_table.add_column("Type", style="cyan")
            s_table.add_column("Listings", justify="right")
            s_table.add_column("Total Visits", justify="right", style="magenta")
            s_table.add_column("Avg €/m²", justify="right", style="yellow")
            for r in seller_rows:
                s_table.add_row(
                    (r.seller_name or "-")[:35],
                    r.seller_type or "-",
                    str(r.ads_count),
                    f"{int(r.total_views or 0):,}",
                    f"{float(r.avg_pm2):,.0f} €" if r.avg_pm2 else "-",
                )
            console.print()
            console.print(s_table)

        # 3. Average Price & Visits by Neighborhood / District
        loc_rows = session.execute(
            select(
                Listing.neighborhood,
                func.count(Listing.id).label("cnt"),
                func.avg(Listing.price_eur).label("avg_price"),
                func.avg(Listing.price_per_m2_eur).label("avg_pm2"),
                func.avg(Listing.views_count).label("avg_views"),
            )
            .where(Listing.neighborhood.is_not(None))
            .group_by(Listing.neighborhood)
            .order_by(desc("cnt"))
            .limit(12)
        ).all()

        if loc_rows:
            l_table = Table(title="Average Prices & Visits by Neighborhood (Quart)")
            l_table.add_column("Neighborhood", style="cyan")
            l_table.add_column("Listings", justify="right")
            l_table.add_column("Avg Price (€)", justify="right", style="green")
            l_table.add_column("Avg €/m²", justify="right", style="yellow")
            l_table.add_column("Avg Visits", justify="right", style="magenta")
            for r in loc_rows:
                l_table.add_row(
                    r.neighborhood[:28],
                    str(r.cnt),
                    f"{float(r.avg_price):,.0f} €" if r.avg_price else "-",
                    f"{float(r.avg_pm2):,.0f} €" if r.avg_pm2 else "-",
                    f"{float(r.avg_views):,.1f}" if r.avg_views else "-",
                )
            console.print()
            console.print(l_table)


@app.command("price-changes")
def cmd_price_changes() -> None:
    """List properties whose price has changed over time (e.g. price drops)."""
    init_db()
    with get_db_session() as session:
        subq = (
            select(PriceHistory.listing_id)
            .group_by(PriceHistory.listing_id)
            .having(func.count(PriceHistory.id) > 1)
        )
        listings = (
            session.execute(select(Listing).where(Listing.id.in_(subq)))
            .scalars()
            .all()
        )

        if not listings:
            console.print("[yellow]No price changes recorded yet.[/yellow]")
            return

        table = Table(title="Tracked Real Estate Price Changes")
        table.add_column("Njuškalo ID", style="cyan")
        table.add_column("Title", max_width=40)
        table.add_column("Initial Price", justify="right")
        table.add_column("Current Price", justify="right")
        table.add_column("Diff (€)", justify="right")
        table.add_column("History Count", justify="center")

        for item in listings:
            history = item.price_history
            first_p = history[0].price_eur
            last_p = history[-1].price_eur
            diff_str = "-"
            if first_p is not None and last_p is not None:
                diff = last_p - first_p
                color = "green" if diff < 0 else "red"
                sign = "+" if diff > 0 else ""
                diff_str = f"[{color}]{sign}{diff:,.0f} €[/{color}]"

            table.add_row(
                item.njuskalo_id,
                item.title[:40],
                f"{first_p:,.0f} €" if first_p else "-",
                f"{last_p:,.0f} €" if last_p else "-",
                diff_str,
                str(len(history)),
            )

        console.print(table)


if __name__ == "__main__":
    app()
