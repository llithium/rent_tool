import { MAX_SALARY, formatSalaryInput, parseSalaryInput, sanitizeSalaryInput } from '$lib/salary';
import type { ComparisonEntry } from './comparisonSet.svelte';

/**
 * Presentation state for comparison salary inputs. Committed salaries live in
 * ComparisonSet; this module keeps only drafts, formatting, and validation.
 */
export function createCompareSalaries(
  onSalaryChange: (name: string, salary: number) => void = () => undefined
) {
  let text = $state<Record<string, string>>({});
  let errors = $state<Record<string, string>>({});

  return {
    get errors() {
      return errors;
    },

    displayed(name: string, committed: number): string {
      return text[name] ?? committed.toLocaleString();
    },

    oninput(name: string, event: Event) {
      const digits = sanitizeSalaryInput((event.target as HTMLInputElement).value);
      const parsed = parseSalaryInput(digits);
      text = {
        ...text,
        [name]: digits ? Number.parseInt(digits, 10).toLocaleString() : ''
      };
      const error =
        !digits || parsed == null || parsed <= 0
          ? 'Enter a salary.'
          : parsed > MAX_SALARY
            ? 'Use $10,000,000 or less.'
            : '';
      errors = { ...errors, [name]: error };
      if (!error && parsed != null) onSalaryChange(name, parsed);
    },

    commit(name: string) {
      const value = text[name];
      if (!value) return;
      text = { ...text, [name]: formatSalaryInput(value) };
    },

    /** Seed missing fields and discard drafts for entries that were removed. */
    sync(entries: readonly ComparisonEntry[]) {
      const active = new Set(entries.map((entry) => entry.city.name));
      const nextText = Object.fromEntries(
        entries.map((entry) => [
          entry.city.name,
          text[entry.city.name] ?? entry.salary.toLocaleString()
        ])
      );
      const nextErrors = Object.fromEntries(
        Object.entries(errors).filter(([name]) => active.has(name))
      );
      text = nextText;
      errors = nextErrors;
    }
  };
}

export type CompareSalaries = ReturnType<typeof createCompareSalaries>;
