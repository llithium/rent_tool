import { SEED_CITIES, findSeedCity, STATE_TAX, stateOf, cityOf } from '$lib/data/cities';
import {
  DEFAULT_COMPARISON_SALARY,
  ComparisonSet,
  LEGACY_PLAN_STORAGE_KEY,
  LEGACY_PLAN_V2_STORAGE_KEY,
  MAX_COMPARISON_ENTRIES,
  isValidCommittedSalary,
  restoreCity,
  type ComparisonEntry
} from '$lib/compare/comparisonSet.svelte';
import { appendComparisonLinks, parseComparisonSalaryLink } from '$lib/compare/links';
import { popText } from '$lib/format';
import { MAX_SALARY } from '$lib/salary';
import type { City, CitySuggestion } from '$lib/types';
import { fetchPopulation, lookupRent } from '$lib/api';

const LAST_KEY = LEGACY_PLAN_STORAGE_KEY;
const LEGACY_KEY = LEGACY_PLAN_V2_STORAGE_KEY;

function cloneSeed(): City[] {
  return SEED_CITIES.map((c) => ({ ...c }));
}

type PlanSuggestion = CitySuggestion & {
  pop?: number | null;
  comparisonSalary?: number;
};

interface HydratedLookup {
  suggestion: PlanSuggestion;
  select: boolean;
}

function validCoordinates(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180
  );
}

function offListSuggestion(name: string, lat: number, lng: number): PlanSuggestion | null {
  const state = stateOf(name);
  if (
    name.length === 0 ||
    name.length > 100 ||
    cityOf(name).length === 0 ||
    !/^[A-Z]{2}$/.test(state) ||
    !validCoordinates(lat, lng)
  ) {
    return null;
  }
  return { label: name, city: cityOf(name), state, lat, lng };
}

function parseOffListValue(raw: string): PlanSuggestion | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (
      typeof record.name !== 'string' ||
      typeof record.lat !== 'number' ||
      typeof record.lng !== 'number'
    ) {
      return null;
    }
    const suggestion = offListSuggestion(record.name, record.lat, record.lng);
    if (!suggestion || !isValidCommittedSalary(record.salary)) return suggestion;
    return { ...suggestion, comparisonSalary: Math.round(record.salary) };
  } catch {
    return null;
  }
}

export interface RentPlanSnapshot {
  readonly salary: number | null;
  readonly selected: City | null;
  readonly selectedName: string | null;
  readonly cities: readonly City[];
  readonly compareCities: readonly City[];
  readonly compareNames: readonly string[];
  readonly compareEntries: readonly ComparisonEntry[];
  readonly looking: boolean;
  readonly pendingName: string | null;
}

export type ComparisonResult =
  | { status: 'added'; name: string; city: City; salary: number; rentAvailable: boolean }
  | { status: 'already-compared'; name: string; city: City; salary: number }
  | { status: 'full'; name: string | null }
  | { status: 'not-found'; name: string };

export interface RentPlanAdapters {
  /** Production uses the typed server endpoint; tests can return a local result. */
  lookupRent: typeof lookupRent;
  /** Production uses the population endpoint; tests can resolve immediately. */
  fetchPopulation: typeof fetchPopulation;
  /** Lazy place-data lookup keeps the initial bundle small. */
  coordinatesForPlace: (
    city: string,
    state: string
  ) => Promise<readonly [number, number] | undefined>;
  /** Browser persistence is an adapter so the workflow is testable without a browser. */
  readStorage: (key: string) => string | null;
  writeStorage: (key: string, value: string) => void;
}

const browserAdapters: RentPlanAdapters = {
  lookupRent,
  fetchPopulation,
  coordinatesForPlace: async (city, state) => {
    const { coordinatesForPlace } = await import('$lib/data/places');
    return coordinatesForPlace(city, state) ?? undefined;
  },
  readStorage: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  writeStorage: (key, value) => {
    localStorage.setItem(key, value);
  }
};

/**
 * The rent-plan workspace module.
 *
 * Callers express intent (`chooseCity`, `addComparison`, `setSalary`) and read a
 * snapshot. Lookup, persistence, canonicalization, cancellation, and capacity
 * rules remain behind this seam, so the route and city modules do not need to
 * coordinate the workflow themselves.
 */
