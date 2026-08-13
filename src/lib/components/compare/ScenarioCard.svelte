<script lang="ts">
  import type { ComparisonEntry } from '$lib/compare/decision';
  import type { CompareSalaries } from '$lib/compare/salaries.svelte';
  import SalaryInput from '$lib/components/ui/SalaryInput.svelte';

  let {
    entry,
    href,
    salaries,
    sharedSalary,
    entranceDelay = 0,
    onremove
  }: {
    entry: ComparisonEntry;
    href: string;
    salaries: CompareSalaries;
    sharedSalary: number | null;
    entranceDelay?: number;
    onremove: () => void;
  } = $props();

  let result = $derived(entry.fit);
</script>

<article
  data-testid="scenario"
  style:animation-delay={`${entranceDelay}ms`}
  class="group min-w-0 animate-rise border-r border-b border-line-strong bg-card p-6 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-card-2 hover:shadow-pop md:p-8"
>
  <div class="flex min-h-12 items-start justify-between gap-2">
    <div>
      <h2 class="text-[clamp(1.75rem,3vw,3rem)] leading-none font-semibold tracking-[-0.045em]">
        <a {href} class="text-ink no-underline hover:text-inherit">{entry.city.name}</a>
      </h2>
      <p class="mt-0.5 text-meta text-muted">{entry.rent.metricLabel}</p>
    </div>
    <button
      onclick={onremove}
      aria-label={`Remove ${entry.city.name}`}
      class="cursor-pointer border border-line-strong bg-transparent p-2 text-muted hover:border-red hover:text-red"
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
    id={`salary-${entry.city.name.replace(/[^a-z0-9]+/gi, '-')}`}
    label="Salary for this city"
    ariaLabel={`Annual salary in ${entry.city.name}`}
    size="md"
    value={salaries.displayed(entry.city.name, sharedSalary)}
    error={salaries.errors[entry.city.name] ?? ''}
    oninput={(event) => salaries.oninput(entry.city.name, event)}
    onblur={() => salaries.commit(entry.city.name)}
    class="mt-4"
  />

  <div class="mt-8 grid grid-cols-2 gap-4 border-t border-line-strong pt-5">
    <div class="min-w-0">
      <span class="block text-meta text-muted">1BR rent</span>
      <strong class="mt-0.5 block text-data tabular-nums">
        {entry.metrics.rent1.value}
      </strong>
    </div>
    <div class="min-w-0">
      <span class="block text-meta text-muted">Rent budget</span>
      {#key entry.rentBudget.amount}
        <strong class="motion-value mt-0.5 block text-data tabular-nums">
          {entry.rentBudget.value}
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
  {#if entry.rent.oneBedroom == null}
    <p class="mt-2 text-meta text-muted">
      We could not match a current 1BR estimate for this city. Open the city name above for
      available rent context and alternatives.
    </p>
  {/if}
</article>
