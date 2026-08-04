<script lang="ts">
  /** The wordmark. Renders as a link back to the city view when `href` is set. */
  let { href = null }: { href?: string | null } = $props();
</script>

{#if href}
  <a
    {href}
    class="flex items-center gap-2.5 text-xs font-semibold tracking-[0.15em] text-ink uppercase no-underline hover:text-accent"
  >
    <img src="/favicon.svg" alt="" width="26" height="26" class="block rounded-md" />
    <span>Rent Tool</span>
  </a>
{:else}
  <div
    class="flex items-center gap-2.5 text-xs font-semibold tracking-[0.15em] text-muted uppercase"
  >
    <img src="/favicon.svg" alt="" width="26" height="26" class="block rounded-md" />
    <span>Rent Tool</span>
  </div>
{/if}
