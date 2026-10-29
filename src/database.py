from contextlib import contextmanager
from decimal import Decimal
from typing import Any, Dict, Generator, Optional, Tuple
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from src.config import settings
from src.models import (
    Base,
    Listing,
    ListingMetricHistory,
    PriceHistory,
    ScrapeRun,
    Seller,
    utc_now,
)

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_db() -> None:
    """Create database tables if they don't exist."""
    Base.metadata.create_all(bind=engine)


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def _compute_price_per_m2(
    price_eur: Optional[Decimal], area_m2: Optional[Decimal]
) -> Optional[Decimal]:
    if not price_eur or not area_m2 or area_m2 < Decimal("10"):
        return None
    # If a developer listed the price per m² directly as the main price (e.g. 3,790 € for an 85 m² flat)
    if price_eur < Decimal("10000") and area_m2 >= Decimal("15"):
        return price_eur.quantize(Decimal("0.01"))
    return (price_eur / area_m2).quantize(Decimal("0.01"))


def upsert_seller(session: Session, detail_data: Dict[str, Any]) -> Optional[Seller]:
    slug = detail_data.get("seller_slug")
    name = detail_data.get("seller_name")
    if not slug or not name:
        return None

    now = utc_now()
    stmt = select(Seller).where(Seller.seller_slug == slug)
    seller = session.execute(stmt).scalar_one_or_none()
    if seller is None:
        seller = Seller(
            seller_slug=slug,
            name=name,
            profile_url=detail_data.get("seller_url"),
            seller_type=detail_data.get("seller_type"),
            is_verified=bool(detail_data.get("seller_is_verified")),
            first_seen_at=now,
            last_seen_at=now,
        )
        session.add(seller)
        session.flush()
    else:
        seller.name = name
        seller.profile_url = detail_data.get("seller_url") or seller.profile_url
        seller.seller_type = detail_data.get("seller_type") or seller.seller_type
        if detail_data.get("seller_is_verified"):
            seller.is_verified = True
        seller.last_seen_at = now
    return seller


def upsert_listing_from_card(
    session: Session, card_data: Dict[str, Any]
) -> Tuple[Listing, bool, bool]:
    """
    Insert or update a listing from a search result card.
    Returns (listing, is_new, price_changed).
    """
    njuskalo_id = str(card_data["njuskalo_id"])
    stmt = select(Listing).where(Listing.njuskalo_id == njuskalo_id)
    listing = session.execute(stmt).scalar_one_or_none()

    new_price: Optional[Decimal] = card_data.get("price_eur")
    now = utc_now()

    if listing is None:
        area = card_data.get("living_area_m2")
        pm2 = _compute_price_per_m2(new_price, area)
        listing = Listing(
            njuskalo_id=njuskalo_id,
            url=card_data["url"],
            title=card_data["title"],
            category_name=card_data.get("category_name"),
            ad_tier=card_data.get("ad_tier"),
            price_eur=new_price,
            price_per_m2_eur=pm2,
            living_area_m2=area,
            location_summary=card_data.get("location_summary"),
            published_at_raw=card_data.get("published_at_raw"),
            published_at=card_data.get("published_at"),
            image_urls=card_data.get("image_urls") or [],
            attributes={},
            first_seen_at=now,
            last_seen_at=now,
            is_active=True,
        )
        session.add(listing)
        session.flush()

        if new_price is not None:
            session.add(
                PriceHistory(
                    listing_id=listing.id,
                    price_eur=new_price,
                    price_per_m2_eur=pm2,
                    recorded_at=now,
                )
            )
        return listing, True, False

    # Existing listing: check if price changed
    price_changed = False
    if new_price is not None and listing.price_eur != new_price:
        price_changed = True
        listing.price_eur = new_price

    if card_data.get("living_area_m2") and not listing.living_area_m2:
        listing.living_area_m2 = card_data["living_area_m2"]

    listing.price_per_m2_eur = _compute_price_per_m2(
        listing.price_eur, listing.living_area_m2
    )

    if price_changed:
        session.add(
            PriceHistory(
                listing_id=listing.id,
                price_eur=new_price,
                price_per_m2_eur=listing.price_per_m2_eur,
                recorded_at=now,
            )
        )

    listing.title = card_data.get("title") or listing.title
    listing.url = card_data.get("url") or listing.url
    listing.ad_tier = card_data.get("ad_tier") or listing.ad_tier
    listing.location_summary = card_data.get("location_summary") or listing.location_summary
    listing.last_seen_at = now
    listing.is_active = True

    return listing, False, price_changed


def update_listing_details(
    session: Session, listing: Listing, detail_data: Dict[str, Any]
) -> bool:
    """
    Enrich a Listing record with full detail page attributes, price, seller/user profile, and views count.
    Returns True if a price change was detected on the detail page.
    """
    now = utc_now()
    price_changed = False

    # Upsert Seller / User record for platform metrics
    seller = upsert_seller(session, detail_data)
    if seller:
        listing.seller_id = seller.id

    detail_price: Optional[Decimal] = detail_data.get("price_eur")
    had_previous_price = listing.price_eur is not None
    if detail_price is not None and listing.price_eur != detail_price:
        if had_previous_price:
            price_changed = True
        listing.price_eur = detail_price

    for field in [
        "title",
        "county",
        "city",
        "neighborhood",
        "location_summary",
        "property_type",
        "living_area_m2",
        "land_area_m2",
        "rooms",
        "floor",
        "total_floors",
        "year_built",
        "year_renovated",
        "energy_class",
        "heating_type",
        "parking",
        "description",
        "seller_name",
        "seller_type",
        "seller_url",
        "views_count",
        "expires_countdown_raw",
        "published_at_raw",
        "published_at",
    ]:
        val = detail_data.get(field)
        if val is not None:
            setattr(listing, field, val)

    if detail_data.get("attributes"):
        merged_attrs = dict(listing.attributes or {})
        merged_attrs.update(detail_data["attributes"])
        listing.attributes = merged_attrs

    if detail_data.get("image_urls"):
        listing.image_urls = detail_data["image_urls"]

    listing.price_per_m2_eur = _compute_price_per_m2(
        listing.price_eur, listing.living_area_m2
    )

    # Record initial price history if card lacked a price (like FeaturedStore banners) or if price changed
    if detail_price is not None and (not had_previous_price or price_changed):
        session.add(
            PriceHistory(
                listing_id=listing.id,
                price_eur=detail_price,
                price_per_m2_eur=listing.price_per_m2_eur,
                recorded_at=now,
            )
        )

    # Always record a metric snapshot (views_count + price_eur) when detail page is visited
    if detail_data.get("views_count") is not None or listing.price_eur is not None:
        session.add(
            ListingMetricHistory(
                listing_id=listing.id,
                views_count=detail_data.get("views_count"),
                price_eur=listing.price_eur,
                recorded_at=now,
            )
        )

    listing.details_scraped = True
    listing.details_scraped_at = now
    listing.last_seen_at = now
    return price_changed
