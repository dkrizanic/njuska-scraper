# Njuškalo Real Estate Intelligence & Scraper

A full-stack Croatian real estate data engine and market intelligence platform for **Njuškalo.hr**. Features a high-performance Python scraper, PostgreSQL database with price history tracking, Express TypeScript backend with clean MVC architecture, and a React analytics dashboard for sublease / rent-to-rent arbitrage detection.

---

## Architecture Overview

### 1. Backend (`/server`) - Enterprise Express TypeScript Architecture
- **Entities (`server/src/entities/`)**: Domain entities (`ListingEntity`, `SellerEntity`, `PriceHistoryEntity`) representing persistent database models.
- **DTOs (`server/src/dtos/`)**: Dedicated Read and Write DTOs (`ListingQueryDto`, `CreateListingDto`, `ListingResponseDto`, `StatsResponseDto`, `ArbitrageResponseDto`, `NeighborhoodStatsDto`, `SellerAnalyticsDto`).
- **Interfaces (`server/src/interfaces/`)**: Strict contracts for service (`IListingsService`, `IStatsService`, `IArbitrageService`, `IAnalyticsService`) and repository abstractions.
- **Repositories (`server/src/repositories/`)**: Encapsulated data access and SQL query layer (`ListingRepository`, `StatsRepository`, `AnalyticsRepository`).
- **Services (`server/src/services/`)**: Business logic implementing service interfaces and executing arbitrage calculations and revenue projections.
- **Controllers (`server/src/controllers/`)**: Ultra-minimal controllers delegating directly to services via DTOs with global error handling.
- **Routes (`server/src/routes/`)**: Modular routing mounted under `/api` (`/stats`, `/listings`, `/rental-arbitrage`, `/analytics`).
- **Cron & Scripts (`server/cron/`, `server/scripts/`)**:
  - `server/cron/daily_scheduler.py`: Automated daily crawler runner.
  - `server/cron/register_daily_cron.ps1`: Windows Task Scheduler registration script.
  - `server/scripts/fast_scrape.py`: High-throughput concurrent search-page crawler.
- **Tests (`server/src/tests/`)**: High-value API contract and unit tests powered by Node's native test runner (`tsx --test`) and Supertest.

### 2. Frontend (`/client`) - React + TypeScript + Tailwind CSS
- **Pages (`client/src/pages/`)**:
  - `ArbitragePage.tsx`: Under-market sublease & rent-to-rent opportunities ranked by discount % and projected monthly profit.
  - `ListingsPage.tsx`: Searchable listings explorer with sorting, filtering, and pagination.
  - `AnalyticsPage.tsx`: Neighborhood price charts (€/m²) and seller volume breakdown.
- **Components (`client/src/components/`)**:
  - `layout/`: `Navbar.tsx`, `KpiCards.tsx`.
  - `listings/`: `ListingsTable.tsx`, `ListingFilters.tsx`, `Pagination.tsx`.
  - `arbitrage/`: `ArbitrageCard.tsx`, `ArbitrageGrid.tsx`.
  - `analytics/`: `NeighborhoodsChart.tsx`, `SellersOverview.tsx`.
- **Props & Types (`client/src/props/`)**: Typed interfaces for listings, arbitrage metrics, platform stats, and component props.
- **Services (`client/src/services/`)**: Encapsulated API client (`api.ts`).

---

## Quick Start

### 1. Database & Infrastructure
```powershell
docker compose up -d
```

### 2. Scraper Setup
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
playwright install chromium
python main.py init-db
```

Run high-speed crawl of Zagreb apartments (sale + rental):
```powershell
python server/scripts/fast_scrape.py
```

### 3. Backend API
```powershell
cd server
npm install
npm run dev
```
API runs on `http://localhost:4000`.

To run backend tests:
```powershell
npm test
```

### 4. Frontend Dashboard
```powershell
cd client
npm install
npm run dev
```
Dashboard runs on `http://localhost:5173`.

---

## AI Agent & Contribution Rules
This repository enforces strict rules on commit format, commentary in code, and test architecture. See [AGENTS.md](AGENTS.md) and [.cursorrules](.cursorrules).
