import { SEED_CITIES, findSeedCity, STATE_TAX, stateOf, cityOf } from '$lib/data/cities';
import { popText } from '$lib/format';
import { MAX_SALARY } from '$lib/salary';
import type { City, CitySnapshot, CitySuggestion, RentMetric } from '$lib/types';
import { fetchPopulation, lookupRent } from '$lib/api';

const LAST_KEY = 'rentToolLast.v3';
const LEGACY_KEY = 'rentToolLast.v2';

function metricForSource(source: City['source']): RentMetric {
  if (source === 'apartment-list') return 'estimated-median';
  if (source === 'hud-fmr') return 'fair-market-rent';
  return 'unknown';
}

function restoredSnapshot(value: unknown): CitySnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const f = value as Partial<CitySnapshot>;
  if (
    typeof f.population !== 'number' ||
    f.population <= 0 ||
    typeof f.householdIncome !== 'number' ||
    f.householdIncome <= 0 ||
    typeof f.commuteMinutes !== 'number' ||
    f.commuteMinutes < 0 ||
    f.commuteMinutes > 300 ||
    typeof f.renterShare !== 'number' ||
    f.renterShare < 0 ||
    f.renterShare > 100 ||
    typeof f.rentalVacancy !== 'number' ||
    f.rentalVacancy < 0 ||
    f.rentalVacancy > 100
  )
    return null;
  return {
    population: f.population,
    householdIncome: f.householdIncome,
    commuteMinutes: f.commuteMinutes,
    renterShare: f.renterShare,
    rentalVacancy: f.rentalVacancy
  };
}

function restoredCity(value: unknown): City | null {
  if (!value || typeof value !== 'object') return null;
  const c = value as Partial<City>;
  if (
    typeof c.name !== 'string' ||
    c.name.length > 100 ||
    typeof c.city !== 'string' ||
    typeof c.state !== 'string' ||
    !/^[A-Z]{2}$/.test(c.state) ||
    !['apartment-list', 'hud-fmr', 'none'].includes(c.source ?? '')
  )
    return null;
  const numberOrNull = (n: unknown) => n == null || (typeof n === 'number' && Number.isFinite(n));
  if (!numberOrNull(c.r1) || !numberOrNull(c.r2) || !numberOrNull(c.yoy)) return null;
  if (
    c.lat != null &&
    (typeof c.lat !== 'number' || !Number.isFinite(c.lat) || c.lat < -90 || c.lat > 90)
  )
    return null;
  if (
    c.lng != null &&
    (typeof c.lng !== 'number' || !Number.isFinite(c.lng) || c.lng < -180 || c.lng > 180)
  )
    return null;
  const source = c.source as City['source'];
  return {
    name: c.name,
    city: c.city,
    state: c.state,
    r1: c.r1 ?? null,
    r2: c.r2 ?? null,
    yoy: c.yoy ?? null,
    tax: typeof c.tax === 'string' ? c.tax.slice(0, 200) : STATE_TAX[c.state] || 'varies',
    pop: typeof c.pop === 'string' ? c.pop.slice(0, 200) : '',
    citySnapshot: restoredSnapshot(c.citySnapshot),
    lat: c.lat,
    lng: c.lng,
    source,
    rentMetric: ['estimated-median', 'fair-market-rent', 'unknown'].includes(c.rentMetric ?? '')
      ? (c.rentMetric as RentMetric)
      : metricForSource(source),
    rentArea: typeof c.rentArea === 'string' ? c.rentArea.slice(0, 150) : c.name,
    rentYear: typeof c.rentYear === 'string' ? c.rentYear.slice(0, 40) : ''
  };
}

function cloneSeed(): City[] {
  return SEED_CITIES.map((c) => ({ ...c }));
}

type PlanSuggestion = CitySuggestion & { pop?: number | null };

export interface RentPlanSnapshot {
  readonly salary: number | null;
  readonly selected: City | null;
  readonly selectedName: string | null;
  readonly cities: readonly City[];
  readonly compareCities: readonly City[];
  readonly compareNames: readonly string[];
  readonly looking: boolean;
  readonly pendingName: string | null;
}

export type ComparisonResult =
  | { status: 'added'; name: string; city: City; rentAvailable: boolean }
  | { status: 'already-compared'; name: string; city: City }
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
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore unavailable browser storage */
    }
  }
};

