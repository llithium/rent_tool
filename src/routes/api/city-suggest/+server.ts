import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { STATE_ABBR, VALID_STATES } from '$lib/data/states';
import type { CitySuggestion } from '$lib/types';

/** Autocomplete proxy over Photon (keyless OSM typeahead). Filters to US cities/towns
 * and returns "City, ST" + coordinates so a pick can feed the map without re-geocoding. */
export const GET: RequestHandler = async ({ url, fetch, setHeaders }) => {
  const q = (url.searchParams.get('q') || '').trim();
  if (q.length < 2) return json({ suggestions: [] });

  const photon = new URL('https://photon.komoot.io/api/');
  photon.searchParams.set('q', q);
  photon.searchParams.set('limit', '12');
  photon.searchParams.set('lang', 'en');

  try {
    const res = await fetch(photon.toString(), {
      headers: { 'User-Agent': 'rent-tool/1.0 (city autocomplete)' }
    });
    if (!res.ok) return json({ suggestions: [] });
    const data = await res.json();

    const seen = new Set<string>();
    const suggestions: CitySuggestion[] = [];

    for (const f of data.features ?? []) {
      const p = f.properties ?? {};
      if (p.countrycode !== 'US') continue;
      if (p.osm_key !== 'place') continue;
      if (!['city', 'town', 'village'].includes(p.osm_value)) continue;

      const cityName: string = p.name;
      const stateAbbr = STATE_ABBR[p.state] || (VALID_STATES.has(p.state) ? p.state : '');
      if (!cityName || !stateAbbr) continue;

      const label = `${cityName}, ${stateAbbr}`;
      if (seen.has(label)) continue;
      seen.add(label);

      const [lng, lat] = f.geometry?.coordinates ?? [];
      if (typeof lat !== 'number' || typeof lng !== 'number') continue;

      suggestions.push({ label, city: cityName, state: stateAbbr, lat, lng });
      if (suggestions.length >= 8) break;
    }

    // Cache identical typeahead queries briefly at the edge.
    setHeaders({ 'Cache-Control': 'public, max-age=60, s-maxage=300' });
    return json({ suggestions });
  } catch {
    return json({ suggestions: [] });
  }
};
