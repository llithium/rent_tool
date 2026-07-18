# City & Salary Rent Tool

A SvelteKit web app: pick a city, enter an offered salary, and get your 30%-rule rent
budget, live rent data, city facts, an affordability map, comparison table, take-home
charts, and pre-filtered apartment searches.

Rebuilt from the original single-file `reference/rent-city-artifact.html` into a real,
deployable app with serverless API endpoints (so it can actually reach live data past
browser CORS).

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts: `npm run build` (production, adapter-vercel), `npm run preview`,
`npm run check` (type-check).

## Data sources

| Source | Endpoint | Key needed | Notes |
| --- | --- | --- | --- |
| **Photon** (OSM) | `/api/city-suggest` | none | City autocomplete + coordinates |
| **Zumper** report | `/api/rents` | none | Live top-100 rents (parsed, cached 6h) |
| **FCC Area API** | `/api/geocode` | none | Coords → county FIPS |
| **HUD FMR** | `/api/fmr` | none (bundled FY2026 table) | Fair Market Rents for **every US county**; `HUD_TOKEN` (free) switches to live figures |
| **Census ACS** | `/api/acs` | `CENSUS_KEY` (free) | Median gross rent fallback |

The app **degrades gracefully** and needs **no keys at all**: the 100 curated cities work
from the bundled Zumper snapshot (live-refreshed when the report parses), and every other
US city resolves through the bundled county-level HUD Fair Market Rents table
(`src/lib/data/fmr-county.json`, ~3,200 counties). Keys only upgrade freshness.

To refresh the bundled FMR table when HUD publishes a new fiscal year:

```bash
python3 scripts/build-fmr-data.py   # downloads + regenerates fmr-county.json
```

### Optional API keys

Copy `.env.example` to `.env` and fill in what you want:

- `HUD_TOKEN` — free from https://www.huduser.gov/portal/dataset/fmr-api.html
- `CENSUS_KEY` — free from https://api.census.gov/data/key_signup.html
  (now **required** for the ACS fallback — the Census API rejects keyless requests)

On Vercel, set these as environment variables in the project settings.

## Structure

- `src/lib/data/` — curated cities, coordinates, tax tables (migrated from the original)
- `src/lib/` — budget math, formatting, search-link + Zumper-table logic, typed API client,
  `appState.svelte.ts` (runes-based shared state)
- `src/lib/components/` — CitySearch (autocomplete combobox), BudgetCard, Verdict,
  CityFacts, SearchLinks, RentTrendChart, TaxBreakdownChart, ComparisonTable, RentMap (Leaflet)
- `src/routes/api/` — the five serverless endpoints above

## Deploy

Push to a repo and import into Vercel (adapter-vercel is already configured), or run
`vercel`. Set `HUD_TOKEN` / `CENSUS_KEY` if you want the off-list rent fallback.
