<script lang="ts">
  import type { Budget, City } from '$lib/types';
  import { money, pctTrend, rentMetricLabel } from '$lib/format';

  let { city, budget }: { city: City; budget: Budget } = $props();

  interface Bar {
    label: string;
    value: number;
    kind: 'rent' | 'budget';
  }

  let bars = $derived.by<Bar[]>(() => {
    const out: Bar[] = [];
    if (city.r1 != null) out.push({ label: rentMetricLabel(city.rentMetric, '1BR'), value: city.r1, kind: 'rent' });
    if (city.r2 != null) out.push({ label: rentMetricLabel(city.rentMetric, '2BR'), value: city.r2, kind: 'rent' });
    out.push({ label: 'Your max', value: budget.maxRent, kind: 'budget' });
    return out;
  });

  let max = $derived(Math.max(...bars.map((b) => b.value), 1));

  // Geometry
  const W = 420;
  const rowH = 46;
  const labelW = 150;
  const barMax = W - labelW - 70;

  function barColor(b: Bar): string {
    if (b.kind === 'budget') return 'var(--accent)';
    return b.value <= budget.maxRent ? 'var(--green)' : 'var(--red)';
  }
</script>

<section class="panel">
  <div class="head">
    <h3>Rent vs your budget</h3>
    {#if city.yoy != null}
      <span class="yoy {city.yoy > 0 ? 'up' : city.yoy < 0 ? 'down' : ''}">
        1BR {pctTrend(city.yoy)}
      </span>
    {/if}
  </div>

  <svg viewBox="0 0 {W} {bars.length * rowH + 8}" role="img" aria-label="Rent comparison chart">
    {#each bars as b, i (b.label)}
      {@const y = i * rowH + 6}
      {@const w = Math.max(2, (b.value / max) * barMax)}
      <text x="0" y={y + 18} class="cat">{b.label}</text>
      <rect x={labelW} y={y + 6} width={barMax} height="18" rx="4" class="track" />
      <rect x={labelW} y={y + 6} width={w} height="18" rx="4" fill={barColor(b)} />
      <text x={labelW + w + 6} y={y + 20} class="val">{money(b.value)}</text>
    {/each}
  </svg>
</section>

<style>
  .panel {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px 18px;
    box-shadow: var(--shadow);
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  h3 {
    font-size: 0.9rem;
  }
  .yoy {
    font-size: 0.72rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--card-2);
    border: 1px solid var(--border);
  }
  .yoy.up {
    color: var(--red);
  }
  .yoy.down {
    color: var(--green);
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .cat {
    font-size: 11px;
    fill: var(--muted);
  }
  .val {
    font-size: 11px;
    font-weight: 700;
    fill: var(--ink);
  }
  .track {
    fill: var(--card-2);
    stroke: var(--border);
    stroke-width: 1;
  }
</style>
