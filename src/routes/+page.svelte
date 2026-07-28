<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { pushState, replaceState } from '$app/navigation';
  import { app } from '$lib/appState.svelte';
  import { computeBudget } from '$lib/budget';
  import { formatSalaryInput, MAX_SALARY, parseSalaryInput, sanitizeSalaryInput } from '$lib/salary';
  import { ACS_DATA_META, RENT_DATA_META } from '$lib/data/cities';
  import type { CitySuggestion, RentSource } from '$lib/types';

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

  // Which dataset the headline rent came from — shown beside the city headline,
  // which now owns the page title role that CityFacts' card header used to.
  const SOURCE_LABEL: Record<RentSource, string> = {
    'apartment-list': 'Apartment List estimate',
    'hud-fmr': 'HUD Fair Market Rent',
    none: 'No rent data'
  };

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

  let shareLabel = $state('Copy link');
  let shareTimer: ReturnType<typeof setTimeout> | undefined;

  // URL sync. The salary contribution to the URL is debounced (city/compare
  // changes are discrete and write immediately) so dragging the slider or typing
  // doesn't thrash the address bar. `lastWritten` guards against the read→write
  // echo and against redundant replaceState calls.
  let salaryForUrl = $state<number | null>(null);
  let salaryUrlTimer: ReturnType<typeof setTimeout> | undefined;
  let hydrated = $state(false);
  let lastWritten = '';
  // Tracks the city in the last-written URL so the write effect can tell a city
  // change (→ pushState, a real history entry) from an incidental salary/compare
  // change (→ replaceState). Browser back/forward then steps through cities only.
  let lastCity: string | null = null;

  function scheduleSalaryUrl(v: number | null) {
    clearTimeout(salaryUrlTimer);
    salaryUrlTimer = setTimeout(() => (salaryForUrl = v), 350);
  }

  $effect(() => {
    // Always read the state so deps are tracked, but hold off writing until
    // onMount has hydrated from the URL and seeded lastWritten — otherwise this
    // could strip the query string before hydrateFromSearch reads it.
    const params = app.buildSearch(salaryForUrl);
    if (!hydrated || params === lastWritten) return;
    const cityChanged = app.selectedName !== lastCity;
    lastWritten = params;
    lastCity = app.selectedName;
    const url = params ? `?${params}` : location.pathname;
    // New city → push a history entry so Back/Forward returns here. Salary/compare
    // tweaks replace the current entry so they don't clutter the history stack.
    if (cityChanged) pushState(url, history.state ?? {});
    else replaceState(url, history.state ?? {});
  });

  // Re-hydrate on browser back/forward. Shallow routing (pushState/replaceState)
  // doesn't update `page.url`, so we read the authoritative live URL instead.
  // Native popstate fires only on genuine history navigation — never on our own
  // push/replace above — so no echo guard beyond the redundant-write short-circuit
  // is needed.
  function onPopState() {
    const search = location.search.replace(/^\?/, '');
    if (!hydrated || search === lastWritten) return;
    lastWritten = search;
    app.applyUrlNavigation(new URLSearchParams(location.search));
    lastCity = app.selectedName;
    salaryForUrl = app.salary;
    salaryText = app.salary != null ? app.salary.toLocaleString() : '';
  }

  async function onCitySelect(sug: CitySuggestion) {
    await app.resolveSuggestion(sug);
  }

  function validate(v: number): string {
    if (!Number.isFinite(v) || v <= 0) return 'Enter an annual salary greater than zero.';
    if (v > MAX_SALARY) return 'Enter an annual salary of $10,000,000 or less.';
    return '';
  }

  function onSalaryInput(e: Event) {
    const digits = sanitizeSalaryInput((e.target as HTMLInputElement).value);
    salaryText = digits ? Number.parseInt(digits, 10).toLocaleString() : '';
    if (!digits) {
      salaryError = '';
      app.salary = null;
    } else {
      const v = parseSalaryInput(digits)!;
      salaryError = validate(v);
      app.salary = salaryError ? null : v;
    }
    scheduleSalaryUrl(app.salary);
    app.persist();
  }

  function commitSalary() {
    if (!salaryText) return;
    salaryText = formatSalaryInput(salaryText);
  }

  function onSalaryKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      commitSalary();
      (e.currentTarget as HTMLInputElement).blur();
    }
  }

  function onSlider(e: Event) {
    const v = parseInt((e.target as HTMLInputElement).value, 10);
    app.salary = v;
    salaryText = v.toLocaleString();
    salaryError = '';
    scheduleSalaryUrl(v);
    app.persist();
  }

  function onShare() {
    if (!selected || !budget) return;
    // The write effect keeps location.href in sync with the current state, so the
    // live deep link is exactly the shareable URL for the current view.
    try {
      navigator.clipboard?.writeText(location.href);
    } catch {
      /* clipboard unavailable */
    }
    shareLabel = '✓ Copied';
    clearTimeout(shareTimer);
    shareTimer = setTimeout(() => (shareLabel = 'Copy link'), 1800);
  }

  let compareFull = $derived(
    selected != null && !app.isComparing(selected.name) && app.compareNames.length >= 5
  );

  onMount(() => {
    // URL wins over localStorage when it names a resolvable city; a bare ?salary=
    // link still falls back to restore() for the city/compare set but keeps the
    // URL's salary.
    const hadUrlState = app.hydrateFromSearch(page.url.searchParams);
    if (!hadUrlState) {
      const urlSalary = app.salary;
      app.restore();
      if (urlSalary != null) app.salary = urlSalary;
    }
    salaryForUrl = app.salary;
    lastWritten = app.buildSearch(salaryForUrl);
    lastCity = app.selectedName;
    salaryText = app.salary != null ? app.salary.toLocaleString() : '';
    hydrated = true;
    window.addEventListener('popstate', onPopState);
    return () => {
      clearTimeout(salaryUrlTimer);
      window.removeEventListener('popstate', onPopState);
    };
  });
