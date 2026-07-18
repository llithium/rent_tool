import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const ACS_YEAR = '2023'; // ACS 5-year, latest stable

/** Census ACS median gross rent by bedroom for a county (keyless; key optional).
 * B25031_003E = 1BR median gross rent, B25031_004E = 2BR. Returns null for missing values. */
export const GET: RequestHandler = async ({ url, fetch, setHeaders }) => {
  const stateFips = url.searchParams.get('state') || '';
  const countyFips = url.searchParams.get('county') || '';
  if (!/^\d{2}$/.test(stateFips) || !/^\d{3}$/.test(countyFips)) {
    throw error(400, 'state (2-digit) and county (3-digit) FIPS are required');
  }
  // The Census API now rejects keyless requests (redirects to missing_key.html),
  // so short-circuit when no key is configured.
  if (!env.CENSUS_KEY) {
    return json({ ok: false, reason: 'no-key' });
  }

  const api = new URL(`https://api.census.gov/data/${ACS_YEAR}/acs/acs5`);
  api.searchParams.set('get', 'NAME,B25031_003E,B25031_004E');
  api.searchParams.set('for', `county:${countyFips}`);
  api.searchParams.set('in', `state:${stateFips}`);
  api.searchParams.set('key', env.CENSUS_KEY);

  const clean = (v: string): number | null => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  try {
    const res = await fetch(api.toString());
    if (!res.ok) return json({ ok: false });
    const rows = await res.json();
    const row = rows?.[1]; // rows[0] is the header
    if (!row) return json({ ok: false });

    setHeaders({ 'Cache-Control': 'public, max-age=86400, s-maxage=2592000' });
    return json({
      ok: true,
      r1: clean(row[1]),
      r2: clean(row[2]),
      name: row[0] ?? '',
      year: ACS_YEAR
    });
  } catch {
    return json({ ok: false });
  }
};
