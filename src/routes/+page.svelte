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
      ? computeBudget(app.salary, selected?.state)
      : null
  );
  let mappableCities = $derived(app.cities.filter((c) => c.lat != null && c.lng != null));

  async function onCitySelect(sug: CitySuggestion) {
    await app.resolveSuggestion(sug);
  }

  function onSalaryInput(e: Event) {
    const v = parseFloat((e.target as HTMLInputElement).value);
    app.salary = Number.isFinite(v) && v > 0 ? v : null;
    app.persist();
  }

  onMount(() => {
    app.restore();
    app.refreshLive();
  });
</script>

<svelte:head>
  <title>City &amp; Salary Rent Tool</title>
</svelte:head>

<main class="wrap">
  <header>
    <h1>City &amp; Salary Rent Tool</h1>
    <p class="sub">
      Pick a city, enter an offered salary — get your 30%-rule rent budget, live rent data, city
      facts, an affordability map, and pre-filtered apartment searches.
    </p>
    <span class="status" class:live={app.live}>{app.liveLabel}</span>
  </header>

  <section class="panel inputs">
    <CitySearch onselect={onCitySelect} />
    <div class="field">
      <label for="salary">Annual salary ($)</label>
      <input
        id="salary"
        type="number"
        min="0"
        step="500"
        placeholder="e.g. 65000"
        value={app.salary ?? ''}
        oninput={onSalaryInput}
      />
    </div>
    {#if selected}
      <button
        class="cmp"
        class:on={app.isComparing(selected.name)}
        onclick={() => app.toggleCompare(selected!.name)}
      >
        {app.isComparing(selected.name) ? '✓ In compare' : '+ Compare'}
      </button>
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
    align-items: flex-end;
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
