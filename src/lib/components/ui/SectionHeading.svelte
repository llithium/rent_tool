<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * The small uppercase label that opens each result section. The optional
   * `children` snippet fills the right-hand slot (a source credit, a legend, a
   * link) and is baseline-aligned with the title.
   */
  let {
    title,
    level = 'h2',
    class: className = '',
    children
  }: {
    title: string;
    level?: 'h2' | 'h3';
    class?: string;
    children?: Snippet;
  } = $props();
</script>

<div class="mb-6 flex flex-wrap items-baseline justify-between gap-4 {className}">
  {#if level === 'h2'}
    <h2 class="text-lg font-semibold tracking-tight text-ink">{title}</h2>
  {:else}
    <h3 class="text-base font-semibold tracking-tight text-ink">{title}</h3>
  {/if}
  {@render children?.()}
</div>