</script>

<svelte:head>
  <title>{selected ? `${selected.name} · Rent Tool` : 'Rent Tool'}</title>
  <meta name="description" content="Compare a salary with current rent estimates, take-home pay, and apartment searches across U.S. cities." />
  <meta property="og:title" content="Rent Tool" />
  <meta property="og:description" content="See how an offered salary compares with rent and estimated take-home pay across U.S. cities." />
</svelte:head>

<main class="wrap" data-hydrated={hydrated ? 'true' : 'false'}>
  <div class="rt-shell">
    <aside class="rt-side">
      <!-- Inside the sticky column so the brand pins with the inputs instead of
           scrolling away above them. -->
      <header class="rt-header">
        <div class="brand">
          <div class="eyebrow-row">
            <img src="/favicon.svg" alt="" width="26" height="26" class="mark" />
            <span class="eyebrow">Rent Tool</span>
          </div>
        </div>
        <a class="compare-link" href="/compare">Compare cities →</a>
      </header>

      <!-- One control surface for search, salary, actions, and the resulting budget. -->
      <section class="panel">
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
              onblur={commitSalary}
              onkeydown={onSalaryKeydown}
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
              title="Copy a shareable link"
              disabled={!budget}
              onclick={onShare}
            >
              {shareLabel}
            </button>
          </div>
        {/if}

        {#if selected && budget}
          <BudgetCard {budget} />
        {/if}
      </section>
    </aside>

    <div class="rt-results">
      {#if selected && budget}
        <header class="city-head">
          <h1>{selected.name}</h1>
          <span class="rt-meta">{SOURCE_LABEL[selected.source]}</span>
        </header>

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
        <section class="empty">
          <p>Enter a city and salary to see your rent budget, verdict, facts, charts, and a map.</p>
        </section>
      {/if}

      <footer>
        Rent estimates: <a href={RENT_DATA_META.dataUrl} target="_blank" rel="noopener">Apartment
          List Rent Estimates</a> ({RENT_DATA_META.label}), © Apartment List, Inc.. Off-list cities use bundled HUD Fair Market Rents. Tax figures are
        2026 estimates for a single filer taking the standard deduction. City facts:
        <a href={ACS_DATA_META.dataUrl} target="_blank" rel="noopener">U.S. Census Bureau
          {ACS_DATA_META.label}</a>. Other city locations &amp; populations:
        <a href="https://simplemaps.com/data/us-cities" target="_blank" rel="noopener">SimpleMaps US
          Cities</a> (CC BY 4.0). All numbers are estimates.
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

  /* Header — first item in the sticky sidebar column; column `gap` handles the
     spacing below it, so no margin needed. */
  .rt-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
    padding: 4px 0;
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
  .compare-link {
    color: var(--accent);
    font-size: 0.78rem;
    font-weight: 650;
    text-decoration: none;
  }
  .compare-link:hover {
    color: var(--accent-deep);
  }
  /* Shell */
  .rt-shell {
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 22px;
    align-items: start;
  }
  .rt-side {
    /* Two-column view: stays pinned on the side while the results scroll.
       Drops to static in the single-column layout below (scrolls away normally).
       `top` matches the wrap's 34px top padding so the column pins exactly where
       it rests — no upward shift as it engages. */
    position: sticky;
    top: 34px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    /* Let the grid track shrink below the inputs' min-content on narrow screens. */
    min-width: 0;
  }
  .rt-results {
    display: flex;
    flex-direction: column;
    min-width: 0;
    /* Start level with the inputs panel (34px brand row + 16px column gap) rather
       than the brand itself, keeping the old header-band feel. Removed in the
       single-column layout, where results sit below the sidebar. */
    padding-top: 50px;
  }

  /* One rule between sections replaces seven card borders. The headline and the
     verdict below it read as a single lede, so that seam alone stays open. */
  .rt-results > :global(* + *) {
    margin-top: 28px;
    padding-top: 28px;
    border-top: 1px solid var(--border);
  }
  .rt-results > :global(.city-head + *) {
    margin-top: 14px;
    padding-top: 0;
    border-top: none;
  }

  .city-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
  }
  .city-head h1 {
    font-size: 2rem;
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.15;
  }

  /* Cascade the result blocks in when they first appear. Because Svelte keeps
     these children mounted across city/salary changes, the animation only plays
     once — on the empty → results transition. */
  .rt-results > :global(*) {
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

  .panel {
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
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
    color: var(--muted);
    font-size: 1.02rem;
    max-width: 40ch;
  }

  /* The two charts share one section band, split by a hairline rather than sitting
     in two boxes. */
  .rt-charts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }
  .rt-charts > :global(* + *) {
    border-left: 1px solid var(--border);
    padding-left: 30px;
  }

  footer {
    font-size: 0.78rem;
    color: var(--muted);
    line-height: 1.6;
    max-width: 74ch;
  }

  @media (max-width: 900px) {
    .rt-shell {
      grid-template-columns: 1fr;
    }
    .rt-side {
      position: static;
    }
    .rt-results {
      padding-top: 0;
    }
  }
  @media (max-width: 760px) {
    .rt-charts {
      grid-template-columns: 1fr;
      gap: 26px;
    }
    /* Stacked: the split becomes horizontal. */
    .rt-charts > :global(* + *) {
      border-left: none;
      padding-left: 0;
      border-top: 1px solid var(--border);
      padding-top: 26px;
    }
    .city-head h1 {
      font-size: 1.7rem;
    }
  }
</style>
