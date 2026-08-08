<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from '$lib/appState.svelte';
  import { computeBudget } from '$lib/budget';
  import { cityHref, type CompareRow } from '$lib/compare/metrics';
  import { createCompareSalaries } from '$lib/compare/salaries.svelte';
  import type { CitySuggestion } from '$lib/types';
  import Brand from '$lib/components/ui/Brand.svelte';
  import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
  import CitySearch from '$lib/components/ui/CitySearch.svelte';
  import ScenarioCard from '$lib/components/compare/ScenarioCard.svelte';
  import CompareHighlights from '$lib/components/compare/CompareHighlights.svelte';
  import CompareMetricsTable from '$lib/components/compare/CompareMetricsTable.svelte';

  const salaries = createCompareSalaries();

  let hydrated = $state(false);

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

  async function addCity(suggestion: CitySuggestion) {
    const name = await app.resolveSuggestion(suggestion);
    if (!app.isComparing(name) && app.compareNames.length < 5) app.toggleCompare(name);
    salaries.ensure(name, app.salary);
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
  class="mx-auto max-w-7xl px-4 pt-6 pb-24 md:px-6"
>
  <header class="flex items-center justify-between gap-4">
    <Brand href={cityViewHref} />
    <nav aria-label="Primary" class="flex items-center gap-2">
      <a
        href={cityViewHref}
        class="rounded-lg px-3 py-2 text-sm font-semibold text-accent no-underline transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent-soft hover:text-accent-deep active:scale-98"
      >
        City view
      </a>
      <ThemeToggle />
    </nav>
  </header>

  <section class="grid gap-6 pt-6 md:grid-cols-[minmax(0,1fr)_20rem] md:items-start md:gap-12">
    <div class="self-center">
      <h1 class="text-3xl font-semibold tracking-tight text-ink">Side by side planner</h1>
    </div>
    <div>
      <CitySearch onselect={addCity} />
      <p class="mt-2 text-xs text-muted">{app.compareNames.length} of 5 cities added</p>
    </div>
  </section>

  {#if rows.length}
    <section
      class="grid grid-cols-1 gap-4 pt-6 pb-8 md:grid-cols-2"
      aria-label="Comparison scenarios"
    >
      {#each rows as row (row.city.name)}
        <ScenarioCard
          {row}
          href={cityHref(row, app.compareNames)}
          {salaries}
          sharedSalary={app.salary}
          onremove={() => app.toggleCompare(row.city.name)}
        />
      {/each}
    </section>

    {#if rows.length > 1}
      <CompareHighlights {rows} compareNames={app.compareNames} />
    {/if}

    <section class="mt-7 border-t border-line pt-7">
      <div class="mb-5 flex items-end justify-between gap-5 max-md:flex-col max-md:items-start">
        <h2 class="text-lg font-semibold tracking-tight">Full breakdown</h2>
        <p class="max-w-85 text-right text-xs text-muted max-md:text-left">
          Taxes estimate a single filer taking the standard deduction.
        </p>
      </div>
      <CompareMetricsTable {rows} compareNames={app.compareNames} />
    </section>
  {:else if hydrated}
    <section class="border-b border-line px-5 py-20 text-center">
      <h2 class="text-3xl font-semibold tracking-tight">Add your first city</h2>
      <p class="mx-auto mt-2 max-w-130 text-muted">
        Search above to start a comparison. You can add up to five cities and use a separate salary
        for each one.
      </p>
    </section>
  {/if}

  <footer class="mt-7 text-xs text-muted">
    Figures are estimates for planning, not tax or financial advice. Rent sources and methodology
    are shown for each city.
  </footer>
</main>
