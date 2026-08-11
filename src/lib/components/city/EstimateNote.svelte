<script lang="ts">
  import type { City } from '$lib/types';
  import { rentMetricLabel } from '$lib/format';

  let { city }: { city: City } = $props();
  let rentLabel = $derived(rentMetricLabel(city.rentMetric, '1BR').toLowerCase());
</script>

<!-- Props: rentLabel (text) <- {rentLabel} -->
<aside class="sr-only">
  <strong class="font-semibold text-ink">Planning estimate.</strong>
  Your budget uses 30% of gross pay and estimated 2026 taxes for a single filer taking the
  standard deduction. The {rentLabel} is market context, not a lease quote.{' '}
  <a class="font-semibold text-accent underline underline-offset-2 hover:text-accent-deep" href="#sources"
    >See methods and sources</a
  >.
</aside>

<style>

</style>