export class RentPlanWorkspace {
  private salaryValue = $state<number | null>(null);
  private citiesValue = $state<City[]>(cloneSeed());
  private selectedNameValue = $state<string | null>(null);
  private lookingValue = $state(false);
  /** City being resolved in the background (rent still loading) — drives the
   * "loading" affordance on nearby chips while the current view stays put. */
  private pendingNameValue = $state<string | null>(null);
  private readonly adapters: RentPlanAdapters;
  private readonly comparisonSet: ComparisonSet;
  private lookupController: AbortController | null = null;
  private resolutionVersion = 0;

  private beginResolution(): number {
    this.resolutionVersion += 1;
    this.lookupController?.abort();
    this.lookupController = null;
    this.lookingValue = false;
    this.pendingNameValue = null;
    return this.resolutionVersion;
  }

  private resolutionIsCurrent(version?: number): boolean {
    return version == null || version === this.resolutionVersion;
  }

  constructor(adapters: RentPlanAdapters = browserAdapters) {
    this.adapters = adapters;
    this.comparisonSet = new ComparisonSet({
      storage: {
        read: (key) => adapters.readStorage(key),
        write: (key, value) => {
          adapters.writeStorage(key, value);
          return true;
        }
      }
    });
  }

  get salary(): number | null {
    return this.salaryValue;
  }

  get cities(): City[] {
    return this.citiesValue;
  }

  get selectedName(): string | null {
    return this.selectedNameValue;
  }

  get compareNames(): string[] {
    return [...this.comparisonSet.names];
  }

  get looking(): boolean {
    return this.lookingValue;
  }

  get pendingName(): string | null {
    return this.pendingNameValue;
  }

  get selected(): City | null {
    return this.selectedName ? this.cityByName(this.selectedName) : null;
  }

  get compareCities(): City[] {
    return [...this.comparisonSet.cities];
  }

  get compareEntries(): readonly ComparisonEntry[] {
    return this.comparisonSet.entries;
  }

  cityByName(name: string): City | null {
    const t = name.toLowerCase();
    return this.cities.find((c) => c.name.toLowerCase() === t) ?? null;
  }

  get snapshot(): RentPlanSnapshot {
    return {
      salary: this.salary,
      selected: this.selected,
      selectedName: this.selectedName,
      cities: this.cities,
      compareCities: this.compareCities,
      compareNames: this.compareNames,
      compareEntries: this.compareEntries,
      looking: this.looking,
      pendingName: this.pendingName
    };
  }

  /** Set the offer salary and persist the new plan. Invalid input clears it. */
  setSalary(value: number | null) {
    this.salaryValue =
      value != null && Number.isFinite(value) && value > 0 && value <= MAX_SALARY
        ? Math.round(value)
        : null;
    this.persist();
  }

  /** Select a city after its rent record is ready (or explicitly unavailable). */
  selectCity(name: string): boolean {
    if (!this.cityByName(name)) return false;
    this.beginResolution();
    return this.commitSelection(name);
  }

  private commitSelection(name: string): boolean {
    if (!this.cityByName(name)) return false;
    this.selectedNameValue = name;
    this.persist();
    void this.ensureCoordinates(name);
    void this.ensurePopulation(name);
    return true;
  }

  /** Explicit city-navigation intent. Comparison additions use addComparison instead. */
  async chooseCity(suggestion: PlanSuggestion): Promise<string> {
    const version = this.beginResolution();
    return this.resolveSuggestion(suggestion, { select: true, version });
  }

  private coordinateLookups = new Set<string>();

  /** Hydrate map coordinates for a bundled rent city that is not in the curated
   * coordinate list. The place dataset is loaded only when this fallback is needed. */
  private async ensureCoordinates(name: string) {
    const city = this.cityByName(name);
    if (!city || city.lat != null || city.lng != null) return;
    const key = name.toLowerCase();
    if (this.coordinateLookups.has(key)) return;
    this.coordinateLookups.add(key);
    try {
      const coords = await this.adapters.coordinatesForPlace(city.city, city.state);
      if (coords) this.patchCity(name, { lat: coords[0], lng: coords[1] });
    } finally {
      this.coordinateLookups.delete(key);
    }
  }

  private popLookups = new Set<string>();

  /** Fill in a missing population figure for a city (fire-and-forget).
   * Curated seed blurbs like "2.8M metro" are kept as-is. */
  private async ensurePopulation(name: string) {
    const city = this.cityByName(name);
    if (!city || city.pop || city.lat == null || city.lng == null) return;
    const key = name.toLowerCase();
    if (this.popLookups.has(key)) return;
    this.popLookups.add(key);
    try {
      const pop = await this.adapters.fetchPopulation(city.lat, city.lng);
      if (pop != null) {
        this.patchCity(name, { pop: popText(pop) });
        this.persist();
      }
    } finally {
      this.popLookups.delete(key);
    }
  }

