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

/** Population of the place at the given coordinates. Returns null on failure. */
export async function fetchPopulation(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<number | null> {
  try {
    const res = await fetch(`/api/population?lat=${lat}&lng=${lng}`, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    return data.ok && typeof data.pop === 'number' && data.pop > 0 ? data.pop : null;
  } catch {
    return null;
  }
}

/** Nearby towns & suburbs around a point, from the bundled US places dataset.
 * `city`/`state` identify the origin so it's excluded from its own list.
 * Returns [] on failure. */
export async function fetchNearby(
  lat: number,
  lng: number,
  city?: string,
  state?: string,
  signal?: AbortSignal
): Promise<NearbyPlace[]> {
  try {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    if (city) params.set('city', city);
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

/** Look up bundled HUD Fair Market Rent for an off-list city. */
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

    const fmrRes = await fetch(`/api/fmr?${fipsQ}`, { signal });
    const fmr = fmrRes.ok ? await fmrRes.json() : { ok: false };

    if (fmr.ok && (fmr.r1 || fmr.r2)) {
      const county = fmr.county || geo.county || '';
      const year = fmr.year ? `${fmr.year}, bundled` : '';
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
    return empty;
  } catch {
    return empty;
  }
}
