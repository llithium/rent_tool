import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { nearbyPlaces } from '$lib/data/places';
import type { NearbyPlace } from '$lib/types';

/** Nearby towns & suburbs around a point, from the bundled US places dataset.
 * Returns "City, ST" + coordinates + distance so a pick feeds resolveSuggestion. */
export const GET: RequestHandler = async ({ url, setHeaders }) => {
  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw error(400, 'lat and lng are required and must be valid coordinates');
  }
  // Origin identity, so the selected city can be excluded from its own list.
  const exCity = (url.searchParams.get('city') || '').trim().slice(0, 80);
  const exState = (url.searchParams.get('state') || '').trim().toUpperCase();
  const exclude = exCity && /^[A-Z]{2}$/.test(exState) ? { city: exCity, state: exState } : undefined;

  const nearby: NearbyPlace[] = nearbyPlaces(lat, lng, { exclude }).map((p) => ({
    label: `${p.city}, ${p.state}`,
    city: p.city,
    state: p.state,
    lat: p.lat,
    lng: p.lng,
    miles: Math.round(p.miles),
    pop: p.pop
  }));

  // Static bundled data — cache freely.
  setHeaders({ 'Cache-Control': 'public, max-age=86400, s-maxage=2592000' });
  return json({ nearby });
};
