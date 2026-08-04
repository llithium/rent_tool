<script lang="ts">
  import 'leaflet/dist/leaflet.css';
  import { onMount, onDestroy } from 'svelte';
  import type { City } from '$lib/types';
  import { money } from '$lib/format';
  import type { Map as LMap, LayerGroup, CircleMarker } from 'leaflet';
  import SectionHeading from '$lib/components/ui/SectionHeading.svelte';

  let {
    cities,
    maxRent,
    selectedName,
    onselect,
    class: className = ''
  }: {
    cities: City[];
    maxRent: number | null;
    selectedName: string | null;
    onselect: (name: string) => void;
    class?: string;
  } = $props();

  let el: HTMLDivElement;
  let map: LMap | undefined;
  let group: LayerGroup | undefined;
  let L: typeof import('leaflet');
  let ready = $state(false);

  const markers = new Map<string, CircleMarker>();

  function colorFor(c: City): string {
    if (c.r1 == null || maxRent == null) return '#99928c';
    return c.r1 <= maxRent ? '#147b3b' : '#b7352d';
  }

  function draw() {
    if (!ready || !group || !L) return;
    // Every redraw replaces the marker elements. If focus was inside the map
    // (wheel zoom is focus-gated), remember which marker held it so it can be
    // restored afterwards — otherwise focus falls to <body> and the wheel detaches.
    const active = document.activeElement;
    const hadFocus = el.contains(active);
    let focusName: string | null = null;
    if (hadFocus) {
      for (const [n, m] of markers) {
        if (m.getElement() === active) {
          focusName = n;
          break;
        }
      }
    }
    // Cancel any in-flight pan/zoom animation: re-adding vector markers while one
    // runs (or interrupting it afterwards) leaves them offset from the tiles.
    map?.stop();
    group.clearLayers();
    markers.clear();

    for (const c of cities) {
      if (c.lat == null || c.lng == null) continue;
      const selected = c.name === selectedName;
      const marker = L.circleMarker([c.lat, c.lng], {
        radius: selected ? 9 : 5.5,
        weight: selected ? 3 : 1.5,
        color: selected ? '#b25027' : '#ffffff',
        fillColor: colorFor(c),
        fillOpacity: 0.9
      });
      const fit =
        maxRent != null && c.r1 != null
          ? c.r1 <= maxRent
            ? 'fits budget'
            : 'over budget'
          : 'rent data unavailable';
      const tooltip = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = c.name;
      tooltip.append(strong, document.createElement('br'));
      tooltip.append(document.createTextNode(`1BR ${money(c.r1)} · ${fit}`));
      marker.bindTooltip(tooltip, { direction: 'top' });
      marker.on('click', () => onselect(c.name));
      marker.addTo(group);
      const element = marker.getElement();
      if (element) {
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'button');
        element.setAttribute('aria-label', `${c.name}, 1 bedroom ${money(c.r1)}, ${fit}`);
        element.addEventListener('keydown', (event) => {
          const keyboardEvent = event as KeyboardEvent;
          if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
            keyboardEvent.preventDefault();
            onselect(c.name);
          }
        });
      }
      markers.set(c.name, marker);
    }

    if (hadFocus) {
      // Same marker if it still exists, else the selected one, else the container.
      // preventScroll, or the focus call scrolls the overflow-hidden container
      // and shifts every marker off its coordinates.
      const target =
        (focusName && markers.get(focusName)?.getElement()) ||
        (selectedName && markers.get(selectedName)?.getElement()) ||
        map?.getContainer();
      (target as HTMLElement | undefined)?.focus({ preventScroll: true });
    }
  }

  onMount(async () => {
    L = (await import('leaflet')).default ?? (await import('leaflet'));
    // zoomAnimation off: an interrupted zoom animation (wheel during the
    // select-recenter, or vice versa) leaves the SVG marker pane with a stale
    // transform, detaching markers from their coordinates. Discrete zoom steps
    // have no animation window to corrupt.
    map = L.map(el, {
      scrollWheelZoom: false,
      attributionControl: true,
      zoomAnimation: false
    }).setView([39.5, -96], 4);
    // Wheel scrolling passes through to the page until focus is inside the map
    // (click or keyboard), so it never traps the page scroll unintentionally.
    // focusin/focusout, not Leaflet's focus/blur: those only watch the container
    // element itself, and focus usually sits on a marker inside it.
    const container = map.getContainer();
    container.addEventListener('focusin', () => map?.scrollWheelZoom.enable());
    container.addEventListener('focusout', (event) => {
      const next = event.relatedTarget;
      if (!(next instanceof Node) || !container.contains(next)) {
        map?.scrollWheelZoom.disable();
      }
    });
    // CARTO Positron: a light, low-detail basemap so the affordability markers stand out.
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);
    group = L.layerGroup().addTo(map);
    ready = true;
    draw();
  });

  onDestroy(() => {
    map?.remove();
  });

  // Redraw when data or budget changes.
  $effect(() => {
    // touch reactive deps
    void cities;
    void maxRent;
    void selectedName;
    draw();
  });

  // Recenter on the selected city. Instant, not flyTo: an animated flight can be
  // interrupted by scroll/drag, which shifts every marker off its coordinates.
  $effect(() => {
    if (!ready || !map || !selectedName) return;
    const c = cities.find((x) => x.name === selectedName);
    if (c?.lat != null && c.lng != null) {
      map.stop();
      map.setView([c.lat, c.lng], Math.max(map.getZoom(), 8), { animate: false });
    }
  });
</script>

<section class={className}>
  <SectionHeading title="Affordability map">
    <div class="flex gap-3.5 text-xs text-muted">
      <!-- The marker colours are set in JS on Leaflet's SVG layer, so the legend
           swatches repeat those literals rather than reading a theme token. -->
      <span class="inline-flex items-center gap-1.5">
        <i class="inline-block size-2.5 rounded-full" style="background:#147b3b"></i> fits budget
      </span>
      <span class="inline-flex items-center gap-1.5">
        <i class="inline-block size-2.5 rounded-full" style="background:#b7352d"></i> over budget
      </span>
    </div>
  </SectionHeading>
  <div
    bind:this={el}
    class="leaflet-theme h-100 w-full overflow-hidden rounded-xl border border-line bg-card-2"
  ></div>
  <p class="mt-3 text-xs text-muted">
    Each of the 100 markets is colored against your current 30% budget. Select a marker by mouse,
    Enter, or Space to load that city. Click the map to zoom with the scroll wheel.
  </p>
</section>

<style>
  /* Leaflet renders its own DOM outside our markup, so its tooltip chrome and
     focus rings can only be reached with real selectors. */
  .leaflet-theme :global(.leaflet-tooltip) {
    background: var(--card);
    color: var(--ink);
    border: 1px solid var(--line-strong);
    box-shadow: var(--elevation-card);
    font-size: 0.78rem;
  }
  .leaflet-theme :global(.leaflet-tooltip-top::before) {
    border-top-color: var(--line-strong);
  }
  /* No focus square when a marker is focused by click or by the post-select focus
     restore; keyboard users still get a visible ring via :focus-visible below.
     That ring has to be repeated here rather than left to app.css: this scoped
     block is unlayered, and unlayered declarations beat anything in @layer base
     whatever the specificity, so the `outline: none` above would otherwise swallow
     the base ring for keyboard users too. */
  .leaflet-theme :global(.leaflet-interactive:focus) {
    outline: none;
  }
  .leaflet-theme :global(.leaflet-interactive:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
