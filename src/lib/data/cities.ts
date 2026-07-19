import type { City } from '$lib/types';
import { COORDS } from './coordinates';

/** Curated snapshot: Zumper National Rent Report, June 2026 baseline.
 * r1/r2/yoy are refreshed live server-side when possible; tax/pop/blurb are static context. */
interface SeedRecord {
  r1: number;
  r2: number;
  yoy: number;
  tax: string;
  pop: string;
  blurb: string;
}

const DETAILED: Record<string, SeedRecord> = {
  'Tampa, FL': { r1: 1520, r2: 1830, yoy: -6.2, tax: 'None (FL has no state income tax)', pop: '3.4M metro', blurb: 'Big finance/insurance employment base (Raymond James, USAA, Citi ops). Heavy new apartment supply has pushed rents down, so renters have leverage — ask about concessions. No state income tax stretches an offer further.' },
  'St Petersburg, FL': { r1: 1500, r2: 2070, yoy: -6.3, tax: 'None (FL has no state income tax)', pop: 'Part of 3.4M Tampa Bay metro', blurb: 'Raymond James is headquartered here; walkable downtown with a growing arts district. Check both St Pete and Tampa listings — they\'re 25 min apart.' },
  'Clearwater, FL': { r1: 1450, r2: 1900, yoy: -6.0, tax: 'None (FL has no state income tax)', pop: 'Part of 3.4M Tampa Bay metro', blurb: 'Beach-adjacent, quieter than Tampa/St Pete. Rents track the Tampa Bay market. Commutes across the bay bridges can be slow at rush hour.' },
  'Orlando, FL': { r1: 1470, r2: 1750, yoy: -8.1, tax: 'None (FL has no state income tax)', pop: '2.9M metro', blurb: 'One of the sharpest rent declines in the country thanks to a construction wave. Diverse economy beyond tourism: healthcare, defense/simulation, and a growing corporate accounting base.' },
  'Fort Lauderdale, FL': { r1: 1900, r2: 2800, yoy: -5.0, tax: 'None (FL has no state income tax)', pop: '1.9M county (Broward)', blurb: 'Priciest of your Florida targets — falling, but from a high base. Broward suburbs (Coral Springs, Sunrise, Pompano, Deerfield) run meaningfully cheaper than downtown.' },
  'Tallahassee, FL': { r1: 1000, r2: 1300, yoy: 0.0, tax: 'None (FL has no state income tax)', pop: '~400K metro', blurb: 'State capital — lots of government and university accounting/audit work (state agencies, FSU). One of the cheapest Florida markets.' },
  'Charlotte, NC': { r1: 1460, r2: 1730, yoy: -1.4, tax: '3.99% flat (NC, 2026)', pop: '2.8M metro', blurb: 'The #2 banking center in the US (Bank of America HQ, Truist, large Wells Fargo hub) — deep market for finance and accounting roles. Suburbs in your tracker (Fort Mill, Mooresville, Davidson, Kannapolis) rent below the city median.' },
  'Raleigh, NC': { r1: 1290, r2: 1540, yoy: 0.0, tax: '3.99% flat (NC, 2026)', pop: '1.5M metro', blurb: 'Research Triangle anchor — state government, tech, and pharma HQs mean steady corporate accounting demand. Mild rents for a fast-growing metro.' },
  'Durham, NC': { r1: 1320, r2: 1670, yoy: -7.0, tax: '3.99% flat (NC, 2026)', pop: 'Part of 2.4M Triangle', blurb: 'Duke, biotech, and startups. 1BR rents falling — more negotiating room than Raleigh right now.' },
  'Philadelphia, PA': { r1: 1470, r2: 1750, yoy: -3.9, tax: '3.07% flat (PA) + ~3.74% Philadelphia city wage tax', pop: '6.2M metro', blurb: 'Watch the tax stack: PA\'s flat 3.07% plus Philly\'s city wage tax (~3.74% for residents) takes a real bite — living in the PA or NJ suburbs (Media, Malvern, Berwyn, Voorhees) changes the math. Big Four and mid-tier firms all have offices here.' },
  'Pittsburgh, PA': { r1: 1360, r2: 1600, yoy: 4.6, tax: '3.07% flat (PA) + ~3% local earned income tax in city', pop: '2.4M metro', blurb: 'Rents rising but still affordable. Healthcare (UPMC), banking (PNC HQ), and universities anchor the job market.' },
  'Washington, DC': { r1: 2300, r2: 3000, yoy: 0.0, tax: 'DC brackets 4%–10.75%', pop: '6.4M metro', blurb: 'Federal agencies, contractors, and the nonprofits around them hire accountants constantly. Expensive, and DC income tax is among the steepest on your list. NoVA (Alexandria, McLean) and Maryland (Rockville, Gaithersburg) have different tax regimes — worth comparing.' },
  'Alexandria, VA': { r1: 1950, r2: 2500, yoy: 0.5, tax: 'VA 2%–5.75%', pop: 'Part of 6.4M DC metro', blurb: 'DC-adjacent with Virginia taxes (top 5.75%) instead of DC\'s. Dense with government contractors — CPA-track roles in govcon accounting are plentiful.' },
  'Baltimore, MD': { r1: 1250, r2: 1650, yoy: -3.8, tax: 'MD 2%–5.75% + ~3.2% local county/city tax', pop: '2.8M metro', blurb: 'Much cheaper than DC with commuter rail access to it. Maryland layers a ~3.2% local tax on top of state rates. Owings Mills is the cheaper suburban option in your tracker.' },
  'Richmond, VA': { r1: 1410, r2: 1650, yoy: 0.7, tax: 'VA 2%–5.75%', pop: '1.3M metro', blurb: 'State capital with a solid banking/finance corridor (Capital One\'s big campus is nearby, plus the Fed\'s Richmond branch). Stable rents, mid-size-city cost of living.' },
  'Dallas, TX': { r1: 1350, r2: 1860, yoy: -6.9, tax: 'None (TX has no state income tax)', pop: '8.1M metro (DFW)', blurb: 'More corporate headquarters than almost anywhere — enormous accounting job market. Rents falling amid heavy supply. Irving and Fort Worth rent cheaper than Dallas proper.' },
  'Fort Worth, TX': { r1: 1250, r2: 1520, yoy: 1.6, tax: 'None (TX has no state income tax)', pop: 'Part of 8.1M DFW metro', blurb: 'Cheaper half of the Metroplex with its own downtown and employer base. No state income tax makes offers here stretch far.' },
  'Irving, TX': { r1: 1290, r2: 1640, yoy: 0.0, tax: 'None (TX has no state income tax)', pop: 'Part of 8.1M DFW metro', blurb: 'Las Colinas is a Fortune-500 HQ cluster (McKesson, Caterpillar, ExxonMobil nearby) — dense with corporate accounting roles, and central to the whole Metroplex.' },
  'Houston, TX': { r1: 1100, r2: 1400, yoy: -14.1, tax: 'None (TX has no state income tax)', pop: '7.5M metro', blurb: 'Recently the steepest 1BR rent drop in the nation — a renter\'s market. Energy, healthcare, and the Big Four all hire heavily. No state income tax.' },
  'Nashville, TN': { r1: 1500, r2: 1720, yoy: -7.4, tax: 'None (TN has no state income tax)', pop: '2.1M metro', blurb: 'Healthcare-company capital (HCA and dozens of others) plus relocated HQs. Rents down after a building boom. Franklin/Brentwood run above the city median; Gallatin below.' },
  'Knoxville, TN': { r1: 1200, r2: 1540, yoy: -1.6, tax: 'None (TN has no state income tax)', pop: '~950K metro', blurb: 'College town economics with low costs and no state income tax.' },
  'Chattanooga, TN': { r1: 1160, r2: 1300, yoy: -3.3, tax: 'None (TN has no state income tax)', pop: '~600K metro', blurb: 'Small, outdoorsy, cheap. Insurance (Unum HQ) and logistics anchor the white-collar market.' },
  'Memphis, TN': { r1: 900, r2: 990, yoy: -10.0, tax: 'None (TN has no state income tax)', pop: '1.3M metro', blurb: 'FedEx HQ dominates — large corporate finance org. Among the cheapest big-city rents anywhere. Neighborhood quality varies sharply; research blocks, not just zip codes. Collierville is the polished suburb in your tracker.' },
  'Atlanta, GA': { r1: 1680, r2: 2090, yoy: 4.3, tax: '4.99% flat (GA, 2026)', pop: '6.3M metro', blurb: 'Rents rising again — one of few Sun Belt markets already recovered. Fortune 500 density (Coca-Cola, Delta, Home Depot, UPS) means a deep accounting market. Alpharetta is the northern-suburb office hub.' },
  'Cincinnati, OH': { r1: 1100, r2: 1410, yoy: -3.5, tax: '2.75% flat (OH, 2026) + ~1.8% city earnings tax', pop: '2.3M metro', blurb: 'Kroger and P&G HQs plus a strong regional-firm scene. Ohio moved to a flat 2.75% in 2026; cities add their own earnings tax. Mason and Covington (KY side) are common cheaper bases.' },
  'Columbus, OH': { r1: 1180, r2: 1380, yoy: -0.8, tax: '2.75% flat (OH, 2026) + 2.5% city earnings tax', pop: '2.2M metro', blurb: 'State capital, OSU, and big insurance/banking employers (Nationwide, Huntington). Growing fast for a Midwest metro but still cheap. New Albany and Reynoldsburg from your tracker are suburb options.' },
  'Cleveland, OH': { r1: 1200, r2: 1250, yoy: 3.4, tax: '2.75% flat (OH, 2026) + 2.5% city earnings tax', pop: '2.1M metro', blurb: 'Unusual market: 2BRs barely cost more than 1BRs — roommate or extra-room math is great. Healthcare giants (Cleveland Clinic) and banks (KeyBank HQ) anchor hiring. Westlake and Mentor are the tracker suburbs.' },
  'Akron, OH': { r1: 800, r2: 930, yoy: 2.6, tax: '2.75% flat (OH, 2026) + 2.5% city earnings tax', pop: '~700K metro', blurb: 'One of the cheapest markets on your list. Goodyear HQ. Half an hour from Cleveland\'s job market.' },
  'Toledo, OH': { r1: 750, r2: 950, yoy: 0.0, tax: '2.75% flat (OH, 2026) + 2.5% city earnings tax', pop: '~640K metro', blurb: 'Cheapest city on your list. Smaller white-collar market — best paired with a specific offer in hand.' },
  'St Louis, MO': { r1: 1050, r2: 1400, yoy: 11.7, tax: 'MO 2%–4.7% + 1% city earnings tax', pop: '2.8M metro', blurb: 'Watch out: 1BR rents recently the fastest riser on your list, though the base is still low. Big corporate presence (Edward Jones, Centene, Boeing defense). The 1% city earnings tax applies if you live or work in the city proper; Fenton and other suburbs avoid it.' },
  'Indianapolis, IN': { r1: 1010, r2: 1290, yoy: -8.2, tax: '2.95% flat (IN, 2026) + ~2% county tax', pop: '2.1M metro', blurb: 'Cheap and falling. Eli Lilly, Salesforce, and a large insurance sector. Indiana\'s flat tax dropped to 2.95% this year; counties add roughly 2%.' },
  'Milwaukee, WI': { r1: 1100, r2: 1340, yoy: 0.0, tax: 'WI 3.5%–7.65%', pop: '1.6M metro', blurb: 'Northwestern Mutual, Fiserv, and manufacturing HQs. Flat rents, low base. Note WI\'s income tax climbs to 7.65% at higher incomes — worth modeling against the no-tax states on your list.' },
  'Phoenix, AZ': { r1: 1200, r2: 1500, yoy: -4.0, tax: '2.5% flat (AZ)', pop: '5.1M metro', blurb: 'Massive apartment supply wave = renter\'s market with common concessions (a free month is negotiable). AZ\'s 2.5% flat tax is the lowest of any state that has one. Big regional accounting hub.' },
  'Oklahoma City, OK': { r1: 880, r2: 1100, yoy: -2.2, tax: 'OK top rate ~4.5% (cut in 2026)', pop: '1.5M metro', blurb: 'Second-cheapest big city on your list. Energy and state government anchor hiring. OK cut income taxes effective 2026.' },
  'Omaha, NE': { r1: 1020, r2: 1400, yoy: 0.0, tax: 'NE top rate ~4.55% (cutting annually)', pop: '~1M metro', blurb: 'Berkshire Hathaway, Mutual of Omaha, Kiewit — outsized corporate finance presence for the metro\'s size. Stable, cheap, low-drama market.' },
  'Sioux Falls, SD': { r1: 950, r2: 1150, yoy: 0.0, tax: 'None (SD has no state income tax)', pop: '~300K metro', blurb: 'Banking back-office hub (credit card operations moved here for SD\'s bank-friendly laws) — real accounting employment for a small city. No state income tax.' },
  'Birmingham, AL': { r1: 1000, r2: 1250, yoy: 0.0, tax: 'AL 2%–5% + ~1% occupational tax in city', pop: '1.1M metro', blurb: 'Regions Bank HQ and a large healthcare sector (UAB).' },
  'Des Moines, IA': { r1: 870, r2: 1080, yoy: -6.5, tax: '3.8% flat (IA, 2026)', pop: '~750K metro', blurb: 'Insurance capital of the Midwest (Principal HQ, dozens of carriers) — strong steady demand for accountants. West Des Moines is the office-park suburb.' },
  'New York, NY': { r1: 4660, r2: 5620, yoy: 4.0, tax: 'NY 4%–10.9% + NYC city tax ~3–3.9%', pop: '19.5M metro', blurb: 'The deepest accounting job market in the country and the most expensive rent on your list by far. The 30% rule effectively requires ~$186K salary for a median 1BR — most people share apartments or live in outer boroughs/Jersey. State + city tax stack tops 14%.' },
  'Providence, RI': { r1: 1880, r2: 2200, yoy: 9.3, tax: 'RI 3.75%–5.99%', pop: '1.7M metro', blurb: 'Boston spillover is pricing this market up fast. Move quick on listings here; it\'s a tightening market, not a soft one.' },
  'Hartford, CT': { r1: 1400, r2: 1700, yoy: 3.0, tax: 'CT 2%–6.99%', pop: '1.2M metro', blurb: 'Insurance capital (Aetna, Travelers, The Hartford) — dense actuarial/accounting employment. CT taxes are mid-to-high.' },
  'Stamford, CT': { r1: 2500, r2: 3200, yoy: 2.0, tax: 'CT 2%–6.99%', pop: 'Part of NYC commuter belt', blurb: 'NYC-money market: hedge funds, banks, and corporate HQs (Charter, Philip Morris). Expensive — or look inland (Norwalk, Bridgeport are cheaper).' },
  'Charleston, SC': { r1: 1950, r2: 2590, yoy: 3.2, tax: 'SC top rate 6.2% (phasing down)', pop: '~850K metro', blurb: 'Booming and priced like it. Boeing, Volvo, and the port drive growth. Moncks Corner and the outer suburbs are the affordable route.' },
  'Columbia, SC': { r1: 1150, r2: 1350, yoy: 1.0, tax: 'SC top rate 6.2% (phasing down)', pop: '~850K metro', blurb: 'State capital and University of South Carolina — government and regional-firm accounting work. Far cheaper than Charleston.' }
};

