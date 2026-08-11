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
    return SEED_CITIES.filter(
      (c) => c.lat != null && c.lng != null && c.name.toLowerCase().includes(t)
    )
      .slice(0, 8)
      .map((c) => ({
        label: c.name,
        city: c.city,
        state: c.state,
        lat: c.lat!,
        lng: c.lng!
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
      if (id !== requestId || (cause instanceof DOMException && cause.name === 'AbortError'))
        return;
      suggestions = seedMatches(q);
    } finally {
      // Deliberate: a newer keystroke already owns `loading`/`activeIndex`, so a
      // stale request must leave them alone. Nothing here can throw, so the early
      // return has no exception to swallow.
      // eslint-disable-next-line no-unsafe-finally
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

<div class="relative min-w-0">
  <label for="city-input" class="mb-2 block text-sm font-medium text-muted"> City </label>
  <div class="relative">
    <input
      id="city-input"
      name="city-search"
      class="w-full rounded-xl border border-line-strong bg-card-2 py-3 pr-10 pl-3 text-base font-semibold text-ink transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-faint hover:border-accent focus:border-transparent focus:outline-2 focus:outline-accent"
      type="search"
      role="combobox"
      aria-expanded={open}
      aria-controls="city-listbox"
      aria-autocomplete="list"
      aria-activedescendant={open && activeIndex >= 0 ? `city-option-${activeIndex}` : undefined}
      aria-busy={loading}
      autocomplete="off"
      data-1p-ignore
      data-lpignore="true"
      data-form-type="other"
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
      <span
        aria-hidden="true"
        class="absolute top-1/2 right-3 h-2 w-6 -translate-y-1/2 animate-pulse rounded-full bg-line-strong"
      ></span>
    {/if}
  </div>

  {#if open && suggestions.length}
    <ul
      id="city-listbox"
      role="listbox"
      class="absolute inset-x-0 top-[calc(100%+0.3125rem)] z-40 max-h-72 animate-overlay-settle overflow-y-auto rounded-xl border border-line-strong bg-card p-1.5 shadow-pop"
    >
      {#each suggestions as sug, i (sug.label)}
        {@const parts = highlight(sug.label)}
        <li
          id={`city-option-${i}`}
          role="option"
          aria-selected={i === activeIndex}
          style:animation-delay={`${Math.min(i * 24, 120)}ms`}
          class="motion-option flex cursor-pointer items-baseline justify-between gap-2.5 rounded-lg px-3 py-2.5 text-base {i ===
          activeIndex
            ? 'bg-accent-soft'
            : ''}"
          onmousedown={(e) => {
            e.preventDefault();
            choose(sug);
          }}
          onmouseenter={() => (activeIndex = i)}
        >
          <span>
            {parts.before}{#if parts.match}<mark class="bg-transparent font-bold text-accent"
                >{parts.match}</mark
              >{/if}{parts.after}
          </span>
          {#if rentFor(sug.label)}
            <span class="text-sm whitespace-nowrap text-muted tabular-nums">
              {rentFor(sug.label)}
            </span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
  <span class="sr-only" aria-live="polite">
    {loading ? 'Searching cities' : open ? `${suggestions.length} city suggestions available` : ''}
  </span>
</div>
