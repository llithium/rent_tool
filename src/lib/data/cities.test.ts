import { describe, expect, it } from 'vitest';
import { findSeedCity, RENT_DATA_META, SEED_CITIES } from './cities';

describe('bundled Apartment List city rents', () => {
  it('loads the complete June 2026 snapshot with source metadata', () => {
    expect(SEED_CITIES.length).toBeGreaterThanOrEqual(651);
    expect(RENT_DATA_META).toMatchObject({
      source: 'Apartment List Rent Estimates',
      period: '2026_06',
      label: 'June 2026',
      termsUrl: 'https://www.apartmentlist.com/about/terms'
    });
  });

  it('maps a known city to the bundled estimates and metric', () => {
    expect(findSeedCity('New York, NY')).toMatchObject({
      r1: 2443,
      r2: 2576,
      yoy: 2.9,
      source: 'apartment-list',
      rentMetric: 'estimated-median',
      rentYear: 'June 2026'
    });
  });

  it('matches punctuation variants used by autocomplete results', () => {
    expect(findSeedCity('St. Petersburg, FL')?.name).toBe('St Petersburg, FL');
    expect(findSeedCity('New York City, NY')?.name).toBe('New York, NY');
  });
});
