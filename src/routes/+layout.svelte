<script lang="ts">
  import '../app.css';

  let { children } = $props();
</script>

<a
  href="#main-content"
  class="fixed top-4 left-4 z-50 -translate-y-24 rounded-lg bg-ink px-3 py-2 text-label text-canvas transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] focus:translate-y-0"
>
  Skip to content
</a>

{@render children()}
