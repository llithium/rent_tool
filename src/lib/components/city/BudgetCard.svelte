<script lang="ts">
  import type { Budget } from '$lib/types';
  import { money } from '$lib/format';

  let { budget }: { budget: Budget } = $props();
</script>

<!-- Lives inside the planning surface, below one dividing line — not its own card. -->
<section class="mt-5 animate-rise border-t border-line pt-4.5">
  <h2 class="text-sm font-medium text-muted">Rent budget</h2>
  <div class="text-5xl leading-none font-semibold tracking-tight text-accent tabular-nums">
    {money(budget.maxRent)}<span class="text-lg font-medium text-muted">/mo</span>
  </div>
  <p class="mt-1 text-sm text-muted">30% of gross income</p>

  <dl class="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
    <div>
      <dt class="text-xs text-muted">Conservative · 25%</dt>
      <dd class="mt-0.5 text-xl font-semibold tracking-tight tabular-nums">
        {money(budget.comfyRent)}
      </dd>
    </div>
    <div>
      <dt class="text-xs text-muted">Take-home · ~{(budget.effRate * 100).toFixed(0)}% tax</dt>
      <dd class="mt-0.5 text-xl font-semibold tracking-tight tabular-nums">
        {money(budget.takeHomeMonthly)}
      </dd>
    </div>
  </dl>
</section>
