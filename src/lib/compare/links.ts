import type { ComparisonCity } from './decision';

export interface CityLinkInput {
  city: Pick<ComparisonCity, 'name' | 'source' | 'lat' | 'lng'>;
  salary: number;
}

/** Browser navigation stays outside comparison analysis. */
export function cityHref(entry: CityLinkInput, compareNames: readonly string[]): string {
  const search = new URLSearchParams();
  if (Number.isFinite(entry.salary)) search.set('salary', String(Math.round(entry.salary)));
  search.set('city', entry.city.name);
  if (
    (entry.city.source === 'none' || entry.city.source === 'hud-fmr') &&
    entry.city.lat != null &&
    entry.city.lng != null
  ) {
    search.set('lat', String(entry.city.lat));
    search.set('lng', String(entry.city.lng));
  }
  for (const name of compareNames) search.append('compare', name);
  return `/?${search}`;
}
