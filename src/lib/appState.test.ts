import { describe, expect, it, vi } from 'vitest';
import { RentPlanWorkspace, type RentPlanAdapters } from './appState.svelte';
import type { CitySuggestion, LookupResult } from '$lib/types';

function adapters(
  result: LookupResult,
  initialStorage: Record<string, string> = {}
): RentPlanAdapters {
  const storage = new Map(Object.entries(initialStorage));
  return {
    lookupRent: vi.fn(async () => result),
    fetchPopulation: vi.fn(async () => null),
    coordinatesForPlace: vi.fn(async () => undefined),
    readStorage: (key) => storage.get(key) ?? null,
    writeStorage: (key, value) => storage.set(key, value)
  };
}

function suggestion(label: string, state = 'ZZ'): CitySuggestion {
  return { label, city: label.replace(/,\s*[A-Z]{2}$/, ''), state, lat: 40, lng: -74 };
}

const unavailableRent: LookupResult = {
  r1: null,
  r2: null,
  yoy: null,
  source: 'none',
  rentMetric: 'unknown',
  rentArea: '',
  rentYear: ''
};

const hudRent: LookupResult = {
  r1: 1_250,
  r2: 1_600,
  yoy: null,
  source: 'hud-fmr',
  rentMetric: 'fair-market-rent',
  rentArea: 'Test County area',
  rentYear: 'FY2026'
};