  private commitComparison(name: string): ComparisonResult {
    const city = this.cityByName(name);
    if (!city) return { status: 'not-found', name };
    return this.comparisonSet.add(city, this.salary);
  }

  /** Add a city to comparison without changing the active plan. */
  addComparison(input: string): ComparisonResult;
  addComparison(input: PlanSuggestion): Promise<ComparisonResult>;
  addComparison(input: PlanSuggestion | string): ComparisonResult | Promise<ComparisonResult> {
    const requestedName = typeof input === 'string' ? input : input.label;
    const known = this.cityByName(requestedName);
    if (known && this.isComparing(known.name)) {
      return this.comparisonSet.add(known, this.salary);
    }
    if (this.comparisonSet.size >= MAX_COMPARISON_ENTRIES) {
      return { status: 'full', name: known?.name ?? requestedName };
    }

    const version = this.beginResolution();
    if (typeof input === 'string') return this.commitComparison(input);
    return this.resolveSuggestion(input, { select: false, version }).then((name) =>
      this.commitComparison(name)
    );
  }

  /** Remove one comparison entry without changing the active plan. */
  removeComparison(name: string): boolean {
    return this.comparisonSet.remove(name);
  }

  clearComparison() {
    this.comparisonSet.clear();
  }

  setComparisonSalary(name: string, value: number): boolean {
    return this.comparisonSet.setSalary(name, value);
  }

  isComparing(name: string): boolean {
    return this.comparisonSet.isComparing(name);
  }

  /** Resolve a city from an autocomplete suggestion: add it if new, then fill rent
   * from the bundled HUD table if it isn't a seed city. Returns the canonical name.
   * Nearby-place picks carry an OSM population — used as an instant prefill. */
  private async resolveSuggestion(
    sug: PlanSuggestion,
    options: { select?: boolean; version?: number } = {}
  ): Promise<string> {
    const selectOnResolve = options.select ?? true;
    const version = options.version;
    const prefillPop = sug.pop != null && sug.pop > 0 ? popText(sug.pop) : '';
    const seed = findSeedCity(sug.label);
    const target = seed ? { ...sug, label: seed.name, city: seed.city, state: seed.state } : sug;
    if (!this.resolutionIsCurrent(version)) return target.label;
    if (seed) {
      this.lookupController?.abort();
      this.lookupController = null;
      this.lookingValue = false;
      this.pendingNameValue = null;
      // Ensure the seed city carries coords for the map.
      if (seed.lat == null && target.lat != null && target.lng != null) {
        this.patchCity(seed.name, { lat: target.lat, lng: target.lng });
      }
      if (!seed.pop && prefillPop) this.patchCity(seed.name, { pop: prefillPop });
      if (seed.r1 != null) {
        if (selectOnResolve && this.resolutionIsCurrent(version)) this.commitSelection(seed.name);
        return seed.name;
      }
    }

    if (!seed && (target.lat == null || target.lng == null)) {
      const coords = await this.adapters.coordinatesForPlace(target.city, target.state);
      if (!this.resolutionIsCurrent(version)) return target.label;
      if (coords) {
        return this.resolveSuggestion({ ...target, lat: coords[0], lng: coords[1] }, options);
      }
    }

    const existing = this.cityByName(target.label);
    if (!existing) {
      this.citiesValue = [
        ...this.citiesValue,
        {
          name: target.label,
          city: target.city,
          state: target.state,
          r1: null,
          r2: null,
          yoy: null,
          tax: STATE_TAX[target.state] || 'varies',
          pop: prefillPop,
          citySnapshot: null,
          lat: target.lat,
          lng: target.lng,
          source: 'none',
          rentMetric: 'unknown',
          rentArea: target.label,
          rentYear: ''
        }
      ];
    } else if (!existing.pop && prefillPop) {
      this.patchCity(target.label, { pop: prefillPop });
    }

    // Load rent BEFORE switching the view. Selecting immediately would flash the
    // whole results column: every rent-dependent card (verdict, charts) collapses
    // while r1 is null, then re-expands when rent lands. Keeping the current city
    // rendered until the new one is ready swaps old-full → new-full with no reflow.
    // The clicked place shows a loading affordance via pendingName in the meantime.
    // If the city already has rent (revisited), skip the wait and select now.
    if (existing?.r1 != null) {
      if (selectOnResolve && this.resolutionIsCurrent(version)) this.commitSelection(target.label);
      return target.label;
    }

    // Local seed suggestions can be useful before their map coordinates are
    // hydrated. They cannot take the coordinate-based HUD lookup path yet.
    if (target.lat == null || target.lng == null) {
      if (selectOnResolve && this.resolutionIsCurrent(version)) this.commitSelection(target.label);
      return target.label;
    }

    this.lookupController?.abort();
    const controller = new AbortController();
    this.lookupController = controller;
    this.lookingValue = true;
    this.pendingNameValue = target.label;
    try {
      const r = await this.adapters.lookupRent(target.lat, target.lng, controller.signal);
      if (controller.signal.aborted || !this.resolutionIsCurrent(version)) return target.label;
      if (r.source !== 'none') {
        this.patchCity(target.label, {
          r1: r.r1,
          r2: r.r2,
          yoy: r.yoy,
          source: r.source,
          rentMetric: r.rentMetric,
          rentArea: r.rentArea,
          rentYear: r.rentYear
        });
      }
    } finally {
      if (this.lookupController === controller) {
        this.lookingValue = false;
        this.pendingNameValue = null;
        this.lookupController = null;
        if (selectOnResolve && this.resolutionIsCurrent(version)) {
          this.commitSelection(target.label); // atomic swap now that rent is in
        }
        this.persist();
      }
    }
    return target.label;
  }

