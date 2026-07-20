<script lang="ts">
  import { fetchSuggestions } from '$lib/api';
  import type { CitySuggestion } from '$lib/types';
  import { SEED_CITIES, findSeedCity } from '$lib/data/cities';
  import { money } from '$lib/format';

  /** Median 1BR rent for a suggestion, when it maps to a known city. */
  function rentFor(label: string): string {
    const seed = findSeedCity(label);
    return seed?.r1 != null ? money(seed.r1) : '';
  }

  let {
    onselect,
    selectedName = null
  }: { onselect: (sug: CitySuggestion) => void; selectedName?: string | null } = $props();

  let query = $state('');

  // Reflect an externally-driven selection (compare table, map marker, restored
  // state) in the field. This only re-runs when selectedName actually changes, so
  // it never clobbers the query while the user is typing (typing leaves the current
  // selection untouched until they choose a suggestion).
  $effect(() => {
    if (selectedName != null) query = selectedName;
  });
  let suggestions = $state<CitySuggestion[]>([]);
  let open = $state(false);
  let loading = $state(false);
  let activeIndex = $state(-1);
  let requestId = 0;

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let blurTimer: ReturnType<typeof setTimeout> | undefined;
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

  async function runSearch(q: string, id: number) {
    controller = new AbortController();
    loading = true;
    try {
      const remote = await fetchSuggestions(q, controller.signal);
      if (id !== requestId) return;
      suggestions = remote.length ? remote : seedMatches(q);
    } catch (cause) {
      if (id !== requestId || (cause instanceof DOMException && cause.name === 'AbortError')) return;
      suggestions = seedMatches(q);
    } finally {
      if (id !== requestId) return;
      loading = false;
      activeIndex = suggestions.length ? 0 : -1;
    }
  }

  function onInput(e: Event) {
    query = (e.target as HTMLInputElement).value;
    clearTimeout(blurTimer);
    open = true;
    requestId += 1;
    const id = requestId;
    controller?.abort();
    clearTimeout(debounceTimer);
    if (query.trim().length < 2) {
      suggestions = [];
      loading = false;
      activeIndex = -1;
      return;
    }
    // Instant local hints, then debounced API refinement.
    suggestions = seedMatches(query);
    activeIndex = suggestions.length ? 0 : -1;
    debounceTimer = setTimeout(() => runSearch(query.trim(), id), 220);
  }

  function choose(sug: CitySuggestion) {
    clearTimeout(blurTimer);
    clearTimeout(debounceTimer);
    requestId += 1;
    controller?.abort();
    loading = false;
    query = sug.label;
    open = false;
    suggestions = [];
    onselect(sug);
  }

  function onKeydown(e: KeyboardEvent) {
    if (!open || !suggestions.length) {
      if (e.key === 'ArrowDown' && query.trim().length >= 2) {
        open = true;
        requestId += 1;
        controller?.abort();
        runSearch(query.trim(), requestId);
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

  function highlight(label: string): { before: string; match: string; after: string } {
    const q = query.trim();
    if (!q) return { before: label, match: '', after: '' };
    const i = label.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return { before: label, match: '', after: '' };
    return {
      before: label.slice(0, i),
      match: label.slice(i, i + q.length),
      after: label.slice(i + q.length)
    };
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
      aria-activedescendant={open && activeIndex >= 0 ? `city-option-${activeIndex}` : undefined}
      aria-busy={loading}
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      placeholder="Start typing a city…"
      value={query}
      oninput={onInput}
      onkeydown={onKeydown}
      onfocus={() => {
        clearTimeout(blurTimer);
        open = suggestions.length > 0;
      }}
      onblur={() => {
        blurTimer = setTimeout(() => (open = false), 150);
      }}
    />
    {#if loading}
      <span class="spinner" aria-hidden="true"></span>
    {/if}
  </div>

  {#if open && suggestions.length}
    <ul class="listbox" id="city-listbox" role="listbox">
      {#each suggestions as sug, i (sug.label)}
        {@const parts = highlight(sug.label)}
        <li
          id={`city-option-${i}`}
          role="option"
          aria-selected={i === activeIndex}
          class:active={i === activeIndex}
          onmousedown={(e) => {
            e.preventDefault();
            choose(sug);
          }}
          onmouseenter={() => (activeIndex = i)}
        >
          <span class="opt-label">{parts.before}{#if parts.match}<mark>{parts.match}</mark>{/if}{parts.after}</span>
          {#if rentFor(sug.label)}<span class="opt-rent num">{rentFor(sug.label)}</span>{/if}
        </li>
      {/each}
    </ul>
  {/if}
  <span class="sr-only" aria-live="polite">
    {loading ? 'Searching cities' : open ? `${suggestions.length} city suggestions available` : ''}
  </span>
</div>

<style>
  .combo {
    position: relative;
    min-width: 0;
  }
  label {
    display: block;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .control {
    position: relative;
  }
  input {
    width: 100%;
    padding: 12px 38px 12px 14px;
    font-size: 1.05rem;
    font-weight: 600;
    border: 1px solid var(--border2);
    border-radius: 11px;
    background: var(--card2);
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
    z-index: 40;
    top: calc(100% + 5px);
    left: 0;
    right: 0;
    list-style: none;
    margin: 0;
    padding: 5px;
    background: var(--card);
    border: 1px solid var(--border2);
    border-radius: 11px;
    box-shadow: var(--shadow-lg);
    max-height: 290px;
    overflow-y: auto;
  }
  li {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: baseline;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
  }
  li.active {
    background: var(--accent-soft);
  }
  .opt-rent {
    font-size: 0.85rem;
    color: var(--muted);
    white-space: nowrap;
  }
  mark {
    background: transparent;
    color: var(--accent);
    font-weight: 700;
  }
</style>
