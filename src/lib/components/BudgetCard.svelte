<script lang="ts">
  import type { Budget } from '$lib/types';
  import { money } from '$lib/format';

  let { budget }: { budget: Budget } = $props();
</script>

<section class="card">
  <div class="eyebrow">Your 30% budget</div>
  <div class="big num">
    {money(budget.maxRent)}<span class="per">/mo</span>
  </div>
  <div class="sub">Max monthly rent · 30% of gross</div>

  <div class="divider"></div>

  <div class="grid">
    <div>
      <div class="v num">{money(budget.comfyRent)}</div>
      <div class="l">Conservative · 25%</div>
    </div>
    <div>
      <div class="v num">{money(budget.takeHomeMonthly)}</div>
      <div class="l nowrap">Take-home /mo · ~{(budget.effRate * 100).toFixed(0)}% tax</div>
    </div>
  </div>
</section>

<style>
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 18px 20px;
  }
  .eyebrow {
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted);
    margin-bottom: 12px;
  }
  .big {
    font-size: 3.1rem;
    font-weight: 600;
    line-height: 0.95;
    color: var(--accent);
  }
  .per {
    font-size: 1.1rem;
    color: var(--muted);
    font-weight: 500;
  }
  .sub {
    font-size: 0.9rem;
    color: var(--muted);
    margin-top: 4px;
  }
  .divider {
    height: 1px;
    background: var(--border);
    margin: 15px 0;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 13px 12px;
  }
  .v {
    font-size: 1.3rem;
    font-weight: 600;
  }
  .l {
    font-size: 0.72rem;
    color: var(--muted);
  }
  .l.nowrap {
    font-size: 0.7rem;
    white-space: nowrap;
  }
</style>
