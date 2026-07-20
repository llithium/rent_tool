<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from '$lib/appState.svelte';
  import { computeBudget } from '$lib/budget';
  import type { CitySuggestion } from '$lib/types';

  import CitySearch from '$lib/components/CitySearch.svelte';
  import BudgetCard from '$lib/components/BudgetCard.svelte';
  import Verdict from '$lib/components/Verdict.svelte';
  import CityFacts from '$lib/components/CityFacts.svelte';
  import SearchLinks from '$lib/components/SearchLinks.svelte';
  import RentTrendChart from '$lib/components/RentTrendChart.svelte';
  import TaxBreakdownChart from '$lib/components/TaxBreakdownChart.svelte';
  import ComparisonTable from '$lib/components/ComparisonTable.svelte';
  import RentMap from '$lib/components/RentMap.svelte';

  let selected = $derived(app.selected);
  let budget = $derived(
    app.salary && app.salary > 0
      ? computeBudget(app.salary, selected ?? undefined)
      : null
  );
  let mappableCities = $derived(app.cities.filter((c) => c.lat != null && c.lng != null));
  let salaryError = $state('');

  async function onCitySelect(sug: CitySuggestion) {
    await app.resolveSuggestion(sug);
  }

  function onSalaryInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value;
    const v = parseFloat(raw);
    if (!raw) salaryError = '';
    else if (!Number.isFinite(v) || v <= 0) salaryError = 'Enter an annual salary greater than zero.';
    else if (v > 10_000_000) salaryError = 'Enter an annual salary of $10,000,000 or less.';
    else salaryError = '';
    app.salary = !salaryError && Number.isFinite(v) && v > 0 ? v : null;
    app.persist();
  }

  onMount(() => {
    app.restore();
    app.refreshLive();
  });
</script>

<svelte:head>
  <title>City &amp; Salary Rent Tool</title>
  <meta name="description" content="Compare a salary with current rent estimates, take-home pay, and apartment searches across U.S. cities." />
  <meta property="og:title" content="City &amp; Salary Rent Tool" />
  <meta property="og:description" content="See how an offered salary compares with rent and estimated take-home pay across U.S. cities." />
</svelte:head>

