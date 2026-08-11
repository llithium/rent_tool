<script lang="ts">
  import {
    AFFORDABILITY_METRICS,
    CITY_CONTEXT_METRICS,
    cityHref,
    metricTone,
    metricToneLabel,
    metricValue,
    type CompareRow
  } from '$lib/compare/metrics';

  let { rows, compareNames }: { rows: CompareRow[]; compareNames: string[] } = $props();
  let cityContextVisible = $state(false);
</script>

<div>
  <div class="mb-3">
    <p class="text-label text-ink">Affordability first</p>
  </div>
  <div class="overflow-x-auto">
    <!-- Cell padding and rules are uniform across the table, so they ride on the
       row and body; alignment and stickiness vary per column. -->
    <table class="w-full min-w-170 border-collapse text-sm">
      <thead>
        <tr
          class="[&>th]:border-b [&>th]:border-line [&>th]:px-4 [&>th]:py-3 [&>th]:align-top [&>th]:text-xs [&>th]:tracking-wider [&>th]:text-muted [&>th]:uppercase"
        >
          <!-- The metric column stays put while the city columns scroll sideways. -->
          <th class="sticky left-0 z-10 min-w-46 bg-canvas text-left">Metric</th>
          {#each rows as row (row.city.name)}
            <th class="text-right">
              <a
                href={cityHref(row, compareNames)}
                class="text-inherit no-underline hover:text-inherit"
              >
                {row.city.name}
              </a>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody
        class="[&_td]:border-b [&_td]:border-line [&_td]:px-4 [&_td]:py-3 [&_td]:align-top [&_th]:border-b [&_th]:border-line [&_th]:px-4 [&_th]:py-3 [&_th]:align-top [&_tr:last-child>*]:border-b-0"
      >
        {#each AFFORDABILITY_METRICS as metric (metric.key)}
          <tr>
            <th class="sticky left-0 z-10 min-w-46 bg-canvas text-left font-semibold text-muted">
              {metric.label}
            </th>
            {#each rows as row, index (row.city.name)}
              {@const tone = metricTone(rows, row, metric.key, metric.direction)}
              {@const value = metricValue(row, metric.key)}
              <td
                data-tone={tone}
                title={tone === 'best'
                  ? 'Best in comparison'
                  : tone === 'worst'
                    ? 'Worst in comparison'
                    : undefined}
                class="relative text-right tabular-nums {tone
                  ? 'border-b-transparent'
                  : ''} {tone === 'best' ? 'text-green' : tone === 'worst' ? 'text-red' : ''}"
              >
                {#key value}<span class="motion-value">{value}</span>{/key}
                {#if tone}
                  <!-- Best/worst is called out with a rule under the cell rather
                     than a fill, so the number stays the loudest thing in the row.
                     It runs to the table edge on the outer columns. -->
                  <span
                    class="absolute bottom-0 h-0.5 {tone === 'best'
                      ? 'bg-green'
                      : 'bg-red'} {index === 0 ? 'left-0' : 'left-1.5'} {index === rows.length - 1
                      ? 'right-0'
                      : 'right-1.5'}"
                  ></span>
                  <span
                    class="mt-1 block text-meta font-semibold {tone === 'best'
                      ? 'text-green'
                      : 'text-red'}"
                  >
                    {metricToneLabel(metric.key, metric.direction, tone)}
                  </span>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
        <tr>
          <th class="sticky left-0 z-10 min-w-46 bg-canvas text-left font-semibold text-muted">
            Income tax context
          </th>
          {#each rows as row (row.city.name)}
            <td class="min-w-44 text-right text-xs text-muted">{row.city.tax}</td>
          {/each}
        </tr>
        {#if cityContextVisible}
          <tr>
            <th
              colspan={rows.length + 1}
              class="border-b border-line bg-card-2 px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted uppercase"
            >
              City context
            </th>
          </tr>
          {#each CITY_CONTEXT_METRICS as metric (metric.key)}
            <tr>
              <th class="sticky left-0 z-10 min-w-46 bg-canvas text-left font-semibold text-muted">
                {metric.label}
              </th>
              {#each rows as row, index (row.city.name)}
                {@const tone = metricTone(rows, row, metric.key, metric.direction)}
                {@const value = metricValue(row, metric.key)}
                <td
                  data-tone={tone}
                  class="relative text-right tabular-nums {tone === 'best'
                    ? 'text-green'
                    : tone === 'worst'
                      ? 'text-red'
                      : ''}"
                >
                  {#key value}<span class="motion-value">{value}</span>{/key}
                  {#if tone}
                    <span
                      class="absolute bottom-0 h-0.5 {tone === 'best'
                        ? 'bg-green'
                        : 'bg-red'} {index === 0 ? 'left-0' : 'left-1.5'} {index === rows.length - 1
                        ? 'right-0'
                        : 'right-1.5'}"
                    ></span>
                    <span
                      class="mt-1 block text-meta font-semibold {tone === 'best'
                        ? 'text-green'
                        : 'text-red'}"
                    >
                      {metricToneLabel(metric.key, metric.direction, tone)}
                    </span>
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        {/if}
        <tr>
          <th class="sticky left-0 z-10 min-w-46 bg-canvas text-left font-semibold text-muted">
            Rent data
          </th>
          {#each rows as row (row.city.name)}
            <td class="min-w-44 text-right text-xs text-muted">
              {row.city.rentArea} · {row.city.rentYear || 'year unavailable'}
            </td>
          {/each}
        </tr>
      </tbody>
    </table>
  </div>
  <button
    type="button"
    aria-expanded={cityContextVisible}
    onclick={() => (cityContextVisible = !cityContextVisible)}
    class="mt-4 cursor-pointer text-sm font-semibold text-accent underline-offset-4 hover:text-accent-deep hover:underline"
  >
    {cityContextVisible
      ? 'Hide city context'
      : `Show city context (${CITY_CONTEXT_METRICS.length} metrics)`}
  </button>
</div>
