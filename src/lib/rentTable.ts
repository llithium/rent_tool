/** Parse Zumper's National Rent Report markdown/HTML table into rent rows.
 * Migrated from the original artifact's applyRentTable(). Runs server-side in /api/rents. */

export interface RentRow {
  name: string; // "City, ST"
  r1: number; // median 1BR
  yoy: number; // 1BR YoY %
  r2: number; // median 2BR
}

export interface ParsedRents {
  rows: RentRow[];
  reportDate: string | null;
}

const CITY_RE = /^[^,]{1,80},\s[A-Z]{2}$/;

function canonicalCityName(text: string): string {
  const match = text.trim().match(/^(.+),\s*([A-Z]{2})$/);
  if (!match) return text.trim();
  // Zumper occasionally inserts a stray comma within a city name (for example,
  // "Salt Lake, City, UT"). Canonical app keys use exactly "City, ST".
  const city = match[1].replace(/,\s*/g, ' ').replace(/\s+/g, ' ').trim();
  return `${city}, ${match[2]}`;
}

function decodeHtml(text: string): string {
  const named: Record<string, string> = {
    amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"'
  };
  return text
    .replace(/<!--.*?-->/gs, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (_, entity: string) => {
      if (entity[0] !== '#') return named[entity.toLowerCase()] ?? `&${entity};`;
      const hex = entity[1]?.toLowerCase() === 'x';
      const value = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : '';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function dollars(text: string): number {
  return Number.parseInt(text.replace(/[^\d]/g, ''), 10);
}

function percent(text: string): number {
  return Number.parseFloat(text.replace(/[^\d.+-]/g, ''));
}

function validRow(row: RentRow): boolean {
  return (
    CITY_RE.test(row.name) &&
    Number.isFinite(row.r1) && row.r1 >= 300 && row.r1 <= 20_000 &&
    Number.isFinite(row.r2) && row.r2 >= 300 && row.r2 <= 25_000 &&
    Number.isFinite(row.yoy) && row.yoy >= -100 && row.yoy <= 200
  );
}

function dedupe(rows: RentRow[]): RentRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = row.name.toLowerCase();
    if (!validRow(row) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseHtmlRows(text: string): RentRow[] {
  const rows: RentRow[] = [];
  for (const match of text.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      decodeHtml(m[1])
    );
    // Rank, change, city, 1BR, 1BR MoM, 1BR YoY, 2BR, ...
    if (cells.length < 7) continue;
    const row = {
      name: canonicalCityName(cells[2]),
      r1: dollars(cells[3]),
      yoy: percent(cells[5]),
      r2: dollars(cells[6])
    };
    if (validRow(row)) rows.push(row);
  }
  return rows;
}

function parseMarkdownRows(text: string): RentRow[] {
  const re =
    /\|[^|\n]*\|[^|\n]*\|\s*\[([^\]]+)\]\([^)]*\)\s*\|\s*\$([\d,]+)\s*\|\s*(-?[\d.]+)%\s*\|\s*(-?[\d.]+)%\s*\|\s*\$([\d,]+)/g;
  const rows: RentRow[] = [];
  for (const m of text.matchAll(re)) {
    rows.push({
      name: canonicalCityName(m[1].trim().replace(/\s+/g, ' ')),
      r1: Number.parseInt(m[2].replace(/,/g, ''), 10),
      yoy: Number.parseFloat(m[4]),
      r2: Number.parseInt(m[5].replace(/,/g, ''), 10)
    });
  }
  return rows;
}

function reportDate(text: string): string | null {
  const iso = text.match(/llm-page-context[^>]*\bupdated=(\d{4})-(\d{2})-(\d{2})/i);
  if (iso) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[Number(iso[2]) - 1]} ${Number(iso[3])}, ${iso[1]}`;
  }
  const human = text.match(/([A-Z][a-z]+ \d{1,2}, \d{4})/);
  return human ? human[1] : null;
}

/** Parse markdown table rows shaped like:
 * | rank | chg | [City, ST](url) | $1BR | m/m% | y/y% | $2BR | ...
 */
export function parseRentTable(text: string): ParsedRents {
  const htmlRows = parseHtmlRows(text);
  const rows = htmlRows.length ? htmlRows : parseMarkdownRows(text);
  return { rows: dedupe(rows), reportDate: reportDate(text) };
}
