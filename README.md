# Rent Tool

A SvelteKit web app: pick a city, enter an offered salary, and get your 30%-rule rent
budget, live rent data, city facts, an affordability map, comparison table, take-home
charts, and pre-filtered apartment searches.

Your city, salary, and comparison list sync to the URL, so any view is a shareable deep
link (the **Copy link** button copies it) that restores on reload or on another device.

Rebuilt from the original single-file `reference/rent-city-artifact.html` into a real,
deployable app with serverless API endpoints (so it can actually reach live data past
browser CORS).

## Run locally

```bash
pnpm install
pnpm dev        # http://localhost:5173
```

Other scripts: `pnpm build` (production, adapter-vercel), `pnpm preview`,
`pnpm check` (type-check), `pnpm test` (unit tests), `pnpm test:e2e`
(browser/accessibility tests), and `pnpm smoke:rents` (live Zumper parser check).

## Data sources

| Source | Endpoint | Key needed | Notes |
| --- | --- | --- | --- |
| **Photon** (OSM) | `/api/city-suggest` | none | City autocomplete + coordinates |
| **Zumper** report | `/api/rents` | none | Live top-100 rents (parsed, cached 6h) |
| **FCC Area API** | `/api/geocode` | none | Coords → county FIPS |
| **HUD FMR** (bundled) | `/api/fmr` | none | FY2026 Fair Market Rents for **every US county** |
| **SimpleMaps places** (bundled) | `/api/nearby` | none | Nearby towns/suburbs around a point |
| **SimpleMaps places** (bundled) | `/api/population` | none | Population for a coordinate |

The app **degrades gracefully** and needs **no keys at all**: the 100 curated cities work
from the bundled Zumper snapshot (live-refreshed when the report parses), and every other
US city resolves through the bundled county-level HUD Fair Market Rents table
(`src/lib/data/fmr-county.json`, ~3,200 counties). HUD lookups require no runtime network
request or API key.

The UI identifies the statistic it is showing: Zumper median asking rent, HUD
40th-percentile Fair Market Rent. See
[docs/API.md](docs/API.md) for the full endpoint reference (params, responses, examples).

### Annual HUD data refresh

When HUD publishes or revises its county-level Fair Market Rent workbook, regenerate the
bundle with an explicit fiscal-year label and either the official URL or a downloaded file.
Get the county-level XLSX from the [official HUD FMR dataset page](https://www.huduser.gov/portal/datasets/fmr.html):

```bash
python3 scripts/build-fmr-data.py --year FY2027 --url https://www.huduser.gov/portal/datasets/fmr/fmr2027/FY27_FMRs.xlsx
# or
python3 scripts/build-fmr-data.py --year FY2027 --input /path/to/FY27_FMRs.xlsx
```

Running the script without arguments rebuilds the currently bundled FY2026 release. The
generator refuses to overwrite the bundle when fewer than 3,000 counties are parsed and
prints the final county count and file size. Review the metadata and sample counties, then run:

```bash
pnpm check
pnpm test
pnpm build
pnpm test:e2e
git add src/lib/data/fmr-county.json
```

Commit the regenerated JSON together with the fiscal-year documentation update.

## Structure

- `src/lib/data/` — curated cities, coordinates, tax tables (migrated from the original)
- `src/lib/` — city-aware estimated tax/budget math, formatting, search-link + Zumper-table logic, typed API client,
  `appState.svelte.ts` (runes-based shared state)
- `src/lib/components/` — CitySearch (autocomplete combobox), BudgetCard, Verdict,
  CityFacts, SearchLinks, NearbySuburbs, RentTrendChart, TaxBreakdownChart, ComparisonTable,
  RentMap (Leaflet)
- `src/routes/api/` — the six serverless endpoints above

## Deploy

Push to a repo and import into Vercel (adapter-vercel is already configured), or run
`vercel`. No API keys are required for off-list HUD rent coverage.

GitHub Actions run type checks, unit tests, the production build, browser tests, and a
weekly live-parser smoke check. The app targets Node 22 on Vercel.
