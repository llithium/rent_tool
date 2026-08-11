<script lang="ts">
  import type { Stat } from '$lib/types';

  /**
   * Stat rows carried by type and whitespace — no cell fills, no grid rules.
   * `lead` is the headline rent row; `default` is the denser ACS snapshot.
   * The column template is the caller's, so it can't collide with one set here.
   */
  let {
    stats,
    size = 'default',
    class: className = ''
  }: { stats: Stat[]; size?: 'lead' | 'default'; class?: string } = $props();
</script>

<div class="grid gap-x-6 gap-y-5 {className}">
  {#each stats as stat (stat.label)}
    <div data-testid="fact">
      <div
        class="tracking-tight tabular-nums {size === 'lead'
          ? 'text-data text-2xl'
          : 'text-data'} {stat.tone === 'up'
          ? 'text-red'
          : stat.tone === 'down'
            ? 'text-green'
            : ''}"
      >
        {stat.value}
      </div>
      <div class="mt-1 text-meta text-muted">{stat.label}</div>
    </div>
  {/each}
</div>
