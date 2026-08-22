import type { ComparisonCity } from './decision';

export interface CityLinkInput {
  city: Pick<ComparisonCity, 'name' | 'source' | 'lat' | 'lng'>;
  salary: number;
}

type ComparisonCityLink = Pick<ComparisonCity, 'name' | 'source' | 'lat' | 'lng'>;

/** Browser navigation stays outside comparison analysis. */
export function cityHref(
  entry: CityLinkInput,
  compareCities: readonly ComparisonCityLink[]
): string {
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
  for (const city of compareCities) {
    if (city.source === 'apartment-list') {
      search.append('compare', city.name);
    } else if (
      city.lat != null &&
      city.lng != null &&
      Number.isFinite(city.lat) &&
      city.lat >= -90 &&
      city.lat <= 90 &&
      Number.isFinite(city.lng) &&
      city.lng >= -180 &&
      city.lng <= 180
    ) {
      search.append(
        'compare-offlist',
        JSON.stringify({ name: city.name, lat: city.lat, lng: city.lng })
      );
    }
  }
  return `/?${search}`;
}
