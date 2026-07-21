<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from '$lib/appState.svelte';
  import { computeBudget } from '$lib/budget';
  import { money } from '$lib/format';
  import type { CitySuggestion } from '$lib/types';

  import CitySearch from '$lib/components/CitySearch.svelte';
  import BudgetCard from '$lib/components/BudgetCard.svelte';
  import Verdict from '$lib/components/Verdict.svelte';
  import CityFacts from '$lib/components/CityFacts.svelte';
  import SearchLinks from '$lib/components/SearchLinks.svelte';
  import NearbySuburbs from '$lib/components/NearbySuburbs.svelte';
  import RentTrendChart from '$lib/components/RentTrendChart.svelte';
  import TaxBreakdownChart from '$lib/components/TaxBreakdownChart.svelte';
  import ComparisonTable from '$lib/components/ComparisonTable.svelte';
  import RentMap from '$lib/components/RentMap.svelte';

  const SLIDER_MIN = 30000;
  const SLIDER_MAX = 200000;

  let selected = $derived(app.selected);
  let budget = $derived(
    app.salary && app.salary > 0
      ? computeBudget(app.salary, selected ?? undefined)
      : null
  );
  let mappableCities = $derived(app.cities.filter((c) => c.lat != null && c.lng != null));

  // The salary number field mirrors what the user typed (comma-formatted) even while
  // it's transiently invalid, so an out-of-range keystroke never wipes the field.
  let salaryText = $state('');
  let salaryError = $state('');

  // Slider is clamped into its own range; it and the number field share app.salary.
  let sliderValue = $derived(Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, app.salary ?? SLIDER_MIN)));
  let sliderFill = $derived(
    Math.round(((sliderValue - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100)
  );

  let shareLabel = $state('Copy');
  let shareTimer: ReturnType<typeof setTimeout> | undefined;

  async function onCitySelect(sug: CitySuggestion) {
    await app.resolveSuggestion(sug);
  }

  function validate(v: number): string {
    if (!Number.isFinite(v) || v <= 0) return 'Enter an annual salary greater than zero.';
    if (v > 10_000_000) return 'Enter an annual salary of $10,000,000 or less.';
    return '';
  }

  function onSalaryInput(e: Event) {
    const digits = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, '');
    salaryText = digits ? parseInt(digits, 10).toLocaleString() : '';
    if (!digits) {
      salaryError = '';
      app.salary = null;
    } else {
      const v = parseInt(digits, 10);
      salaryError = validate(v);
      app.salary = salaryError ? null : v;
    }
    app.persist();
  }

  function onSlider(e: Event) {
    const v = parseInt((e.target as HTMLInputElement).value, 10);
    app.salary = v;
    salaryText = v.toLocaleString();
    salaryError = '';
    app.persist();
  }

  function onShare() {
    if (!selected || !budget) return;
    const c = selected;
    const verdict = c.r1 != null ? (budget.maxRent >= c.r1 ? 'fits comfortably' : 'a stretch') : 'unknown';
    const txt =
      `${c.name} on ${money(app.salary)}/yr: 30% budget ${money(budget.maxRent)}/mo · ` +
      `median 1BR ${money(c.r1)} (${verdict}) · take-home ≈ ${money(budget.takeHomeMonthly)}/mo ` +
      `after ~${(budget.effRate * 100).toFixed(0)}% tax.`;
    try {
      navigator.clipboard?.writeText(txt);
    } catch {
      /* clipboard unavailable */
    }
    shareLabel = '✓ Copied';
    clearTimeout(shareTimer);
    shareTimer = setTimeout(() => (shareLabel = 'Copy'), 1800);
  }

  let compareFull = $derived(
    selected != null && !app.isComparing(selected.name) && app.compareNames.length >= 5
  );

  onMount(() => {
    app.restore();
    salaryText = app.salary != null ? app.salary.toLocaleString() : '';
    app.refreshLive();
  });
</script>

<svelte:head>
  <title>Rent Tool</title>
  <meta name="description" content="Compare a salary with current rent estimates, take-home pay, and apartment searches across U.S. cities." />
  <meta property="og:title" content="Rent Tool" />
  <meta property="og:description" content="See how an offered salary compares with rent and estimated take-home pay across U.S. cities." />
</svelte:head>

<main class="wrap">
  <header class="rt-header">
    <div class="brand">
      <div class="eyebrow-row">
        <img src="/favicon.svg" alt="" width="26" height="26" class="mark" />
        <span class="eyebrow">Rent Tool</span>
      </div>
    </div>
  </header>

  <div class="rt-shell">
    <aside class="rt-side">
      <section class="card inputs-card">
        <CitySearch onselect={onCitySelect} selectedName={app.selectedName} />

        <div class="salary">
          <label for="salary" class="field-label">Annual salary</label>
          <div class="salary-input" class:invalid={salaryError}>
            <span class="dollar num">$</span>
            <input
              id="salary"
              type="text"
              inputmode="numeric"
              placeholder="e.g. 65,000"
              value={salaryText}
              oninput={onSalaryInput}
              aria-invalid={salaryError ? 'true' : 'false'}
              aria-describedby={salaryError ? 'salary-error' : undefined}
            />
          </div>
          <input
            class="slider"
            type="range"
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            step="1000"
            value={sliderValue}
            style="--fill:{sliderFill}%"
            aria-label="Annual salary slider"
            oninput={onSlider}
          />
          <div class="slider-labels tabnum">
            <span>$30k</span><span>drag to explore</span><span>$200k</span>
          </div>
          {#if salaryError}<span class="error" id="salary-error">{salaryError}</span>{/if}
        </div>

        {#if selected}
          <div class="btn-row">
            <button
              class="cmp"
              class:on={app.isComparing(selected.name)}
              disabled={compareFull}
              title={compareFull ? 'Remove a city before adding another' : undefined}
              onclick={() => app.toggleCompare(selected!.name)}
            >
              {app.isComparing(selected.name) ? '✓ In compare' : '+ Compare'}
            </button>
            <button
              class="share"
              type="button"
              title="Copy a shareable summary"
              disabled={!budget}
              onclick={onShare}
            >
              {shareLabel}
            </button>
          </div>
        {/if}
      </section>

      {#if selected && budget}
        <BudgetCard {budget} />
      {/if}
    </aside>

    <div class="rt-results">
      {#if selected && budget}
        {#if selected.r1 != null}
          <Verdict {budget} city={selected} />
        {/if}
        <CityFacts city={selected} looking={app.looking} />

        <div class="rt-charts">
          <RentTrendChart city={selected} {budget} />
          <TaxBreakdownChart city={selected} {budget} />
        </div>

        <SearchLinks city={selected} maxRent={budget.maxRent} />

        <NearbySuburbs city={selected} />

        {#if app.compareCities.length}
          <ComparisonTable cities={app.compareCities} maxRent={budget.maxRent} />
        {/if}

        <RentMap
          cities={mappableCities}
          maxRent={budget.maxRent}
          selectedName={app.selectedName}
          onselect={(n) => app.select(n)}
        />
      {:else}
        <section class="card empty">
          <p>Enter a city and salary to see your rent budget, verdict, facts, charts, and a map.</p>
        </section>
      {/if}

      <footer>
        Rent snapshot: Zumper National Rent Report (June 2026 baseline), refreshed live when
        available. Off-list cities fall back to HUD Fair Market Rents / Census ACS. Tax figures are
        2026 estimates for a single filer taking the standard deduction — an estimate to power the
        visual, not tax advice. City locations &amp; populations:
        <a href="https://simplemaps.com/data/us-cities" target="_blank" rel="noopener">SimpleMaps US
          Cities</a> (CC BY 4.0). All numbers are estimates — verify before signing anything.
      </footer>
    </div>
  </div>
</main>

<style>
  .wrap {
    max-width: var(--maxw);
    margin: 0 auto;
    padding: 34px 22px 70px;
  }

  /* Header */
  .rt-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 26px;
  }
  .eyebrow-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .mark {
    border-radius: 7px;
    display: block;
  }
  .eyebrow {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--muted);
  }
  /* Shell */
  .rt-shell {
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 22px;
    align-items: start;
  }
  .rt-side {
    position: sticky;
    top: 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    /* Let the grid track shrink below the inputs' min-content on narrow screens. */
    min-width: 0;
  }
  .rt-results {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }

  /* Cascade the result blocks in when they first appear. Because Svelte keeps
     these children mounted across city/salary changes, the animation only plays
     once — on the empty → results transition. */
  .rt-results > :global(*),
  .rt-side > :global(*:not(.inputs-card)) {
    animation: rt-rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .rt-results > :global(*:nth-child(2)) {
    animation-delay: 0.05s;
  }
  .rt-results > :global(*:nth-child(3)) {
    animation-delay: 0.1s;
  }
  .rt-results > :global(*:nth-child(4)) {
    animation-delay: 0.15s;
  }
  .rt-results > :global(*:nth-child(5)) {
    animation-delay: 0.2s;
  }
  .rt-results > :global(*:nth-child(6)) {
    animation-delay: 0.25s;
  }
  .rt-results > :global(*:nth-child(n + 7)) {
    animation-delay: 0.3s;
  }

  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
  }
  .inputs-card {
    padding: 20px;
  }

  /* Salary field */
  .salary {
    margin-top: 16px;
  }
  .field-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .salary-input {
    display: flex;
    align-items: baseline;
    gap: 2px;
    margin-bottom: 10px;
    border-bottom: 2px solid var(--border2);
  }
  .salary-input.invalid {
    border-bottom-color: var(--red);
  }
  .dollar {
    font-size: 1.5rem;
    color: var(--muted);
  }
  .salary-input input {
    flex: 1;
    min-width: 0;
    padding: 2px 0;
    font-size: 1.9rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    border: none;
    background: transparent;
    color: var(--ink);
  }
  .salary-input input:focus {
    outline: none;
  }
  .salary-input:focus-within {
    border-bottom-color: var(--accent);
  }
  .slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.72rem;
    /* --muted (not --faint) so these labels clear AA contrast on the card. */
    color: var(--muted);
    margin-top: 5px;
  }
  .error {
    display: block;
    margin-top: 8px;
    color: var(--red);
    font-size: 0.78rem;
  }

  /* Custom range slider */
  .slider {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
    width: 100%;
  }
  .slider::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: 99px;
    background: linear-gradient(90deg, var(--accent) var(--fill, 40%), var(--border2) var(--fill, 40%));
  }
  .slider::-moz-range-track {
    height: 6px;
    border-radius: 99px;
    background: var(--border2);
  }
  .slider::-moz-range-progress {
    height: 6px;
    border-radius: 99px;
    background: var(--accent);
  }
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    margin-top: -8px;
    border-radius: 50%;
    background: var(--accent);
    border: 3px solid var(--card);
    box-shadow: 0 1px 4px rgba(60, 40, 20, 0.35);
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }
  .slider:hover::-webkit-slider-thumb,
  .slider:active::-webkit-slider-thumb {
    transform: scale(1.12);
    box-shadow: 0 2px 8px rgba(60, 40, 20, 0.4);
  }
  .slider::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--accent);
    border: 3px solid var(--card);
    box-shadow: 0 1px 4px rgba(60, 40, 20, 0.35);
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }
  .slider:hover::-moz-range-thumb,
  .slider:active::-moz-range-thumb {
    transform: scale(1.12);
    box-shadow: 0 2px 8px rgba(60, 40, 20, 0.4);
  }

  /* Buttons */
  .btn-row {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }
  .cmp {
    flex: 1;
    padding: 11px 14px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.92rem;
    border: 1px solid var(--accent);
    background: var(--card2);
    color: var(--accent);
    transition: transform 0.12s ease, background 0.12s ease, color 0.12s ease;
  }
  .cmp:not(:disabled):active,
  .share:not(:disabled):active {
    transform: scale(0.98);
  }
  .cmp.on {
    background: var(--accent);
    color: var(--accent-ink);
  }
  .cmp:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
  .share {
    flex: none;
    padding: 11px 14px;
    border-radius: 10px;
    border: 1px solid var(--border2);
    background: var(--card2);
    color: var(--ink);
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    transition: transform 0.12s ease;
  }
  .share:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .empty {
    padding: 40px 24px;
    color: var(--muted);
    text-align: center;
  }

  .rt-charts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  footer {
    font-size: 0.78rem;
    color: var(--muted);
    line-height: 1.6;
    max-width: 74ch;
    padding-top: 6px;
  }

  @media (max-width: 900px) {
    .rt-shell {
      grid-template-columns: 1fr;
    }
    .rt-side {
      position: static;
    }
  }
  @media (max-width: 760px) {
    .rt-charts {
      grid-template-columns: 1fr;
    }
  }
</style>
