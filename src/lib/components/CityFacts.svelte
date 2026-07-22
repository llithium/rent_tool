<script lang="ts">
  import type { City, RentSource } from '$lib/types';
  import { money, pctTrend, rentMetricLabel } from '$lib/format';
  import { ACS_DATA_META } from '$lib/data/cities';
  import { STATE_NAME } from '$lib/data/states';

  let { city, looking }: { city: City; looking: boolean } = $props();

  let wikiUrl = $derived.by(() => {
    const query = `${city.city}, ${STATE_NAME[city.state] ?? city.state}`;
    return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}&go=Go`;
  });

  const SOURCE_LABEL: Record<RentSource, string> = {
    'apartment-list': 'Apartment List estimate',
    'hud-fmr': 'HUD Fair Market Rent',
    none: 'No rent data'
  };

  // Metric-aware labels keep Apartment List estimates distinct from HUD FMRs.
  let rentFacts = $derived(
    [
      { l: rentMetricLabel(city.rentMetric, '1BR'), v: money(city.r1), cls: '' },
      { l: rentMetricLabel(city.rentMetric, '2BR'), v: money(city.r2), cls: '' },
      {
        l: '1BR trend',
        v: pctTrend(city.yoy),
        cls: city.yoy == null ? '' : city.yoy > 0 ? 'up' : city.yoy < 0 ? 'down' : ''
      },
      ...(!city.citySnapshot && city.pop
        ? [{ l: 'Population', v: city.pop, cls: '' }]
        : [])
    ].filter((f) => f.v && f.v !== '—')
  );

  let snapshotFacts = $derived.by(() => {
    const f = city.citySnapshot;
    if (!f) return [];
    return [
      { l: 'Population', v: f.population.toLocaleString('en-US') },
      { l: 'Median household income', v: money(f.householdIncome) },
      { l: 'Mean commute', v: f.commuteMinutes > 0 ? `${f.commuteMinutes.toFixed(1)} min` : '' },
      { l: 'Renter-occupied homes', v: `${f.renterShare.toFixed(1)}%` },
      { l: 'Rental vacancy rate', v: f.rentalVacancy > 0 ? `${f.rentalVacancy.toFixed(1)}%` : '' }
    ].filter((fact) => fact.v);
  });
</script>

<section class="card">
  <div class="head">
    <h2>{city.name}</h2>
    <span class="src">{SOURCE_LABEL[city.source]}</span>
  </div>

  {#if looking}
    <p class="hint">Looking up rent data for this city…</p>
  {:else if city.r1 == null}
    <p class="hint">No rent figure available for this city — the search links below still work.</p>
  {/if}

  {#if rentFacts.length}
    <div class="grid">
      {#each rentFacts as f (f.l)}
        <div class="fact">
          <div class="fv {f.cls}">{f.v}</div>
          <div class="fl">{f.l}</div>
        </div>
      {/each}
    </div>
  {/if}

  {#if city.rentArea || city.rentYear}
    <p class="vintage">{city.rentArea}{city.rentYear ? ` · ${city.rentYear}` : ''}</p>
  {/if}

  {#if snapshotFacts.length}
    <div class="snapshot-head">
      <h3>City snapshot</h3>
      {#if city.citySnapshot}
        <a href={ACS_DATA_META.dataUrl} target="_blank" rel="noopener">
          {ACS_DATA_META.label} ↗
        </a>
      {/if}
    </div>
    <div class="grid snapshot-grid">
      {#each snapshotFacts as f (f.l)}
        <div class="fact">
          <div class="fv">{f.v}</div>
          <div class="fl">{f.l}</div>
        </div>
      {/each}
    </div>
    {#if city.citySnapshot}
      <p class="vintage">{ACS_DATA_META.geography} · U.S. Census Bureau</p>
    {/if}
  {/if}

  <a class="wiki" href={wikiUrl} target="_blank" rel="noopener">
    Read about {city.city} on Wikipedia ↗
  </a>
</section>

<style>
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 22px;
    box-shadow: var(--shadow);
    container-type: inline-size;
  }
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }
  h2 {
    font-size: 1.15rem;
    font-weight: 600;
  }
  .src {
    font-size: 0.66rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    background: var(--card2);
    border: 1px solid var(--border);
    padding: 4px 9px;
    border-radius: 99px;
  }
  .hint {
    font-size: 0.85rem;
    color: var(--muted);
    background: var(--card2);
    border-radius: var(--radius-sm);
    padding: 9px 11px;
    margin-bottom: 16px;
  }
  /* Ruled grid: shared 1px borders via right/bottom on each cell, clipped by the wrapper. */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }
  .snapshot-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 22px;
    margin-bottom: 8px;
  }
  .snapshot-head h3 {
    font-size: 0.78rem;
    font-weight: 650;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
  }
  .snapshot-head a {
    color: var(--muted);
    font-size: 0.72rem;
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
  }
  .snapshot-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .fact {
    padding: 13px 15px;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: var(--card2);
  }
  .fv {
    font-size: 1.25rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }
  .fv.up {
    color: var(--red);
  }
  .fv.down {
    color: var(--green);
  }
  .fl {
    font-size: 0.68rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-top: 3px;
  }
  .vintage {
    margin-top: 12px;
    font-size: 0.72rem;
    color: var(--muted);
  }
  .wiki {
    display: inline-block;
    margin-top: 14px;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--accent);
  }
  .wiki:hover {
    text-decoration: underline;
  }

  @container (max-width: 620px) {
    .snapshot-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .snapshot-grid .fact:last-child {
      grid-column: 1 / -1;
    }
  }
</style>
