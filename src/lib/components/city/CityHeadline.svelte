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

<header class={className}>
  <div class="flex flex-wrap items-end justify-between gap-4">
    <h1
      class="bg-linear-to-r from-black to-[#666666] bg-clip-text text-5xl font-semibold tracking-tight text-transparent md:text-6xl dark:from-white dark:to-[#9B9B9B]"
    >
      {city.name}
    </h1>
    <span class="pb-2 text-sm font-medium text-muted">{SOURCE_LABEL[city.source]}</span>
  </div>
</header>