/** Generic 2026 state income-tax notes for cities outside the detailed list. */
export const STATE_TAX: Record<string, string> = {
  AL: 'AL 2%–5%', AK: 'None (AK)', AR: 'AR top ~3.9% (2026)', AZ: '2.5% flat (AZ)', CA: 'CA 1%–13.3%', CO: '4.4% flat (CO)', CT: 'CT 2%–6.99%', DC: 'DC 4%–10.75%', DE: 'DE 2.2%–6.6%', FL: 'None (FL)', GA: '4.99% flat (GA, 2026)', HI: 'HI up to 11%', ID: '~5.3% flat (ID)', IL: '4.95% flat (IL)', IN: '2.95% flat (IN, 2026) + county', IA: '3.8% flat (IA)', KS: 'KS up to 5.58%', KY: '3.5% flat (KY, 2026)', LA: '3% flat (LA)', MA: '5% flat (MA, 9% over $1M)', MD: 'MD 2%–5.75% + local', ME: 'ME 5.8%–7.15%', MI: '4.25% flat (MI)', MN: 'MN 5.35%–9.85%', MO: 'MO 2%–4.7%', MS: 'MS ~4.4% flat (phasing down)', MT: 'MT top ~5.9%', NC: '3.99% flat (NC, 2026)', ND: 'ND up to 2.5%', NE: 'NE top ~4.55%', NV: 'None (NV)', NH: 'None on wages (NH)', NJ: 'NJ 1.4%–10.75%', NM: 'NM 1.7%–5.9%', NY: 'NY 4%–10.9%', OH: '2.75% flat (OH, 2026) + city', OK: 'OK top ~4.5%', OR: 'OR 4.75%–9.9%', PA: '3.07% flat (PA) + local', RI: 'RI 3.75%–5.99%', SC: 'SC top 6.2%', SD: 'None (SD)', TN: 'None (TN)', TX: 'None (TX)', UT: '4.55% flat (UT)', VA: 'VA 2%–5.75%', VT: 'VT 3.35%–8.75%', WA: 'None on wages (WA)', WI: 'WI 3.5%–7.65%', WV: 'WV ~4.8%', WY: 'None (WY)'
};

