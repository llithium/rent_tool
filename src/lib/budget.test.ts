import { describe, expect, it } from 'vitest';
import { computeBudget, federalTax, ficaTax, salaryForRent } from './budget';

describe('budget math', () => {
  it('applies federal brackets progressively', () => {
    expect(federalTax(16_100)).toBe(0);
    expect(federalTax(28_500)).toBeCloseTo(1_240);
    expect(federalTax(66_500)).toBeCloseTo(5_800);
  });

  it('caps Social Security and adds additional Medicare', () => {
    expect(ficaTax(100_000)).toBeCloseTo(7_650);
    expect(ficaTax(250_000)).toBeCloseTo(184_500 * 0.062 + 250_000 * 0.0145 + 50_000 * 0.009);
  });

  it('adds known local tax without double-counting it in the state rate', () => {
    const nyc = computeBudget(100_000, { name: 'New York, NY', state: 'NY' });
    expect(nyc.stateRate).toBe(0.06);
    expect(nyc.localRate).toBe(0.035);
    expect(nyc.localMonthly).toBeCloseTo(291.67, 1);
    expect(nyc.localTaxModeled).toBe(true);
  });

  it('marks unknown local tax as unmodeled', () => {
    const buffalo = computeBudget(100_000, { name: 'Buffalo, NY', state: 'NY' });
    expect(buffalo.localMonthly).toBe(0);
    expect(buffalo.localTaxModeled).toBe(false);
  });

  it('converts rent to the salary implied by the 30 percent rule', () => {
    expect(salaryForRent(2_000)).toBe(80_000);
  });
});
