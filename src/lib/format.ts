/** Formatting + parsing helpers, migrated from the original artifact. */
import type { RentMetric } from '$lib/types';

/** "$1,234" — rounded, no decimals. */
export function money(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return '$' + Math.round(n).toLocaleString();
}

/** Percent with sign, e.g. "+4.3%" / "-6.2%" / "flat". */
export function pctTrend(yoy: number | null | undefined): string {
  if (yoy == null) return '—';
  if (yoy === 0) return 'flat';
  return (yoy > 0 ? '+' : '') + yoy + '% YoY';
}

export function rentMetricLabel(metric: RentMetric, bedrooms: '1BR' | '2BR' = '1BR'): string {
  if (metric === 'median-asking') return `Median asking ${bedrooms} rent`;
  if (metric === 'fair-market-rent') return `${bedrooms} Fair Market Rent`;
  return `${bedrooms} rent`;
}

/** Population fact text: "874,579" for place-level figures, "3.4M metro" for
 * the aggregated urban estimates the dataset uses on large anchor cities. */
export function popText(pop: number): string {
  if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(1)}M metro`;
  return pop.toLocaleString('en-US');
}

export interface CityParts {
  slug: string;
  st: string; // lowercase state, for URL paths
  city: string;
  state: string; // uppercase
}

/** Parse "City, ST" into URL-friendly parts. Returns null if it doesn't match. */
export function parseCity(cityState: string): CityParts | null {
  const m = cityState.match(/^(.+?),\s*([A-Za-z]{2})$/);
  if (!m) return null;
  return {
    slug: m[1]
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
    st: m[2].toLowerCase(),
    city: m[1].trim(),
    state: m[2].toUpperCase()
  };
}
