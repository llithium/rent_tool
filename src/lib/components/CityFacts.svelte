<script lang="ts">
  import type { City, RentSource } from '$lib/types';
  import { money, pctTrend } from '$lib/format';

  let { city, looking }: { city: City; looking: boolean } = $props();

  const SOURCE_LABEL: Record<RentSource, string> = {
    'zumper-live': 'Live · Zumper',
    'zumper-snapshot': 'Zumper snapshot',
    'hud-fmr': 'HUD Fair Market Rent',
    'census-acs': 'Census ACS',
    none: 'No rent data'
  };

  let facts = $derived(
    [
      { l: 'Median 1BR rent', v: money(city.r1) },
      { l: 'Median 2BR rent', v: money(city.r2) },
      {
        l: '1BR rent trend',
        v: pctTrend(city.yoy),
        cls: city.yoy == null ? '' : city.yoy > 0 ? 'up' : city.yoy < 0 ? 'down' : ''
      },
      { l: 'Income tax', v: city.tax },
      { l: 'Population', v: city.pop }
    ].filter((f) => f.v && f.v !== '—')
  );
</script>

<section class="panel">
  <div class="head">
    <h2>City facts — {city.name}</h2>
    <span class="src">{SOURCE_LABEL[city.source]}</span>
  </div>

  <div class="grid">
    {#each facts as f (f.l)}
      <div class="fact">
        <div class="fv {f.cls ?? ''}">{f.v}</div>
        <div class="fl">{f.l}</div>
      </div>
    {/each}
  </div>

  {#if looking}
    <p class="hint">Looking up live rent data for this city…</p>
  {:else if city.r1 == null}
    <p class="hint">
      No rent figure available for this city — the search links below still work.
    </p>
  {/if}

  {#if city.blurb}
    <p class="blurb">{city.blurb}</p>
  {/if}
</section>

<style>
  .panel {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 18px;
    box-shadow: var(--shadow);
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  h2 {
    font-size: 1rem;
  }
  .src {
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--muted);
    background: var(--card-2);
    border: 1px solid var(--border);
    padding: 3px 8px;
    border-radius: 999px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 9px;
    margin-bottom: 11px;
  }
  .fact {
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
  }
  .fv {
    font-weight: 700;
    font-size: 1rem;
  }
  .fv.up {
    color: var(--red);
  }
  .fv.down {
    color: var(--green);
  }
  .fl {
    font-size: 0.7rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-top: 2px;
  }
  .blurb {
    font-size: 0.9rem;
    line-height: 1.55;
    color: var(--ink);
    opacity: 0.9;
  }
  .hint {
    font-size: 0.83rem;
    color: var(--muted);
    background: var(--card-2);
    border-radius: var(--radius-sm);
    padding: 9px 11px;
    margin-bottom: 10px;
  }
</style>
