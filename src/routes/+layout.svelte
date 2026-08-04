<script lang="ts">
  import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
  import '../app.css';

  let { children } = $props();
</script>

<ThemeToggle />

{@render children()}
