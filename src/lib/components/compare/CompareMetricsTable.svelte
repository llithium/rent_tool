<script lang="ts">
  import {
    COMPARE_METRICS,
    cityHref,
    metricTone,
    metricValue,
    type CompareRow
  } from '$lib/compare/metrics';

  let { rows, compareNames }: { rows: CompareRow[]; compareNames: string[] } = $props();
</script>

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
      {#each COMPARE_METRICS as metric (metric.key)}
        <tr>
          <th class="sticky left-0 z-10 min-w-46 bg-canvas text-left font-semibold text-muted">
            {metric.label}
          </th>
          {#each rows as row, index (row.city.name)}
            {@const tone = metricTone(rows, row, metric.key, metric.direction)}
            <td
              data-tone={tone}
              title={tone === 'best'
                ? 'Best in comparison'
                : tone === 'worst'
                  ? 'Worst in comparison'
                  : undefined}
              class="relative text-right tabular-nums {tone ? 'border-b-transparent' : ''} {tone ===
              'best'
                ? 'text-green'
                : tone === 'worst'
                  ? 'text-red'
                  : ''}"
            >
              {metricValue(row, metric.key)}
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
