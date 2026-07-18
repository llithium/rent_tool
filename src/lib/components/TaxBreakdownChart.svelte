<script lang="ts">
  import type { Budget, City } from '$lib/types';
  import { money } from '$lib/format';

  let { city, budget }: { city: City; budget: Budget } = $props();

  function pct(part: number, whole: number): number {
    return whole > 0 ? (part / whole) * 100 : 0;
  }

  // Row 1: gross monthly = state tax + take-home
  let taxAmt = $derived(budget.grossMonthly - budget.takeHomeMonthly);
  let taxPct = $derived(pct(taxAmt, budget.grossMonthly));
  let takePct = $derived(pct(budget.takeHomeMonthly, budget.grossMonthly));
  // Row 2: take-home = rent (median 1BR) + remaining
  let rent = $derived(city.r1 ?? 0);
  let remaining = $derived(Math.max(0, budget.takeHomeMonthly - rent));
  let rentShare = $derived(
    budget.takeHomeMonthly > 0 ? (rent / budget.takeHomeMonthly) * 100 : 0
  );
  let rentPct = $derived(Math.min(100, pct(rent, budget.takeHomeMonthly)));
  let leftPct = $derived(pct(remaining, budget.takeHomeMonthly));
</script>

<section class="panel">
  <h3>Where the money goes</h3>

  <div class="row">
    <div class="rlabel">
      Gross monthly {money(budget.grossMonthly)}{taxAmt > 0 ? ` · tax ${money(taxAmt)}/mo` : ''}
    </div>
    <div class="bar">
      {#if taxAmt > 0}
        <div class="seg tax" style="width:{taxPct}%">
          {#if taxPct >= 14}<span>Tax {money(taxAmt)}</span>{/if}
        </div>
      {/if}
      <div class="seg take" style="width:{takePct}%">
        <span>Take-home {money(budget.takeHomeMonthly)}</span>
      </div>
    </div>
  </div>

  {#if city.r1 != null}
    <div class="row">
      <div class="rlabel">Take-home split</div>
      <div class="bar">
        <div class="seg rent {rentShare > 100 ? 'over' : ''}" style="width:{rentPct}%">
          {#if rentPct >= 16}<span>Rent {money(rent)}</span>{/if}
        </div>
        {#if remaining > 0}
          <div class="seg left" style="width:{leftPct}%">
            {#if leftPct >= 16}<span>Left {money(remaining)}</span>{/if}
          </div>
        {/if}
      </div>
    </div>
    <p class="foot">
      Median 1BR rent is <strong>{rentShare.toFixed(0)}%</strong> of your estimated take-home pay.
    </p>
  {/if}

  {#if budget.estTaxRate === 0}
    <p class="foot muted">No state income tax on wages here — take-home equals gross.</p>
  {/if}
</section>

<style>
  .panel {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px 18px;
    box-shadow: var(--shadow);
  }
  h3 {
    font-size: 0.9rem;
    margin-bottom: 12px;
  }
  .row {
    margin-bottom: 12px;
  }
  .rlabel {
    font-size: 0.72rem;
    color: var(--muted);
    margin-bottom: 4px;
  }
  .bar {
    display: flex;
    width: 100%;
    height: 30px;
    border-radius: 7px;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .seg {
    display: flex;
    align-items: center;
    padding: 0 8px;
    font-size: 0.7rem;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    min-width: 0;
  }
  .seg span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .seg.tax {
    background: var(--red);
  }
  .seg.take {
    background: var(--green);
  }
  .seg.rent {
    background: var(--accent);
  }
  .seg.rent.over {
    background: var(--red);
  }
  .seg.left {
    background: color-mix(in srgb, var(--green) 55%, var(--card));
    color: var(--ink);
  }
  .foot {
    font-size: 0.8rem;
    color: var(--ink);
    margin-top: 4px;
  }
  .foot.muted {
    color: var(--muted);
  }
  strong {
    font-weight: 700;
  }
</style>
