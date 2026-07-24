<script lang="ts">
  import type { City } from '$lib/types';
  import { money, pctTrend, rentMetricLabel } from '$lib/format';
  import { ACS_DATA_META } from '$lib/data/cities';
  import { STATE_NAME } from '$lib/data/states';

  let { city, looking }: { city: City; looking: boolean } = $props();

  let wikiUrl = $derived.by(() => {
    const query = `${city.city}, ${STATE_NAME[city.state] ?? city.state}`;
    return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}&go=Go`;
  });

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

<section class="facts">
  {#if looking}
    <p class="hint">Looking up rent data for this city…</p>
  {:else if city.r1 == null}
    <p class="hint">No rent figure available for this city — the search links below still work.</p>
  {/if}

  {#if rentFacts.length}
    <div class="grid lead-grid">
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
    <div class="rt-secthead snapshot-head">
      <h2>City snapshot</h2>
      {#if city.citySnapshot}
        <a class="rt-meta" href={ACS_DATA_META.dataUrl} target="_blank" rel="noopener">
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
  .facts {
    container-type: inline-size;
  }
  .hint {
    font-size: 0.9rem;
    color: var(--muted);
    margin-bottom: 18px;
  }
  /* Stat rows carried by type and whitespace — no cell fills, no grid rules. */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 20px 26px;
  }
  .snapshot-head {
    margin-top: 28px;
    margin-bottom: 14px;
  }
  .snapshot-head a {
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
  }
  .snapshot-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .fv {
    font-size: 1.2rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }
  /* The headline rents outrank the ACS snapshot below them. */
  .lead-grid .fv {
    font-size: 1.7rem;
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
    margin-top: 14px;
    font-size: 0.72rem;
    color: var(--muted);
  }
  .wiki {
    display: inline-block;
    margin-top: 16px;
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
