<script lang="ts">
  import type { City } from '$lib/types';
  import { parseCity } from '$lib/format';
  import { buildSearchLinks } from '$lib/searchLinks';

  let { city, maxRent }: { city: City; maxRent: number } = $props();

  let links = $derived.by(() => {
    const parts = parseCity(city.name);
    return parts ? buildSearchLinks(parts, maxRent) : [];
  });
</script>

<section class="panel">
  <h2>Find apartments under your budget</h2>
  <div class="links">
    {#each links as link (link.label)}
      <a href={link.url} target="_blank" rel="noopener">{link.label}</a>
    {/each}
  </div>
  <p class="note">
    Links are pre-filtered where the listing site supports your max rent. Figures are estimates; verify
    before signing anything.
  </p>
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
  .links {
    display: flex;
    gap: 9px;
    flex-wrap: wrap;
  }
  a {
    display: inline-block;
    padding: 10px 15px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--ink);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
  }
  a:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  .note {
    font-size: 0.76rem;
    color: var(--muted);
    margin-top: 10px;
    line-height: 1.45;
  }
</style>
