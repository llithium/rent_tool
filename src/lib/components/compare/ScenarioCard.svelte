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
    entranceDelay = 0,
    onremove
  }: {
    row: CompareRow;
    href: string;
    salaries: CompareSalaries;
    sharedSalary: number | null;
    entranceDelay?: number;
    onremove: () => void;
  } = $props();

  let result = $derived(fitStatus(row));
</script>

<article
  data-testid="scenario"
  style:animation-delay={`${entranceDelay}ms`}
  class="min-w-0 animate-rise rounded-xl bg-card-2 p-6 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-card"
>
  <div class="flex min-h-12 items-start justify-between gap-2">
    <div>
      <h2 class="text-title">
        <a {href} class="text-ink no-underline hover:text-inherit">{row.city.name}</a>
      </h2>
      <p class="mt-0.5 text-meta text-muted">{rentMetricLabel(row.city.rentMetric)}</p>
    </div>
    <button
      onclick={onremove}
      aria-label={`Remove ${row.city.name}`}
      class="cursor-pointer rounded-md border-0 bg-transparent p-2 text-muted hover:bg-card-2 hover:text-red"
    >
      <svg class="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="m4.5 4.5 7 7m0-7-7 7"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </div>

  <SalaryInput
    id={`salary-${row.city.name.replace(/[^a-z0-9]+/gi, '-')}`}
    label="Salary for this city"
    ariaLabel={`Annual salary in ${row.city.name}`}
    size="md"
    value={salaries.displayed(row.city.name, sharedSalary)}
    error={salaries.errors[row.city.name] ?? ''}
    oninput={(event) => salaries.oninput(row.city.name, event)}
    onblur={() => salaries.commit(row.city.name)}
    class="mt-4"
  />

  <div class="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-4">
    <div class="min-w-0">
      <span class="block text-meta text-muted">1BR rent</span>
      <strong class="mt-0.5 block text-data tabular-nums">
        {money(row.city.r1)}<small class="text-xs font-medium text-muted">/mo</small>
      </strong>
    </div>
    <div class="min-w-0">
      <span class="block text-meta text-muted">Rent budget</span>
      {#key row.budget.maxRent}
        <strong class="motion-value mt-0.5 block text-data tabular-nums">
          {money(row.budget.maxRent)}<small class="text-xs font-medium text-muted">/mo</small>
        </strong>
      {/key}
    </div>
  </div>

  <div
    class="mt-4 border-t-2 pt-3 text-sm font-semibold {result.tone === 'good'
      ? 'border-green text-green'
      : result.tone === 'bad'
        ? 'border-red text-red'
        : 'border-line-strong text-muted'}"
  >
    {#key result.label}
      <span class="motion-copy inline-block">{result.label}</span>
    {/key}
  </div>
  {#if row.city.r1 == null}
    <p class="mt-2 text-meta text-muted">
      We could not match a current 1BR estimate for this city. Open the city name above for
      available rent context and alternatives.
    </p>
  {/if}
</article>
