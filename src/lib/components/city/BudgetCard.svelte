<script lang="ts">
  import type { Budget } from '$lib/types';
  import { money } from '$lib/format';

  let { budget }: { budget: Budget } = $props();
</script>

<!-- Lives inside the sidebar panel, below a hairline — not its own card. -->
<section class="mt-5 animate-rise border-t border-line pt-4.5">
  <div class="mb-3 text-sm font-medium text-muted">Your 30% budget</div>
  <div class="text-5xl leading-none font-semibold tracking-tight text-accent tabular-nums">
    {money(budget.maxRent)}<span class="text-lg font-medium text-muted">/mo</span>
  </div>
  <div class="mt-1 text-sm text-muted">Max monthly rent · 30% of gross</div>

  <div class="my-4 h-px bg-line"></div>

  <div class="grid grid-cols-2 gap-3">
    <div>
      <div class="text-xl font-semibold tracking-tight tabular-nums">
        {money(budget.comfyRent)}
      </div>
      <div class="text-xs text-muted">Conservative · 25%</div>
    </div>
    <div>
      <div class="text-xl font-semibold tracking-tight tabular-nums">
        {money(budget.takeHomeMonthly)}
      </div>
      <div class="text-xs whitespace-nowrap text-muted">
        Take-home /mo · ~{(budget.effRate * 100).toFixed(0)}% tax
      </div>
    </div>
  </div>
</section>
