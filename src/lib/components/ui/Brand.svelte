<script lang="ts">
  /** The wordmark. Renders as a link back to the city view when `href` is set. */
  let { href = null }: { href?: string | null } = $props();
</script>

{#if href}
  <a
    {href}
    class="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink no-underline transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-accent"
  >
    <img src="/favicon.svg" alt="" width="26" height="26" class="block rounded-md" />
    <span>Rent Tool</span>
  </a>
{:else}
  <div class="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink">
    <img src="/favicon.svg" alt="" width="26" height="26" class="block rounded-md" />
    <span>Rent Tool</span>
  </div>
{/if}