describe('RentPlanWorkspace', () => {
  it('exposes plan intent through a snapshot and preserves salary invariants', () => {
    const plan = new RentPlanWorkspace(adapters(unavailableRent));

    plan.setSalary(95_000.4);

    expect(plan.snapshot.salary).toBe(95_000);
    plan.setSalary(12_000_001);
    expect(plan.snapshot.salary).toBeNull();
  });

  it('commits an unresolved city while keeping rent unavailable explicit', async () => {
    const plan = new RentPlanWorkspace(adapters(unavailableRent));

    await plan.chooseCity(suggestion('Nowhere, ZZ'));

    expect(plan.snapshot.selectedName).toBe('Nowhere, ZZ');
    expect(plan.snapshot.selected?.r1).toBeNull();
    expect(plan.snapshot.looking).toBe(false);
    expect(plan.snapshot.pendingName).toBeNull();
  });

  it('adds a comparison without changing the active plan', async () => {
    const plan = new RentPlanWorkspace(adapters(hudRent));
    await plan.chooseCity(suggestion('Current, ZZ'));

    const result = await plan.addComparison(suggestion('Nearby, ZZ'));

    expect(result.status).toBe('added');
    expect(plan.snapshot.selectedName).toBe('Current, ZZ');
    expect(plan.snapshot.compareNames).toEqual(['Nearby, ZZ']);
  });

  it('resolves coordinates before looking up a coordinate-less off-list city', async () => {
    const dependency = adapters(hudRent);
    dependency.coordinatesForPlace = vi.fn(async () => [40.7, -74] as const);
    const plan = new RentPlanWorkspace(dependency);

    const result = await plan.addComparison({
      label: 'Off-list, ZZ',
      city: 'Off-list',
      state: 'ZZ'
    });

    expect(result.status).toBe('added');
    expect(dependency.coordinatesForPlace).toHaveBeenCalledWith('Off-list', 'ZZ');
    expect(dependency.lookupRent).toHaveBeenCalledWith(40.7, -74, expect.any(AbortSignal));
  });

  it('enforces the comparison cap before resolving another city', async () => {
    const dependency = adapters(hudRent);
    const plan = new RentPlanWorkspace(dependency);

    for (let index = 0; index < 5; index += 1) {
      const result = await plan.addComparison(suggestion(`City ${index}, ZZ`));
      expect(result.status).toBe('added');
    }

    const result = await plan.addComparison(suggestion('City 5, ZZ'));

    expect(result.status).toBe('full');
    expect(dependency.lookupRent).toHaveBeenCalledTimes(5);
    expect(plan.snapshot.compareNames).toHaveLength(5);
  });

  it('builds a canonical URL with rounded salary and fixed parameter ordering', async () => {
    const plan = new RentPlanWorkspace(adapters(hudRent));

    plan.setSalary(80_000.6);
    await plan.chooseCity(suggestion('Current, ZZ'));
    await plan.addComparison(suggestion('Nearby, ZZ'));

    expect(plan.buildSearch()).toBe(
      'salary=80001&city=Current%2C+ZZ&lat=40&lng=-74&compare-offlist=%7B%22name%22%3A%22Nearby%2C+ZZ%22%2C%22lat%22%3A40%2C%22lng%22%3A-74%7D'
    );
  });

  it('ignores malformed salary and invalid off-list coordinates during URL hydration', () => {
    const plan = new RentPlanWorkspace(adapters(unavailableRent));
    plan.setSalary(80_000);

    const selected = plan.hydrateFromSearch(
      new URLSearchParams({ salary: 'not-a-number', city: 'Unknown, ZZ', lat: '91', lng: '-74' })
    );

    expect(selected).toBe(false);
    expect(plan.snapshot.salary).toBe(80_000);
    expect(plan.snapshot.selectedName).toBeNull();
  });

  it('ignores an out-of-range salary during URL hydration', () => {
    const plan = new RentPlanWorkspace(adapters(unavailableRent));

    plan.hydrateFromSearch(new URLSearchParams({ salary: '10000001' }));

    expect(plan.snapshot.salary).toBeNull();
  });

  it('hydrates a known seed city and five deduplicated seed comparisons', () => {
    const plan = new RentPlanWorkspace(adapters(unavailableRent));

    const selected = plan.hydrateFromSearch(
      new URLSearchParams([
        ['salary', '95000'],
        ['city', 'New York, NY'],
        ['compare', 'Tampa, FL'],
        ['compare', 'Tampa, FL'],
        ['compare', 'Austin, TX'],
        ['compare', 'Boston, MA'],
        ['compare', 'Miami, FL'],
        ['compare', 'New York, NY'],
        ['compare', 'Seattle, WA']
      ])
    );

    expect(selected).toBe(true);
    expect(plan.snapshot.selectedName).toBe('New York, NY');
    expect(plan.snapshot.salary).toBe(95_000);
    expect(plan.snapshot.compareNames).toEqual([
      'Tampa, FL',
      'Austin, TX',
      'Boston, MA',
      'Miami, FL',
      'New York, NY'
    ]);
  });

  it('hydrates off-list comparison placeholders, validates entries, and caps URL order', async () => {
    const plan = new RentPlanWorkspace(adapters(hudRent));
    const valid = (name: string, lat = 40, lng = -74) => JSON.stringify({ name, lat, lng });
    const search = new URLSearchParams([
      ['city', 'Active, ZZ'],
      ['lat', '40.1'],
      ['lng', '-73.9'],
      ['compare-offlist', valid('Off-list, ZZ', 40.1, -73.9)],
      ['compare', 'Tampa, FL'],
      ['compare-offlist', valid('off-list, zz', 40.1, -73.9)],
      ['compare-offlist', '{not-json'],
      ['compare-offlist', valid('Bad coordinates, ZZ', 91, -74)],
      ['compare', 'Austin, TX'],
      ['compare', 'Boston, MA'],
      ['compare', 'Miami, FL'],
      ['compare-offlist', valid('Overflow, ZZ', 41, -75)]
    ]);

    expect(plan.hydrateFromSearch(search)).toBe(true);
    expect(plan.snapshot.compareNames).toEqual([
      'Off-list, ZZ',
      'Tampa, FL',
      'Austin, TX',
      'Boston, MA',
      'Miami, FL'
    ]);
    expect(plan.cityByName('Off-list, ZZ')).toMatchObject({
      name: 'Off-list, ZZ',
      lat: 40.1,
      lng: -73.9
    });
    expect(plan.cityByName('Bad coordinates, ZZ')).toBeNull();
    expect(plan.cityByName('Overflow, ZZ')).toBeNull();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(plan.snapshot.selectedName).toBe('Active, ZZ');
    expect(plan.cityByName('Off-list, ZZ')).toMatchObject({
      source: 'hud-fmr',
      r1: 1_250
    });
    expect(plan.snapshot.compareNames).toHaveLength(5);
  });

  it('clears absent salary and city on URL navigation while preserving comparisons', () => {
    const plan = new RentPlanWorkspace(adapters(unavailableRent));

    plan.setSalary(80_000);
    plan.selectCity('Tampa, FL');
    plan.addComparison('Austin, TX');
    plan.applyUrlNavigation(new URLSearchParams());

    expect(plan.snapshot.salary).toBeNull();
    expect(plan.snapshot.selectedName).toBeNull();
    expect(plan.snapshot.compareNames).toEqual(['Austin, TX']);
  });

  it('restores a valid custom city and comparison set from adapter storage', () => {
    const savedCity = {
      name: 'Saved Town, ZZ',
      city: 'Saved Town',
      state: 'ZZ',
      r1: null,
      r2: null,
      yoy: null,
      tax: 'varies',
      pop: '',
      citySnapshot: null,
      lat: 40,
      lng: -74,
      source: 'none',
      rentMetric: 'unknown',
      rentArea: 'Saved Town, ZZ',
      rentYear: ''
    };
    const plan = new RentPlanWorkspace(
      adapters(unavailableRent, {
        'rentToolLast.v3': JSON.stringify({
          salary: 90_000,
          selected: 'Saved Town, ZZ',
          compare: ['Saved Town, ZZ', 'Tampa, FL'],
          custom: [savedCity]
        })
      })
    );

    plan.restoreSession();

    expect(plan.snapshot.salary).toBe(90_000);
    expect(plan.snapshot.selectedName).toBe('Saved Town, ZZ');
    expect(plan.snapshot.selected).toMatchObject(savedCity);
    expect(plan.snapshot.compareNames).toEqual(['Saved Town, ZZ', 'Tampa, FL']);
  });
});
