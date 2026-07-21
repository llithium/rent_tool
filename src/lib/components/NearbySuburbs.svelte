<script lang="ts">
  import type { City, NearbyPlace } from '$lib/types';
  import { fetchNearby } from '$lib/api';
  import { app } from '$lib/appState.svelte';

  let { city }: { city: City } = $props();

  /** Compact population label: 1.2M / 15k / 850. */
  function fmtPop(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
    return String(n);
  }

  let places = $state<NearbyPlace[]>([]);
  let loading = $state(false);

  // Refetch whenever the selected city (or its coords) changes; abort stale requests.
  $effect(() => {
    const { lat, lng, state } = city;
    if (lat == null || lng == null) {
      places = [];
      loading = false;
      return;
    }
    const controller = new AbortController();
    loading = true;
    places = [];
    fetchNearby(lat, lng, state, controller.signal).then((res) => {
      if (controller.signal.aborted) return;
      places = res;
      loading = false;
    });
    return () => controller.abort();
  });
</script>

{#if (city.lat != null && city.lng != null) && (loading || places.length)}
  <section class="card">
    <div class="head">
      <h2>Nearby suburbs &amp; towns</h2>
      <span class="src">OpenStreetMap</span>
    </div>
    <p class="note">
      Within ~25 miles of {city.city}, largest population first. Click a place to load its rent.
    </p>

    {#if loading}
      <p class="hint">Finding nearby places…</p>
    {:else}
      <div class="chips">
        {#each places as p (p.label)}
          <button class="chip" onclick={() => app.resolveSuggestion(p)}>
            <span class="name">{p.city}, {p.state}</span>
            {#if p.pop != null}
              <span class="meta tabnum">pop {fmtPop(p.pop)}</span>
            {/if}
            <span class="meta tabnum">{p.miles} mi</span>
          </button>
        {/each}
      </div>
    {/if}
  </section>
{/if}

<style>
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 22px;
    box-shadow: var(--shadow);
  }
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }
  h2 {
    font-size: 1.15rem;
    font-weight: 600;
  }
  .src {
    font-size: 0.66rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    background: var(--card2);
    border: 1px solid var(--border);
    padding: 4px 9px;
    border-radius: 99px;
  }
  .note {
    font-size: 0.85rem;
    color: var(--muted);
    line-height: 1.5;
    margin-bottom: 14px;
    max-width: 66ch;
  }
  .hint {
    font-size: 0.85rem;
    color: var(--muted);
    background: var(--card2);
    border-radius: var(--radius-sm);
    padding: 9px 11px;
  }
  .chips {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .chip {
    display: inline-flex;
    align-items: baseline;
    gap: 9px;
    padding: 10px 15px;
    border-radius: 11px;
    border: 1px solid var(--border2);
    background: var(--card2);
    color: var(--ink);
    cursor: pointer;
    font-weight: 600;
    font-size: 0.92rem;
    transition: all 0.12s;
  }
  .chip:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-soft);
  }
  .meta {
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--muted);
  }
  .chip:hover .meta {
    color: var(--accent);
  }
</style>
