/** Source of the rent figures currently shown for a city. */
export type RentSource = 'zumper-live' | 'zumper-snapshot' | 'hud-fmr' | 'census-acs' | 'none';

/** What the rent number represents. Sources are not directly interchangeable. */
export type RentMetric = 'median-asking' | 'fair-market-rent' | 'median-gross' | 'unknown';

export type RentRefreshStatus = 'live' | 'stale' | 'unavailable';

/** A city record: curated context merged with (possibly live) rent figures. */
export interface City {
  /** Canonical "City, ST" key. */
  name: string;
  city: string;
  state: string;
  /** Median 1BR rent, monthly USD. */
  r1: number | null;
  /** Median 2BR rent, monthly USD. */
  r2: number | null;
  /** 1BR year-over-year change, percent. null = unknown. */
  yoy: number | null;
  /** State/local income-tax note. */
  tax: string;
  /** Population blurb. */
  pop: string;
  /** Long-form context. */
  blurb: string;
  lat?: number;
  lng?: number;
  /** Where r1/r2/yoy came from. */
  source: RentSource;
  /** Statistical meaning, geography, and vintage of the rent figures. */
  rentMetric: RentMetric;
  rentArea: string;
  rentYear: string;
}

/** Autocomplete suggestion returned by /api/city-suggest. */
export interface CitySuggestion {
  label: string; // "City, ST"
  city: string;
  state: string;
  lat: number;
  lng: number;
}

/** Result of resolving rent for an off-list city via government APIs. */
export interface LookupResult {
  r1: number | null;
  r2: number | null;
  yoy: number | null;
  source: RentSource;
  rentMetric: RentMetric;
  rentArea: string;
  rentYear: string;
  note?: string;
  lat?: number;
  lng?: number;
}

/** Computed rent budget for a salary, with an estimated take-home breakdown. */
export interface Budget {
  grossMonthly: number;
  maxRent: number; // 30% rule
  comfyRent: number; // 25% rule
  takeHomeMonthly: number; // after federal + FICA + state tax
  federalMonthly: number; // federal income tax
  ficaMonthly: number; // Social Security + Medicare
  stateMonthly: number; // state income tax
  stateRate: number; // state fraction — for the "no state tax" note
  localMonthly: number; // modeled city/local income tax
  localRate: number; // city/local effective-rate estimate
  localTaxModeled: boolean; // false means a possible local tax is not included
  taxAssumptions: string;
  effRate: number; // total tax / gross, for the summary label
}
