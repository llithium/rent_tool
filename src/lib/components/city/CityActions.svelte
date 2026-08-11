<script lang="ts">
  import { app } from '$lib/appState.svelte';
  import { saveCompareSalary } from '$lib/compare/salaries.svelte';

  let { cityName, canShare }: { cityName: string; canShare: boolean } = $props();

  let comparing = $derived(app.isComparing(cityName));
  let compareFull = $derived(!comparing && app.compareNames.length >= 5);

  let shareLabel = $state('Copy link');
  let shareTimer: ReturnType<typeof setTimeout> | undefined;

  function onCompare() {
    const adding = !app.isComparing(cityName);
    app.toggleCompare(cityName);
    if (adding && app.isComparing(cityName)) saveCompareSalary(cityName, app.salary);
  }

  async function onShare() {
    // The URL sync keeps location.href in step with the current state, so the
    // live deep link is exactly the shareable URL for the current view.
    if (!navigator.clipboard?.writeText) {
      shareLabel = 'Copy unavailable';
      clearTimeout(shareTimer);
      shareTimer = setTimeout(() => (shareLabel = 'Copy link'), 2600);
      return;
    }
    try {
      await navigator.clipboard.writeText(location.href);
      shareLabel = '✓ Copied';
    } catch {
      shareLabel = 'Copy unavailable';
    }
    clearTimeout(shareTimer);
    shareTimer = setTimeout(() => (shareLabel = 'Copy link'), 2600);
  }
</script>

<!-- Secondary actions live after the answer so they cannot compete with the plan. -->
<div class="mt-5 flex items-center gap-4 border-t border-line pt-3">
  <button
    type="button"
    disabled={compareFull}
    title={compareFull ? 'Remove a city before adding another' : undefined}
    onclick={onCompare}
    class="cursor-pointer rounded-md p-1 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-55 {comparing
      ? 'text-ink'
      : 'text-accent hover:text-accent-deep'}"
  >
    {comparing ? '✓ In compare' : '+ Compare'}
  </button>
  <button
    type="button"
    title="Copy a shareable link"
    disabled={!canShare}
    onclick={onShare}
    class="cursor-pointer rounded-md p-1 text-sm font-medium text-muted transition-colors duration-200 not-disabled:hover:text-accent disabled:cursor-not-allowed disabled:opacity-55"
  >
    {shareLabel}
  </button>
</div>
