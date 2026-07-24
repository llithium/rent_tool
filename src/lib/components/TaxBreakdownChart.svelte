<script lang="ts">
  import type { Budget, City } from '$lib/types';
  import { money } from '$lib/format';

  let { city, budget }: { city: City; budget: Budget } = $props();

  function pct(part: number, whole: number): number {
    return whole > 0 ? (part / whole) * 100 : 0;
  }

  // Row 1: gross monthly = federal + FICA + state tax + local tax + take-home
  let taxAmt = $derived(budget.federalMonthly + budget.ficaMonthly + budget.stateMonthly + budget.localMonthly);
  let fedPct = $derived(pct(budget.federalMonthly, budget.grossMonthly));
  let ficaPct = $derived(pct(budget.ficaMonthly, budget.grossMonthly));
  let statePct = $derived(pct(budget.stateMonthly, budget.grossMonthly));
  let localPct = $derived(pct(budget.localMonthly, budget.grossMonthly));
  let takePct = $derived(pct(budget.takeHomeMonthly, budget.grossMonthly));
  // Row 2: take-home = rent (median 1BR) + remaining
  let rent = $derived(city.r1 ?? 0);
  let remaining = $derived(Math.max(0, budget.takeHomeMonthly - rent));
  let rentShare = $derived(budget.takeHomeMonthly > 0 ? (rent / budget.takeHomeMonthly) * 100 : 0);
  let rentPct = $derived(Math.min(100, pct(rent, budget.takeHomeMonthly)));
  let leftPct = $derived(pct(remaining, budget.takeHomeMonthly));
</script>

<section>
  <div class="rt-secthead"><h2>Where the money goes</h2></div>

  <div class="rlabel">
    Gross monthly {money(budget.grossMonthly)}{taxAmt > 0 ? ` · tax ${money(taxAmt)}/mo` : ''}
  </div>
  <div class="bar rt-grow">
    {#if budget.federalMonthly > 0}
      <div class="seg federal" style="width:{fedPct}%">
        {#if fedPct >= 13}<span>Federal {money(budget.federalMonthly)}</span>{/if}
      </div>
    {/if}
    {#if budget.ficaMonthly > 0}
      <div class="seg fica" style="width:{ficaPct}%">
        {#if ficaPct >= 13}<span>FICA {money(budget.ficaMonthly)}</span>{/if}
      </div>
    {/if}
    {#if budget.stateMonthly > 0}
      <div class="seg state" style="width:{statePct}%">
        {#if statePct >= 13}<span>State {money(budget.stateMonthly)}</span>{/if}
      </div>
    {/if}
    {#if budget.localMonthly > 0}
      <div class="seg local" style="width:{localPct}%">
        {#if localPct >= 13}<span>Local {money(budget.localMonthly)}</span>{/if}
      </div>
    {/if}
    <div class="seg take" style="width:{takePct}%">
      <span>Take-home {money(budget.takeHomeMonthly)}</span>
    </div>
  </div>
  <div class="legend">
    <span><i class="sw federal"></i>Federal {money(budget.federalMonthly)}</span>
    <span><i class="sw fica"></i>FICA {money(budget.ficaMonthly)}</span>
    <span><i class="sw state"></i>State {money(budget.stateMonthly)}</span>
    {#if budget.localTaxModeled}<span><i class="sw local"></i>Local {money(budget.localMonthly)}</span>{/if}
  </div>

  {#if city.r1 != null}
    <div class="rlabel">Take-home split</div>
    <div class="bar rt-grow">
      <div class="seg rent {rentShare > 100 ? 'over' : ''}" style="width:{rentPct}%">
        {#if rentPct >= 30}<span>Rent {money(rent)}</span>{:else if rentPct >= 14}<span>{money(rent)}</span>{/if}
      </div>
      {#if remaining > 0}
        <div class="seg left" style="width:{leftPct}%">
          {#if leftPct >= 16}<span>Left {money(remaining)}</span>{/if}
        </div>
      {/if}
    </div>
    <div class="legend split">
      <span><i class="sw rent {rentShare > 100 ? 'over' : ''}"></i>Rent {money(rent)}</span>
      {#if remaining > 0}<span><i class="sw left"></i>Left {money(remaining)}</span>{/if}
    </div>
    <p class="foot">
      Median 1BR is <strong class={rentShare > 30 ? 'over' : 'ok'}>{rentShare.toFixed(0)}%</strong>
      of your take-home pay.
    </p>
  {/if}

  {#if budget.stateRate === 0}
    <p class="foot muted">No state income tax on wages here — but federal tax and FICA still apply.</p>
  {/if}
  {#if !budget.localTaxModeled}
    <p class="foot muted">Local wage taxes, if any, are not included for this city.</p>
  {/if}
</section>

<style>
  .rlabel {
    font-size: 0.72rem;
    color: var(--muted);
    margin-bottom: 5px;
  }
  .bar {
    display: flex;
    width: 100%;
    height: 32px;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 9px;
    transform-origin: left;
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
    transition: width 0.4s ease;
  }
  .seg span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .seg.federal {
    background: var(--red);
  }
  .seg.fica {
    background: var(--amber);
  }
  .seg.state {
    background: color-mix(in srgb, var(--red) 55%, var(--amber));
  }
  .seg.local {
    background: color-mix(in srgb, var(--accent) 70%, var(--red));
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
    background: color-mix(in srgb, var(--green) 45%, var(--card));
    color: var(--ink);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 5px 14px;
    margin-bottom: 16px;
    font-size: 0.72rem;
    color: var(--muted);
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .sw {
    width: 9px;
    height: 9px;
    border-radius: 2px;
    display: inline-block;
  }
  .sw.federal {
    background: var(--red);
  }
  .sw.fica {
    background: var(--amber);
  }
  .sw.state {
    background: color-mix(in srgb, var(--red) 55%, var(--amber));
  }
  .sw.local {
    background: color-mix(in srgb, var(--accent) 70%, var(--red));
  }
  .sw.rent {
    background: var(--accent);
  }
  .sw.rent.over {
    background: var(--red);
  }
  .sw.left {
    background: color-mix(in srgb, var(--green) 45%, var(--card));
    border: 1px solid var(--border);
  }
  .legend.split {
    margin-bottom: 4px;
  }
  .foot {
    font-size: 0.9rem;
    color: var(--ink);
    margin-top: 4px;
  }
  .foot.muted {
    font-size: 0.8rem;
    color: var(--muted);
  }
  strong {
    font-weight: 700;
  }
  strong.over {
    color: var(--red);
  }
  strong.ok {
    color: var(--green);
  }
</style>
