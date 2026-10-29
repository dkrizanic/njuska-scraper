from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

JSONType = JSON().with_variant(JSONB(), "postgresql")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class Seller(Base):
    """Tracks unique Njuškalo users, real estate agencies, and investors for platform/marketing metrics."""
    __tablename__ = "sellers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    seller_slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    profile_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    seller_type: Mapped[Optional[str]] = mapped_column(
        String(64), nullable=True, index=True
    )  # e.g. 'investitor', 'trgovina', 'privatni'
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    listings: Mapped[List["Listing"]] = relationship("Listing", back_populates="seller")


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    njuskalo_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    url: Mapped[str] = mapped_column(String(1024), nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    category_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    ad_tier: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # Regular, VauVau, Featured, FeaturedStore

    # Pricing
    price_eur: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True, index=True)
    price_per_m2_eur: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)

    # Platform & Marketing Metrics (Views / Visits & Seller relation)
    views_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    expires_countdown_raw: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    seller_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("sellers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    seller_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    seller_type: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    seller_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)

    # Location & Core Real Estate Specs
    location_summary: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    county: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    city: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    neighborhood: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)

    property_type: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    living_area_m2: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True, index=True)
    land_area_m2: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    rooms: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    floor: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    total_floors: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    year_built: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    year_renovated: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    energy_class: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    heating_type: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    parking: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Content
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Flexible JSONB/JSON columns for full Croatian attributes table & image URLs
    attributes: Mapped[Dict[str, Any]] = mapped_column(JSONType, default=dict, nullable=False)
    image_urls: Mapped[List[str]] = mapped_column(JSONType, default=list, nullable=False)

    # Dates & Status Tracking
    published_at_raw: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    details_scraped: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )
    details_scraped_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    seller: Mapped[Optional["Seller"]] = relationship("Seller", back_populates="listings")
    price_history: Mapped[List["PriceHistory"]] = relationship(
        "PriceHistory", back_populates="listing", cascade="all, delete-orphan", order_by="PriceHistory.recorded_at"
    )
    metrics_history: Mapped[List["ListingMetricHistory"]] = relationship(
        "ListingMetricHistory",
        back_populates="listing",
        cascade="all, delete-orphan",
        order_by="ListingMetricHistory.recorded_at",
    )

    __table_args__ = (
        Index("ix_listings_city_price", "city", "price_eur"),
    )


class PriceHistory(Base):
    __tablename__ = "price_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    listing_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    price_eur: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    price_per_m2_eur: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False, index=True
    )

    listing: Mapped["Listing"] = relationship("Listing", back_populates="price_history")


class ListingMetricHistory(Base):
    """Time-series snapshots of listing visits/views and price for graphing platform engagement over time."""
    __tablename__ = "listing_metrics_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    listing_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    views_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    price_eur: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False, index=True
    )

    listing: Mapped["Listing"] = relationship("Listing", back_populates="metrics_history")


class ScrapeRun(Base):
    __tablename__ = "scrape_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    target_name: Mapped[str] = mapped_column(String(255), nullable=False)
    target_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    pages_scraped: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    listings_found: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    new_listings: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    price_changes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    details_fetched: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(64), default="RUNNING", nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
