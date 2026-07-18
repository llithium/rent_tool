<script lang="ts">
  import type { Budget, City } from '$lib/types';
  import { money } from '$lib/format';
  import { salaryForRent } from '$lib/budget';

  let { budget, city }: { budget: Budget; city: City } = $props();

  let cushion = $derived(city.r1 != null ? budget.maxRent - city.r1 : null);
  let good = $derived(cushion != null && cushion >= 0);
</script>

{#if city.r1 != null && cushion != null}
  <div class="verdict" class:bad={!good}>
    {#if good}
      <strong>✓ Comfortable.</strong> Your {money(budget.maxRent)} budget covers the median 1BR
      ({money(city.r1)}) with {money(cushion)}/mo to spare.{#if city.r2 != null && budget.maxRent >= city.r2}{' '}It
        even covers the median 2BR ({money(city.r2)}).{/if}
    {:else}
      <strong>⚠ Stretch.</strong> The median 1BR here ({money(city.r1)}) runs {money(-cushion)}/mo
      over your 30% budget. You'd need roughly {money(salaryForRent(city.r1))}/yr for the median —
      consider below-median units, roommates, or nearby suburbs.
    {/if}
  </div>
{/if}

<style>
  .verdict {
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    font-size: 0.93rem;
    background: color-mix(in srgb, var(--green) 12%, var(--card));
    border: 1px solid color-mix(in srgb, var(--green) 30%, transparent);
    line-height: 1.5;
  }
  .verdict.bad {
    background: color-mix(in srgb, var(--red) 12%, var(--card));
    border-color: color-mix(in srgb, var(--red) 30%, transparent);
  }
  strong {
    font-weight: 700;
  }
</style>