/** Rest of Zumper's top-100 (June 2026) beyond the detailed metros: [city, 1BR, 1BR YoY%, 2BR]. */
const TOP100: [string, number, number, number][] = [
  ['San Francisco, CA', 4060, 21.9, 5700], ['Boston, MA', 2950, 3.5, 3600], ['Jersey City, NJ', 2920, 6.6, 3000], ['San Jose, CA', 2760, 2.6, 3510], ['Miami, FL', 2610, -3.3, 3470], ['Arlington, VA', 2450, 0.8, 3310], ['Urban Honolulu, HI', 2360, 7.3, 3100], ['San Diego, CA', 2220, -3.5, 3000], ['Santa Ana, CA', 2210, -0.5, 2800], ['Chicago, IL', 2200, 10.0, 2600], ['Los Angeles, CA', 2200, -4.3, 2970], ['Anaheim, CA', 2080, 2.5, 2680], ['Oakland, CA', 2070, 6.2, 2600], ['Seattle, WA', 1980, 1.0, 2870], ['New Haven, CT', 1870, -8.3, 2150], ['Long Beach, CA', 1850, 0.5, 2400], ['Scottsdale, AZ', 1800, 5.9, 2500], ['Virginia Beach, VA', 1690, 7.6, 1910], ['Newark, NJ', 1600, -6.4, 1930], ['Denver, CO', 1570, -7.6, 2220], ['Gilbert, AZ', 1570, 0.6, 1950], ['Madison, WI', 1550, -2.5, 1860], ['Sacramento, CA', 1500, 0.0, 1870], ['New Orleans, LA', 1450, -4.0, 1650], ['Asheville, NC', 1400, -4.8, 1700], ['Henderson, NV', 1400, -11.9, 1790], ['Portland, OR', 1400, -1.4, 1700], ['Plano, TX', 1370, -2.8, 1900], ['Syracuse, NY', 1350, 1.5, 1500], ['Austin, TX', 1330, -12.5, 1750], ['Reno, NV', 1310, 0.8, 1730], ['Boise, ID', 1300, -7.1, 1500], ['Fresno, CA', 1290, -3.0, 1560], ['Minneapolis, MN', 1280, 1.6, 1750], ['Anchorage, AK', 1270, -1.6, 1730], ['Buffalo, NY', 1250, 4.2, 1400], ['Norfolk, VA', 1250, 2.5, 1550], ['Rochester, NY', 1230, 2.5, 1410], ['Aurora, CO', 1200, -7.7, 1780], ['Salt Lake City, UT', 1200, -2.4, 1600], ['Las Vegas, NV', 1190, -1.7, 1450], ['Mesa, AZ', 1150, -7.3, 1450], ['Kansas City, MO', 1140, 0.9, 1400], ['Jacksonville, FL', 1130, -5.0, 1340], ['Bakersfield, CA', 1110, -3.5, 1480], ['Colorado Springs, CO', 1100, 0.0, 1500], ['Arlington, TX', 1080, 1.9, 1450], ['Glendale, AZ', 1050, -1.9, 1360], ['Louisville, KY', 1050, -0.9, 1200], ['Spokane, WA', 1050, -4.5, 1300], ['Augusta, GA', 1010, 1.0, 1130], ['Baton Rouge, LA', 1000, 3.1, 1100], ['Greensboro, NC', 1000, 0.0, 1250], ['Lexington, KY', 990, -4.8, 1350], ['Albuquerque, NM', 980, 3.2, 1300], ['San Antonio, TX', 950, -10.4, 1250], ['Detroit, MI', 940, -6.9, 1100], ['Tulsa, OK', 930, 2.2, 1160], ['Winston Salem, NC', 920, -3.2, 1200], ['Tucson, AZ', 900, -1.1, 1250], ['Lincoln, NE', 860, -3.4, 1130], ['El Paso, TX', 830, -6.7, 1200], ['Wichita, KS', 750, -3.8, 900], ['Shreveport, LA', 720, -8.9, 860]
];

