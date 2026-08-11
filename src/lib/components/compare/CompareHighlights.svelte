<script lang="ts">
  import { money } from '$lib/format';
  import { cityHref, type CompareRow } from '$lib/compare/metrics';

  let { rows, compareNames }: { rows: CompareRow[]; compareNames: string[] } = $props();

  let bestRent = $derived(
    rows.reduce<CompareRow | null>(
      (best, row) =>
        row.city.r1 == null || (best?.city.r1 != null && best.city.r1 <= row.city.r1) ? best : row,
      null
    )
  );
  let bestTakeHome = $derived(
    rows.reduce<CompareRow | null>(
      (best, row) =>
        !best || row.budget.takeHomeMonthly > best.budget.takeHomeMonthly ? row : best,
      null
    )
  );
  let bestAfterRent = $derived(
    rows.reduce<CompareRow | null>(
      (best, row) =>
        row.afterRent == null || (best?.afterRent != null && best.afterRent >= row.afterRent)
          ? best
          : row,
      null
    )
  );

  let leaders = $derived([
    { label: 'Lowest 1BR rent', row: bestRent, figure: money(bestRent?.city.r1) },
    {
      label: 'Highest take-home',
      row: bestTakeHome,
      figure: money(bestTakeHome?.budget.takeHomeMonthly)
    },
    { label: 'Most left after rent', row: bestAfterRent, figure: money(bestAfterRent?.afterRent) }
  ]);
</script>

<section
  data-testid="highlights"
  class="mt-8 grid divide-y divide-line border-y border-line md:grid-cols-3 md:divide-x md:divide-y-0"
>
  {#each leaders as leader (leader.label)}
    <div class="min-w-0 py-4 md:px-5.5 md:first:pl-0 md:last:pr-0">
      <span class="block text-xs text-muted">{leader.label}</span>
      <strong class="my-1 block text-base">
        {#if leader.row}
          <a
            href={cityHref(leader.row, compareNames)}
            class="text-ink no-underline hover:text-inherit"
          >
            {leader.row.city.name}
          </a>
        {:else}
          —
        {/if}
      </strong>
      <small class="block text-xs text-muted tabular-nums">{leader.figure}/mo</small>
    </div>
  {/each}
</section>
