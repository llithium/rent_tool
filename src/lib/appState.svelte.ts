import { SEED_CITIES, findSeedCity, STATE_TAX, stateOf, cityOf } from '$lib/data/cities';
import { popText } from '$lib/format';
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

class AppState {
  salary = $state<number | null>(null);
  cities = $state<City[]>(cloneSeed());
  selectedName = $state<string | null>(null);
  compareNames = $state<string[]>([]);
  looking = $state(false);
  /** City being resolved in the background (rent still loading) — drives the
   * "loading" affordance on nearby chips while the current view stays put. */
  pendingName = $state<string | null>(null);
  private lookupController: AbortController | null = null;

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

  select(name: string) {
    this.selectedName = name;
    this.persist();
    void this.ensurePopulation(name);
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
      const pop = await fetchPopulation(city.lat, city.lng);
      if (pop != null) {
        this.patchCity(name, { pop: popText(pop) });
        this.persist();
      }
    } finally {
      this.popLookups.delete(key);
    }
  }

  toggleCompare(name: string) {
    if (this.compareNames.includes(name)) {
      this.compareNames = this.compareNames.filter((n) => n !== name);
    } else if (this.compareNames.length < 5) {
      this.compareNames = [...this.compareNames, name];
    }
    this.persist();
  }

  isComparing(name: string): boolean {
    return this.compareNames.includes(name);
  }

  /** Resolve a city from an autocomplete suggestion: add it if new, then fill rent
   * from the bundled HUD table if it isn't a seed city. Returns the canonical name.
   * Nearby-place picks carry an OSM population — used as an instant prefill. */
  async resolveSuggestion(sug: CitySuggestion & { pop?: number | null }): Promise<string> {
    const prefillPop = sug.pop != null && sug.pop > 0 ? popText(sug.pop) : '';
    const seed = findSeedCity(sug.label);
    const target = seed ? { ...sug, label: seed.name, city: seed.city, state: seed.state } : sug;
    if (seed) {
      this.lookupController?.abort();
      this.lookupController = null;
      this.looking = false;
      // Ensure the seed city carries coords for the map.
      if (seed.lat == null) this.patchCity(seed.name, { lat: target.lat, lng: target.lng });
      if (!seed.pop && prefillPop) this.patchCity(seed.name, { pop: prefillPop });
      if (seed.r1 != null) {
        this.select(seed.name);
        return seed.name;
      }
    }

    const existing = this.cityByName(target.label);
    if (!existing) {
      this.cities = [
        ...this.cities,
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
      this.select(target.label);
      return target.label;
    }

    this.lookupController?.abort();
    const controller = new AbortController();
    this.lookupController = controller;
    this.looking = true;
    this.pendingName = target.label;
    try {
      const r = await lookupRent(target.lat, target.lng, controller.signal);
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
        this.looking = false;
        this.pendingName = null;
        this.lookupController = null;
        this.select(target.label); // atomic swap now that rent is in
        this.persist();
      }
    }
    return target.label;
  }

  private patchCity(name: string, patch: Partial<City>) {
    const t = name.toLowerCase();
    this.cities = this.cities.map((c) => (c.name.toLowerCase() === t ? { ...c, ...patch } : c));
  }

  persist() {
    try {
      // Off-list cities added via autocomplete aren't in the seed set — store them
      // whole so selection/comparison survives a reload.
      const seedNames = new Set(SEED_CITIES.map((c) => c.name.toLowerCase()));
      const custom = this.cities.filter((c) => !seedNames.has(c.name.toLowerCase()));
      localStorage.setItem(
        LAST_KEY,
        JSON.stringify({
          salary: this.salary,
          selected: this.selectedName,
          compare: this.compareNames,
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
   * the caller knows the URL "won" and can skip the localStorage restore.
   * Mirrors restore()'s validation discipline. */
  hydrateFromSearch(search: URLSearchParams): boolean {
    const salaryRaw = search.get('salary');
    if (salaryRaw != null) {
      const n = parseInt(salaryRaw, 10);
      if (Number.isFinite(n) && n > 0 && n <= 10_000_000) this.salary = n;
    }

    const cityName = search.get('city');
    let selectedCity = false;
    if (cityName && cityName.length <= 100) {
      if (this.cityByName(cityName)) {
        this.selectedName = cityName;
        void this.ensurePopulation(cityName);
        selectedCity = true;
      } else if (this.resolveOffList(cityName, search)) {
        // Off-list city from a shared link: re-resolved (fire-and-forget) via the
        // bundled-HUD lookup path using the coords the sharer encoded.
        selectedCity = true;
      }
    }

    const compare = search.getAll('compare').filter((n) => this.cityByName(n) != null);
    if (compare.length) this.compareNames = [...new Set(compare)].slice(0, 5);

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
      this.salary = Number.isFinite(n) && n > 0 && n <= 10_000_000 ? n : null;
    } else {
      this.salary = null;
    }

    const cityName = search.get('city');
    if (cityName && cityName.length <= 100) {
      if (this.cityByName(cityName)) {
        this.selectedName = cityName;
        void this.ensurePopulation(cityName);
      } else if (!this.resolveOffList(cityName, search)) {
        this.selectedName = null;
      }
    } else {
      this.selectedName = null;
    }

    // The compare set is persistent workspace state, not city-navigation state.
    // Older history entries often predate the user's latest compare additions;
    // replaying their query params here made cities appear to vanish on Back.
    // Initial deep links are still handled by hydrateFromSearch().

    this.persist();
  }

  restore() {
    try {
      const raw = localStorage.getItem(LAST_KEY) ?? localStorage.getItem(LEGACY_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (
        typeof s.salary === 'number' &&
        Number.isFinite(s.salary) &&
        s.salary > 0 &&
        s.salary <= 10_000_000
      ) {
        this.salary = s.salary;
      }
      if (Array.isArray(s.custom)) {
        const valid = s.custom.map(restoredCity).filter((c: City | null): c is City => c != null);
        if (valid.length) {
          const have = new Set(this.cities.map((c) => c.name.toLowerCase()));
          this.cities = [
            ...this.cities,
            ...valid.filter((c: City) => !have.has(c.name.toLowerCase()))
          ];
        }
      }
      if (typeof s.selected === 'string' && this.cityByName(s.selected)) {
        this.selectedName = s.selected;
        void this.ensurePopulation(s.selected);
      }
      if (Array.isArray(s.compare)) {
        const compare = (s.compare as unknown[]).filter(
          (n: unknown): n is string => typeof n === 'string' && this.cityByName(n) != null
        );
        this.compareNames = [...new Set<string>(compare)].slice(0, 5);
      }
      if (!localStorage.getItem(LAST_KEY)) this.persist();
    } catch {
      /* ignore */
    }
  }
}

export const app = new AppState();
