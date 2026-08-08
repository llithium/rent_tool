<script lang="ts">
  import type { City } from '$lib/types';
  import { money, parseCity } from '$lib/format';
  import { buildSearchLinks } from '$lib/searchLinks';
  import SectionHeading from '$lib/components/ui/SectionHeading.svelte';

  let {
    city,
    maxRent,
    class: className = ''
  }: { city: City; maxRent: number; class?: string } = $props();

  let links = $derived.by(() => {
    const parts = parseCity(city.name);
    return parts ? buildSearchLinks(parts, maxRent) : [];
  });
</script>

<section class={className}>
  <SectionHeading title="Find apartments under {money(maxRent)}" />
  <div class="flex flex-wrap gap-3">
    {#each links as link (link.label)}
      <a
        href={link.url}
        target="_blank"
        rel="noopener"
        class="inline-block rounded-xl border border-line-strong bg-card-2 px-4 py-3 text-sm font-semibold text-ink no-underline transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-px hover:border-accent hover:bg-accent-soft hover:text-accent hover:shadow-card active:scale-98"
      >
        {link.label}
      </a>
    {/each}
  </div>
  <p class="mt-3 max-w-[66ch] text-xs/normal text-muted">
    Pre-filtered to your max rent where the site supports it. Figures are estimates — verify before
    signing anything.
  </p>
</section>
