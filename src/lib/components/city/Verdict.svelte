<script lang="ts">
  import type { Budget, City } from '$lib/types';
  import { money, rentMetricLabel } from '$lib/format';
  import { salaryForRent } from '$lib/budget';

  let {
    budget,
    city,
    class: className = ''
  }: { budget: Budget; city: City; class?: string } = $props();

  let cushion = $derived(city.r1 != null ? budget.maxRent - city.r1 : null);
  let good = $derived(cushion != null && cushion >= 0);
  let rentLabel = $derived(rentMetricLabel(city.rentMetric, '1BR').toLowerCase());
  let rentLabel2 = $derived(rentMetricLabel(city.rentMetric, '2BR').toLowerCase());

  // Built as one string rather than an inline {#if}: the clause has to start with
  // a space and the "else" branch with none, which template whitespace can't
  // express reliably.
  let twoBrClause = $derived(
    city.r2 != null && budget.maxRent >= city.r2
      ? ` — it even covers the ${rentLabel2} (${money(city.r2)}).`
      : '.'
  );
</script>

{#if city.r1 != null && cushion != null}
  <!-- The lede under the city headline. Carries its signal through a colored rule
       and a colored verdict word instead of a tinted box. -->
  <section
    class="flex items-start gap-3.5 border-l-4 pl-4 {good
      ? 'border-green'
      : 'border-red'} {className}"
  >
    <!-- No delay and no fill-mode: the ✓/⚠ is the verdict signal, so it must be
         visible whether or not the animation ever runs. -->
    <span
      aria-hidden="true"
      class="shrink-0 animate-pop text-2xl/tight {good ? 'text-green' : 'text-red'}"
    >
      {good ? '✓' : '⚠'}
    </span>
    <div>
      <div class="mb-1 text-xl font-semibold tracking-tight {good ? 'text-green' : 'text-red'}">
        {good ? 'Comfortable' : 'A stretch'}
      </div>
      <!-- Three lines are reserved so the block height stays constant between the
           short "Comfortable" copy and the longer "A stretch" copy — no layout shift. -->
      <div class="min-h-[4.875em] max-w-[62ch] leading-relaxed text-ink">
        {#if good}
          Your {money(budget.maxRent)} budget covers the {rentLabel} ({money(city.r1)}) with
          {money(cushion)}/mo to spare{twoBrClause}
        {:else}
          The {rentLabel} ({money(city.r1)}) runs {money(-cushion)}/mo over your 30% budget. You'd
          want roughly {money(salaryForRent(city.r1))}/yr for it — consider below-median units, a
          roommate, or nearby suburbs.
        {/if}
      </div>
    </div>
  </section>
{/if}
