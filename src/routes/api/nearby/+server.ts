import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { VALID_STATES } from '$lib/data/states';
import { haversineMiles } from '$lib/geo';
import type { NearbyPlace } from '$lib/types';

const KINDS = ['city', 'town', 'village'] as const;
type Kind = (typeof KINDS)[number];

interface OverpassNode {
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
}

interface Candidate {
  city: string;
  lat: number;
  lng: number;
  kind: Kind;
  miles: number;
  pop: number | null;
}

/** Parse OSM's `population` tag ("15,230", "15 230", "15230"). */
function parsePop(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseInt(v.replace(/[,\s]/g, ''), 10);
  return Number.isFinite(n) && n > 0 && n < 50_000_000 ? n : null;
}

type Fetch = typeof globalThis.fetch;

function num(v: string | null): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Resolve a USPS state code from coordinates via the FCC Area API (keyless), the
 * same source /api/geocode uses. OSM place nodes rarely tag their state, and guessing
 * from the origin mislabels cross-border suburbs (e.g. Cincinnati's Kentucky neighbors). */
async function stateForPoint(fetch: Fetch, lat: number, lng: number): Promise<string> {
  try {
    const u = new URL('https://geo.fcc.gov/api/census/area');
    u.searchParams.set('lat', String(lat));
    u.searchParams.set('lon', String(lng));
    u.searchParams.set('format', 'json');
    const res = await fetch(u.toString(), { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return '';
    const data = await res.json();
    const code = String(data.results?.[0]?.state_code ?? '').toUpperCase();
    return VALID_STATES.has(code) ? code : '';
  } catch {
    return '';
  }
}

/** Nearby towns & suburbs around a point, from OpenStreetMap (Overpass, keyless).
 * Returns "City, ST" + coordinates + distance so a pick feeds resolveSuggestion. */
export const GET: RequestHandler = async ({ url, fetch, setHeaders }) => {
  const lat = num(url.searchParams.get('lat'));
  const lng = num(url.searchParams.get('lng'));
  if (lat == null || lng == null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw error(400, 'lat and lng are required and must be valid coordinates');
  }
  const fallbackState = (url.searchParams.get('state') || '').toUpperCase();
  const originState = VALID_STATES.has(fallbackState) ? fallbackState : '';

  // Independent settlements (city/town/village) — not `place=suburb`, which in OSM is a
  // district *within* a city and would yield noisy intra-city neighborhood labels.
  // `out body` (not `out tags`) is required — for nodes it returns lat/lon plus tags.
  const q =
    `[out:json][timeout:20];` +
    `node(around:40000,${lat},${lng})[place~"^(city|town|village)$"];` +
    // Generous limit: truncation is arbitrary (node-id order), and we sort by
    // population after the fact — a low cap could drop a metro's biggest suburbs.
    `out body 400;`;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'User-Agent': 'rent-tool/1.0 (nearby places)',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `data=${encodeURIComponent(q)}`,
      signal: AbortSignal.timeout(15_000)
    });
    // Overpass returns HTML (429/504) when busy — treat anything non-JSON as no data.
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) {
      return json({ nearby: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const data: { elements?: unknown[] } = await res.json();

    // Collect candidates, dedupe by name (keep the closest), sort by distance.
    const byName = new Map<string, Candidate>();
    for (const el of (data.elements ?? []) as OverpassNode[]) {
      const t = el.tags ?? {};
      const kind = t.place as Kind;
      if (!KINDS.includes(kind)) continue;
      const name = typeof t.name === 'string' ? t.name.trim().slice(0, 80) : '';
      if (!name || /[<>]/.test(name)) continue;
      if (typeof el.lat !== 'number' || typeof el.lon !== 'number') continue;

      const miles = haversineMiles(lat, lng, el.lat, el.lon);
      if (miles < 1) continue; // the origin itself

      const prev = byName.get(name);
      if (!prev || miles < prev.miles) {
        byName.set(name, {
          city: name,
          lat: el.lat,
          lng: el.lon,
          kind,
          miles,
          pop: parsePop(t.population)
        });
      }
    }

    // Largest first; places without a population tag sort last, nearest-first.
    const closest = [...byName.values()]
      .sort((a, b) => (b.pop ?? -1) - (a.pop ?? -1) || a.miles - b.miles)
      .slice(0, 8);

    // Resolve each place's real state from its own coordinates (parallel), so
    // cross-border suburbs get the correct suffix and downstream state tax.
    const nearby: NearbyPlace[] = [];
    const seen = new Set<string>();
    const states = await Promise.all(closest.map((c) => stateForPoint(fetch, c.lat, c.lng)));
    closest.forEach((c, i) => {
      const state = states[i] || originState;
      if (!state) return;
      const label = `${c.city}, ${state}`;
      if (seen.has(label)) return;
      seen.add(label);
      nearby.push({
        label,
        city: c.city,
        state,
        lat: c.lat,
        lng: c.lng,
        kind: c.kind,
        miles: Math.round(c.miles),
        pop: c.pop
      });
    });

    // Only cache real results — never pin an empty response from a transient
    // Overpass outage, or the section would stay blank for the full TTL.
    setHeaders({
      'Cache-Control': nearby.length ? 'public, max-age=300, s-maxage=3600' : 'no-store'
    });
    return json({ nearby });
  } catch {
    return json({ nearby: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }
};
