<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { app } from '$lib/appState.svelte';
  import { computeBudget } from '$lib/budget';
  import { createSalaryField } from '$lib/salaryField.svelte';
  import { createUrlSync } from '$lib/urlSync.svelte';
  import type { CitySuggestion } from '$lib/types';

  import CitySidebar from '$lib/components/city/CitySidebar.svelte';
  import CityHeadline from '$lib/components/city/CityHeadline.svelte';
  import Verdict from '$lib/components/city/Verdict.svelte';
  import CityFacts from '$lib/components/city/CityFacts.svelte';
  import SearchLinks from '$lib/components/city/SearchLinks.svelte';
  import NearbySuburbs from '$lib/components/city/NearbySuburbs.svelte';
  import RentTrendChart from '$lib/components/city/RentTrendChart.svelte';
  import TaxBreakdownChart from '$lib/components/city/TaxBreakdownChart.svelte';
  import ComparisonTable from '$lib/components/city/ComparisonTable.svelte';
  import RentMap from '$lib/components/city/RentMap.svelte';
  import SourcesFooter from '$lib/components/city/SourcesFooter.svelte';
  import LandingContent from '$lib/components/landing/LandingContent.svelte';

  const urlSync = createUrlSync();

  const salary = createSalaryField((value) => {
    app.salary = value;
    urlSync.scheduleSalary(value);
    app.persist();
  });

  let selected = $derived(app.selected);
  let budget = $derived(
    app.salary && app.salary > 0 ? computeBudget(app.salary, selected ?? undefined) : null
  );
  let mappableCities = $derived(app.cities.filter((c) => c.lat != null && c.lng != null));

  async function onCitySelect(suggestion: CitySuggestion) {
    await app.resolveSuggestion(suggestion);
  }

  onMount(() => urlSync.start(page.url.searchParams, () => salary.reseed(app.salary)));
</script>

<svelte:head>
  <title
    >{selected
      ? `${selected.name} · Rent Tool`
      : 'Rent budget calculator for your next move · Rent Tool'}</title
  >
  <meta
    name="description"
    content="Turn a salary offer into a practical rent budget, then compare it with current rent estimates, taxes, nearby options, and apartment searches."
  />
  <meta property="og:title" content="Know what rent fits before you move · Rent Tool" />
  <meta
    property="og:description"
    content="Turn a salary offer into a practical rent budget and compare it with current local estimates."
  />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="/favicon.svg" />
</svelte:head>

<main
  id="main-content"
  data-hydrated={urlSync.hydrated ? 'true' : 'false'}
  class="mx-auto max-w-7xl px-4 pt-6 pb-24 md:px-6"
>
  <div class="grid items-start gap-12 lg:grid-cols-[22rem_minmax(0,1fr)]">
    <CitySidebar
      {salary}
      {selected}
      {budget}
      onselect={onCitySelect}
      onsalary={(value) => salary.set(value)}
    />

    <!-- The results column reads as one document: sections are separated by a
         hairline and a small uppercase label, not by nested card boxes, and each
         one carries its own rhythm and entrance delay. Because Svelte keeps these
         children mounted across city/salary changes, the cascade plays once — on
         the empty → results transition. -->
    <div data-testid="results" class="flex min-w-0 flex-col lg:pt-16">
      {#if !urlSync.hydrated}
        <section
          aria-busy="true"
          aria-label="Loading saved rent plan"
          class="min-h-96 rounded-2xl bg-card-2 p-8 md:p-12"
        >
          <div class="h-4 w-32 animate-pulse rounded-md bg-line-strong"></div>
          <div class="mt-6 h-12 max-w-2xl animate-pulse rounded-lg bg-line"></div>
          <div class="mt-4 h-12 max-w-xl animate-pulse rounded-lg bg-line"></div>
          <div class="mt-8 h-6 max-w-2xl animate-pulse rounded-md bg-line"></div>
        </section>
      {:else if selected && budget}
        <CityHeadline city={selected} class="animate-rise" />

        {#if selected.r1 != null}
          <Verdict {budget} city={selected} class="mt-3.5 animate-rise [animation-delay:50ms]" />
        {/if}
        <CityFacts
          city={selected}
          looking={app.looking}
          class="animate-rise [animation-delay:100ms] {selected.r1 != null
            ? 'mt-7 border-t border-line pt-7'
            : 'mt-3.5'}"
        />

        <!-- The two charts share one section band, split by a hairline rather
             than sitting in two boxes. -->
        <div
          class="mt-7 grid animate-rise grid-cols-1 gap-6 border-t border-line pt-7 [animation-delay:150ms] md:grid-cols-2 md:gap-8"
        >
          <RentTrendChart city={selected} {budget} />
          <TaxBreakdownChart
            city={selected}
            {budget}
            class="border-line max-md:border-t max-md:pt-6 md:border-l md:pl-8"
          />
        </div>

        <SearchLinks
          city={selected}
          maxRent={budget.maxRent}
          class="mt-7 animate-rise border-t border-line pt-7 [animation-delay:200ms]"
        />

        <NearbySuburbs
          city={selected}
          class="mt-7 animate-rise border-t border-line pt-7 [animation-delay:250ms]"
        />

        {#if app.compareCities.length}
          <ComparisonTable
            cities={app.compareCities}
            maxRent={budget.maxRent}
            class="mt-7 animate-rise border-t border-line pt-7 [animation-delay:300ms]"
          />
        {/if}

        <RentMap
          cities={mappableCities}
          maxRent={budget.maxRent}
          selectedName={app.selectedName}
          onselect={(name) => app.select(name)}
          class="mt-7 animate-rise border-t border-line pt-7 [animation-delay:300ms]"
        />
      {:else}
        <LandingContent />
      {/if}

      {#if urlSync.hydrated && selected && budget}
        <SourcesFooter
          class="mt-7 animate-rise border-t border-line pt-7 [animation-delay:300ms]"
        />
      {/if}
    </div>
  </div>
</main>
