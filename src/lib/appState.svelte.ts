import { SEED_CITIES, findSeedCity, STATE_TAX, stateOf, cityOf } from '$lib/data/cities';
import type { City, CitySuggestion } from '$lib/types';
import { fetchLiveRents, lookupRent } from '$lib/api';

const LAST_KEY = 'rentToolLast.v2';

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
  looking = $state(false);

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
  private mergeLive(rows: { name: string; r1: number; yoy: number; r2: number }[]) {
    const byName = new Map(this.cities.map((c) => [c.name.toLowerCase(), c] as const));
    const next = [...this.cities];
    for (const row of rows) {
      const existing = byName.get(row.name.toLowerCase());
      if (existing) {
        const idx = next.indexOf(existing);
        next[idx] = { ...existing, r1: row.r1, r2: row.r2, yoy: row.yoy, source: 'zumper-live' };
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
          source: 'zumper-live'
        });
      }
    }
    this.cities = next;
  }

  async refreshLive() {
    const res = await fetchLiveRents();
    if (res.live && res.rows.length) {
      this.mergeLive(res.rows);
      this.live = true;
      const when = res.reportDate ? ` (${res.reportDate})` : '';
      this.liveLabel = `Live rents · Zumper National Rent Report${when} · ${res.rows.length} cities refreshed`;
    }
  }

  /** Resolve a city from an autocomplete suggestion: add it if new, then fill rent
   * from government APIs if it isn't a seed city. Returns the canonical name. */
  async resolveSuggestion(sug: CitySuggestion): Promise<string> {
    const seed = findSeedCity(sug.label);
    if (seed) {
      // Ensure the seed city carries coords for the map.
      if (seed.lat == null) this.patchCity(seed.name, { lat: sug.lat, lng: sug.lng });
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
          pop: '',
          blurb: '',
          lat: sug.lat,
          lng: sug.lng,
          source: 'none'
        }
      ];
    }
    this.select(sug.label);

    // Fetch gov rent data in the background.
    this.looking = true;
    try {
      const r = await lookupRent(sug.lat, sug.lng);
      if (r.source !== 'none') {
        this.patchCity(sug.label, {
          r1: r.r1,
          r2: r.r2,
          yoy: r.yoy,
          source: r.source,
          blurb: r.note ?? ''
        });
        this.persist(); // re-persist now that rents arrived
      }
    } finally {
      this.looking = false;
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
      const raw = localStorage.getItem(LAST_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (typeof s.salary === 'number') this.salary = s.salary;
      if (Array.isArray(s.custom)) {
        const valid = s.custom.filter(
          (c: unknown): c is City =>
            !!c && typeof c === 'object' && typeof (c as City).name === 'string'
        );
        if (valid.length) {
          const have = new Set(this.cities.map((c) => c.name.toLowerCase()));
          this.cities = [
            ...this.cities,
            ...valid.filter((c: City) => !have.has(c.name.toLowerCase()))
          ];
        }
      }
      if (typeof s.selected === 'string') this.selectedName = s.selected;
      if (Array.isArray(s.compare)) this.compareNames = s.compare.filter((n: unknown) => typeof n === 'string');
    } catch {
      /* ignore */
    }
  }
}

export const app = new AppState();
