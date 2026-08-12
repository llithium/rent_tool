import { pushState, replaceState } from '$app/navigation';
import { app } from '$lib/appState.svelte';

/**
 * Two-way sync between the shared app state and the address bar, so any view is
 * a shareable deep link.
 *
 * The salary contribution is debounced (city/compare changes are discrete and
 * write immediately) so dragging the slider or typing doesn't thrash the address
 * bar. `lastWritten` guards against the read→write echo and against redundant
 * replaceState calls.
 *
 * Call this once at component init — it registers an `$effect`, so it must run
 * inside a component's effect context.
 */
export function createUrlSync() {
  let hydrated = $state(false);
  let salaryForUrl = $state<number | null>(null);
  let salaryTimer: ReturnType<typeof setTimeout> | undefined;
  let lastWritten = '';
  // Tracks the city in the last-written URL so the write effect can tell a city
  // change (→ pushState, a real history entry) from an incidental salary/compare
  // change (→ replaceState). Browser back/forward then steps through cities only.
  let lastCity: string | null = null;

  $effect(() => {
    // Always read the state so deps are tracked, but hold off writing until
    // start() has hydrated from the URL and seeded lastWritten — otherwise this
    // could strip the query string before hydrateFromSearch reads it.
    const params = app.buildSearch(salaryForUrl);
    if (!hydrated || params === lastWritten) return;
    const cityChanged = app.selectedName !== lastCity;
    lastWritten = params;
    lastCity = app.selectedName;
    const url = params ? `?${params}` : location.pathname;
    // New city → push a history entry so Back/Forward returns here. Salary/compare
    // tweaks replace the current entry so they don't clutter the history stack.
    if (cityChanged) pushState(url, history.state ?? {});
    else replaceState(url, history.state ?? {});
  });

  return {
    get hydrated() {
      return hydrated;
    },

    /** Queue the salary that should appear in the URL once typing settles. */
    scheduleSalary(value: number | null) {
      clearTimeout(salaryTimer);
      salaryTimer = setTimeout(() => (salaryForUrl = value), 350);
    },

    /**
     * Hydrate from the initial URL, then keep watching history navigation.
     * `onStateApplied` re-seeds whatever the component mirrors locally (the
     * salary text field). Returns an onMount-style teardown.
     */
    start(initialSearch: URLSearchParams, onStateApplied: () => void) {
      // URL wins over localStorage when it names a resolvable city; a bare
      // ?salary= link still falls back to restore() for the city/compare set but
      // keeps the URL's salary.
      const hadUrlState = app.hydrateFromSearch(initialSearch);
      if (!hadUrlState) {
        const urlSalary = app.salary;
        app.restoreSession();
        if (urlSalary != null) app.setSalary(urlSalary);
      }
      salaryForUrl = app.salary;
      lastWritten = app.buildSearch(salaryForUrl);
      lastCity = app.selectedName;
      hydrated = true;
      onStateApplied();

      // Re-hydrate on browser back/forward. Shallow routing (pushState/replaceState)
      // doesn't update `page.url`, so we read the authoritative live URL instead.
      // Native popstate fires only on genuine history navigation — never on our own
      // push/replace above — so no echo guard beyond the redundant-write
      // short-circuit is needed.
      const onPopState = () => {
        const search = location.search.replace(/^\?/, '');
        if (!hydrated || search === lastWritten) return;
        lastWritten = search;
        app.applyUrlNavigation(new URLSearchParams(location.search));
        lastCity = app.selectedName;
        salaryForUrl = app.salary;
        onStateApplied();
      };

      window.addEventListener('popstate', onPopState);
      return () => {
        clearTimeout(salaryTimer);
        window.removeEventListener('popstate', onPopState);
      };
    }
  };
}
