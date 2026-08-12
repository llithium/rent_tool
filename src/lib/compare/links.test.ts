import { describe, expect, it } from 'vitest';
import { cityHref } from './links';

describe('comparison city links', () => {
  it('creates a city-view link from only navigation fields', () => {
    expect(
      cityHref(
        {
          city: { name: 'Off-list, ZZ', source: 'hud-fmr', lat: 40.1, lng: -73.9 },
          salary: 80_000
        },
        ['Off-list, ZZ', 'Anchor, NY']
      )
    ).toBe(
      '/?salary=80000&city=Off-list%2C+ZZ&lat=40.1&lng=-73.9&compare=Off-list%2C+ZZ&compare=Anchor%2C+NY'
    );
  });

  it('omits an invalid salary instead of serializing NaN', () => {
    expect(
      cityHref({ city: { name: 'Anchor, NY', source: 'apartment-list' }, salary: Number.NaN }, [])
    ).toBe('/?city=Anchor%2C+NY');
  });
});
