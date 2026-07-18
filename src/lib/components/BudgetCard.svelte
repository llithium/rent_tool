<script lang="ts">
  import type { Budget } from '$lib/types';
  import { money } from '$lib/format';

  let { budget, cityLabel }: { budget: Budget; cityLabel: string } = $props();
</script>

<section class="panel">
  <h2>Your rent budget{cityLabel ? ` in ${cityLabel}` : ''}</h2>
  <div class="stats">
    <div class="stat accent">
      <div class="v">{money(budget.maxRent)}</div>
      <div class="l">Max monthly rent · 30% rule</div>
    </div>
    <div class="stat">
      <div class="v">{money(budget.comfyRent)}</div>
      <div class="l">Conservative target · 25%</div>
    </div>
    <div class="stat">
      <div class="v">{money(budget.grossMonthly)}</div>
      <div class="l">Gross monthly income</div>
    </div>
    <div class="stat">
      <div class="v">{money(budget.takeHomeMonthly)}</div>
      <div class="l">Est. take-home · after ~{(budget.effRate * 100).toFixed(0)}% tax (fed + FICA + state)</div>
    </div>
  </div>
  <p class="note">Take-home assumes a single filer taking the standard deduction — an estimate, not tax advice.</p>
</section>

<style>
  .panel {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 18px;
    box-shadow: var(--shadow);
  }
  h2 {
    font-size: 1rem;
    margin-bottom: 12px;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
  }
  .stat {
    background: var(--card-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 12px 14px;
  }
  .stat.accent {
    background: var(--accent-soft);
    border-color: transparent;
  }
  .v {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .l {
    font-size: 0.73rem;
    color: var(--muted);
    margin-top: 3px;
  }
  .note {
    font-size: 0.72rem;
    color: var(--muted);
    margin-top: 10px;
    line-height: 1.4;
  }
</style>
