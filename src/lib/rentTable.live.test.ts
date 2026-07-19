import { describe, expect, it } from 'vitest';
import { parseRentTable } from './rentTable';

describe.skipIf(import.meta.env.LIVE_RENT_SMOKE !== '1')('live Zumper parser', () => {
  it('parses at least 80 current report rows', async () => {
    const response = await fetch('https://www.zumper.com/rent-research/national-rent-report', {
      signal: AbortSignal.timeout(20_000),
      headers: { 'User-Agent': 'rent-tool-smoke-test/1.0' }
    });
    expect(response.ok).toBe(true);
    const parsed = parseRentTable(await response.text());
    expect(parsed.rows.length).toBeGreaterThanOrEqual(80);
    expect(parsed.reportDate).toBeTruthy();
  }, 30_000);
});
