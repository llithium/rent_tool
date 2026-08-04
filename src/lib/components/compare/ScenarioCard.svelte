<script lang="ts">
  import { money, rentMetricLabel } from '$lib/format';
  import { fitStatus, type CompareRow } from '$lib/compare/metrics';
  import type { CompareSalaries } from '$lib/compare/salaries.svelte';
  import SalaryInput from '$lib/components/ui/SalaryInput.svelte';

  let {
    row,
    href,
    salaries,
    sharedSalary,
    onremove
  }: {
    row: CompareRow;
    href: string;
    salaries: CompareSalaries;
    sharedSalary: number | null;
    onremove: () => void;
  } = $props();

  let result = $derived(fitStatus(row));
</script>

<!-- Columns are separated by a hairline, which becomes a horizontal rule once
     the grid stacks. -->
<article
  data-testid="scenario"
  class="min-w-0 border-line px-5.5 pt-1 pb-6 not-first:border-l first:pl-0 last:pr-0 max-md:px-0 max-md:py-5.5 max-md:not-first:border-t max-md:not-first:border-l-0 max-md:first:pt-0"
>
  <div class="flex min-h-13.5 items-start justify-between gap-2.5">
    <div>
      <h2 class="text-base tracking-tight">
        <a {href} class="text-ink no-underline hover:text-inherit">{row.city.name}</a>
      </h2>
      <p class="mt-0.5 text-xs text-muted">{rentMetricLabel(row.city.rentMetric)}</p>
    </div>
    <button
      onclick={onremove}
      aria-label={`Remove ${row.city.name}`}
      class="cursor-pointer rounded-md border-0 bg-transparent text-xl leading-none text-muted hover:bg-card-2 hover:text-red"
    >
      ×
    </button>
  </div>

  <SalaryInput
    id={`salary-${row.city.name.replace(/[^a-z0-9]+/gi, '-')}`}
    label="Annual salary"
    ariaLabel={`Annual salary in ${row.city.name}`}
    size="md"
    value={salaries.displayed(row.city.name, sharedSalary)}
    error={salaries.errors[row.city.name] ?? ''}
    oninput={(event) => salaries.oninput(row.city.name, event)}
    onblur={() => salaries.commit(row.city.name)}
    class="mt-4"
  />

  <div class="mt-5 grid grid-cols-2 gap-4.5 border-t border-line pt-3.5">
    <div class="min-w-0">
      <span class="block text-xs text-muted">1BR rent</span>
      <strong class="mt-0.5 block text-base tabular-nums">
        {money(row.city.r1)}<small class="text-xs font-medium text-muted">/mo</small>
      </strong>
    </div>
    <div class="min-w-0">
      <span class="block text-xs text-muted">Rent budget</span>
      <strong class="mt-0.5 block text-base tabular-nums">
        {money(row.budget.maxRent)}<small class="text-xs font-medium text-muted">/mo</small>
      </strong>
    </div>
  </div>

  <div
    class="mt-3.5 border-t-2 pt-2.5 text-sm font-bold {result.tone === 'good'
      ? 'border-green text-green'
      : result.tone === 'bad'
        ? 'border-red text-red'
        : 'border-line-strong text-muted'}"
  >
    {result.label}
  </div>
</article>
