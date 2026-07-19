<script lang="ts">
  import 'leaflet/dist/leaflet.css';
  import { onMount, onDestroy } from 'svelte';
  import type { City } from '$lib/types';
  import { money } from '$lib/format';
  import type { Map as LMap, LayerGroup, CircleMarker } from 'leaflet';

  let {
    cities,
    maxRent,
    selectedName,
    onselect
  }: {
    cities: City[];
    maxRent: number | null;
    selectedName: string | null;
    onselect: (name: string) => void;
  } = $props();

  let el: HTMLDivElement;
  let map: LMap | undefined;
  let group: LayerGroup | undefined;
  let L: typeof import('leaflet');
  let ready = $state(false);

  const markers = new Map<string, CircleMarker>();

  function colorFor(c: City): string {
    if (c.r1 == null || maxRent == null) return '#9a948a';
    return c.r1 <= maxRent ? '#2e7d4f' : '#b3402e';
  }

  function draw() {
    if (!ready || !group || !L) return;
    group.clearLayers();
    markers.clear();

    for (const c of cities) {
      if (c.lat == null || c.lng == null) continue;
      const selected = c.name === selectedName;
      const marker = L.circleMarker([c.lat, c.lng], {
        radius: selected ? 9 : 6,
        weight: selected ? 3 : 1.5,
        color: selected ? '#b05730' : '#ffffff',
        fillColor: colorFor(c),
        fillOpacity: 0.9
      });
      const fit = maxRent != null && c.r1 != null
        ? c.r1 <= maxRent ? 'fits budget' : 'over budget'
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
  }

  onMount(async () => {
    L = (await import('leaflet')).default ?? (await import('leaflet'));
    map = L.map(el, { scrollWheelZoom: false, attributionControl: true }).setView(
      [39.5, -96],
      4
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
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

  // Pan to the selected city.
  $effect(() => {
    if (!ready || !map || !selectedName) return;
    const c = cities.find((x) => x.name === selectedName);
    if (c?.lat != null && c.lng != null) {
      map.flyTo([c.lat, c.lng], Math.max(map.getZoom(), 8), { duration: 0.6 });
    }
  });
</script>

<section class="panel">
  <div class="head">
    <h2>Affordability map</h2>
    <div class="legend">
      <span><i style="background:#2e7d4f"></i> fits budget</span>
      <span><i style="background:#b3402e"></i> over budget</span>
      <span><i style="background:#9a948a"></i> no data</span>
    </div>
  </div>
  <div class="map" bind:this={el}></div>
  <p class="note">Markers are colored against your 30% budget. Select one by mouse, Enter, or Space.</p>
</section>

<style>
  .panel {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 18px;
    box-shadow: var(--shadow);
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  h2 {
    font-size: 1rem;
  }
  .legend {
    display: flex;
    gap: 12px;
    font-size: 0.72rem;
    color: var(--muted);
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .legend i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
  }
  .map {
    height: 380px;
    width: 100%;
    border-radius: var(--radius-sm);
    overflow: hidden;
    border: 1px solid var(--border);
    background: var(--card-2);
  }
  .note {
    font-size: 0.76rem;
    color: var(--muted);
    margin-top: 10px;
  }
  /* Leaflet tooltip theming */
  .map :global(.leaflet-tooltip) {
    background: var(--card);
    color: var(--ink);
    border: 1px solid var(--border-strong);
    box-shadow: var(--shadow);
    font-size: 0.78rem;
  }
  .map :global(.leaflet-tooltip-top::before) {
    border-top-color: var(--border-strong);
  }
</style>
