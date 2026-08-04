<script lang="ts">
  import { ACS_DATA_META, RENT_DATA_META } from '$lib/data/cities';

  let { class: className = '' }: { class?: string } = $props();
</script>

<footer class="max-w-[74ch] text-xs/relaxed text-muted {className}">
  Rent estimates:
  <a
    href={RENT_DATA_META.dataUrl}
    target="_blank"
    rel="noopener"
    class="text-accent underline hover:text-accent-deep">Apartment List Rent Estimates</a
  >
  ({RENT_DATA_META.label}), © Apartment List, Inc.. Off-list cities use bundled HUD Fair Market
  Rents. Tax figures are 2026 estimates for a single filer taking the standard deduction. City
  facts:
  <a
    href={ACS_DATA_META.dataUrl}
    target="_blank"
    rel="noopener"
    class="text-accent underline hover:text-accent-deep">U.S. Census Bureau {ACS_DATA_META.label}</a
  >. Other city locations &amp; populations:
  <a
    href="https://simplemaps.com/data/us-cities"
    target="_blank"
    rel="noopener"
    class="text-accent underline hover:text-accent-deep">SimpleMaps US Cities</a
  > (CC BY 4.0). All numbers are estimates.
</footer>
