import type { Budget } from '$lib/types';

/** Rough *effective* state (incl. notable local) income-tax rate by state, for a typical
 * mid-career salary. This is a deliberate estimate to power the take-home visual — not tax
 * advice. States with no wage income tax are 0. */
export const EST_STATE_RATE: Record<string, number> = {
  AL: 0.045, AK: 0, AR: 0.039, AZ: 0.025, CA: 0.06, CO: 0.044, CT: 0.055,
  DC: 0.075, DE: 0.05, FL: 0, GA: 0.0499, HI: 0.079, ID: 0.053, IL: 0.0495,
  IN: 0.049, IA: 0.038, KS: 0.052, KY: 0.035, LA: 0.03, MA: 0.05, MD: 0.073,
  ME: 0.065, MI: 0.0425, MN: 0.068, MO: 0.047, MS: 0.044, MT: 0.055, NC: 0.0399,
  ND: 0.02, NE: 0.045, NV: 0, NH: 0, NJ: 0.05, NM: 0.045, NY: 0.06, OH: 0.045,
  OK: 0.045, OR: 0.085, PA: 0.065, RI: 0.045, SC: 0.055, SD: 0, TN: 0, TX: 0,
  UT: 0.0455, VA: 0.0525, VT: 0.06, WA: 0, WI: 0.055, WV: 0.048, WY: 0
};

/** Compute the 30%-rule budget from an annual salary and (optional) state for take-home. */
export function computeBudget(salary: number, state?: string): Budget {
  const grossMonthly = salary / 12;
  const estTaxRate = (state && EST_STATE_RATE[state.toUpperCase()]) || 0;
  return {
    grossMonthly,
    maxRent: grossMonthly * 0.3,
    comfyRent: grossMonthly * 0.25,
    takeHomeMonthly: grossMonthly * (1 - estTaxRate),
    estTaxRate
  };
}

/** Salary implied by a given monthly rent under the 30% rule (rent * 12 / 0.3 = rent * 40). */
export function salaryForRent(monthlyRent: number): number {
  return monthlyRent * 40;
}
