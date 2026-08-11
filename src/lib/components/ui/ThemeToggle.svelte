<script lang="ts">
  import { onMount } from 'svelte';

  let theme = $state<'light' | 'dark'>('light');

  onMount(() => {
    theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  });

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('rent-tool-theme', theme);
    } catch {
      // The theme still works for this session when storage is unavailable.
    }
  }
</script>

<button
  type="button"
  onclick={toggleTheme}
  aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
  title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
  class="cursor-pointer rounded-lg border border-line-strong bg-card-2 px-3 py-2 text-meta text-muted transition-colors duration-200 hover:border-accent hover:text-accent active:scale-98"
>
  {theme === 'light' ? 'Dark' : 'Light'}
</button>
