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

/** Parse markdown table rows shaped like:
 * | rank | chg | [City, ST](url) | $1BR | m/m% | y/y% | $2BR | ...
 */
export function parseRentTable(text: string): ParsedRents {
  const re =
    /\|[^|\n]*\|[^|\n]*\|\s*\[([^\]]+)\]\([^)]*\)\s*\|\s*\$([\d,]+)\s*\|\s*(-?[\d.]+)%\s*\|\s*(-?[\d.]+)%\s*\|\s*\$([\d,]+)/g;

  const rows: RentRow[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim().replace(/\s+/g, ' ');
    const r1 = parseInt(m[2].replace(/,/g, ''), 10);
    const yoy = parseFloat(m[4]);
    const r2 = parseInt(m[5].replace(/,/g, ''), 10);
    if (name && Number.isFinite(r1) && Number.isFinite(r2)) {
      rows.push({ name, r1, yoy: Number.isFinite(yoy) ? yoy : 0, r2 });
    }
  }

  const dm = text.match(/([A-Z][a-z]+ \d{1,2}, \d{4})/);
  return { rows, reportDate: dm ? dm[1] : null };
}
