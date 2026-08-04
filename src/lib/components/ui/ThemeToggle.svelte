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

<!-- Safe-area insets keep the button clear of a notch or rounded corner; there
     is no Tailwind default for env(), so those two offsets stay arbitrary. -->
<button
  type="button"
  onclick={toggleTheme}
  aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
  title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
  class="fixed top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-50 grid size-11 cursor-pointer place-items-center rounded-full border border-line-strong bg-card/90 text-ink shadow-card backdrop-blur-md transition duration-200 hover:-translate-y-px hover:bg-card hover:text-accent active:translate-y-0"
>
  {#if theme === 'light'}
    <svg
      class="size-5"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  {:else}
    <svg
      class="size-5"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"
      />
    </svg>
  {/if}
</button>
