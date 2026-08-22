import { describe, expect, it } from 'vitest';
import RAW from './data/us-places.json';
import { coordinatesForPlace, nearbyPlaces, placeAt, type Place } from './data/places';
import { haversineMiles } from './geo';

type PlaceRow = [string, string, number, number, number];
type NearbyOptions = {
  radiusMiles?: number;
  excludeMiles?: number;
  limit?: number;
  exclude?: { city: string; state: string };
};

const RAW_PLACES = RAW as PlaceRow[];

function placeKey(city: string, state: string): string {
  return `${city
    .trim()
    .toLowerCase()
    .replace(/[.-]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')}|${state.trim().toUpperCase()}`;
}

function toPlace(row: PlaceRow, miles: number): Place {
  return { city: row[0], state: row[1], lat: row[2], lng: row[3], pop: row[4], miles };
}

/** Independent reference implementation used to protect the exhaustive result contract. */
function exhaustiveNearby(lat: number, lng: number, options: NearbyOptions = {}): Place[] {
  const { radiusMiles = 25, excludeMiles = 0.75, limit = 8, exclude } = options;
  const excludeKey = exclude ? placeKey(exclude.city, exclude.state) : null;
  const hits: Place[] = [];

  for (const row of RAW_PLACES) {
    if (Math.abs(row[2] - lat) * 69 > radiusMiles) continue;
    if (excludeKey && placeKey(row[0], row[1]) === excludeKey) continue;
    const miles = haversineMiles(lat, lng, row[2], row[3]);
    if (miles < excludeMiles || miles > radiusMiles) continue;
    hits.push(toPlace(row, miles));
  }

  return hits.sort((a, b) => b.pop - a.pop || a.miles - b.miles).slice(0, limit);
}

function exhaustivePlaceAt(lat: number, lng: number, maxMiles = 10): Place | null {
  let best: Place | null = null;
  for (const row of RAW_PLACES) {
    if (Math.abs(row[2] - lat) * 69 > maxMiles) continue;
    const miles = haversineMiles(lat, lng, row[2], row[3]);
    if (miles > maxMiles) continue;
    if (!best || miles < best.miles) best = toPlace(row, miles);
  }
  return best;
}

const CHARLOTTE = { lat: 35.2271, lng: -80.8431 };
const ST_PETERSBURG = { lat: 27.7931, lng: -82.6652 };

const EXCLUDE_CLT = { exclude: { city: 'Charlotte', state: 'NC' } };

const NEARBY_FIXTURES: Array<{
  name: string;
  lat: number;
  lng: number;
  options?: NearbyOptions;
}> = [
  {
    name: 'Charlotte city center',
    lat: CHARLOTTE.lat,
    lng: CHARLOTTE.lng,
    options: EXCLUDE_CLT
  },
  {
    name: 'Cincinnati interstate and state border',
    lat: 39.1031,
    lng: -84.512,
    options: { radiusMiles: 25 }
  },
  {
    name: 'query across latitude and longitude cell boundaries',
    lat: 40.0001,
    lng: -80.0001,
    options: { radiusMiles: 25 }
  },
  {
    name: 'St Petersburg punctuation alias exclusion',
    lat: ST_PETERSBURG.lat,
    lng: ST_PETERSBURG.lng,
    options: { exclude: { city: 'St Petersburg', state: 'FL' } }
  },
  {
    name: 'ocean with no places',
    lat: 35,
    lng: -140,
    options: { radiusMiles: 25 }
  },
  {
    name: 'high-latitude Alaska',
    lat: 71.2727,
    lng: -156.7575,
    options: { radiusMiles: 25 }
  },
  {
    name: 'antimeridian-crossing Alaska query',
    lat: 52,
    lng: 179.9,
    options: { radiusMiles: 500 }
  },
  {
    name: 'large-radius great-circle query',
    lat: 40.49307874403894,
    lng: 128.7773130554706,
    options: { radiusMiles: 10_000 }
  }
];

const PLACE_AT_FIXTURES = [
  { name: 'Charlotte city center', lat: CHARLOTTE.lat, lng: CHARLOTTE.lng, maxMiles: 10 },
  // The lower-population duplicate must remain discoverable at its own coordinates.
  { name: 'duplicate normalized Marion, Indiana row', lat: 39.5884, lng: -85.7587, maxMiles: 10 },
  { name: 'ocean with no place', lat: 35, lng: -140, maxMiles: 10 },
  { name: 'high-latitude Alaska', lat: 71.2727, lng: -156.7575, maxMiles: 10 },
  { name: 'antimeridian-crossing Alaska query', lat: 52, lng: 179.9, maxMiles: 500 }
];

for (const fixture of NEARBY_FIXTURES) {
  it(`keeps nearby result objects and ordering for ${fixture.name}`, () => {
    expect(nearbyPlaces(fixture.lat, fixture.lng, fixture.options)).toEqual(
      exhaustiveNearby(fixture.lat, fixture.lng, fixture.options)
    );
  });
}

for (const fixture of PLACE_AT_FIXTURES) {
  it(`keeps nearest-place behavior for ${fixture.name}`, () => {
    expect(placeAt(fixture.lat, fixture.lng, fixture.maxMiles)).toEqual(
      exhaustivePlaceAt(fixture.lat, fixture.lng, fixture.maxMiles)
    );
  });
}

describe('nearbyPlaces', () => {
  it('returns places within the radius, largest population first', () => {
    const hits = nearbyPlaces(CHARLOTTE.lat, CHARLOTTE.lng, EXCLUDE_CLT);
    expect(hits.length).toBe(8);
    for (let i = 1; i < hits.length; i++) {
      expect(hits[i - 1].pop).toBeGreaterThanOrEqual(hits[i].pop);
    }
    for (const h of hits) {
      expect(h.miles).toBeLessThanOrEqual(25);
    }
  });

  it('excludes the origin city itself', () => {
    const hits = nearbyPlaces(CHARLOTTE.lat, CHARLOTTE.lng, EXCLUDE_CLT);
    expect(hits.map((h) => h.city)).not.toContain('Charlotte');
  });

  it('excludes punctuation aliases for the origin city', () => {
    const hits = nearbyPlaces(ST_PETERSBURG.lat, ST_PETERSBURG.lng, {
      exclude: { city: 'St Petersburg', state: 'FL' }
    });
    expect(hits.map((h) => h.city)).not.toContain('St. Petersburg');
    expect(hits.some((h) => h.city === 'Tampa' && h.state === 'FL')).toBe(true);
  });

  it('labels cross-border suburbs with their own state', () => {
    // Cincinnati, OH — its metro sprawls into Kentucky.
    const hits = nearbyPlaces(39.1031, -84.512);
    expect(hits.some((h) => h.state === 'KY')).toBe(true);
  });
});

describe('placeAt', () => {
  it('finds the place at a city center', () => {
    const place = placeAt(CHARLOTTE.lat, CHARLOTTE.lng);
    expect(place?.city).toBe('Charlotte');
    expect(place?.state).toBe('NC');
    expect(place?.pop).toBeGreaterThan(500_000);
  });

  it('returns null in the middle of nowhere', () => {
    // Pacific Ocean west of the CA coast.
    expect(placeAt(35, -140)).toBeNull();
  });
});

describe('coordinatesForPlace', () => {
  it('finds an exact city/state coordinate for a bundled rent city', () => {
    expect(coordinatesForPlace('Lansing', 'MI')).toEqual([42.7142, -84.5601]);
  });

  it('keeps the highest-population row for duplicate normalized names', () => {
    expect(coordinatesForPlace('Marion', 'IN')).toEqual([40.5497, -85.6604]);
  });
});
