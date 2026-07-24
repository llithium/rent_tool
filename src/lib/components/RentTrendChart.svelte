<script lang="ts">
  import type { Budget, City } from '$lib/types';
  import { money, pctTrend } from '$lib/format';

  let { city, budget }: { city: City; budget: Budget } = $props();

  interface Bar {
    label: string;
    value: number;
    kind: 'rent' | 'budget';
  }

  let bars = $derived.by<Bar[]>(() => {
    const out: Bar[] = [];
    if (city.r1 != null) out.push({ label: 'Median 1BR', value: city.r1, kind: 'rent' });
    if (city.r2 != null) out.push({ label: 'Median 2BR', value: city.r2, kind: 'rent' });
    out.push({ label: 'Your max (30%)', value: budget.maxRent, kind: 'budget' });
    return out;
  });

  let max = $derived(Math.max(...bars.map((b) => b.value), 1));

  function barColor(b: Bar): string {
    if (b.kind === 'budget') return 'var(--accent)';
    return b.value <= budget.maxRent ? 'var(--green)' : 'var(--red)';
  }
</script>

<section>
  <div class="rt-secthead">
    <h2>Rent vs your budget</h2>
    {#if city.yoy != null}
      <span class="yoy {city.yoy > 0 ? 'up' : city.yoy < 0 ? 'down' : ''}">1BR {pctTrend(city.yoy)}</span>
    {/if}
  </div>

  <div class="bars">
    {#each bars as b (b.label)}
      <div class="bar-row">
        <div class="bar-head">
          <span class="cat">{b.label}</span>
          <span class="val num">{money(b.value)}</span>
        </div>
        <div class="track">
          <div
            class="fill rt-grow"
            style="width:{Math.max(3, (b.value / max) * 100)}%;background:{barColor(b)}"
          ></div>
        </div>
      </div>
    {/each}
  </div>
</section>

<style>
  .yoy {
    font-size: 0.74rem;
    font-weight: 600;
    color: var(--muted);
    white-space: nowrap;
  }
  .yoy.up {
    color: var(--red);
  }
  .yoy.down {
    color: var(--green);
  }
  .bars {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .bar-head {
    display: flex;
    justify-content: space-between;
    font-size: 0.82rem;
    margin-bottom: 5px;
  }
  .cat {
    color: var(--muted);
  }
  .val {
    font-weight: 600;
  }
  .track {
    height: 12px;
    border-radius: 99px;
    /* --border, not --card2: the track now sits on the page background rather
       than inside a card, and card2 against bg is almost invisible — an unfilled
       track has to still read as a bar. */
    background: var(--border);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    border-radius: 99px;
    transform-origin: left;
    transition: width 0.4s ease;
  }
</style>
