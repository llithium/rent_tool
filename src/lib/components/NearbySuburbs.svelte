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
    const { lat, lng, city: cityName, state } = city;
    if (lat == null || lng == null) {
      places = [];
      loading = false;
      return;
    }
    const controller = new AbortController();
    loading = true;
    // Keep the current chips on screen until the replacement arrives — clearing
    // them here would collapse the card to the loading line and back on every
    // click, which reads as a flash. The swap below is atomic.
    fetchNearby(lat, lng, cityName, state, controller.signal).then((res) => {
      if (controller.signal.aborted) return;
      places = res;
      loading = false;
    });
    return () => controller.abort();
  });
</script>

{#if (city.lat != null && city.lng != null) && (loading || places.length)}
  <section>
    <div class="rt-secthead">
      <h2>Nearby suburbs &amp; towns</h2>
      <span class="rt-meta">SimpleMaps</span>
    </div>
    <p class="note">
      Within ~25 miles of {city.city}, largest population first. Click a place to load its rent.
    </p>

    {#if !places.length}
      <p class="hint">Finding nearby places…</p>
    {:else}
      <div class="chips">
        {#each places as p (p.label)}
          <button
            class="chip"
            class:loading={app.pendingName === p.label}
            disabled={app.pendingName === p.label}
            onclick={() => app.resolveSuggestion(p)}
          >
            <span class="name">{p.city}, {p.state}</span>
            {#if app.pendingName === p.label}
              <span class="spinner" aria-hidden="true"></span>
            {:else}
              {#if p.pop != null}
                <span class="meta tabnum">{fmtPop(p.pop)} pop</span>
              {/if}
              <span class="meta tabnum">{p.miles} mi</span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </section>
{/if}

<style>
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
    transition: border-color 0.12s ease, color 0.12s ease, background 0.12s ease,
      transform 0.12s ease, box-shadow 0.12s ease;
  }
  .chip:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-soft);
    transform: translateY(-1px);
    box-shadow: var(--shadow);
  }
  .chip:active {
    transform: translateY(0);
  }
  .meta {
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--muted);
  }
  .chip:hover .meta {
    color: var(--accent);
  }
  .chip.loading {
    border-color: var(--accent);
    color: var(--accent);
    cursor: default;
  }
  .spinner {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid color-mix(in srgb, var(--accent) 30%, transparent);
    border-top-color: var(--accent);
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
