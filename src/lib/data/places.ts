import { haversineMiles } from '../geo';
import RAW from './us-places.json';

/** Bundled US places dataset (SimpleMaps US Cities, CC BY 4.0 — see the page footer
 * attribution). ~31k cities/towns/CDPs as [city, state, lat, lng, population].
 * Population is SimpleMaps' urban-population estimate: place-level for suburbs and
 * towns, aggregated urban-area for large anchor cities. */
type PlaceRow = [string, string, number, number, number];
const PLACES = RAW as PlaceRow[];
const PLACE_BY_NAME = new Map<string, PlaceRow>();

function placeKey(city: string, state: string): string {
  return `${city
    .trim()
    .toLowerCase()
    .replace(/[.-]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')}|${state.trim().toUpperCase()}`;
}

for (const row of PLACES) {
  const key = placeKey(row[0], row[1]);
  const current = PLACE_BY_NAME.get(key);
  if (!current || row[4] > current[4]) PLACE_BY_NAME.set(key, row);
}

export interface Place {
  city: string;
  state: string;
  lat: number;
  lng: number;
  pop: number;
  miles: number;
}

function toPlace(row: PlaceRow, miles: number): Place {
  return { city: row[0], state: row[1], lat: row[2], lng: row[3], pop: row[4], miles };
}

/** Coordinates for an exact city/state match in the bundled SimpleMaps data. */
export function coordinatesForPlace(city: string, state: string): [number, number] | null {
  const place = PLACE_BY_NAME.get(placeKey(city, state));
  return place ? [place[2], place[3]] : null;
}

/** Places within `radiusMiles` of a point, largest population first. The origin
 * place is excluded by name (`exclude`) — its dataset centroid can sit more than a
 * mile from our seed coords, so a distance cutoff alone would either miss it or
 * swallow genuinely adjacent towns. A small cutoff still catches alias rows. */
export function nearbyPlaces(
  lat: number,
  lng: number,
  {
    radiusMiles = 25,
    excludeMiles = 0.75,
    limit = 8,
    exclude
  }: {
    radiusMiles?: number;
    excludeMiles?: number;
    limit?: number;
    exclude?: { city: string; state: string };
  } = {}
): Place[] {
  const excludeKey = exclude ? placeKey(exclude.city, exclude.state) : null;
  const hits: Place[] = [];
  for (const row of PLACES) {
    // Cheap bounding-box reject before the trig (1° lat ≈ 69 mi).
    if (Math.abs(row[2] - lat) * 69 > radiusMiles) continue;
    if (excludeKey && placeKey(row[0], row[1]) === excludeKey) continue;
    const miles = haversineMiles(lat, lng, row[2], row[3]);
    if (miles < excludeMiles || miles > radiusMiles) continue;
    hits.push(toPlace(row, miles));
  }
  return hits.sort((a, b) => b.pop - a.pop || a.miles - b.miles).slice(0, limit);
}

/** The place nearest to a point, or null if nothing lies within `maxMiles`. */
export function placeAt(lat: number, lng: number, maxMiles = 10): Place | null {
  let best: Place | null = null;
  for (const row of PLACES) {
    if (Math.abs(row[2] - lat) * 69 > maxMiles) continue;
    const miles = haversineMiles(lat, lng, row[2], row[3]);
    if (miles > maxMiles) continue;
    if (!best || miles < best.miles) best = toPlace(row, miles);
  }
  return best;
}