function stateOf(name: string): string {
  return (name.match(/,\s*([A-Za-z]{2})$/) || [])[1]?.toUpperCase() || '';
}

function cityOf(name: string): string {
  return name.replace(/,\s*[A-Za-z]{2}$/, '').trim();
}

/** Build the immutable seed city map keyed by canonical "City, ST". */
function buildSeed(): Map<string, City> {
  const map = new Map<string, City>();

  for (const [name, d] of Object.entries(DETAILED)) {
    const coord = COORDS[name];
    map.set(name, {
      name,
      city: cityOf(name),
      state: stateOf(name),
      r1: d.r1,
      r2: d.r2,
      yoy: d.yoy,
      tax: d.tax,
      pop: d.pop,
      blurb: d.blurb,
      lat: coord?.[0],
      lng: coord?.[1],
      source: 'zumper-snapshot',
      rentMetric: 'median-asking',
      rentArea: name,
      rentYear: 'June 2026'
    });
  }

  for (const [name, r1, yoy, r2] of TOP100) {
    if (map.has(name)) continue;
    const st = stateOf(name);
    const coord = COORDS[name];
    map.set(name, {
      name,
      city: cityOf(name),
      state: st,
      r1,
      r2,
      yoy,
      tax: STATE_TAX[st] || 'varies',
      pop: '',
      blurb: '',
      lat: coord?.[0],
      lng: coord?.[1],
      source: 'zumper-snapshot',
      rentMetric: 'median-asking',
      rentArea: name,
      rentYear: 'June 2026'
    });
  }

  return map;
}

/** The seed cities as an array, sorted by name. */
export const SEED_CITIES: City[] = [...buildSeed().values()].sort((a, b) =>
  a.name.localeCompare(b.name)
);

/** Case-insensitive lookup of a seed city by "City, ST". */
export function findSeedCity(name: string): City | undefined {
  const target = name.trim().toLowerCase();
  return SEED_CITIES.find((c) => c.name.toLowerCase() === target);
}

export { stateOf, cityOf };
