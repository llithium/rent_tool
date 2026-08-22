import type { ComparisonCity } from './decision';
import type { ComparisonEntry } from './comparisonSet.svelte';
import { MAX_SALARY } from '$lib/salary';

export interface CityLinkInput {
  city: Pick<ComparisonCity, 'name' | 'source' | 'lat' | 'lng'>;
  salary: number;
}

export const COMPARISON_SALARY_PARAM = 'compare-salary';

export type ComparisonCityLink = Pick<ComparisonCity, 'name' | 'source' | 'lat' | 'lng'> & {
  salary?: number;
};

export interface ComparisonLinkEntry {
  city: Pick<ComparisonCity, 'name' | 'source' | 'lat' | 'lng'>;
  salary?: number;
}

type ComparisonLinkInput = ComparisonCityLink | ComparisonLinkEntry;

function validCoordinates(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180
  );
}

function navigationEntry(input: ComparisonLinkInput): ComparisonLinkEntry {
  return 'city' in input ? input : { city: input, salary: input.salary };
}

export function comparisonSalaryLink(name: string, salary: number): string {
  return JSON.stringify({ name, salary: Math.round(salary) });
}

export function parseComparisonSalaryLink(raw: string): { name: string; salary: number } | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (
      typeof record.name !== 'string' ||
      typeof record.salary !== 'number' ||
      !Number.isFinite(record.salary) ||
      record.salary <= 0 ||
      record.salary > MAX_SALARY
    ) {
      return null;
    }
    return { name: record.name, salary: Math.round(record.salary) };
  } catch {
    return null;
  }
}

/** Append the legacy city parameters plus the complete entry salaries. */
export function appendComparisonLinks(
  search: URLSearchParams,
  entries: readonly (ComparisonEntry | ComparisonLinkInput)[]
): void {
  for (const input of entries) {
    const entry = navigationEntry(input);
    let serialized = false;
    if (entry.city.source === 'apartment-list') {
      search.append('compare', entry.city.name);
      serialized = true;
    } else if (
      entry.city.lat != null &&
      entry.city.lng != null &&
      validCoordinates(entry.city.lat, entry.city.lng)
    ) {
      search.append(
        'compare-offlist',
        JSON.stringify({ name: entry.city.name, lat: entry.city.lat, lng: entry.city.lng })
      );
      serialized = true;
    }
    if (serialized && entry.salary != null && Number.isFinite(entry.salary)) {
      search.append(COMPARISON_SALARY_PARAM, comparisonSalaryLink(entry.city.name, entry.salary));
    }
  }
}

/** Browser navigation stays outside comparison analysis. */
export function cityHref(
  entry: CityLinkInput,
  compareCities: readonly (ComparisonEntry | ComparisonLinkInput)[]
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
  appendComparisonLinks(search, compareCities);
  return `/?${search}`;
}
