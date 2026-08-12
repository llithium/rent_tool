import { describe, expect, it, vi } from 'vitest';
import { RentPlanWorkspace, type RentPlanAdapters } from './appState.svelte';
import type { CitySuggestion, LookupResult } from '$lib/types';

function adapters(result: LookupResult): RentPlanAdapters {
  const storage = new Map<string, string>();
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
});
