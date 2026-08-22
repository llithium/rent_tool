import { haversineMiles } from '../geo';
import RAW from './us-places.json';

/** Bundled US places dataset (SimpleMaps US Cities, CC BY 4.0 — see the page footer
 * attribution). ~31k cities/towns/CDPs as [city, state, lat, lng, population].
 * Population is SimpleMaps' urban-population estimate: place-level for suburbs and
 * towns, aggregated urban-area for large anchor cities. */
type PlaceRow = [string, string, number, number, number];
const PLACES = RAW as PlaceRow[];
const PLACE_BY_NAME = new Map<string, PlaceRow>();

const GRID_CELL_DEGREES = 1;
const LATITUDE_CELL_COUNT = 180;
const LONGITUDE_CELL_COUNT = 360;
const EARTH_RADIUS_MILES = 3958.8;
const POLAR_COSINE_EPSILON = 1e-6;
const ALL_LONGITUDE_CELLS = Object.freeze(
  Array.from({ length: LONGITUDE_CELL_COUNT }, (_, index) => index)
);

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

function latitudeCell(latitude: number): number {
  return Math.max(
    0,
    Math.min(LATITUDE_CELL_COUNT - 1, Math.floor((latitude + 90) / GRID_CELL_DEGREES))
  );
}

function normalizedLongitude(longitude: number): number {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

function longitudeCell(longitude: number): number {
  return Math.floor((normalizedLongitude(longitude) + 180) / GRID_CELL_DEGREES);
}

function gridKey(latitudeIndex: number, longitudeIndex: number): number {
  return latitudeIndex * LONGITUDE_CELL_COUNT + longitudeIndex;
}

function buildPlaceGrid(): ReadonlyMap<number, readonly number[]> {
  const buckets = new Map<number, number[]>();
  for (let index = 0; index < PLACES.length; index += 1) {
    const row = PLACES[index];
    const key = gridKey(latitudeCell(row[2]), longitudeCell(row[3]));
    const bucket = buckets.get(key);
    if (bucket) bucket.push(index);
    else buckets.set(key, [index]);
  }

  const frozenBuckets = new Map<number, readonly number[]>();
  for (const [key, bucket] of buckets) frozenBuckets.set(key, Object.freeze(bucket));
  return frozenBuckets;
}

// Keep this index private: callers should continue to receive the exact query
// semantics below, not depend on the grid's cell size or representation.
const PLACE_GRID = buildPlaceGrid();

function longitudeCellsForRange(longitude: number, allowanceDegrees: number): number[] {
  if (allowanceDegrees >= 180) return ALL_LONGITUDE_CELLS.slice();

  const center = normalizedLongitude(longitude);
  const first = Math.floor((center - allowanceDegrees + 180) / GRID_CELL_DEGREES);
  const last = Math.floor((center + allowanceDegrees + 180) / GRID_CELL_DEGREES);
  const cells: number[] = [];
  for (let cell = first; cell <= last; cell += 1) {
    cells.push(((cell % LONGITUDE_CELL_COUNT) + LONGITUDE_CELL_COUNT) % LONGITUDE_CELL_COUNT);
  }
  return cells;
}

function longitudeAllowance(
  radiusMiles: number,
  queryLatitude: number,
  minimumLatitude: number,
  maximumLatitude: number
): number {
  const radiusRadians = radiusMiles / EARTH_RADIUS_MILES;
  if (radiusRadians >= Math.PI) return 180;

  const queryRadians = (queryLatitude * Math.PI) / 180;
  const queryCosine = Math.cos(queryRadians);
  if (queryCosine <= POLAR_COSINE_EPSILON) return 180;

  // For each latitude in this cell, solve the haversine inequality for the
  // largest possible longitude difference. The minimum of that bound can occur
  // at an endpoint or at the one interior critical latitude.
  const cosineRadius = Math.cos(radiusRadians);
  const sineQuery = Math.sin(queryRadians);
  const latitudes = [minimumLatitude, maximumLatitude];
  if (Math.abs(cosineRadius) > POLAR_COSINE_EPSILON) {
    const criticalSine = sineQuery / cosineRadius;
    if (criticalSine >= -1 && criticalSine <= 1) {
      const criticalLatitude = (Math.asin(criticalSine) * 180) / Math.PI;
      if (criticalLatitude >= minimumLatitude && criticalLatitude <= maximumLatitude) {
        latitudes.push(criticalLatitude);
      }
    }
  }

  let maximumLongitudeRadians = 0;
  for (const latitude of latitudes) {
    const rowRadians = (latitude * Math.PI) / 180;
    const rowCosine = Math.cos(rowRadians);
    if (rowCosine <= POLAR_COSINE_EPSILON) return 180;

    const cosineLongitude =
      (cosineRadius - sineQuery * Math.sin(rowRadians)) / (queryCosine * rowCosine);
    if (cosineLongitude <= -1) return 180;
    maximumLongitudeRadians = Math.max(
      maximumLongitudeRadians,
      Math.acos(Math.max(-1, Math.min(1, cosineLongitude)))
    );
  }

  // The extra cell-width margin keeps the bucket lookup conservative at cell
  // boundaries after converting the spherical bound to degree cells.
  return Math.min(180, (maximumLongitudeRadians * 180) / Math.PI + 2 * GRID_CELL_DEGREES);
}

function rowsForRadius(lat: number, lng: number, radiusMiles: number): readonly PlaceRow[] {
  // The public handlers validate these values. Falling back here preserves the
  // old direct-function behavior for unusual inputs as well.
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180 ||
    !Number.isFinite(radiusMiles) ||
    radiusMiles < 0
  ) {
    return PLACES;
  }

  const latitudeAllowance = radiusMiles / 69;
  const minimumLatitude = Math.max(-90, lat - latitudeAllowance);
  const maximumLatitude = Math.min(90, lat + latitudeAllowance);
  const firstLatitudeCell = latitudeCell(minimumLatitude);
  const lastLatitudeCell = latitudeCell(maximumLatitude);
  const candidateIndexes = new Set<number>();

  for (
    let latitudeIndex = firstLatitudeCell;
    latitudeIndex <= lastLatitudeCell;
    latitudeIndex += 1
  ) {
    const cellMinimumLatitude = latitudeIndex * GRID_CELL_DEGREES - 90;
    const cellMaximumLatitude = cellMinimumLatitude + GRID_CELL_DEGREES;
    const relevantMinimumLatitude = Math.max(minimumLatitude, cellMinimumLatitude);
    const relevantMaximumLatitude = Math.min(maximumLatitude, cellMaximumLatitude);
    const allowanceDegrees = longitudeAllowance(
      radiusMiles,
      lat,
      relevantMinimumLatitude,
      relevantMaximumLatitude
    );

    for (const longitudeIndex of longitudeCellsForRange(lng, allowanceDegrees)) {
      const bucket = PLACE_GRID.get(gridKey(latitudeIndex, longitudeIndex));
      if (!bucket) continue;
      for (const index of bucket) candidateIndexes.add(index);
    }
  }

  // Buckets are visited geographically, not in source order. Restore the raw
  // row order so sort ties and placeAt's first-match tie behavior are unchanged.
  return [...candidateIndexes].sort((a, b) => a - b).map((index) => PLACES[index]);
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
  for (const row of rowsForRadius(lat, lng, radiusMiles)) {
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
  for (const row of rowsForRadius(lat, lng, maxMiles)) {
    if (Math.abs(row[2] - lat) * 69 > maxMiles) continue;
    const miles = haversineMiles(lat, lng, row[2], row[3]);
    if (miles > maxMiles) continue;
    if (!best || miles < best.miles) best = toPlace(row, miles);
  }
  return best;
}