  private patchCity(name: string, patch: Partial<City>) {
    const t = name.toLowerCase();
    this.citiesValue = this.citiesValue.map((c) =>
      c.name.toLowerCase() === t ? { ...c, ...patch } : c
    );
    const updated = this.cityByName(name);
    if (updated) this.comparisonSet.updateCity(updated);
  }

  private persist() {
    try {
      // Off-list cities added via autocomplete aren't in the seed set — store them
      // whole so selection/comparison survives a reload.
      const seedNames = new Set(SEED_CITIES.map((c) => c.name.toLowerCase()));
      const custom = this.citiesValue.filter((c) => !seedNames.has(c.name.toLowerCase()));
      this.adapters.writeStorage(
        LAST_KEY,
        JSON.stringify({
          salary: this.salaryValue,
          selected: this.selectedNameValue,
          custom
        })
      );
    } catch {
      /* ignore */
    }
  }

  /** Serialize the shareable state (salary, selected city, compare list) into a
   * canonical query string. Fixed param order so equal state yields an identical
   * string — the write-effect relies on that to short-circuit no-op updates.
   * Coords ride along only for an off-list selected city, so a fresh recipient can
   * re-resolve its rent (see hydrateFromSearch). */
  buildSearch(salaryOverride?: number | null): string {
    const sp = new URLSearchParams();
    const salary = salaryOverride === undefined ? this.salary : salaryOverride;
    if (salary != null && Number.isFinite(salary) && salary > 0) {
      sp.set('salary', String(Math.round(salary)));
    }
    const sel = this.selected;
    if (sel) {
      sp.set('city', sel.name);
      const offList = sel.source === 'none' || sel.source === 'hud-fmr';
      if (offList && sel.lat != null && sel.lng != null) {
        sp.set('lat', String(sel.lat));
        sp.set('lng', String(sel.lng));
      }
    }
    appendComparisonLinks(sp, this.compareEntries);
    return sp.toString();
  }

  private ensureOffListPlaceholder(suggestion: PlanSuggestion): City {
    const existing = this.cityByName(suggestion.label);
    if (existing) {
      const patch: Partial<City> = {};
      if (existing.lat == null && suggestion.lat != null) patch.lat = suggestion.lat;
      if (existing.lng == null && suggestion.lng != null) patch.lng = suggestion.lng;
      if (!existing.pop && suggestion.pop != null && suggestion.pop > 0) {
        patch.pop = popText(suggestion.pop);
      }
      if (Object.keys(patch).length) this.patchCity(existing.name, patch);
      return this.cityByName(existing.name) ?? existing;
    }

    const city: City = {
      name: suggestion.label,
      city: suggestion.city,
      state: suggestion.state,
      r1: null,
      r2: null,
      yoy: null,
      tax: STATE_TAX[suggestion.state] || 'varies',
      pop: suggestion.pop != null && suggestion.pop > 0 ? popText(suggestion.pop) : '',
      citySnapshot: null,
      lat: suggestion.lat,
      lng: suggestion.lng,
      source: 'none',
      rentMetric: 'unknown',
      rentArea: suggestion.label,
      rentYear: ''
    };
    this.citiesValue = [...this.citiesValue, city];
    return city;
  }

