import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parseRentTable, type RentRow } from '$lib/rentTable';

const ZUMPER_URL = 'https://www.zumper.com/rent-research/national-rent-report';
const TTL_MS = 6 * 60 * 60 * 1000; // 6h
const MIN_LIVE_ROWS = 80;
const FETCH_TIMEOUT_MS = 10_000;

interface CacheEntry {
  at: number;
  rows: RentRow[];
  reportDate: string | null;
}
// Module-level cache — persists across warm serverless invocations.
let cache: CacheEntry | null = null;

/** Fetch Zumper's national rent report, parse the top-100 table, and cache it.
 * Best-effort: if the page can't be parsed, returns rows: [] and the client keeps
 * its bundled snapshot. Never throws to the client. */
export const GET: RequestHandler = async ({ fetch, setHeaders }) => {
  if (cache && Date.now() - cache.at < TTL_MS) {
    setHeaders({ 'Cache-Control': 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400' });
    return json({
      rows: cache.rows,
      reportDate: cache.reportDate,
      live: true,
      status: 'live',
      rowCount: cache.rows.length,
      lastSuccessfulAt: new Date(cache.at).toISOString(),
      cached: true
    });
  }

  try {
    const res = await fetch(ZUMPER_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
    const text = res.ok ? await res.text() : '';
    const { rows, reportDate } = parseRentTable(text);

    if (rows.length < MIN_LIVE_ROWS) {
      console.warn('rent refresh rejected', { status: res.status, rows: rows.length });
      setHeaders({ 'Cache-Control': 'public, max-age=0, s-maxage=300' });
      return json({
        rows: cache?.rows ?? [],
        reportDate: cache?.reportDate ?? reportDate,
        live: false,
        status: cache ? 'stale' : 'unavailable',
        rowCount: cache?.rows.length ?? 0,
        lastSuccessfulAt: cache ? new Date(cache.at).toISOString() : null,
        cached: false
      });
    }

    const at = Date.now();
    cache = { at, rows, reportDate };
    setHeaders({ 'Cache-Control': 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400' });
    return json({
      rows,
      reportDate,
      live: true,
      status: 'live',
      rowCount: rows.length,
      lastSuccessfulAt: new Date(at).toISOString(),
      cached: false
    });
  } catch (cause) {
    console.warn('rent refresh failed', { cause: cause instanceof Error ? cause.name : 'unknown' });
    setHeaders({ 'Cache-Control': 'public, max-age=0, s-maxage=300' });
    return json({
      rows: cache?.rows ?? [],
      reportDate: cache?.reportDate ?? null,
      live: false,
      status: cache ? 'stale' : 'unavailable',
      rowCount: cache?.rows.length ?? 0,
      lastSuccessfulAt: cache ? new Date(cache.at).toISOString() : null,
      cached: false
    });
  }
};
