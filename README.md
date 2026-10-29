# Njuškalo Real Estate (Nekretnine) Scraper

A modular Python scraper for **Njuškalo.hr** real estate listings powered by **Playwright** (persistent browser profiles for anti-bot/CAPTCHA resilience), **BeautifulSoup4**, and **PostgreSQL** (`SQLAlchemy 2.0` + `JSONB` attributes + full price history tracking).

## Key Features
- **Two-Stage Real Estate Extraction**:
  1. Crawls search/category pagination pages (`EntityList-item--Regular`, `EntityList-item--VauVau`, etc.).
  2. Visits each property detail page to extract full specifications (`ClassifiedDetailSummary`, `ClassifiedDetailBasicDetails`, `ClassifiedDetailPropertyGroups`, description, seller info, and gallery images).
- **Price History Tracking**: Automatically detects price drops or increases across runs and logs every price change in the `price_history` table.
- **Persistent Browser Profile**: Stores cookies, local storage, and ShieldSquare/Cloudflare trust tokens in `./browser_profile/` so you rarely encounter CAPTCHAs after the first session.
- **Hybrid Relational + JSONB Schema**: Normalizes core real estate metrics (`price_eur`, `price_per_m2_eur`, `living_area_m2`, `land_area_m2`, `rooms`, `floor`, `year_built`, `energy_class`, `city`, `neighborhood`) while preserving all raw Croatian property attributes in a PostgreSQL `JSONB` column (`attributes`).

---

## Quick Start

### 1. Start PostgreSQL via Docker Compose
```powershell
docker compose up -d
```

### 2. Create Virtual Environment & Install Dependencies
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
playwright install chromium
```

### 3. Initialize the Database Schema
```powershell
python main.py init-db
```

### 4. Run the Scraper
 Scrape all targets configured in `targets.yaml`:
```powershell
python main.py scrape
```

Or scrape a specific Njuškalo URL directly from the CLI:
```powershell
python main.py scrape --url "https://www.njuskalo.hr/prodaja-stanova/zagreb" --max-pages 2 --details
```

> **Tip for First Run:** Keep `HEADLESS=false` (the default in `.env`) on your first run. If Njuškalo presents a cookie dialog or a one-time bot verification prompt, the browser window will let it pass and persist the session inside `./browser_profile/`.

### 5. View Stats & Price Drops
```powershell
# View database summary and recent listings table
python main.py stats

# View listings whose price has changed over time
python main.py price-changes
```
