<script lang="ts">
  import type { City } from '$lib/types';
  import { money, pctTrend } from '$lib/format';
  import { app } from '$lib/appState.svelte';

  let { cities, maxRent }: { cities: City[]; maxRent: number } = $props();

  function cushion(c: City): number | null {
    return c.r1 != null ? maxRent - c.r1 : null;
  }
</script>

<section class="panel">
  <div class="head">
    <h2>Compare cities</h2>
    <span class="count">{cities.length} / 5</span>
  </div>
  <p class="basis">
    {#if app.salary}
      Budget fit measured against <strong>{money(maxRent)}/mo</strong> — 30% of a
      <strong>{money(app.salary)}</strong> salary. The 30% rule uses gross income, so the same
      budget applies to every city.
    {/if}
  </p>

  <div class="scroll">
    <table>
      <thead>
        <tr>
          <th class="sticky">City</th>
          <th>1BR</th>
          <th>2BR</th>
          <th>1BR trend</th>
          <th>Fits budget?</th>
          <th>Income tax</th>
          <th aria-label="Remove"></th>
        </tr>
      </thead>
      <tbody>
        {#each cities as c (c.name)}
          {@const cu = cushion(c)}
          <tr>
            <td class="sticky">
              <button class="namebtn" onclick={() => app.select(c.name)}>{c.name}</button>
            </td>
            <td>{money(c.r1)}</td>
            <td>{money(c.r2)}</td>
            <td class={c.yoy == null ? '' : c.yoy > 0 ? 'up' : c.yoy < 0 ? 'down' : ''}>
              {pctTrend(c.yoy)}
            </td>
            <td>
              {#if cu == null}
                <span class="pill">—</span>
              {:else if cu >= 0}
                <span class="pill good">✓ +{money(cu)}</span>
              {:else}
                <span class="pill bad">✕ {money(cu)}</span>
              {/if}
            </td>
            <td class="tax">{c.tax}</td>
            <td>
              <button
                class="rm"
                aria-label={`Remove ${c.name}`}
                onclick={() => app.toggleCompare(c.name)}>×</button
              >
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
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
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  h2 {
    font-size: 1rem;
  }
  .basis {
    font-size: 0.8rem;
    color: var(--muted);
    margin-bottom: 12px;
    line-height: 1.45;
    max-width: 62ch;
  }
  .basis strong {
    color: var(--ink);
    font-weight: 600;
  }
  .count {
    font-size: 0.72rem;
    color: var(--muted);
  }
  .scroll {
    overflow-x: auto;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 0.88rem;
    min-width: 560px;
  }
  th,
  td {
    text-align: left;
    padding: 9px 12px;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }
  th {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--muted);
    font-weight: 600;
  }
  .sticky {
    position: sticky;
    left: 0;
    background: var(--card);
  }
  td.tax {
    white-space: normal;
    min-width: 160px;
    color: var(--muted);
    font-size: 0.8rem;
  }
  .up {
    color: var(--red);
  }
  .down {
    color: var(--green);
  }
  .namebtn {
    background: none;
    border: none;
    padding: 0;
    color: var(--accent);
    font-weight: 600;
    cursor: pointer;
    font-size: 0.88rem;
  }
  .pill {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;
    background: var(--card-2);
    border: 1px solid var(--border);
  }
  .pill.good {
    color: var(--green);
    background: color-mix(in srgb, var(--green) 12%, var(--card));
    border-color: transparent;
  }
  .pill.bad {
    color: var(--red);
    background: color-mix(in srgb, var(--red) 12%, var(--card));
    border-color: transparent;
  }
  .rm {
    background: none;
    border: none;
    color: var(--muted);
    font-size: 1.1rem;
    cursor: pointer;
    line-height: 1;
    padding: 2px 6px;
    border-radius: 6px;
  }
  .rm:hover {
    color: var(--red);
    background: var(--card-2);
  }
</style>
