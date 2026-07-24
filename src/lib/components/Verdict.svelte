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
  /* The lede under the city headline. Carries its signal through a colored rule
     and colored verdict word instead of a tinted box. */
  .verdict {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding-left: 16px;
    border-left: 3px solid var(--green);
  }
  .verdict.bad {
    border-left-color: var(--red);
  }
  .icon {
    font-size: 1.5rem;
    line-height: 1.2;
    flex: none;
    color: var(--green);
    animation: rt-pop 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
  }
  .verdict.bad .icon {
    color: var(--red);
  }
  .head {
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin-bottom: 3px;
    color: var(--green);
  }
  .verdict.bad .head {
    color: var(--red);
  }
  .body {
    font-size: 1.05rem;
    line-height: 1.55;
    color: var(--ink);
    max-width: 62ch;
    /* Reserve 3 lines so the block height stays constant between the short
       "Comfortable" copy and the longer "A stretch" copy — no layout shift. */
    min-height: calc(1.55em * 3);
  }
</style>
