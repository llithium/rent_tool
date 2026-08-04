import { MAX_SALARY, formatSalaryInput, parseSalaryInput, sanitizeSalaryInput } from '$lib/salary';

function validate(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return 'Enter an annual salary greater than zero.';
  if (value > MAX_SALARY) return 'Enter an annual salary of $10,000,000 or less.';
  return '';
}

/**
 * The salary number field's own state.
 *
 * `text` mirrors what the user typed (comma-formatted) even while it's
 * transiently invalid, so an out-of-range keystroke never wipes the field; the
 * parsed value is handed to `onChange` and is null whenever the text is invalid.
 */
export function createSalaryField(onChange: (salary: number | null) => void) {
  let text = $state('');
  let error = $state('');

  return {
    get text() {
      return text;
    },
    get error() {
      return error;
    },

    oninput(event: Event) {
      const digits = sanitizeSalaryInput((event.target as HTMLInputElement).value);
      text = digits ? Number.parseInt(digits, 10).toLocaleString() : '';
      if (!digits) {
        error = '';
        onChange(null);
        return;
      }
      const value = parseSalaryInput(digits)!;
      error = validate(value);
      onChange(error ? null : value);
    },

    onblur() {
      if (!text) return;
      text = formatSalaryInput(text);
    },

    onkeydown(event: KeyboardEvent) {
      if (event.key !== 'Enter') return;
      if (text) text = formatSalaryInput(text);
      (event.currentTarget as HTMLInputElement).blur();
    },

    /** Adopt a salary set elsewhere (the slider, a restored URL, history nav). */
    set(salary: number | null) {
      text = salary != null ? salary.toLocaleString() : '';
      error = '';
      onChange(salary);
    },

    /** Re-seed the text from state without reporting a change back. */
    reseed(salary: number | null) {
      text = salary != null ? salary.toLocaleString() : '';
      error = '';
    }
  };
}

export type SalaryField = ReturnType<typeof createSalaryField>;
