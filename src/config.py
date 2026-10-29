from pathlib import Path
from typing import List
import yaml
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class TargetConfig(BaseModel):
    name: str
    url: str
    max_pages: int | None = None  # None = scrape all pages until last pagination page
    scrape_details: bool = True
    max_details: int | None = None  # None = scrape all property detail pages
    refresh_metrics: bool = False  # If True, revisit already-scraped detail pages to update views_count
    skip_existing_details: bool = True


class Settings(BaseSettings):
    database_url: str = Field(
        default="postgresql+psycopg://njuskalo:njuskalo_pass@localhost:5432/njuskalo_db",
        alias="DATABASE_URL",
    )
    headless: bool = Field(default=False, alias="HEADLESS")
    browser_profile_dir: Path = Field(
        default=Path("./browser_profile"), alias="BROWSER_PROFILE_DIR"
    )
    min_delay_seconds: float = Field(default=2.5, alias="MIN_DELAY_SECONDS")
    max_delay_seconds: float = Field(default=5.5, alias="MAX_DELAY_SECONDS")
    page_timeout_ms: int = Field(default=45000, alias="PAGE_TIMEOUT_MS")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


def load_targets(config_path: Path = Path("targets.yaml")) -> List[TargetConfig]:
    if not config_path.exists():
        return []
    with open(config_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    raw_targets = data.get("targets", [])
    return [TargetConfig(**t) for t in raw_targets]


settings = Settings()
