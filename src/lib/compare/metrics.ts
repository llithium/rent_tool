import { salaryForRent } from '$lib/budget';
import { money, pctTrend } from '$lib/format';
import type { Budget, City } from '$lib/types';

/** One city's scenario: its own salary, the budget it buys, and how rent fits. */
export interface CompareRow {
  city: City;
  salary: number;
  budget: Budget;
  rentGap: number | null;
  afterRent: number | null;
}

export type MetricKey =
  | 'salary'
  | 'takehome'
  | 'tax'
  | 'budget'
  | 'rent1'
  | 'rent2'
  | 'after'
  | 'needed'
  | 'trend'
  | 'income'
  | 'commute'
  | 'renters'
  | 'vacancy';

export interface CompareMetric {
  key: MetricKey;
  label: string;
  /** Which end of the range counts as the winner. */
  direction: 'high' | 'low';
}

export const COMPARE_METRICS: readonly CompareMetric[] = [
  { key: 'salary', label: 'Annual salary', direction: 'high' },
  { key: 'takehome', label: 'Est. take-home', direction: 'high' },
  { key: 'tax', label: 'Effective tax rate', direction: 'low' },
  { key: 'budget', label: '30% rent budget', direction: 'high' },
  { key: 'rent1', label: '1BR rent', direction: 'low' },
  { key: 'rent2', label: '2BR rent', direction: 'low' },
  { key: 'after', label: 'Take-home after 1BR', direction: 'high' },
  { key: 'needed', label: 'Salary needed for 1BR', direction: 'low' },
  { key: 'trend', label: 'Rent trend', direction: 'low' },
  { key: 'income', label: 'Median household income', direction: 'high' },
  { key: 'commute', label: 'Average commute', direction: 'low' },
  { key: 'renters', label: 'Renter households', direction: 'high' },
  { key: 'vacancy', label: 'Rental vacancy', direction: 'high' }
];

/** The values that answer the affordability decision before city context. */
export const AFFORDABILITY_METRICS = COMPARE_METRICS.slice(0, 8);

/** Secondary city facts, available after the core rent decision is understood. */
export const CITY_CONTEXT_METRICS = COMPARE_METRICS.slice(8);

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function metricValue(row: CompareRow, key: MetricKey): string {
  const snapshot = row.city.citySnapshot;
  if (key === 'salary') return money(row.salary);
  if (key === 'takehome') return `${money(row.budget.takeHomeMonthly)}/mo`;
  if (key === 'tax') return pct(row.budget.effRate);
  if (key === 'budget') return `${money(row.budget.maxRent)}/mo`;
  if (key === 'rent1') return `${money(row.city.r1)}/mo`;
  if (key === 'rent2') return `${money(row.city.r2)}/mo`;
  if (key === 'after') return row.afterRent == null ? '—' : `${money(row.afterRent)}/mo`;
  if (key === 'needed') return row.city.r1 == null ? '—' : money(salaryForRent(row.city.r1));
  if (key === 'trend') return pctTrend(row.city.yoy);
  if (key === 'income') return money(snapshot?.householdIncome);
  if (key === 'commute') return snapshot ? `${snapshot.commuteMinutes} min` : '—';
  if (key === 'renters') return snapshot ? `${snapshot.renterShare}%` : '—';
  if (key === 'vacancy') return snapshot ? `${snapshot.rentalVacancy}%` : '—';
  return '—';
}

export function metricNumber(row: CompareRow, key: MetricKey): number | null {
  const snapshot = row.city.citySnapshot;
  if (key === 'salary') return row.salary;
  if (key === 'takehome') return row.budget.takeHomeMonthly;
  if (key === 'tax') return row.budget.effRate;
  if (key === 'budget') return row.budget.maxRent;
  if (key === 'rent1') return row.city.r1;
  if (key === 'rent2') return row.city.r2;
  if (key === 'after') return row.afterRent;
  if (key === 'needed') return row.city.r1 == null ? null : salaryForRent(row.city.r1);
  if (key === 'trend') return row.city.yoy;
  if (key === 'income') return snapshot?.householdIncome ?? null;
  if (key === 'commute') return snapshot?.commuteMinutes ?? null;
  if (key === 'renters') return snapshot?.renterShare ?? null;
  if (key === 'vacancy') return snapshot?.rentalVacancy ?? null;
  return null;
}

export type MetricTone = 'best' | 'worst' | null;

/**
 * Rank one cell against the same metric in every other row. Only called out when
 * every row has a comparable number and they are not all equal.
 */
export function metricTone(
  rows: CompareRow[],
  row: CompareRow,
  key: MetricKey,
  direction: 'high' | 'low'
): MetricTone {
  const values = rows
    .map((candidate) => metricNumber(candidate, key))
    .filter((value): value is number => value != null && Number.isFinite(value));
  const value = metricNumber(row, key);
  if (value == null || values.length < 2 || values.length !== rows.length) return null;
  const low = Math.min(...values);
  const high = Math.max(...values);
  if (low === high) return null;
  if (value === (direction === 'high' ? high : low)) return 'best';
  if (value === (direction === 'high' ? low : high)) return 'worst';
  return null;
}

/** A direct, text-based counterpart to the best/worst visual treatment. */
export function metricToneLabel(
  key: MetricKey,
  direction: 'high' | 'low',
  tone: Exclude<MetricTone, null>
): string {
  if (tone === 'worst') return direction === 'high' ? 'Lowest' : 'Highest';
  if (key === 'after') return 'Most left';
  if (key === 'rent1' || key === 'rent2' || key === 'needed' || key === 'commute') return 'Lowest';
  if (key === 'tax' || key === 'trend') return 'Lowest';
  return 'Highest';
}

export function fitStatus(row: CompareRow): { label: string; tone: 'good' | 'bad' | null } {
  if (row.rentGap == null) return { label: 'Rent unavailable', tone: null };
  if (row.rentGap >= 0) return { label: `${money(row.rentGap)} under budget`, tone: 'good' };
  return { label: `${money(Math.abs(row.rentGap))} over budget`, tone: 'bad' };
}

/** Deep link back to the city view for this scenario, keeping the compare set. */
export function cityHref(row: CompareRow, compareNames: string[]): string {
  const search = new URLSearchParams();
  search.set('salary', String(Math.round(row.salary)));
  search.set('city', row.city.name);
  if (
    (row.city.source === 'none' || row.city.source === 'hud-fmr') &&
    row.city.lat != null &&
    row.city.lng != null
  ) {
    search.set('lat', String(row.city.lat));
    search.set('lng', String(row.city.lng));
  }
  for (const name of compareNames) search.append('compare', name);
  return `/?${search}`;
}
