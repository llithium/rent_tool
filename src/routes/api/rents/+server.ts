import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parseRentTable, type RentRow } from '$lib/rentTable';

const ZUMPER_URL = 'https://www.zumper.com/rent-research/national-rent-report';
const TTL_MS = 6 * 60 * 60 * 1000; // 6h

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
  setHeaders({ 'Cache-Control': 'public, max-age=0, s-maxage=21600' });

  if (cache && Date.now() - cache.at < TTL_MS) {
    return json({ rows: cache.rows, reportDate: cache.reportDate, live: cache.rows.length > 0, cached: true });
  }

  try {
    const res = await fetch(ZUMPER_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml'
      }
    });
    const text = res.ok ? await res.text() : '';
    const { rows, reportDate } = parseRentTable(text);

    cache = { at: Date.now(), rows, reportDate };
    return json({ rows, reportDate, live: rows.length > 0, cached: false });
  } catch {
    return json({ rows: [], reportDate: null, live: false, cached: false });
  }
};
