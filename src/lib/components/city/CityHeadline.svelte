<script lang="ts">
  import type { City, RentSource } from '$lib/types';

  // Which dataset the headline rent came from — shown beside the city headline,
  // which owns the page-title role that CityFacts' card header used to.
  const SOURCE_LABEL: Record<RentSource, string> = {
    'apartment-list': 'Apartment List estimate',
    'hud-fmr': 'HUD Fair Market Rent',
    none: 'No rent data'
  };

  let { city, class: className = '' }: { city: City; class?: string } = $props();
</script>

<header class="flex flex-wrap items-baseline justify-between gap-3.5 {className}">
  <h1 class="text-2xl/tight font-semibold tracking-tight md:text-3xl">{city.name}</h1>
  <span class="text-xs font-medium text-muted">{SOURCE_LABEL[city.source]}</span>
</header>
