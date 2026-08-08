import { MAX_SALARY, formatSalaryInput, parseSalaryInput, sanitizeSalaryInput } from '$lib/salary';

const SALARY_KEY = 'rentToolCompareSalaries.v1';

export const DEFAULT_SALARY = 80_000;

function savedCompareSalaries(): Record<string, number> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SALARY_KEY) ?? '{}');
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, number] =>
          typeof entry[1] === 'number' &&
          Number.isFinite(entry[1]) &&
          entry[1] > 0 &&
          entry[1] <= MAX_SALARY
      )
    );
  } catch {
    return {};
  }
}

/** Capture the salary attached to a city when it is added to Compare. */
export function saveCompareSalary(name: string, salary: number | null) {
  if (salary == null || !Number.isFinite(salary) || salary <= 0 || salary > MAX_SALARY) return;
  try {
    localStorage.setItem(
      SALARY_KEY,
      JSON.stringify({ ...savedCompareSalaries(), [name]: Math.round(salary) })
    );
  } catch {
    // Compare still works for this session when storage is unavailable.
  }
}

/**
 * One salary per compared city, mirrored to localStorage so a scenario survives
 * a reload. Text is kept verbatim (comma-formatted) while the user types; the
 * table reads through `parse()` and falls back to DEFAULT_SALARY.
 */
export function createCompareSalaries() {
  let text = $state<Record<string, string>>({});
  let errors = $state<Record<string, string>>({});

  function persist() {
    try {
      const values: Record<string, number> = {};
      for (const [name, value] of Object.entries(text)) {
        const salary = parseSalaryInput(value);
        if (salary != null && salary > 0) values[name] = salary;
      }
      localStorage.setItem(SALARY_KEY, JSON.stringify(values));
    } catch {
      // Storage can be unavailable in private browsing.
    }
  }

  return {
    get errors() {
      return errors;
    },

    /** Displayed value for a city, falling back to the shared salary. */
    displayed(name: string, fallback: number | null): string {
      return text[name] ?? (fallback ?? DEFAULT_SALARY).toLocaleString();
    },

    /** Salary the table should compute with. */
    parse(name: string): number {
      const salary = parseSalaryInput(text[name] ?? '');
      return salary != null && salary > 0 ? salary : DEFAULT_SALARY;
    },

    oninput(name: string, event: Event) {
      const digits = sanitizeSalaryInput((event.target as HTMLInputElement).value);
      const value = parseSalaryInput(digits) ?? 0;
      text = { ...text, [name]: digits ? Number.parseInt(digits, 10).toLocaleString() : '' };
      errors = {
        ...errors,
        [name]: !digits ? 'Enter a salary.' : value > MAX_SALARY ? 'Use $10,000,000 or less.' : ''
      };
      persist();
    },

    commit(name: string) {
      const value = text[name];
      if (!value) return;
      text = { ...text, [name]: formatSalaryInput(value) };
    },

    /** Seed every compared city from storage, then the shared salary. */
    hydrate(names: string[], fallback: number | null) {
      const stored = savedCompareSalaries();
      text = Object.fromEntries(
        names.map((name) => [name, (stored[name] ?? fallback ?? DEFAULT_SALARY).toLocaleString()])
      );
    },

    /** Give a newly added city a starting salary if it has none yet. */
    ensure(name: string, fallback: number | null) {
      if (text[name]) return;
      text = { ...text, [name]: (fallback ?? DEFAULT_SALARY).toLocaleString() };
      persist();
    }
  };
}

export type CompareSalaries = ReturnType<typeof createCompareSalaries>;