const MAX_COMPARE_CITIES = 5;

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
  private compareNamesValue = $state<string[]>([]);
  private lookingValue = $state(false);
  /** City being resolved in the background (rent still loading) — drives the
   * "loading" affordance on nearby chips while the current view stays put. */
  private pendingNameValue = $state<string | null>(null);
  private readonly adapters: RentPlanAdapters;
  private lookupController: AbortController | null = null;

  constructor(adapters: RentPlanAdapters = browserAdapters) {
    this.adapters = adapters;
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
    return this.compareNamesValue;
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
    return this.compareNames.map((n) => this.cityByName(n)).filter((c): c is City => c != null);
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
    this.selectedNameValue = name;
    this.persist();
    void this.ensureCoordinates(name);
    void this.ensurePopulation(name);
    return true;
  }

  /** Explicit city-navigation intent. Comparison additions use addComparison instead. */
  async chooseCity(suggestion: PlanSuggestion): Promise<string> {
    return this.resolveSuggestion(suggestion, { select: true });
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
    if (this.isComparing(city.name)) {
      return { status: 'already-compared', name: city.name, city };
    }
    if (this.compareNames.length >= MAX_COMPARE_CITIES) {
      return { status: 'full', name: city.name };
    }
    this.compareNamesValue = [...this.compareNames, city.name];
    this.persist();
    return { status: 'added', name: city.name, city, rentAvailable: city.r1 != null };
  }

  /** Add a city to comparison without changing the active plan. */
  addComparison(input: string): ComparisonResult;
  addComparison(input: PlanSuggestion): Promise<ComparisonResult>;
  addComparison(input: PlanSuggestion | string): ComparisonResult | Promise<ComparisonResult> {
    const requestedName = typeof input === 'string' ? input : input.label;
    const known = this.cityByName(requestedName);
    if (known && this.isComparing(known.name)) {
      return { status: 'already-compared', name: known.name, city: known };
    }
    if (this.compareNames.length >= MAX_COMPARE_CITIES) {
      return { status: 'full', name: known?.name ?? requestedName };
    }

    if (typeof input === 'string') return this.commitComparison(input);
    return this.resolveSuggestion(input, { select: false }).then((name) =>
      this.commitComparison(name)
    );
  }

  /** Remove one comparison entry without changing the active plan. */
  removeComparison(name: string): boolean {
    if (!this.isComparing(name)) return false;
    this.compareNamesValue = this.compareNames.filter((n) => n !== name);
    this.persist();
    return true;
  }

  clearComparison() {
    if (!this.compareNames.length) return;
    this.compareNamesValue = [];
    this.persist();
  }

  isComparing(name: string): boolean {
    return this.compareNames.includes(name);
  }

  /** Resolve a city from an autocomplete suggestion: add it if new, then fill rent
   * from the bundled HUD table if it isn't a seed city. Returns the canonical name.
   * Nearby-place picks carry an OSM population — used as an instant prefill. */
  private async resolveSuggestion(
    sug: PlanSuggestion,
    options: { select?: boolean } = {}
  ): Promise<string> {
    const selectOnResolve = options.select ?? true;
    const prefillPop = sug.pop != null && sug.pop > 0 ? popText(sug.pop) : '';
    const seed = findSeedCity(sug.label);
    const target = seed ? { ...sug, label: seed.name, city: seed.city, state: seed.state } : sug;
    if (seed) {
      this.lookupController?.abort();
      this.lookupController = null;
      this.lookingValue = false;
      this.pendingNameValue = null;
      // Ensure the seed city carries coords for the map.
      if (seed.lat == null) this.patchCity(seed.name, { lat: target.lat, lng: target.lng });
      if (!seed.pop && prefillPop) this.patchCity(seed.name, { pop: prefillPop });
      if (seed.r1 != null) {
        if (selectOnResolve) this.selectCity(seed.name);
        return seed.name;
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
      if (selectOnResolve) this.selectCity(target.label);
      return target.label;
    }

    this.lookupController?.abort();
    const controller = new AbortController();
    this.lookupController = controller;
    this.lookingValue = true;
    this.pendingNameValue = target.label;
    try {
      const r = await this.adapters.lookupRent(target.lat, target.lng, controller.signal);
      if (controller.signal.aborted) return target.label;
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
        if (selectOnResolve) this.selectCity(target.label); // atomic swap now that rent is in
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
          compare: this.compareNamesValue,
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
    // Only bundled seed cities survive a fresh load (resolvable by name);
    // off-list compare cities are intentionally not deep-linked.
    for (const name of this.compareNames) sp.append('compare', name);
    return sp.toString();
  }

  /** Seed state from URL query params. Returns true when a city was selected, so
   * the caller knows the URL "won" and can skip the session restore.
   * Mirrors restoreSession()'s validation discipline. */
  hydrateFromSearch(search: URLSearchParams): boolean {
    const salaryRaw = search.get('salary');
    if (salaryRaw != null) {
      const n = parseInt(salaryRaw, 10);
      if (Number.isFinite(n) && n > 0 && n <= MAX_SALARY) this.salaryValue = n;
    }

    const cityName = search.get('city');
    let selectedCity = false;
    if (cityName && cityName.length <= 100) {
      if (this.cityByName(cityName)) {
        this.selectedNameValue = cityName;
        void this.ensureCoordinates(cityName);
        void this.ensurePopulation(cityName);
        selectedCity = true;
      } else if (this.resolveOffList(cityName, search)) {
        // Off-list city from a shared link: re-resolved (fire-and-forget) via the
        // bundled-HUD lookup path using the coords the sharer encoded.
        selectedCity = true;
      }
    }

    const compare = search.getAll('compare').filter((n) => this.cityByName(n) != null);
    if (compare.length) this.compareNamesValue = [...new Set(compare)].slice(0, MAX_COMPARE_CITIES);

    return selectedCity;
  }

  /** Off-list city from a shared link/history entry: re-resolve bundled HUD rent
   * using the encoded coords. Returns true when the coords
   * validate and a resolve was kicked off. Both coords must be present — a
   * missing param must not coerce to 0 and resolve at (0,0). */
  private resolveOffList(cityName: string, search: URLSearchParams): boolean {
    const latRaw = search.get('lat');
    const lngRaw = search.get('lng');
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    const state = stateOf(cityName);
    if (
      latRaw &&
      lngRaw &&
      Number.isFinite(lat) &&
      lat >= -90 &&
      lat <= 90 &&
      Number.isFinite(lng) &&
      lng >= -180 &&
      lng <= 180 &&
      /^[A-Z]{2}$/.test(state)
    ) {
      void this.resolveSuggestion({ label: cityName, city: cityOf(cityName), state, lat, lng });
      return true;
    }
    return false;
  }

  /** Apply URL params on browser back/forward navigation. Unlike
   * hydrateFromSearch (initial load, which never clears so a bare ?salary= link
   * can fall back to localStorage), here the URL is the sole source of truth:
   * an absent param clears the corresponding state. */
  applyUrlNavigation(search: URLSearchParams) {
    const salaryRaw = search.get('salary');
    if (salaryRaw != null) {
      const n = parseInt(salaryRaw, 10);
      this.salaryValue = Number.isFinite(n) && n > 0 && n <= MAX_SALARY ? n : null;
    } else {
      this.salaryValue = null;
    }

    const cityName = search.get('city');
    if (cityName && cityName.length <= 100) {
      if (this.cityByName(cityName)) {
        this.selectedNameValue = cityName;
        void this.ensureCoordinates(cityName);
        void this.ensurePopulation(cityName);
      } else if (!this.resolveOffList(cityName, search)) {
        this.selectedNameValue = null;
      }
    } else {
      this.selectedNameValue = null;
    }

    // The compare set is persistent workspace state, not city-navigation state.
    // Older history entries often predate the user's latest compare additions;
    // replaying their query params here made cities appear to vanish on Back.
    // Initial deep links are still handled by hydrateFromSearch().

    this.persist();
  }

  restoreSession() {
    try {
      const raw = this.adapters.readStorage(LAST_KEY) ?? this.adapters.readStorage(LEGACY_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (
        typeof s.salary === 'number' &&
        Number.isFinite(s.salary) &&
        s.salary > 0 &&
        s.salary <= MAX_SALARY
      ) {
        this.salaryValue = s.salary;
      }
      if (Array.isArray(s.custom)) {
        const valid = s.custom.map(restoredCity).filter((c: City | null): c is City => c != null);
        if (valid.length) {
          const have = new Set(this.citiesValue.map((c) => c.name.toLowerCase()));
          this.citiesValue = [
            ...this.citiesValue,
            ...valid.filter((c: City) => !have.has(c.name.toLowerCase()))
          ];
        }
      }
      if (typeof s.selected === 'string' && this.cityByName(s.selected)) {
        this.selectedNameValue = s.selected;
        void this.ensureCoordinates(s.selected);
        void this.ensurePopulation(s.selected);
      }
      if (Array.isArray(s.compare)) {
        const compare = (s.compare as unknown[]).filter(
          (n: unknown): n is string => typeof n === 'string' && this.cityByName(n) != null
        );
        this.compareNamesValue = [...new Set<string>(compare)].slice(0, MAX_COMPARE_CITIES);
      }
      if (!this.adapters.readStorage(LAST_KEY)) this.persist();
    } catch {
      /* ignore */
    }
  }
}

export const app = new RentPlanWorkspace();
