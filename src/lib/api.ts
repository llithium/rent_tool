import type {
  CitySuggestion,
  LookupResult,
  NearbyPlace,
  RentRefreshStatus,
  RentSource
} from '$lib/types';
import type { RentRow } from '$lib/rentTable';

/** Typed client wrappers for the /api endpoints. All degrade gracefully. */

export async function fetchSuggestions(q: string, signal?: AbortSignal): Promise<CitySuggestion[]> {
  const res = await fetch(`/api/city-suggest?q=${encodeURIComponent(q)}`, { signal });
  if (!res.ok) return [];
  const data = await res.json();
  return data.suggestions ?? [];
}

/** Nearby towns & suburbs around a point, from OpenStreetMap. Returns [] on failure. */
export async function fetchNearby(
  lat: number,
  lng: number,
  state?: string,
  signal?: AbortSignal
): Promise<NearbyPlace[]> {
  try {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    if (state) params.set('state', state);
    const res = await fetch(`/api/nearby?${params}`, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.nearby) ? data.nearby : [];
  } catch {
    return [];
  }
}

export interface RentsResponse {
  rows: RentRow[];
  reportDate: string | null;
  live: boolean;
  cached: boolean;
  status: RentRefreshStatus;
  rowCount: number;
  lastSuccessfulAt: string | null;
}

const EMPTY_RENTS: RentsResponse = {
  rows: [], reportDate: null, live: false, cached: false,
  status: 'unavailable', rowCount: 0, lastSuccessfulAt: null
};

export async function fetchLiveRents(): Promise<RentsResponse> {
  try {
    const res = await fetch('/api/rents');
    if (!res.ok) return EMPTY_RENTS;
    const data = await res.json();
    return {
      ...EMPTY_RENTS,
      ...data,
      rows: Array.isArray(data.rows) ? data.rows : []
    };
  } catch {
    return EMPTY_RENTS;
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
export async function lookupRent(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<LookupResult> {
  const empty: LookupResult = {
    r1: null, r2: null, yoy: null, source: 'none',
    rentMetric: 'unknown', rentArea: '', rentYear: ''
  };
  try {
    const geoRes = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`, { signal });
    const geo: GeoResult = geoRes.ok ? await geoRes.json() : { ok: false };
    if (!geo.ok || !geo.stateFips || !geo.countyFips) return empty;

    const fipsQ = `state=${geo.stateFips}&county=${geo.countyFips}`;

    // Prefer HUD FMR; fall back to ACS.
    const [fmr, acs] = await Promise.all([
      fetch(`/api/fmr?${fipsQ}`, { signal }).then((r) => (r.ok ? r.json() : { ok: false })),
      fetch(`/api/acs?${fipsQ}`, { signal }).then((r) => (r.ok ? r.json() : { ok: false }))
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
        rentMetric: 'fair-market-rent',
        rentArea: county ? `${county} area` : 'resolved county area',
        rentYear: String(fmr.year ?? ''),
        note: `HUD Fair Market Rent, ${county}${year ? ` (${year})` : ''}`
      };
    }
    if (acs.ok && (acs.r1 || acs.r2)) {
      return {
        r1: acs.r1,
        r2: acs.r2,
        yoy: null,
        source: 'census-acs' as RentSource,
        rentMetric: 'median-gross',
        rentArea: acs.name || (geo.county ? `${geo.county} County` : 'resolved county'),
        rentYear: String(acs.year ?? ''),
        note: `Census ACS median gross rent, ${geo.county} County (${acs.year})`
      };
    }
    return empty;
  } catch {
    return empty;
  }
}
