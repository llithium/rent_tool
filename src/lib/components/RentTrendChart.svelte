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

<section class="card">
  <div class="head">
    <h3>Rent vs your budget</h3>
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
            class="fill"
            style="width:{Math.max(3, (b.value / max) * 100)}%;background:{barColor(b)}"
          ></div>
        </div>
      </div>
    {/each}
  </div>
</section>

<style>
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    box-shadow: var(--shadow);
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  h3 {
    font-size: 1rem;
    font-weight: 600;
  }
  .yoy {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 99px;
    background: var(--card2);
    border: 1px solid var(--border);
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
    background: var(--card2);
    border: 1px solid var(--border);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    border-radius: 99px;
    transform-origin: left;
    animation: rt-grow-x 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
    transition: width 0.4s ease;
  }
</style>
