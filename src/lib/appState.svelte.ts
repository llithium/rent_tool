import { SEED_CITIES, findSeedCity, STATE_TAX, stateOf, cityOf } from '$lib/data/cities';
import { popText } from '$lib/format';
import type { City, CitySuggestion, RentMetric } from '$lib/types';
import { fetchLiveRents, fetchPopulation, lookupRent } from '$lib/api';

const LAST_KEY = 'rentToolLast.v3';
const LEGACY_KEY = 'rentToolLast.v2';

function metricForSource(source: City['source']): RentMetric {
  if (source === 'zumper-live' || source === 'zumper-snapshot') return 'median-asking';
  if (source === 'hud-fmr') return 'fair-market-rent';
  if (source === 'census-acs') return 'median-gross';
  return 'unknown';
}

function restoredCity(value: unknown): City | null {
  if (!value || typeof value !== 'object') return null;
  const c = value as Partial<City>;
  if (
    typeof c.name !== 'string' || c.name.length > 100 ||
    typeof c.city !== 'string' || typeof c.state !== 'string' || !/^[A-Z]{2}$/.test(c.state) ||
    !['zumper-live', 'zumper-snapshot', 'hud-fmr', 'census-acs', 'none'].includes(c.source ?? '')
  ) return null;
  const numberOrNull = (n: unknown) => n == null || (typeof n === 'number' && Number.isFinite(n));
  if (!numberOrNull(c.r1) || !numberOrNull(c.r2) || !numberOrNull(c.yoy)) return null;
  if (c.lat != null && (typeof c.lat !== 'number' || !Number.isFinite(c.lat) || c.lat < -90 || c.lat > 90)) return null;
  if (c.lng != null && (typeof c.lng !== 'number' || !Number.isFinite(c.lng) || c.lng < -180 || c.lng > 180)) return null;
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
    blurb: typeof c.blurb === 'string' ? c.blurb.slice(0, 500) : '',
    lat: c.lat,
    lng: c.lng,
    source,
    rentMetric: ['median-asking', 'fair-market-rent', 'median-gross', 'unknown'].includes(c.rentMetric ?? '')
      ? c.rentMetric as RentMetric
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
  liveLabel = $state('Zumper National Rent Report, June 2026 snapshot (100 cities)');
  live = $state(false);
  refreshStatus = $state<'live' | 'stale' | 'unavailable'>('unavailable');
  looking = $state(false);
  /** City being resolved in the background (rent still loading) — drives the
   * "loading" affordance on nearby chips while the current view stays put. */
  pendingName = $state<string | null>(null);
  private lookupController: AbortController | null = null;

  get selected(): City | null {
    return this.selectedName ? this.cityByName(this.selectedName) : null;
  }

  get compareCities(): City[] {
    return this.compareNames
      .map((n) => this.cityByName(n))
      .filter((c): c is City => c != null);
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

  /** Merge live Zumper rows over the working set. */
  private mergeLive(
    rows: { name: string; r1: number; yoy: number; r2: number }[],
    reportDate: string | null
  ) {
    const byName = new Map(this.cities.map((c) => [c.name.toLowerCase(), c] as const));
    const next = [...this.cities];
    for (const row of rows) {
      const existing = byName.get(row.name.toLowerCase());
      if (existing) {
        const idx = next.indexOf(existing);
        next[idx] = {
          ...existing, r1: row.r1, r2: row.r2, yoy: row.yoy, source: 'zumper-live',
          rentMetric: 'median-asking', rentArea: row.name, rentYear: reportDate ?? ''
        };
      } else {
        const st = stateOf(row.name);
        next.push({
          name: row.name,
          city: cityOf(row.name),
          state: st,
          r1: row.r1,
          r2: row.r2,
          yoy: row.yoy,
          tax: STATE_TAX[st] || 'varies',
          pop: '',
          blurb: '',
          source: 'zumper-live',
          rentMetric: 'median-asking',
          rentArea: row.name,
          rentYear: reportDate ?? ''
        });
      }
    }
    this.cities = next;
  }

  async refreshLive() {
    const res = await fetchLiveRents();
    if (res.rows.length) this.mergeLive(res.rows, res.reportDate);
    this.refreshStatus = res.status;
    this.live = res.status === 'live';
    const when = res.reportDate ? ` · ${res.reportDate}` : '';
    if (res.status === 'live') {
      this.liveLabel = `Live · Zumper National Rent Report${when} · ${res.rowCount} cities`;
    } else if (res.status === 'stale') {
      this.liveLabel = `Cached rents${when} · live refresh unavailable`;
    } else {
      this.liveLabel = 'June 2026 rent snapshot · live refresh unavailable';
    }
  }

  /** Resolve a city from an autocomplete suggestion: add it if new, then fill rent
   * from government APIs if it isn't a seed city. Returns the canonical name.
   * Nearby-place picks carry an OSM population — used as an instant prefill. */
  async resolveSuggestion(sug: CitySuggestion & { pop?: number | null }): Promise<string> {
    const prefillPop = sug.pop != null && sug.pop > 0 ? popText(sug.pop) : '';
    const seed = findSeedCity(sug.label);
    if (seed) {
      this.lookupController?.abort();
      this.lookupController = null;
      this.looking = false;
      // Ensure the seed city carries coords for the map.
      if (seed.lat == null) this.patchCity(seed.name, { lat: sug.lat, lng: sug.lng });
      if (!seed.pop && prefillPop) this.patchCity(seed.name, { pop: prefillPop });
      this.select(seed.name);
      return seed.name;
    }

    const existing = this.cityByName(sug.label);
    if (!existing) {
      this.cities = [
        ...this.cities,
        {
          name: sug.label,
          city: sug.city,
          state: sug.state,
          r1: null,
          r2: null,
          yoy: null,
          tax: STATE_TAX[sug.state] || 'varies',
          pop: prefillPop,
          blurb: '',
          lat: sug.lat,
          lng: sug.lng,
          source: 'none',
          rentMetric: 'unknown',
          rentArea: sug.label,
          rentYear: ''
        }
      ];
    } else if (!existing.pop && prefillPop) {
      this.patchCity(sug.label, { pop: prefillPop });
    }

    // Load rent BEFORE switching the view. Selecting immediately would flash the
    // whole results column: every rent-dependent card (verdict, charts) collapses
    // while r1 is null, then re-expands when rent lands. Keeping the current city
    // rendered until the new one is ready swaps old-full → new-full with no reflow.
    // The clicked place shows a loading affordance via pendingName in the meantime.
    // If the city already has rent (revisited), skip the wait and select now.
    if (existing?.r1 != null) {
      this.select(sug.label);
      return sug.label;
    }

    this.lookupController?.abort();
    const controller = new AbortController();
    this.lookupController = controller;
    this.looking = true;
    this.pendingName = sug.label;
    try {
      const r = await lookupRent(sug.lat, sug.lng, controller.signal);
      if (controller.signal.aborted) return sug.label;
      if (r.source !== 'none') {
        this.patchCity(sug.label, {
          r1: r.r1,
          r2: r.r2,
          yoy: r.yoy,
          source: r.source,
          rentMetric: r.rentMetric,
          rentArea: r.rentArea,
          rentYear: r.rentYear,
          blurb: r.note ?? ''
        });
      }
    } finally {
      if (this.lookupController === controller) {
        this.looking = false;
        this.pendingName = null;
        this.lookupController = null;
        this.select(sug.label); // atomic swap now that rent is in
        this.persist();
      }
    }
    return sug.label;
  }

  private patchCity(name: string, patch: Partial<City>) {
    const t = name.toLowerCase();
    this.cities = this.cities.map((c) =>
      c.name.toLowerCase() === t ? { ...c, ...patch } : c
    );
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

  restore() {
    try {
      const raw = localStorage.getItem(LAST_KEY) ?? localStorage.getItem(LEGACY_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (typeof s.salary === 'number' && Number.isFinite(s.salary) && s.salary > 0 && s.salary <= 10_000_000) {
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
