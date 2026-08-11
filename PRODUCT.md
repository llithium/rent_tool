# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are people evaluating a salary offer and a possible move between United States cities. They need to decide what rent they can afford before committing to a move or beginning an apartment search. Current renters may also use the tool to test whether a rent target fits their income.

## Product Purpose

Rent Tool turns an annual salary and a city into a practical monthly rent target. It helps people evaluate a possible move with current local rent context, estimated take-home pay, city facts, nearby alternatives, and ready-filtered apartment searches. Success is a user leaving with a rent target and the context to understand and act on it.

## Positioning

Rent Tool connects a salary offer to a city-specific move decision: it estimates taxes and a 30%-rule rent budget, then places that target alongside local rent estimates, nearby places, and apartment-search links. It is not only a generic rent calculator or a city comparison table.

## Operating Context

Users search a supported US city, enter or adjust annual salary, and review their rent budget, rent estimates, tax breakdown, city snapshot, nearby suburbs, comparisons, map, and apartment-search links. A city, salary, and comparison list are reflected in the URL and stored in the browser, making scenarios shareable and recoverable without an account.

## Capabilities and Constraints

- City autocomplete and coordinates use Photon/OSM; location lookup uses the FCC Area API.
- Bundled Apartment List city estimates, HUD county Fair Market Rents, Census ACS city facts, and SimpleMaps place data provide results without requiring user API keys.
- Results identify whether a displayed rent statistic is an Apartment List estimated median or HUD 40th-percentile Fair Market Rent, along with its source and reporting period.
- Tax and affordability figures are planning estimates, not tax advice.
- The tool must degrade gracefully when a city is not covered by the bundled city rent snapshot, using bundled county-level HUD data where available.
- The application is a SvelteKit web app deployed with Vercel-compatible serverless endpoints.

## Brand Commitments

The product name is Rent Tool. It does not require an account. Product language should present estimates plainly, disclose their source and period, and avoid overstating financial certainty.

## Evidence on Hand

- Bundled June 2026 Apartment List city rent snapshot: `src/lib/data/apartment-list-rents.json`.
- Bundled FY2026 HUD county Fair Market Rents: `src/lib/data/fmr-county.json`.
- Bundled Census ACS city facts: `src/lib/data/acs-city-facts.json`.
- Data-source and refresh documentation: `README.md` and `docs/API.md`.
- The repository contains no user testimonials, customer claims, pricing, or account-based product data. Future work must not fabricate them.

## Product Principles

1. Start with a user’s real decision: the salary offer and the city they may move to.
2. Make affordability understandable by pairing a rent target with taxes and local market context.
3. Be transparent about estimates, sources, periods, and their limits.
4. Preserve user privacy and low friction through a no-account, browser- and URL-based workflow.
5. Turn analysis into next steps through comparisons, nearby alternatives, and direct search links.

## Accessibility & Inclusion

The app includes an accessibility-tested web interface and should preserve keyboard-accessible interactions, visible focus states, and reduced-motion support.
