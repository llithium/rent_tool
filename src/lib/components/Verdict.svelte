<script lang="ts">
  import type { Budget, City } from '$lib/types';
  import { money, rentMetricLabel } from '$lib/format';
  import { salaryForRent } from '$lib/budget';

  let { budget, city }: { budget: Budget; city: City } = $props();

  let cushion = $derived(city.r1 != null ? budget.maxRent - city.r1 : null);
  let good = $derived(cushion != null && cushion >= 0);
  let rentLabel = $derived(rentMetricLabel(city.rentMetric, '1BR').toLowerCase());
  let rentLabel2 = $derived(rentMetricLabel(city.rentMetric, '2BR').toLowerCase());
</script>

{#if city.r1 != null && cushion != null}
  <section class="verdict" class:bad={!good}>
    <span class="icon" aria-hidden="true">{good ? '✓' : '⚠'}</span>
    <div>
      <div class="head">{good ? 'Comfortable' : 'A stretch'}</div>
      <div class="body">
        {#if good}
          Your {money(budget.maxRent)} budget covers the {rentLabel} ({money(city.r1)}) with
          {money(cushion)}/mo to spare{#if city.r2 != null && budget.maxRent >= city.r2}{' '}— it
            even covers the {rentLabel2} ({money(city.r2)}).{:else}.{/if}
        {:else}
          The {rentLabel} ({money(city.r1)}) runs {money(-cushion)}/mo over your 30% budget. You'd
          want roughly {money(salaryForRent(city.r1))}/yr for it — consider below-median units, a
          roommate, or nearby suburbs.
        {/if}
      </div>
    </div>
  </section>
{/if}

<style>
  .verdict {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 20px;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    background: var(--green-soft);
    border: 1px solid color-mix(in srgb, var(--green) 32%, transparent);
  }
  .verdict.bad {
    background: var(--red-soft);
    border-color: color-mix(in srgb, var(--red) 32%, transparent);
  }
  .icon {
    font-size: 1.9rem;
    line-height: 1;
    flex: none;
    color: var(--green);
  }
  .verdict.bad .icon {
    color: var(--red);
  }
  .head {
    font-size: 1.35rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin-bottom: 3px;
    color: var(--green);
  }
  .verdict.bad .head {
    color: var(--red);
  }
  .body {
    font-size: 1.02rem;
    line-height: 1.5;
    color: var(--ink);
  }
</style>
