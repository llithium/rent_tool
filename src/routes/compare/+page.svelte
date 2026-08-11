<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from '$lib/appState.svelte';
  import { computeBudget } from '$lib/budget';
  import { cityHref, type CompareRow } from '$lib/compare/metrics';
  import { createCompareSalaries } from '$lib/compare/salaries.svelte';
  import type { CitySuggestion } from '$lib/types';
  import AppHeader from '$lib/components/ui/AppHeader.svelte';
  import CitySearch from '$lib/components/ui/CitySearch.svelte';
  import ScenarioCard from '$lib/components/compare/ScenarioCard.svelte';
  import CompareHighlights from '$lib/components/compare/CompareHighlights.svelte';
  import CompareMetricsTable from '$lib/components/compare/CompareMetricsTable.svelte';

  const salaries = createCompareSalaries();

  let hydrated = $state(false);
  let cityMessage = $state('');

  let cityViewHref = $derived.by(() => {
    const search = app.buildSearch();
    return search ? `/?${search}` : '/';
  });

  let rows = $derived.by((): CompareRow[] =>
    app.compareCities.map((city) => {
      const salary = salaries.parse(city.name);
      const budget = computeBudget(salary, city);
      return {
        city,
        salary,
        budget,
        rentGap: city.r1 == null ? null : budget.maxRent - city.r1,
        afterRent: city.r1 == null ? null : budget.takeHomeMonthly - city.r1
      };
    })
  );

  let atCapacity = $derived(app.compareNames.length >= 5);

  async function addCity(suggestion: CitySuggestion) {
    const name = await app.resolveSuggestion(suggestion);
    if (app.isComparing(name)) {
      cityMessage = `${name} is already in this comparison.`;
      return;
    }
    if (app.compareNames.length >= 5) {
      cityMessage = 'Your comparison already has five cities. Remove one to add another.';
      return;
    }
    app.toggleCompare(name);
    salaries.ensure(name, app.salary);
    cityMessage = `${name} added to the comparison.`;
  }

  function clearComparison() {
    app.clearCompare();
    cityMessage = 'Comparison cleared. Add a city to begin a new plan.';
  }

  onMount(() => {
    // A client-side visit from the city page already has the freshest state.
    // Restoring unconditionally here could replace it with an older localStorage
    // snapshot and make newly selected compare cities seem to disappear.
    if (!app.selected && !app.compareCities.length && app.salary == null) app.restore();
    if (!app.compareCities.length && app.selected) app.toggleCompare(app.selected.name);
    salaries.hydrate(
      app.compareCities.map((city) => city.name),
      app.salary
    );
    hydrated = true;
  });
</script>

<svelte:head>
  <title>Compare cities and salaries · Rent Tool</title>
  <meta
    name="description"
    content="Compare rent, take-home pay, taxes, and affordability across U.S. cities using a different salary for every city."
  />
</svelte:head>

<main
  id="main-content"
  data-hydrated={hydrated ? 'true' : 'false'}
  class="mx-auto max-w-7xl px-4 pt-4 pb-20 md:px-6 md:pt-6 md:pb-24"
>
  <AppHeader brandHref={cityViewHref} actionHref={cityViewHref} actionLabel="City view" />

  <section
    class="mt-8 grid gap-6 border-b border-line pb-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end lg:gap-12"
  >
    <div>
      <h1 class="text-headline text-ink">Side by side planner</h1>
      <p class="mt-2 max-w-2xl text-body text-muted">
        Compare what each city leaves you after a typical one-bedroom rent, then inspect the
        trade-offs.
      </p>
    </div>
    <div class="w-full lg:justify-self-end">
      {#if atCapacity}
        <div class="rounded-xl border border-line-strong bg-card-2 px-4 py-3">
          <p class="text-label text-ink">Five cities are ready to compare.</p>
          <p class="mt-1 text-meta text-muted">Remove one below to make room for another city.</p>
        </div>
      {:else}
        <CitySearch onselect={addCity} />
      {/if}
      <p aria-live="polite" class="mt-2 min-h-5 text-meta text-muted">
        {cityMessage || `${app.compareNames.length} of 5 cities added`}
      </p>
    </div>
  </section>

  {#if rows.length}
    <div class="mt-5 flex justify-end">
      <button
        type="button"
        onclick={clearComparison}
        class="cursor-pointer text-sm font-semibold text-accent underline-offset-4 hover:text-accent-deep hover:underline"
      >
        Clear comparison
      </button>
    </div>

    <section
      class="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6"
      aria-label="Comparison scenarios"
    >
      {#each rows as row, index (row.city.name)}
        <ScenarioCard
          {row}
          href={cityHref(row, app.compareNames)}
          {salaries}
          sharedSalary={app.salary}
          entranceDelay={Math.min(index * 60, 180)}
          onremove={() => app.toggleCompare(row.city.name)}
        />
      {/each}
    </section>

    {#if rows.length > 1}
      <CompareHighlights {rows} compareNames={app.compareNames} />
    {/if}

    <section class="mt-8 border-t border-line pt-6">
      <div class="mb-5 flex items-end justify-between gap-5 max-md:flex-col max-md:items-start">
        <h2 class="text-title">Full breakdown</h2>
        <p class="max-w-85 text-right text-meta text-muted max-md:text-left">
          Taxes estimate a single filer taking the standard deduction.
        </p>
      </div>
      <CompareMetricsTable {rows} compareNames={app.compareNames} />
    </section>
  {:else if hydrated}
    <section class="mt-12 border-b border-line py-16 md:py-20" aria-labelledby="empty-heading">
      <div class="max-w-2xl">
        <h2 id="empty-heading" class="text-headline">Compare two places before you choose</h2>
        <p class="mt-3 text-body text-muted">
          Start with the city tied to your offer or current home. Add another place to see which one
          gives your plan more room after rent.
        </p>
        <ul class="mt-6 space-y-2 text-sm/relaxed text-muted">
          <li>Pick the city you are considering.</li>
          <li>Add the place you want to weigh against it.</li>
          <li>Use the decision brief to choose the trade-off that matters most.</li>
        </ul>
      </div>
    </section>
  {/if}

  <footer class="mt-12 border-t border-line pt-6 text-meta text-muted">
    Figures are estimates for planning, not tax or financial advice. Rent sources and methodology
    are shown for each city.
  </footer>
</main>