<main class="wrap">
  <header>
    <h1>City &amp; Salary Rent Tool</h1>
    <p class="sub">
      Pick a city, enter an offered salary — get your 30%-rule rent budget, live rent data, city
      facts, an affordability map, and pre-filtered apartment searches.
    </p>
    <span class="status" class:live={app.live} aria-live="polite">{app.liveLabel}</span>
  </header>

  <section class="panel inputs">
    <CitySearch onselect={onCitySelect} />
    <div class="field">
      <label for="salary">Annual salary ($)</label>
      <input
        id="salary"
        type="number"
        min="0"
        max="10000000"
        step="500"
        placeholder="e.g. 65000"
        value={app.salary ?? ''}
        oninput={onSalaryInput}
        aria-invalid={salaryError ? 'true' : 'false'}
        aria-describedby={salaryError ? 'salary-error' : undefined}
      />
      {#if salaryError}<span class="error" id="salary-error">{salaryError}</span>{/if}
    </div>
    {#if selected}
      <div class="cmp-slot">
        <span class="cmp-spacer" aria-hidden="true">&nbsp;</span>
        <button
          class="cmp"
          class:on={app.isComparing(selected.name)}
          disabled={!app.isComparing(selected.name) && app.compareNames.length >= 5}
          title={!app.isComparing(selected.name) && app.compareNames.length >= 5 ? 'Remove a city before adding another' : undefined}
          onclick={() => app.toggleCompare(selected!.name)}
        >
          {app.isComparing(selected.name) ? '✓ In compare' : '+ Compare'}
        </button>
      </div>
    {/if}
  </section>

  {#if !selected || !budget}
    <section class="panel empty">
      <p>Enter a city and salary to see your rent budget, facts, charts, and a map.</p>
    </section>
  {/if}

  {#if selected && budget}
    <div class="grid">
      <div class="col-main">
        <BudgetCard {budget} cityLabel={selected.name} />
        {#if selected.r1 != null}
          <Verdict {budget} city={selected} />
        {/if}
        <CityFacts city={selected} looking={app.looking} />
        <SearchLinks city={selected} maxRent={budget.maxRent} />
      </div>
      <div class="col-side">
        <RentTrendChart city={selected} {budget} />
        <TaxBreakdownChart city={selected} {budget} />
      </div>
    </div>

    {#if app.compareCities.length}
      <ComparisonTable cities={app.compareCities} maxRent={budget.maxRent} />
    {/if}

    <RentMap
      cities={mappableCities}
      maxRent={budget.maxRent}
      selectedName={app.selectedName}
      onselect={(n) => app.select(n)}
    />
  {/if}

  <footer>
    Rent snapshot: Zumper National Rent Report (June 2026 baseline), refreshed live when
    available. Off-list cities use HUD Fair Market Rents / Census ACS. Tax figures are 2026
    estimates. All numbers are estimates — verify before signing anything.
  </footer>
</main>

<style>
  .wrap {
    max-width: var(--maxw);
    margin: 0 auto;
    padding: 24px 16px 64px;
  }
  header {
    margin-bottom: 18px;
  }
  h1 {
    font-size: 1.5rem;
    letter-spacing: -0.01em;
    margin-bottom: 4px;
  }
  .sub {
    color: var(--muted);
    font-size: 0.92rem;
    max-width: 60ch;
    margin-bottom: 10px;
  }
  .status {
    font-size: 0.75rem;
    padding: 5px 10px;
    border-radius: 999px;
    display: inline-block;
    background: var(--card-2);
    border: 1px solid var(--border);
    color: var(--muted);
  }
  .status.live {
    background: color-mix(in srgb, var(--green) 14%, var(--card));
    border-color: color-mix(in srgb, var(--green) 30%, transparent);
    color: var(--green);
  }
  .panel {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
  }
  .inputs {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    /* Top-aligned so a validation message under one field can't push its input
       out of line with the others; labels are the same height in every field. */
    align-items: flex-start;
    padding: 18px;
    margin-bottom: 16px;
  }
  .field {
    flex: 1 1 160px;
  }
  label {
    display: block;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 5px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  input {
    width: 100%;
    padding: 11px 12px;
    font-size: 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--card);
    color: var(--ink);
  }
  input:focus {
    outline: 2px solid var(--accent);
    border-color: transparent;
  }
  .error {
    display: block;
    margin-top: 5px;
    color: var(--red);
    font-size: 0.75rem;
  }
  .cmp-slot {
    min-width: 0;
  }
  .cmp-spacer {
    display: block;
    font-size: 0.72rem;
    font-weight: 600;
    margin-bottom: 5px;
  }
  .cmp {
    padding: 11px 18px;
    font-size: 0.95rem;
    font-weight: 600;
    border-radius: var(--radius-sm);
    border: 1px solid var(--accent);
    background: var(--card);
    color: var(--accent);
    cursor: pointer;
    white-space: nowrap;
  }
  .cmp.on {
    background: var(--accent);
    color: var(--accent-ink);
  }
  .cmp:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
  .empty {
    padding: 28px 18px;
    color: var(--muted);
    text-align: center;
    margin-bottom: 16px;
  }
  .grid {
    display: grid;
    grid-template-columns: 1.55fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
    align-items: start;
  }
  .col-main,
  .col-side {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }
  section.panel:not(.inputs):not(.empty),
  :global(.wrap > section) {
    margin-bottom: 0;
  }
  /* Space between the top-level comparison table and map */
  :global(.wrap > section + section) {
    margin-top: 16px;
  }
  footer {
    margin-top: 22px;
    font-size: 0.76rem;
    color: var(--muted);
    line-height: 1.5;
    max-width: 70ch;
  }
  @media (max-width: 760px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
