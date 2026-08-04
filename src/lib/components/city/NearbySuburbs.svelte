<script lang="ts">
  import type { City, NearbyPlace } from '$lib/types';
  import { fetchNearby } from '$lib/api';
  import { app } from '$lib/appState.svelte';
  import SectionHeading from '$lib/components/ui/SectionHeading.svelte';

  let { city, class: className = '' }: { city: City; class?: string } = $props();

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

{#if city.lat != null && city.lng != null && (loading || places.length)}
  <section class={className}>
    <SectionHeading title="Nearby suburbs &amp; towns">
      <span class="text-xs font-medium text-muted">SimpleMaps</span>
    </SectionHeading>
    <p class="mb-3.5 max-w-[66ch] text-sm/normal text-muted">
      Within ~25 miles of {city.city}, largest population first. Click a place to load its rent.
    </p>

    {#if !places.length}
      <p class="text-sm text-muted">Finding nearby places…</p>
    {:else}
      <div class="flex flex-wrap gap-2.5">
        {#each places as p (p.label)}
          {@const pending = app.pendingName === p.label}
          <button
            disabled={pending}
            onclick={() => app.resolveSuggestion(p)}
            class="group inline-flex items-baseline gap-2 rounded-xl border bg-card-2 px-4 py-2.5 text-sm font-semibold transition duration-150 hover:-translate-y-px hover:border-accent hover:bg-accent-soft hover:text-accent hover:shadow-card active:translate-y-0 {pending
              ? 'cursor-default border-accent text-accent'
              : 'cursor-pointer border-line-strong text-ink'}"
          >
            <span>{p.city}, {p.state}</span>
            {#if pending}
              <span
                aria-hidden="true"
                class="size-3 animate-spin rounded-full border-2 border-accent/30 border-t-accent"
              ></span>
            {:else}
              {#if p.pop != null}
                <span class="text-xs font-medium text-muted tabular-nums group-hover:text-accent">
                  {fmtPop(p.pop)} pop
                </span>
              {/if}
              <span class="text-xs font-medium text-muted tabular-nums group-hover:text-accent">
                {p.miles} mi
              </span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </section>
{/if}
