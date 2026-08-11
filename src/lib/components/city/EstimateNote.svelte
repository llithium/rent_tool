<script lang="ts">
  import type { City } from '$lib/types';
  import { rentMetricLabel, sentenceLabel } from '$lib/format';

  let { city, class: className = '' }: { city: City; class?: string } = $props();
  let rentLabel = $derived(sentenceLabel(rentMetricLabel(city.rentMetric, '1BR')));
</script>

<aside class="text-xs/relaxed text-muted {className}">
  <strong class="font-semibold text-ink">Planning estimate.</strong>
  Your target uses 30% of gross pay and estimated 2026 taxes for a single filer taking the standard deduction.
  The {rentLabel} is market context, not a lease quote.
  <a
    class="font-semibold whitespace-nowrap text-accent underline underline-offset-2 hover:text-accent-deep"
    href="#sources">See methods and sources</a
  >.
</aside>