  private async resolveHydratedLookups(lookups: readonly HydratedLookup[], version: number) {
    for (const lookup of lookups) {
      if (!this.resolutionIsCurrent(version)) return;
      await this.resolveSuggestion(lookup.suggestion, {
        select: lookup.select,
        version
      });
    }
  }

  private scheduleLookup(
    suggestion: PlanSuggestion,
    select: boolean,
    lookups: Map<string, HydratedLookup>
  ): string {
    const city = this.ensureOffListPlaceholder(suggestion);
    if (city.source === 'apartment-list' || city.r1 != null) {
      if (select) this.commitSelection(city.name);
      return city.name;
    }
    const key = city.name.toLowerCase();
    const existing = lookups.get(key);
    if (existing) {
      existing.select ||= select;
    } else {
      lookups.set(key, {
        suggestion: {
          ...suggestion,
          label: city.name,
          city: city.city,
          state: city.state,
          lat: city.lat,
          lng: city.lng
        },
        select
      });
    }
    return city.name;
  }

  private linkSalary(search: URLSearchParams): number | null {
    const raw = search.get('salary');
    if (raw == null) return null;
    const value = parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 && value <= MAX_SALARY ? value : null;
  }

  private comparisonSalaryLinks(search: URLSearchParams): {
    byName: Map<string, number>;
    positional: number[];
  } {
    const byName = new Map<string, number>();
    const positional: number[] = [];
    for (const raw of search.getAll('compare-salary')) {
      const parsed = parseComparisonSalaryLink(raw);
      if (parsed) {
        byName.set(parsed.name.toLowerCase(), parsed.salary);
        continue;
      }
      const value = Number(raw);
      if (Number.isFinite(value) && value > 0 && value <= MAX_SALARY) {
        positional.push(Math.round(value));
      }
    }
    return { byName, positional };
  }

  private applyComparisonSearch(
    search: URLSearchParams,
    fallbackSalary: number,
    scheduleLookup: (suggestion: PlanSuggestion, select: boolean) => string
  ): void {
    const salaries = this.comparisonSalaryLinks(search);
    const entries: ComparisonEntry[] = [];
    const seen = new Set<string>();
    let entryIndex = 0;

    for (const [key, value] of search) {
      let city: City | null = null;
      let suggestion: PlanSuggestion | null = null;
      if (key === 'compare') {
        city = this.cityByName(value);
        if (city?.source !== 'apartment-list') city = null;
      } else if (key === 'compare-offlist') {
        suggestion = parseOffListValue(value);
        if (suggestion) {
          const existing = this.cityByName(suggestion.label);
          const candidateKey = (existing?.name ?? suggestion.label).toLowerCase();
          if (seen.has(candidateKey) || entries.length >= MAX_COMPARISON_ENTRIES) continue;
          city = this.ensureOffListPlaceholder(suggestion);
        }
      }
      if (!city) continue;

      const cityKey = city.name.toLowerCase();
      if (seen.has(cityKey) || entries.length >= MAX_COMPARISON_ENTRIES) continue;
      seen.add(cityKey);
      const salary =
        salaries.byName.get(cityKey) ??
        suggestion?.comparisonSalary ??
        salaries.positional[entryIndex] ??
        fallbackSalary;
      entries.push({ city, salary });
      entryIndex += 1;
      if (suggestion && city.source !== 'apartment-list' && city.r1 == null) {
        scheduleLookup(suggestion, false);
      }
    }

    this.comparisonSet.replace(entries);
  }

  /** Seed state from URL query params. URL comparison state is authoritative. */
  hydrateFromSearch(search: URLSearchParams): boolean {
    const version = this.beginResolution();
    const linkSalary = this.linkSalary(search);
    if (linkSalary != null) this.salaryValue = linkSalary;

    const cityName = search.get('city');
    let selectedCity = false;
    const lookups = new Map<string, HydratedLookup>();
    const scheduleLookup = (suggestion: PlanSuggestion, select: boolean) =>
      this.scheduleLookup(suggestion, select, lookups);

    if (cityName && cityName.length <= 100) {
      const known = this.cityByName(cityName);
      if (known) {
        this.commitSelection(known.name);
        selectedCity = true;
      } else {
        const suggestion = this.offListSuggestionFromSearch(cityName, search);
        if (suggestion) {
          const city = this.ensureOffListPlaceholder(suggestion);
          selectedCity = true;
          if (city.r1 != null) this.commitSelection(city.name);
          else scheduleLookup(suggestion, true);
        }
      }
    }

    const hasComparisonLinkState =
      search.has('compare') || search.has('compare-offlist') || search.has('compare-salary');
    const hasLinkState = selectedCity || hasComparisonLinkState;
    if (hasLinkState) {
      this.applyComparisonSearch(search, linkSalary ?? DEFAULT_COMPARISON_SALARY, scheduleLookup);
    }
    this.persist();
    void this.resolveHydratedLookups([...lookups.values()], version);

    return selectedCity || hasLinkState;
  }

