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

<header class="flex items-center justify-between gap-4 {className}">
  <Brand href={brandHref} />
  <nav aria-label="Primary" class="flex items-center gap-2">
    <a
      href={actionHref}
      class="rounded-lg px-3 py-2 text-label text-accent no-underline transition-colors duration-200 hover:bg-accent-soft hover:text-accent-deep active:scale-98"
    >
      {actionLabel}
    </a>
    <ThemeToggle />
  </nav>
</header>
