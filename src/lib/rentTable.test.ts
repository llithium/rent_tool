import { describe, expect, it } from 'vitest';
import { parseRentTable } from './rentTable';

describe('parseRentTable', () => {
  it('parses the current Zumper HTML table and report date', () => {
    const html = `
      <meta name="llm-page-context" content="type=Rental Trends Page; updated=2026-06-29">
      <table><tbody>
        <tr><td>1</td><td>0</td><td><a href="/new-york-ny">New York, NY</a></td>
          <td>$4,660</td><td>1.0<!-- -->%</td><td>4.0<!-- -->%</td><td>$5,620</td><td>0%</td><td>0%</td></tr>
        <tr><td>2</td><td>0</td><td><a href="/san-francisco-ca">San Francisco, CA</a></td>
          <td>$4,060</td><td>0%</td><td>21.9%</td><td>$5,700</td><td>0%</td><td>0%</td></tr>
      </tbody></table>`;

    expect(parseRentTable(html)).toEqual({
      reportDate: 'June 29, 2026',
      rows: [
        { name: 'New York, NY', r1: 4660, yoy: 4, r2: 5620 },
        { name: 'San Francisco, CA', r1: 4060, yoy: 21.9, r2: 5700 }
      ]
    });
  });

  it('retains support for the legacy markdown representation', () => {
    const markdown = '| 1 | 0 | [Tampa, FL](/tampa) | $1,520 | -1.0% | -6.2% | $1,830 |';
    expect(parseRentTable(markdown).rows).toEqual([
      { name: 'Tampa, FL', r1: 1520, yoy: -6.2, r2: 1830 }
    ]);
  });

  it('rejects duplicates and implausible rows', () => {
    const row = (name: string, r1: string) =>
      `<tr><td>1</td><td>0</td><td>${name}</td><td>${r1}</td><td>0%</td><td>2%</td><td>$1,500</td></tr>`;
    const parsed = parseRentTable(row('Austin, TX', '$1,200') + row('Austin, TX', '$1,300') + row('Bad', '$20'));
    expect(parsed.rows).toEqual([{ name: 'Austin, TX', r1: 1200, yoy: 2, r2: 1500 }]);
  });

  it('normalizes stray commas in upstream city labels', () => {
    const html = '<tr><td>1</td><td>0</td><td>Salt Lake, City, UT</td><td>$1,200</td><td>0%</td><td>-2.4%</td><td>$1,600</td></tr>';
    expect(parseRentTable(html).rows[0]?.name).toBe('Salt Lake City, UT');
  });
});