  private offListSuggestionFromSearch(
    cityName: string,
    search: URLSearchParams
  ): PlanSuggestion | null {
    const latRaw = search.get('lat');
    const lngRaw = search.get('lng');
    if (latRaw == null || lngRaw == null || latRaw.trim() === '' || lngRaw.trim() === '') {
      return null;
    }
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    return offListSuggestion(cityName, lat, lng);
  }

  /** Apply URL params on browser back/forward navigation. URL state is the sole
   * source of truth, including the complete comparison set. */
  applyUrlNavigation(search: URLSearchParams) {
    const version = this.beginResolution();
    const linkSalary = this.linkSalary(search);
    this.salaryValue = linkSalary;

    const cityName = search.get('city');
    const lookups = new Map<string, HydratedLookup>();
    const scheduleLookup = (suggestion: PlanSuggestion, select: boolean) =>
      this.scheduleLookup(suggestion, select, lookups);

    if (cityName && cityName.length <= 100) {
      const known = this.cityByName(cityName);
      if (known) {
        this.commitSelection(known.name);
      } else {
        const suggestion = this.offListSuggestionFromSearch(cityName, search);
        if (suggestion) {
          const city = this.ensureOffListPlaceholder(suggestion);
          if (city.r1 != null) this.commitSelection(city.name);
          else scheduleLookup(suggestion, true);
        } else {
          this.selectedNameValue = null;
        }
      }
    } else {
      this.selectedNameValue = null;
    }

    this.applyComparisonSearch(search, linkSalary ?? DEFAULT_COMPARISON_SALARY, scheduleLookup);
    this.persist();
    void this.resolveHydratedLookups([...lookups.values()], version);
  }

  restoreSession() {
    try {
      const raw = this.adapters.readStorage(LAST_KEY) ?? this.adapters.readStorage(LEGACY_KEY);
      let restoredPlan: Record<string, unknown> | null = null;
      if (raw) {
        try {
          const parsed: unknown = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            restoredPlan = parsed as Record<string, unknown>;
          }
        } catch {
          // The comparison set can still restore its own representation.
        }
      }

      if (restoredPlan) {
        if (
          typeof restoredPlan.salary === 'number' &&
          Number.isFinite(restoredPlan.salary) &&
          restoredPlan.salary > 0 &&
          restoredPlan.salary <= MAX_SALARY
        ) {
          this.salaryValue = restoredPlan.salary;
        }
        if (Array.isArray(restoredPlan.custom)) {
          const valid = restoredPlan.custom
            .map(restoreCity)
            .filter((c: City | null): c is City => c != null);
          if (valid.length) {
            const have = new Set(this.citiesValue.map((c) => c.name.toLowerCase()));
            this.citiesValue = [
              ...this.citiesValue,
              ...valid.filter((c: City) => !have.has(c.name.toLowerCase()))
            ];
          }
        }
        if (typeof restoredPlan.selected === 'string' && this.cityByName(restoredPlan.selected)) {
          this.selectedNameValue = restoredPlan.selected;
          void this.ensureCoordinates(restoredPlan.selected);
          void this.ensurePopulation(restoredPlan.selected);
        }
      }

      this.comparisonSet.restore({ resolveCity: (name) => this.cityByName(name) });
      const have = new Set(this.citiesValue.map((city) => city.name.toLowerCase()));
      const restoredCities = this.comparisonSet.entries
        .map((entry) => entry.city)
        .filter((city) => !have.has(city.name.toLowerCase()));
      if (restoredCities.length) {
        this.citiesValue = [...this.citiesValue, ...restoredCities];
      }

      if (!this.adapters.readStorage(LAST_KEY) && raw) this.persist();
    } catch {
      /* ignore */
    }
  }
}

export const app = new RentPlanWorkspace();
