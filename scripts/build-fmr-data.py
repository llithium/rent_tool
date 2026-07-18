#!/usr/bin/env python3
"""Build src/lib/data/fmr-county.json from HUD's county-level Fair Market Rents file.

Usage:
  python3 scripts/build-fmr-data.py [path-to-FY_FMRs.xlsx]

With no argument, downloads the FY2026 file from huduser.gov (needs a browser
User-Agent — plain curl gets a 202 bot-challenge). Stdlib only; the xlsx is read
with zipfile + minimal XML parsing, no openpyxl required.

Rows are aggregated by the first 5 digits of the `fips` column (state+county FIPS);
New England has multiple town-level rows per county, which are averaged — matching
the avg logic in src/routes/api/fmr/+server.ts. Output maps FIPS -> [1BR, 2BR].

Re-run annually when HUD publishes a new fiscal year (update YEAR/URL below).
"""

import json
import re
import sys
import urllib.request
import zipfile
from collections import defaultdict
from pathlib import Path
from xml.etree import ElementTree

YEAR = "FY2026"
URL = "https://www.huduser.gov/portal/datasets/fmr/fmr2026/FY26_FMRs.xlsx"
OUT = Path(__file__).resolve().parent.parent / "src" / "lib" / "data" / "fmr-county.json"
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def download(url: str) -> Path:
    dest = Path("/tmp") / url.rsplit("/", 1)[-1]
    print(f"Downloading {url} …")
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        },
    )
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        f.write(r.read())
    return dest


def col_index(cell_ref: str) -> int:
    """'C7' -> 2."""
    letters = re.match(r"[A-Z]+", cell_ref).group()
    idx = 0
    for ch in letters:
        idx = idx * 26 + (ord(ch) - 64)
    return idx - 1


def read_rows(xlsx: Path):
    z = zipfile.ZipFile(xlsx)
    shared = [
        (t.text or "")
        for t in ElementTree.fromstring(z.read("xl/sharedStrings.xml")).iter(
            "{%s}t" % NS["m"]
        )
    ]
    sheet = ElementTree.fromstring(z.read("xl/worksheets/sheet1.xml"))
    for row in sheet.iter("{%s}row" % NS["m"]):
        cells: dict[int, str] = {}
        for c in row.iter("{%s}c" % NS["m"]):
            v = c.find("{%s}v" % NS["m"])
            if v is None or v.text is None:
                continue
            val = shared[int(v.text)] if c.get("t") == "s" else v.text
            cells[col_index(c.get("r"))] = val
        yield cells


def main() -> None:
    xlsx = Path(sys.argv[1]) if len(sys.argv) > 1 else download(URL)
    rows = read_rows(xlsx)

    header = next(rows)
    col = {name: i for i, name in header.items()}
    fips_i, r1_i, r2_i = col["fips"], col["fmr_1"], col["fmr_2"]

    sums: dict[str, list[float]] = defaultdict(lambda: [0.0, 0.0, 0])
    for cells in rows:
        fips = cells.get(fips_i, "")
        try:
            r1 = float(cells[r1_i])
            r2 = float(cells[r2_i])
        except (KeyError, ValueError):
            continue
        if len(fips) < 5 or r1 <= 0 or r2 <= 0:
            continue
        s = sums[fips[:5]]
        s[0] += r1
        s[1] += r2
        s[2] += 1

    counties = {
        fips: [round(s[0] / s[2]), round(s[1] / s[2])]
        for fips, s in sorted(sums.items())
    }

    OUT.write_text(
        json.dumps(
            {"meta": {"year": YEAR, "source": "HUD Fair Market Rents"}, "counties": counties},
            separators=(",", ":"),
        )
        + "\n"
    )
    print(f"Wrote {OUT} — {len(counties)} counties ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
