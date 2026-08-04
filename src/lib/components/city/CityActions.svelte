<script lang="ts">
  import { app } from '$lib/appState.svelte';

  let { cityName, canShare }: { cityName: string; canShare: boolean } = $props();

  let comparing = $derived(app.isComparing(cityName));
  let compareFull = $derived(!comparing && app.compareNames.length >= 5);

  let shareLabel = $state('Copy link');
  let shareTimer: ReturnType<typeof setTimeout> | undefined;

  function onShare() {
    // The URL sync keeps location.href in step with the current state, so the
    // live deep link is exactly the shareable URL for the current view.
    try {
      navigator.clipboard?.writeText(location.href);
    } catch {
      /* clipboard unavailable */
    }
    shareLabel = '✓ Copied';
    clearTimeout(shareTimer);
    shareTimer = setTimeout(() => (shareLabel = 'Copy link'), 1800);
  }
</script>

<div class="mt-4 flex gap-2">
  <button
    type="button"
    disabled={compareFull}
    title={compareFull ? 'Remove a city before adding another' : undefined}
    onclick={() => app.toggleCompare(cityName)}
    class="flex-1 cursor-pointer rounded-lg border border-accent px-3.5 py-2.5 text-sm font-semibold transition duration-150 not-disabled:active:scale-98 disabled:cursor-not-allowed disabled:opacity-55 {comparing
      ? 'bg-accent text-accent-ink'
      : 'bg-card-2 text-accent'}"
  >
    {comparing ? '✓ In compare' : '+ Compare'}
  </button>
  <button
    type="button"
    title="Copy a shareable link"
    disabled={!canShare}
    onclick={onShare}
    class="flex-none cursor-pointer rounded-lg border border-line-strong bg-card-2 px-3.5 py-2.5 text-sm font-semibold text-ink transition duration-150 not-disabled:active:scale-98 disabled:cursor-not-allowed disabled:opacity-55"
  >
    {shareLabel}
  </button>
</div>
