<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from '$lib/appState.svelte';
  import { computeBudget, salaryForRent } from '$lib/budget';
  import { money, pctTrend, rentMetricLabel } from '$lib/format';
  import type { Budget, City, CitySuggestion } from '$lib/types';
  import CitySearch from '$lib/components/CitySearch.svelte';

  const SALARY_KEY = 'rentToolCompareSalaries.v1';
  const DEFAULT_SALARY = 80_000;

  interface Row {
    city: City;
    salary: number;
    budget: Budget;
    rentGap: number | null;
    afterRent: number | null;
  }

  let hydrated = $state(false);
  let salaryText = $state<Record<string, string>>({});
  let salaryErrors = $state<Record<string, string>>({});
  let cityViewHref = $derived.by(() => {
    const search = app.buildSearch();
    return search ? `/?${search}` : '/';
  });

  let rows = $derived.by((): Row[] =>
    app.compareCities.map((city) => {
      const salary = parseInt((salaryText[city.name] ?? '').replace(/,/g, ''), 10);
      const validSalary = Number.isFinite(salary) && salary > 0 ? salary : DEFAULT_SALARY;
      const budget = computeBudget(validSalary, city);
      return {
        city,
        salary: validSalary,
        budget,
        rentGap: city.r1 == null ? null : budget.maxRent - city.r1,
        afterRent: city.r1 == null ? null : budget.takeHomeMonthly - city.r1
      };
    })
  );

  let bestRent = $derived(
    rows.reduce<Row | null>(
      (best, row) => row.city.r1 == null || (best?.city.r1 != null && best.city.r1 <= row.city.r1)
        ? best
        : row,
      null
    )
  );
  let bestTakeHome = $derived(
    rows.reduce<Row | null>((best, row) => !best || row.budget.takeHomeMonthly > best.budget.takeHomeMonthly ? row : best, null)
  );
  let bestAfterRent = $derived(
    rows.reduce<Row | null>((best, row) => row.afterRent == null || (best?.afterRent != null && best.afterRent >= row.afterRent) ? best : row, null)
  );

  function salaryFor(name: string): string {
    return salaryText[name] ?? (app.salary ?? DEFAULT_SALARY).toLocaleString();
  }

  function persistSalaries() {
    try {
      const values: Record<string, number> = {};
      for (const [name, text] of Object.entries(salaryText)) {
        const salary = parseInt(text.replace(/,/g, ''), 10);
        if (Number.isFinite(salary) && salary > 0) values[name] = salary;
      }
      localStorage.setItem(SALARY_KEY, JSON.stringify(values));
    } catch {
      // Storage can be unavailable in private browsing.
    }
  }

  function onSalaryInput(name: string, event: Event) {
    const digits = (event.target as HTMLInputElement).value.replace(/\D/g, '');
    const value = digits ? parseInt(digits, 10) : 0;
    salaryText = {
      ...salaryText,
      [name]: digits ? value.toLocaleString() : ''
    };
    salaryErrors = {
      ...salaryErrors,
      [name]: !digits ? 'Enter a salary.' : value > 10_000_000 ? 'Use $10,000,000 or less.' : ''
    };
    persistSalaries();
  }

  async function addCity(suggestion: CitySuggestion) {
    const name = await app.resolveSuggestion(suggestion);
    if (!app.isComparing(name) && app.compareNames.length < 5) app.toggleCompare(name);
    if (!salaryText[name]) {
      salaryText = { ...salaryText, [name]: (app.salary ?? DEFAULT_SALARY).toLocaleString() };
      persistSalaries();
    }
  }

  function removeCity(name: string) {
    app.toggleCompare(name);
  }

  function cityHref(row: Row): string {
    const search = new URLSearchParams();
    search.set('salary', String(Math.round(row.salary)));
    search.set('city', row.city.name);
    if (
      (row.city.source === 'none' || row.city.source === 'hud-fmr') &&
      row.city.lat != null &&
      row.city.lng != null
    ) {
      search.set('lat', String(row.city.lat));
      search.set('lng', String(row.city.lng));
    }
    for (const name of app.compareNames) search.append('compare', name);
    return `/?${search}`;
  }

  function status(row: Row): { label: string; tone: string } {
    if (row.rentGap == null) return { label: 'Rent unavailable', tone: '' };
    if (row.rentGap >= 0) return { label: `${money(row.rentGap)} under budget`, tone: 'good' };
    return { label: `${money(Math.abs(row.rentGap))} over budget`, tone: 'bad' };
  }

  function pct(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  function metricValue(row: Row, key: string): string {
    const snapshot = row.city.citySnapshot;
    if (key === 'salary') return money(row.salary);
    if (key === 'takehome') return `${money(row.budget.takeHomeMonthly)}/mo`;
    if (key === 'tax') return pct(row.budget.effRate);
    if (key === 'budget') return `${money(row.budget.maxRent)}/mo`;
    if (key === 'rent1') return `${money(row.city.r1)}/mo`;
    if (key === 'rent2') return `${money(row.city.r2)}/mo`;
    if (key === 'after') return row.afterRent == null ? '—' : `${money(row.afterRent)}/mo`;
    if (key === 'needed') return row.city.r1 == null ? '—' : money(salaryForRent(row.city.r1));
    if (key === 'trend') return pctTrend(row.city.yoy);
    if (key === 'income') return money(snapshot?.householdIncome);
    if (key === 'commute') return snapshot ? `${snapshot.commuteMinutes} min` : '—';
    if (key === 'renters') return snapshot ? `${snapshot.renterShare}%` : '—';
    if (key === 'vacancy') return snapshot ? `${snapshot.rentalVacancy}%` : '—';
    return '—';
  }

  function metricNumber(row: Row, key: string): number | null {
    const snapshot = row.city.citySnapshot;
    if (key === 'salary') return row.salary;
    if (key === 'takehome') return row.budget.takeHomeMonthly;
    if (key === 'tax') return row.budget.effRate;
    if (key === 'budget') return row.budget.maxRent;
    if (key === 'rent1') return row.city.r1;
    if (key === 'rent2') return row.city.r2;
    if (key === 'after') return row.afterRent;
    if (key === 'needed') return row.city.r1 == null ? null : salaryForRent(row.city.r1);
    if (key === 'trend') return row.city.yoy;
    if (key === 'income') return snapshot?.householdIncome ?? null;
    if (key === 'commute') return snapshot?.commuteMinutes ?? null;
    if (key === 'renters') return snapshot?.renterShare ?? null;
    if (key === 'vacancy') return snapshot?.rentalVacancy ?? null;
    return null;
  }

  function metricTone(row: Row, key: string, direction: 'high' | 'low'): 'best' | 'worst' | '' {
    const values = rows
      .map((candidate) => metricNumber(candidate, key))
      .filter((value): value is number => value != null && Number.isFinite(value));
    const value = metricNumber(row, key);
    if (value == null || values.length < 2) return '';
    const low = Math.min(...values);
    const high = Math.max(...values);
    if (low === high) return '';
    if (value === (direction === 'high' ? high : low)) return 'best';
    if (value === (direction === 'high' ? low : high)) return 'worst';
    return '';
  }

  const metrics = [
    { key: 'salary', label: 'Annual salary', direction: 'high' },
    { key: 'takehome', label: 'Est. take-home', direction: 'high' },
    { key: 'tax', label: 'Effective tax rate', direction: 'low' },
    { key: 'budget', label: '30% rent budget', direction: 'high' },
    { key: 'rent1', label: '1BR rent', direction: 'low' },
    { key: 'rent2', label: '2BR rent', direction: 'low' },
    { key: 'after', label: 'Take-home after 1BR', direction: 'high' },
    { key: 'needed', label: 'Salary needed for 1BR', direction: 'low' },
    { key: 'trend', label: 'Rent trend', direction: 'low' },
    { key: 'income', label: 'Median household income', direction: 'high' },
    { key: 'commute', label: 'Average commute', direction: 'low' },
    { key: 'renters', label: 'Renter households', direction: 'high' },
    { key: 'vacancy', label: 'Rental vacancy', direction: 'high' }
  ] as const;

  onMount(() => {
    // A client-side visit from the city page already has the freshest state.
    // Restoring unconditionally here could replace it with an older localStorage
    // snapshot and make newly selected compare cities seem to disappear.
    if (!app.selected && !app.compareCities.length && app.salary == null) app.restore();
    if (!app.compareCities.length && app.selected) app.toggleCompare(app.selected.name);
    let saved: Record<string, number> = {};
    try {
      saved = JSON.parse(localStorage.getItem(SALARY_KEY) ?? '{}');
    } catch {
      saved = {};
    }
    salaryText = Object.fromEntries(
      app.compareCities.map((city) => [
        city.name,
        (saved[city.name] ?? app.salary ?? DEFAULT_SALARY).toLocaleString()
      ])
    );
    hydrated = true;
  });
</script>

<svelte:head>
  <title>Compare cities and salaries · Rent Tool</title>
  <meta name="description" content="Compare rent, take-home pay, taxes, and affordability across U.S. cities using a different salary for every city." />
</svelte:head>

<main class="compare-page" data-hydrated={hydrated ? 'true' : 'false'}>
  <header class="topbar">
    <a class="brand" href={cityViewHref}>
      <img src="/favicon.svg" alt="" width="26" height="26" />
      <span>Rent Tool</span>
    </a>
    <a class="back" href={cityViewHref}>← Back to city view</a>
  </header>

  <section class="intro">
    <div>
      <h1 class="eyebrow">Side-by-side planner</h1>
    </div>
    <div class="add-panel">
      <CitySearch onselect={addCity} />
      <p>{app.compareNames.length} of 5 cities added</p>
    </div>
  </section>

  {#if rows.length}
    <section class="salary-grid" aria-label="Comparison scenarios">
      {#each rows as row (row.city.name)}
        {@const result = status(row)}
        <article class="scenario">
          <div class="scenario-head">
            <div>
              <h2><a class="city-link" href={cityHref(row)}>{row.city.name}</a></h2>
              <p>{rentMetricLabel(row.city.rentMetric)}</p>
            </div>
            <button class="remove" onclick={() => removeCity(row.city.name)} aria-label={`Remove ${row.city.name}`}>×</button>
          </div>
          <label for={`salary-${row.city.name}`}>Annual salary</label>
          <div class="salary-input" class:invalid={salaryErrors[row.city.name]}>
            <span>$</span>
            <input
              id={`salary-${row.city.name}`}
              aria-label={`Annual salary in ${row.city.name}`}
              inputmode="numeric"
              value={salaryFor(row.city.name)}
              oninput={(event) => onSalaryInput(row.city.name, event)}
            />
          </div>
          {#if salaryErrors[row.city.name]}<span class="error">{salaryErrors[row.city.name]}</span>{/if}
          <div class="headline">
            <div>
              <span>1BR rent</span>
              <strong>{money(row.city.r1)}<small>/mo</small></strong>
            </div>
            <div>
              <span>Rent budget</span>
              <strong>{money(row.budget.maxRent)}<small>/mo</small></strong>
            </div>
          </div>
          <div class="fit {result.tone}">{result.label}</div>
        </article>
      {/each}
    </section>

    {#if rows.length > 1}
      <section class="highlights">
        <div>
          <span>Lowest 1BR rent</span>
          {#if bestRent}
            <strong><a class="city-link" href={cityHref(bestRent)}>{bestRent.city.name}</a></strong>
          {:else}
            <strong>—</strong>
          {/if}
          <small>{money(bestRent?.city.r1)}/mo</small>
        </div>
        <div>
          <span>Highest take-home</span>
          {#if bestTakeHome}
            <strong><a class="city-link" href={cityHref(bestTakeHome)}>{bestTakeHome.city.name}</a></strong>
          {:else}
            <strong>—</strong>
          {/if}
          <small>{money(bestTakeHome?.budget.takeHomeMonthly)}/mo</small>
        </div>
        <div>
          <span>Most left after rent</span>
          {#if bestAfterRent}
            <strong><a class="city-link" href={cityHref(bestAfterRent)}>{bestAfterRent.city.name}</a></strong>
          {:else}
            <strong>—</strong>
          {/if}
          <small>{money(bestAfterRent?.afterRent)}/mo</small>
        </div>
      </section>
    {/if}

    <section class="detail">
      <div class="section-head">
        <div>
          <h2 class="eyebrow">Full breakdown</h2>
        </div>
        <p>Taxes estimate a single filer taking the standard deduction.</p>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              {#each rows as row}<th><a class="city-link" href={cityHref(row)}>{row.city.name}</a></th>{/each}
            </tr>
          </thead>
          <tbody>
            {#each metrics as metric}
              <tr>
                <th>{metric.label}</th>
                {#each rows as row}
                  {@const tone = metricTone(row, metric.key, metric.direction)}
                  <td
                    class="num"
                    class:best={tone === 'best'}
                    class:worst={tone === 'worst'}
                    title={tone === 'best' ? 'Best in comparison' : tone === 'worst' ? 'Worst in comparison' : undefined}
                  >{metricValue(row, metric.key)}</td>
                {/each}
              </tr>
            {/each}
            <tr>
              <th>Income tax context</th>
              {#each rows as row}<td class="note">{row.city.tax}</td>{/each}
            </tr>
            <tr>
              <th>Rent data</th>
              {#each rows as row}<td class="note">{row.city.rentArea} · {row.city.rentYear || 'year unavailable'}</td>{/each}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  {:else if hydrated}
    <section class="empty">
      <h2>Add your first city</h2>
      <p>Search above to start a comparison. You can add up to five cities and use a separate salary for each one.</p>
    </section>
  {/if}

  <footer>Figures are estimates for planning, not tax or financial advice. Rent sources and methodology are shown for each city.</footer>
</main>

<style>
  .compare-page { max-width: var(--maxw); margin: 0 auto; padding: 34px 22px 70px; }
  .topbar { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
  .brand { display: flex; align-items: center; gap: 10px; color: var(--ink); text-decoration: none; font-size: .74rem; font-weight: 700; text-transform: uppercase; letter-spacing: .14em; }
  .brand img { border-radius: 7px; }
  .back { font-size: .86rem; font-weight: 600; text-decoration: none; }
  .intro { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 38px; align-items: end; padding: 46px 0 28px; border-bottom: 1px solid var(--border); }
  .eyebrow { color: var(--muted); text-transform: uppercase; letter-spacing: .11em; font-size: .72rem; font-weight: 650; margin-bottom: 9px; }
  .add-panel { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); }
  .add-panel > p { color: var(--muted); font-size: .76rem; margin-top: 9px; }
  .salary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(215px, 1fr)); gap: 0; padding: 30px 0; }
  .scenario { padding: 4px 22px 24px; min-width: 0; }
  .scenario:first-child { padding-left: 0; }
  .scenario:last-child { padding-right: 0; }
  .scenario + .scenario { border-left: 1px solid var(--border); }
  .scenario-head { display: flex; justify-content: space-between; gap: 10px; align-items: start; min-height: 54px; }
  .scenario h2 { font-size: 1.05rem; letter-spacing: -.02em; }
  .city-link, .city-link:hover { color: inherit; text-decoration: none; }
  .scenario-head p { color: var(--muted); font-size: .68rem; margin-top: 2px; }
  .remove { border: 0; background: transparent; color: var(--muted); cursor: pointer; font-size: 1.25rem; line-height: 1; border-radius: 6px; }
  .remove:hover { color: var(--red); background: var(--card2); }
  label { display: block; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; font-size: .65rem; font-weight: 700; margin-top: 15px; }
  .salary-input { display: flex; align-items: baseline; border-bottom: 2px solid var(--border2); margin-top: 2px; }
  .salary-input:focus-within { border-color: var(--accent); }
  .salary-input.invalid { border-color: var(--red); }
  .salary-input span { color: var(--muted); font-size: 1.15rem; }
  .salary-input input { min-width: 0; width: 100%; border: 0; background: transparent; color: var(--ink); font: inherit; font-size: 1.45rem; font-weight: 700; padding: 3px; font-variant-numeric: tabular-nums; }
  .salary-input input:focus { outline: 0; }
  .error { color: var(--red); font-size: .68rem; }
  .headline { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--border); }
  .headline > div { min-width: 0; }
  .headline span { display: block; color: var(--muted); font-size: .65rem; }
  .headline strong { display: block; font-size: 1rem; font-variant-numeric: tabular-nums; margin-top: 2px; }
  .headline small { color: var(--muted); font-size: .65rem; font-weight: 500; }
  .fit { margin-top: 14px; padding-top: 10px; border-top: 2px solid var(--border2); color: var(--muted); font-size: .76rem; font-weight: 700; }
  .fit.good { color: var(--green); border-top-color: var(--green); }
  .fit.bad { color: var(--red); border-top-color: var(--red); }
  .highlights { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px; margin: 0; }
  .highlights > div { min-width: 0; padding: 2px 22px 14px; }
  .highlights > div:first-child { padding-left: 0; }
  .highlights > div:last-child { padding-right: 0; }
  .highlights span, .highlights small { display: block; color: var(--muted); font-size: .7rem; }
  .highlights strong { display: block; font-size: 1rem; margin: 3px 0; }
  .detail { border-top: 1px solid var(--border); margin-top: 28px; padding-top: 28px; }
  .section-head { display: flex; justify-content: space-between; align-items: end; gap: 20px; margin-bottom: 20px; }
  .section-head > p { max-width: 340px; color: var(--muted); font-size: .78rem; text-align: right; }
  .table-scroll { overflow-x: auto; border-top: 2px solid var(--border2); }
  table { width: 100%; border-collapse: collapse; min-width: 680px; font-size: .84rem; }
  th, td { padding: 13px 16px; border-bottom: 1px solid var(--border); text-align: right; vertical-align: top; }
  thead th { color: var(--muted); font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; }
  th:first-child { text-align: left; position: sticky; left: 0; background: var(--bg); z-index: 1; min-width: 185px; }
  tbody th { color: var(--muted); font-weight: 600; }
  td.best { color: var(--green); box-shadow: inset 0 -2px var(--green); }
  td.worst { color: var(--red); box-shadow: inset 0 -2px var(--red); }
  tr:last-child th, tr:last-child td { border-bottom: 0; }
  td.note { white-space: normal; min-width: 175px; color: var(--muted); font-size: .74rem; }
  .empty { text-align: center; padding: 80px 20px; border-bottom: 1px solid var(--border); }
  .empty h2 { font-size: 1.5rem; }
  .empty p { color: var(--muted); max-width: 520px; margin: 8px auto 0; }
  footer { color: var(--muted); font-size: .72rem; margin-top: 28px; }
  @media (max-width: 760px) {
    .compare-page { padding: 20px 16px 48px; }
    .intro { grid-template-columns: 1fr; gap: 24px; padding: 38px 0 28px; }
    .salary-grid { grid-template-columns: 1fr; }
    .scenario, .scenario:first-child, .scenario:last-child { padding: 22px 0; }
    .scenario:first-child { padding-top: 0; }
    .scenario + .scenario { border-left: 0; border-top: 1px solid var(--border); }
    .highlights { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .highlights > div, .highlights > div:first-child, .highlights > div:last-child { padding: 16px 0; }
    .section-head { align-items: start; flex-direction: column; }
    .section-head > p { text-align: left; }
  }
</style>
