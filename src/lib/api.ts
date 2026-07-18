import type { CitySuggestion, LookupResult, RentSource } from '$lib/types';
import type { RentRow } from '$lib/rentTable';

/** Typed client wrappers for the /api endpoints. All degrade gracefully. */

export async function fetchSuggestions(q: string, signal?: AbortSignal): Promise<CitySuggestion[]> {
  const res = await fetch(`/api/city-suggest?q=${encodeURIComponent(q)}`, { signal });
  if (!res.ok) return [];
  const data = await res.json();
  return data.suggestions ?? [];
}

export interface RentsResponse {
  rows: RentRow[];
  reportDate: string | null;
  live: boolean;
  cached: boolean;
}

export async function fetchLiveRents(): Promise<RentsResponse> {
  try {
    const res = await fetch('/api/rents');
    if (!res.ok) return { rows: [], reportDate: null, live: false, cached: false };
    return await res.json();
  } catch {
    return { rows: [], reportDate: null, live: false, cached: false };
  }
}

interface GeoResult {
  ok: boolean;
  stateFips?: string;
  countyFips?: string;
  county?: string;
  state?: string;
}

/** Look up rent for an off-list city via government APIs (HUD FMR → Census ACS). */
export async function lookupRent(lat: number, lng: number): Promise<LookupResult> {
  const empty: LookupResult = { r1: null, r2: null, yoy: null, source: 'none' };
  try {
    const geoRes = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
    const geo: GeoResult = geoRes.ok ? await geoRes.json() : { ok: false };
    if (!geo.ok || !geo.stateFips || !geo.countyFips) return empty;

    const fipsQ = `state=${geo.stateFips}&county=${geo.countyFips}`;

    // Prefer HUD FMR; fall back to ACS.
    const [fmr, acs] = await Promise.all([
      fetch(`/api/fmr?${fipsQ}`).then((r) => (r.ok ? r.json() : { ok: false })),
      fetch(`/api/acs?${fipsQ}`).then((r) => (r.ok ? r.json() : { ok: false }))
    ]);

    if (fmr.ok && (fmr.r1 || fmr.r2)) {
      const county = fmr.county || geo.county || '';
      const year = fmr.bundled
        ? `${fmr.year}, bundled`
        : fmr.year
          ? `FY${fmr.year}`
          : '';
      return {
        r1: fmr.r1,
        r2: fmr.r2,
        yoy: null,
        source: 'hud-fmr' as RentSource,
        note: `HUD Fair Market Rent, ${county}${year ? ` (${year})` : ''}`
      };
    }
    if (acs.ok && (acs.r1 || acs.r2)) {
      return {
        r1: acs.r1,
        r2: acs.r2,
        yoy: null,
        source: 'census-acs' as RentSource,
        note: `Census ACS median gross rent, ${geo.county} County (${acs.year})`
      };
    }
    return empty;
  } catch {
    return empty;
  }
}
