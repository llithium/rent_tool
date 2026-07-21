<script lang="ts">
  import type { City } from '$lib/types';
  import { money, parseCity } from '$lib/format';
  import { buildSearchLinks } from '$lib/searchLinks';

  let { city, maxRent }: { city: City; maxRent: number } = $props();

  let links = $derived.by(() => {
    const parts = parseCity(city.name);
    return parts ? buildSearchLinks(parts, maxRent) : [];
  });
</script>

<section class="card">
  <h2>Find apartments under {money(maxRent)}</h2>
  <div class="links">
    {#each links as link (link.label)}
      <a class="lk" href={link.url} target="_blank" rel="noopener">{link.label}</a>
    {/each}
  </div>
  <p class="note">
    Pre-filtered to your max rent where the site supports it. Figures are estimates — verify before
    signing anything.
  </p>
</section>

<style>
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 22px;
    box-shadow: var(--shadow);
  }
  h2 {
    font-size: 1.15rem;
    font-weight: 600;
    margin-bottom: 14px;
  }
  .links {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .lk {
    display: inline-block;
    padding: 11px 17px;
    border-radius: 11px;
    border: 1px solid var(--border2);
    background: var(--card2);
    color: var(--ink);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.92rem;
    transition: border-color 0.12s ease, color 0.12s ease, background 0.12s ease,
      transform 0.12s ease, box-shadow 0.12s ease;
  }
  .lk:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-soft);
    transform: translateY(-1px);
    box-shadow: var(--shadow);
  }
  .lk:active {
    transform: translateY(0);
  }
  .note {
    font-size: 0.8rem;
    color: var(--muted);
    margin-top: 12px;
    line-height: 1.5;
    max-width: 66ch;
  }
</style>
