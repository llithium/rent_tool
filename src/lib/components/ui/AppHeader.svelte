<script lang="ts">
  import Brand from './Brand.svelte';
  import ThemeToggle from './ThemeToggle.svelte';

  let {
    brandHref = null,
    actionHref,
    actionLabel,
    class: className = ''
  }: {
    brandHref?: string | null;
    actionHref: string;
    actionLabel: string;
    class?: string;
  } = $props();
</script>

<header
  class="flex items-center justify-between gap-4 border-y border-line-strong py-3 {className}"
>
  <Brand href={brandHref} />
  <nav aria-label="Primary" class="flex items-center gap-1">
    <a
      href={actionHref}
      class="px-4 py-2 text-label tracking-[0.08em] text-ink uppercase no-underline transition-colors duration-200 hover:bg-ink hover:text-canvas active:scale-98"
    >
      {actionLabel}
    </a>
    <ThemeToggle />
  </nav>
</header>
