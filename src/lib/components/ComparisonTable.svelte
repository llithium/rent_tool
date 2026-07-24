<script lang="ts">
  import type { City } from '$lib/types';
  import { money, pctTrend } from '$lib/format';
  import { app } from '$lib/appState.svelte';

  let { cities, maxRent }: { cities: City[]; maxRent: number } = $props();

  function cushion(c: City): number | null {
    return c.r1 != null ? maxRent - c.r1 : null;
  }
</script>

<section>
  <div class="rt-secthead">
    <h2>Compare cities</h2>
    <span class="rt-meta tabnum">{cities.length} / 5</span>
  </div>
  <p class="basis">
    {#if app.salary}
      Fit measured against <strong>{money(maxRent)}/mo</strong> — the same 30% budget applies to
      every city, since the rule uses gross income.
    {/if}
  </p>

  <div class="scroll">
    <table>
      <thead>
        <tr>
          <th class="left">City</th>
          <th class="right">1BR</th>
          <th class="right">2BR</th>
          <th class="right">Trend</th>
          <th class="center">Fits?</th>
          <th class="left">Income tax</th>
          <th aria-label="Remove"></th>
        </tr>
      </thead>
      <tbody>
        {#each cities as c (c.name)}
          {@const cu = cushion(c)}
          <tr class:selected={c.name === app.selectedName}>
            <td class="city">
              <button class="namebtn" onclick={() => app.select(c.name)}>{c.name}</button>
            </td>
            <td class="num right strong">{money(c.r1)}</td>
            <td class="num right">{money(c.r2)}</td>
            <td class="num right {c.yoy == null ? '' : c.yoy > 0 ? 'up' : c.yoy < 0 ? 'down' : ''}">
              {pctTrend(c.yoy)}
            </td>
            <td class="center">
              {#if cu == null}
                <span class="pill">—</span>
              {:else if cu >= 0}
                <span class="pill good">+{money(cu)}</span>
              {:else}
                <span class="pill bad">{money(cu)}</span>
              {/if}
            </td>
            <td class="tax">{c.tax}</td>
            <td class="right">
              <button class="rm" aria-label={`Remove ${c.name}`} onclick={() => app.toggleCompare(c.name)}
                >×</button
              >
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>

<style>
  .basis {
    font-size: 0.88rem;
    color: var(--muted);
    margin-top: -6px;
    margin-bottom: 14px;
    line-height: 1.5;
    max-width: 64ch;
  }
  .basis strong {
    color: var(--ink);
    font-weight: 600;
  }
  .scroll {
    overflow-x: auto;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 0.92rem;
    min-width: 540px;
  }
  th {
    padding: 9px 12px;
    border-bottom: 2px solid var(--border2);
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    font-weight: 600;
    white-space: nowrap;
  }
  td {
    padding: 11px 12px;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }
  th.left,
  td.city,
  td.tax {
    text-align: left;
  }
  th.right,
  td.right {
    text-align: right;
  }
  th.center,
  td.center {
    text-align: center;
  }
  td.strong {
    font-weight: 600;
  }
  tr.selected td {
    background: var(--accent-soft);
  }
  td.tax {
    white-space: normal;
    min-width: 150px;
    color: var(--muted);
    font-size: 0.82rem;
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
    font-size: 0.98rem;
    letter-spacing: -0.015em;
  }
  .pill {
    display: inline-block;
    padding: 3px 9px;
    border-radius: 99px;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--muted);
  }
  .pill.good {
    color: var(--green);
    background: var(--green-soft);
    border-color: transparent;
  }
  .pill.bad {
    color: var(--red);
    background: var(--red-soft);
    border-color: transparent;
  }
  .rm {
    background: none;
    border: none;
    color: var(--muted);
    font-size: 1.15rem;
    cursor: pointer;
    line-height: 1;
    padding: 2px 7px;
    border-radius: 6px;
  }
  .rm:hover {
    color: var(--red);
    background: var(--card2);
  }
</style>
