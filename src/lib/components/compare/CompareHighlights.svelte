<script lang="ts">
  import { money } from '$lib/format';
  import { cityHref, type CompareRow } from '$lib/compare/metrics';

  type DecisionCriterion = 'afterRent' | 'rent' | 'takeHome';

  let { rows, compareNames }: { rows: CompareRow[]; compareNames: string[] } = $props();
  let criterion = $state<DecisionCriterion>('afterRent');

  let decision = $derived.by(() => {
    const eligible = rows.filter(
      (row) =>
        (criterion === 'afterRent' && row.afterRent != null) ||
        (criterion === 'rent' && row.city.r1 != null) ||
        criterion === 'takeHome'
    );
    if (!eligible.length) return null;
    return eligible.reduce((best, row) => {
      if (criterion === 'rent')
        return (row.city.r1 ?? Infinity) < (best.city.r1 ?? Infinity) ? row : best;
      if (criterion === 'takeHome')
        return row.budget.takeHomeMonthly > best.budget.takeHomeMonthly ? row : best;
      return (row.afterRent ?? -Infinity) > (best.afterRent ?? -Infinity) ? row : best;
    });
  });

  let title = $derived(
    criterion === 'afterRent'
      ? 'Most room after 1BR rent'
      : criterion === 'rent'
        ? 'Lowest typical 1BR rent'
        : 'Highest estimated take-home'
  );
  let detail = $derived(
    decision
      ? criterion === 'afterRent'
        ? `${money(decision.afterRent)} left after a typical 1BR each month.`
        : criterion === 'rent'
          ? `${money(decision.city.r1)}/mo for a typical 1BR.`
          : `${money(decision.budget.takeHomeMonthly)}/mo after estimated taxes.`
      : 'Add cities with rent estimates to identify a leading option.'
  );
</script>

<section class="mt-8 pt-6" aria-labelledby="decision-heading">
  <div class="flex flex-col justify-between gap-5 md:flex-row md:items-end">
    <div class="max-w-xl">
      <h2 id="decision-heading" class="text-lg font-semibold tracking-tight">Decision brief</h2>
      <p class="mt-1 text-sm text-muted">
        Choose what matters most for this move. The result uses the salaries shown in each scenario.
      </p>
    </div>
    <div class="flex flex-wrap gap-2" aria-label="Decision criterion">
      <button
        type="button"
        aria-pressed={criterion === 'afterRent'}
        onclick={() => (criterion = 'afterRent')}
        class="cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold transition-colors {criterion ===
        'afterRent'
          ? 'border-accent bg-accent text-accent-ink'
          : 'border-line-strong bg-card text-ink hover:border-accent hover:text-accent'}"
      >
        Most left after rent
      </button>
      <button
        type="button"
        aria-pressed={criterion === 'rent'}
        onclick={() => (criterion = 'rent')}
        class="cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold transition-colors {criterion ===
        'rent'
          ? 'border-accent bg-accent text-accent-ink'
          : 'border-line-strong bg-card text-ink hover:border-accent hover:text-accent'}"
      >
        Lowest 1BR rent
      </button>
      <button
        type="button"
        aria-pressed={criterion === 'takeHome'}
        onclick={() => (criterion = 'takeHome')}
        class="cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold transition-colors {criterion ===
        'takeHome'
          ? 'border-accent bg-accent text-accent-ink'
          : 'border-line-strong bg-card text-ink hover:border-accent hover:text-accent'}"
      >
        Highest take-home
      </button>
    </div>
  </div>

  {#key `${criterion}-${decision?.city.name ?? 'none'}-${detail}`}
    <div
      class="motion-copy mt-6 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
    >
      <div>
        <span class="block text-xs font-semibold tracking-wide text-muted uppercase">{title}</span>
        {#if decision}
          <a
            href={cityHref(decision, compareNames)}
            class="mt-1 inline-block text-2xl font-semibold tracking-tight text-ink decoration-accent underline-offset-4 hover:text-accent"
          >
            {decision.city.name}
          </a>
        {:else}
          <strong class="mt-1 block text-2xl font-semibold tracking-tight text-ink"
            >Not enough data yet</strong
          >
        {/if}
      </div>
      <p class="max-w-sm text-sm text-muted tabular-nums sm:text-right">{detail}</p>
    </div>
  {/key}
</section>
