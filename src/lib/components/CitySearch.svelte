<script lang="ts">
  import { fetchSuggestions } from '$lib/api';
  import type { CitySuggestion } from '$lib/types';
  import { SEED_CITIES } from '$lib/data/cities';

  let {
    onselect
  }: { onselect: (sug: CitySuggestion) => void } = $props();

  let query = $state('');
  let suggestions = $state<CitySuggestion[]>([]);
  let open = $state(false);
  let loading = $state(false);
  let activeIndex = $state(-1);

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;

  /** Local fallback: match against bundled seed cities when the API is unreachable. */
  function seedMatches(q: string): CitySuggestion[] {
    const t = q.toLowerCase();
    return SEED_CITIES.filter((c) => c.name.toLowerCase().includes(t))
      .slice(0, 8)
      .map((c) => ({
        label: c.name,
        city: c.city,
        state: c.state,
        lat: c.lat ?? 0,
        lng: c.lng ?? 0
      }));
  }

  async function runSearch(q: string) {
    controller?.abort();
    controller = new AbortController();
    loading = true;
    try {
      const remote = await fetchSuggestions(q, controller.signal);
      suggestions = remote.length ? remote : seedMatches(q);
    } catch {
      suggestions = seedMatches(q);
    } finally {
      loading = false;
      activeIndex = suggestions.length ? 0 : -1;
    }
  }

  function onInput(e: Event) {
    query = (e.target as HTMLInputElement).value;
    open = true;
    clearTimeout(debounceTimer);
    if (query.trim().length < 2) {
      suggestions = [];
      loading = false;
      return;
    }
    // Instant local hints, then debounced API refinement.
    suggestions = seedMatches(query);
    debounceTimer = setTimeout(() => runSearch(query.trim()), 220);
  }

  function choose(sug: CitySuggestion) {
    query = sug.label;
    open = false;
    suggestions = [];
    onselect(sug);
  }

  function onKeydown(e: KeyboardEvent) {
    if (!open || !suggestions.length) {
      if (e.key === 'ArrowDown' && query.trim().length >= 2) {
        open = true;
        runSearch(query.trim());
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % suggestions.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        choose(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      open = false;
    }
  }

  function highlight(label: string): string {
    const q = query.trim();
    if (!q) return label;
    const i = label.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return label;
    return (
      label.slice(0, i) +
      '<mark>' +
      label.slice(i, i + q.length) +
      '</mark>' +
      label.slice(i + q.length)
    );
  }
</script>

<div class="combo">
  <label for="city-input">City</label>
  <div class="control">
    <input
      id="city-input"
      type="text"
      role="combobox"
      aria-expanded={open}
      aria-controls="city-listbox"
      aria-autocomplete="list"
      autocomplete="off"
      placeholder="Start typing a city…"
      value={query}
      oninput={onInput}
      onkeydown={onKeydown}
      onfocus={() => (open = suggestions.length > 0)}
      onblur={() => setTimeout(() => (open = false), 150)}
    />
    {#if loading}
      <span class="spinner" aria-hidden="true"></span>
    {/if}
  </div>

  {#if open && suggestions.length}
    <ul class="listbox" id="city-listbox" role="listbox">
      {#each suggestions as sug, i (sug.label)}
        <li
          role="option"
          aria-selected={i === activeIndex}
          class:active={i === activeIndex}
          onmousedown={(e) => {
            e.preventDefault();
            choose(sug);
          }}
          onmouseenter={() => (activeIndex = i)}
        >
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <span class="opt-label">{@html highlight(sug.label)}</span>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .combo {
    position: relative;
    flex: 1 1 240px;
    min-width: 0;
  }
  label {
    display: block;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 5px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .control {
    position: relative;
  }
  input {
    width: 100%;
    padding: 11px 38px 11px 12px;
    font-size: 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--card);
    color: var(--ink);
  }
  input:focus {
    outline: 2px solid var(--accent);
    border-color: transparent;
  }
  .spinner {
    position: absolute;
    right: 12px;
    top: 50%;
    width: 15px;
    height: 15px;
    margin-top: -7px;
    border: 2px solid var(--border-strong);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .listbox {
    position: absolute;
    z-index: 30;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    list-style: none;
    margin: 0;
    padding: 4px;
    background: var(--card);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow);
    max-height: 300px;
    overflow-y: auto;
  }
  li {
    padding: 9px 11px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95rem;
  }
  li.active {
    background: var(--accent-soft);
  }
  .opt-label :global(mark) {
    background: transparent;
    color: var(--accent);
    font-weight: 700;
  }
</style>
