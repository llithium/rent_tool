import { describe, expect, it } from 'vitest';
import { nearbyPlaces, placeAt } from './data/places';

const CHARLOTTE = { lat: 35.2271, lng: -80.8431 };

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
