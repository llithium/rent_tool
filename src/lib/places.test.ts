import { describe, expect, it } from 'vitest';
import { coordinatesForPlace, nearbyPlaces, placeAt } from './data/places';

const CHARLOTTE = { lat: 35.2271, lng: -80.8431 };
const ST_PETERSBURG = { lat: 27.7931, lng: -82.6652 };

const EXCLUDE_CLT = { exclude: { city: 'Charlotte', state: 'NC' } };

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
});
