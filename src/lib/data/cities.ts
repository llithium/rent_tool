import type { City } from '$lib/types';
import { COORDS } from './coordinates';
import apartmentListData from './apartment-list-rents.json';

/** Curated context layered over the bundled Apartment List city estimates. */
interface SeedRecord {
  tax: string;
  pop: string;
  blurb: string;
}

interface ApartmentListData {
  meta: {
    source: string;
    period: string;
    label: string;
    dataUrl: string;
    termsUrl: string;
  };
  cities: Record<string, { r1: number; r2: number; yoy: number; population: number }>;
}

const RENT_DATA = apartmentListData as ApartmentListData;
export const RENT_DATA_META = RENT_DATA.meta;

const DETAILED: Record<string, SeedRecord> = {
  'Tampa, FL': { tax: 'None (FL has no state income tax)', pop: '3.4M metro', blurb: 'Big finance/insurance employment base (Raymond James, USAA, Citi ops). Heavy new apartment supply has pushed rents down, so renters have leverage — ask about concessions. No state income tax stretches an offer further.' },
  'St Petersburg, FL': { tax: 'None (FL has no state income tax)', pop: 'Part of 3.4M Tampa Bay metro', blurb: 'Raymond James is headquartered here; walkable downtown with a growing arts district. Check both St Pete and Tampa listings — they\'re 25 min apart.' },
  'Clearwater, FL': { tax: 'None (FL has no state income tax)', pop: 'Part of 3.4M Tampa Bay metro', blurb: 'Beach-adjacent, quieter than Tampa/St Pete. Rents track the Tampa Bay market. Commutes across the bay bridges can be slow at rush hour.' },
  'Orlando, FL': { tax: 'None (FL has no state income tax)', pop: '2.9M metro', blurb: 'One of the sharpest rent declines in the country thanks to a construction wave. Diverse economy beyond tourism: healthcare, defense/simulation, and a growing corporate accounting base.' },
  'Fort Lauderdale, FL': { tax: 'None (FL has no state income tax)', pop: '1.9M county (Broward)', blurb: 'Priciest of your Florida targets — falling, but from a high base. Broward suburbs (Coral Springs, Sunrise, Pompano, Deerfield) run meaningfully cheaper than downtown.' },
  'Tallahassee, FL': { tax: 'None (FL has no state income tax)', pop: '~400K metro', blurb: 'State capital — lots of government and university accounting/audit work (state agencies, FSU). One of the cheapest Florida markets.' },
  'Charlotte, NC': { tax: '3.99% flat (NC, 2026)', pop: '2.8M metro', blurb: 'The #2 banking center in the US (Bank of America HQ, Truist, large Wells Fargo hub) — deep market for finance and accounting roles. Suburbs in your tracker (Fort Mill, Mooresville, Davidson, Kannapolis) rent below the city median.' },
  'Raleigh, NC': { tax: '3.99% flat (NC, 2026)', pop: '1.5M metro', blurb: 'Research Triangle anchor — state government, tech, and pharma HQs mean steady corporate accounting demand. Mild rents for a fast-growing metro.' },
  'Durham, NC': { tax: '3.99% flat (NC, 2026)', pop: 'Part of 2.4M Triangle', blurb: 'Duke, biotech, and startups. 1BR rents falling — more negotiating room than Raleigh right now.' },
  'Philadelphia, PA': { tax: '3.07% flat (PA) + ~3.74% Philadelphia city wage tax', pop: '6.2M metro', blurb: 'Watch the tax stack: PA\'s flat 3.07% plus Philly\'s city wage tax (~3.74% for residents) takes a real bite — living in the PA or NJ suburbs (Media, Malvern, Berwyn, Voorhees) changes the math. Big Four and mid-tier firms all have offices here.' },
  'Pittsburgh, PA': { tax: '3.07% flat (PA) + ~3% local earned income tax in city', pop: '2.4M metro', blurb: 'Rents rising but still affordable. Healthcare (UPMC), banking (PNC HQ), and universities anchor the job market.' },
  'Washington, DC': { tax: 'DC brackets 4%–10.75%', pop: '6.4M metro', blurb: 'Federal agencies, contractors, and the nonprofits around them hire accountants constantly. Expensive, and DC income tax is among the steepest on your list. NoVA (Alexandria, McLean) and Maryland (Rockville, Gaithersburg) have different tax regimes — worth comparing.' },
  'Alexandria, VA': { tax: 'VA 2%–5.75%', pop: 'Part of 6.4M DC metro', blurb: 'DC-adjacent with Virginia taxes (top 5.75%) instead of DC\'s. Dense with government contractors — CPA-track roles in govcon accounting are plentiful.' },
  'Baltimore, MD': { tax: 'MD 2%–5.75% + ~3.2% local county/city tax', pop: '2.8M metro', blurb: 'Much cheaper than DC with commuter rail access to it. Maryland layers a ~3.2% local tax on top of state rates. Owings Mills is the cheaper suburban option in your tracker.' },
  'Richmond, VA': { tax: 'VA 2%–5.75%', pop: '1.3M metro', blurb: 'State capital with a solid banking/finance corridor (Capital One\'s big campus is nearby, plus the Fed\'s Richmond branch). Stable rents, mid-size-city cost of living.' },
  'Dallas, TX': { tax: 'None (TX has no state income tax)', pop: '8.1M metro (DFW)', blurb: 'More corporate headquarters than almost anywhere — enormous accounting job market. Rents falling amid heavy supply. Irving and Fort Worth rent cheaper than Dallas proper.' },
  'Fort Worth, TX': { tax: 'None (TX has no state income tax)', pop: 'Part of 8.1M DFW metro', blurb: 'Cheaper half of the Metroplex with its own downtown and employer base. No state income tax makes offers here stretch far.' },
  'Irving, TX': { tax: 'None (TX has no state income tax)', pop: 'Part of 8.1M DFW metro', blurb: 'Las Colinas is a Fortune-500 HQ cluster (McKesson, Caterpillar, ExxonMobil nearby) — dense with corporate accounting roles, and central to the whole Metroplex.' },
  'Houston, TX': { tax: 'None (TX has no state income tax)', pop: '7.5M metro', blurb: 'Recently the steepest 1BR rent drop in the nation — a renter\'s market. Energy, healthcare, and the Big Four all hire heavily. No state income tax.' },
  'Nashville, TN': { tax: 'None (TN has no state income tax)', pop: '2.1M metro', blurb: 'Healthcare-company capital (HCA and dozens of others) plus relocated HQs. Rents down after a building boom. Franklin/Brentwood run above the city median; Gallatin below.' },
  'Knoxville, TN': { tax: 'None (TN has no state income tax)', pop: '~950K metro', blurb: 'College town economics with low costs and no state income tax.' },
  'Chattanooga, TN': { tax: 'None (TN has no state income tax)', pop: '~600K metro', blurb: 'Small, outdoorsy, cheap. Insurance (Unum HQ) and logistics anchor the white-collar market.' },
  'Memphis, TN': { tax: 'None (TN has no state income tax)', pop: '1.3M metro', blurb: 'FedEx HQ dominates — large corporate finance org. Among the cheapest big-city rents anywhere. Neighborhood quality varies sharply; research blocks, not just zip codes. Collierville is the polished suburb in your tracker.' },
  'Atlanta, GA': { tax: '4.99% flat (GA, 2026)', pop: '6.3M metro', blurb: 'Rents rising again — one of few Sun Belt markets already recovered. Fortune 500 density (Coca-Cola, Delta, Home Depot, UPS) means a deep accounting market. Alpharetta is the northern-suburb office hub.' },
  'Cincinnati, OH': { tax: '2.75% flat (OH, 2026) + ~1.8% city earnings tax', pop: '2.3M metro', blurb: 'Kroger and P&G HQs plus a strong regional-firm scene. Ohio moved to a flat 2.75% in 2026; cities add their own earnings tax. Mason and Covington (KY side) are common cheaper bases.' },
  'Columbus, OH': { tax: '2.75% flat (OH, 2026) + 2.5% city earnings tax', pop: '2.2M metro', blurb: 'State capital, OSU, and big insurance/banking employers (Nationwide, Huntington). Growing fast for a Midwest metro but still cheap. New Albany and Reynoldsburg from your tracker are suburb options.' },
  'Cleveland, OH': { tax: '2.75% flat (OH, 2026) + 2.5% city earnings tax', pop: '2.1M metro', blurb: 'Unusual market: 2BRs barely cost more than 1BRs — roommate or extra-room math is great. Healthcare giants (Cleveland Clinic) and banks (KeyBank HQ) anchor hiring. Westlake and Mentor are the tracker suburbs.' },
  'Akron, OH': { tax: '2.75% flat (OH, 2026) + 2.5% city earnings tax', pop: '~700K metro', blurb: 'One of the cheapest markets on your list. Goodyear HQ. Half an hour from Cleveland\'s job market.' },
  'Toledo, OH': { tax: '2.75% flat (OH, 2026) + 2.5% city earnings tax', pop: '~640K metro', blurb: 'Cheapest city on your list. Smaller white-collar market — best paired with a specific offer in hand.' },
  'St Louis, MO': { tax: 'MO 2%–4.7% + 1% city earnings tax', pop: '2.8M metro', blurb: 'Watch out: 1BR rents recently the fastest riser on your list, though the base is still low. Big corporate presence (Edward Jones, Centene, Boeing defense). The 1% city earnings tax applies if you live or work in the city proper; Fenton and other suburbs avoid it.' },
  'Indianapolis, IN': { tax: '2.95% flat (IN, 2026) + ~2% county tax', pop: '2.1M metro', blurb: 'Cheap and falling. Eli Lilly, Salesforce, and a large insurance sector. Indiana\'s flat tax dropped to 2.95% this year; counties add roughly 2%.' },
  'Milwaukee, WI': { tax: 'WI 3.5%–7.65%', pop: '1.6M metro', blurb: 'Northwestern Mutual, Fiserv, and manufacturing HQs. Flat rents, low base. Note WI\'s income tax climbs to 7.65% at higher incomes — worth modeling against the no-tax states on your list.' },
  'Phoenix, AZ': { tax: '2.5% flat (AZ)', pop: '5.1M metro', blurb: 'Massive apartment supply wave = renter\'s market with common concessions (a free month is negotiable). AZ\'s 2.5% flat tax is the lowest of any state that has one. Big regional accounting hub.' },
  'Oklahoma City, OK': { tax: 'OK top rate ~4.5% (cut in 2026)', pop: '1.5M metro', blurb: 'Second-cheapest big city on your list. Energy and state government anchor hiring. OK cut income taxes effective 2026.' },
  'Omaha, NE': { tax: 'NE top rate ~4.55% (cutting annually)', pop: '~1M metro', blurb: 'Berkshire Hathaway, Mutual of Omaha, Kiewit — outsized corporate finance presence for the metro\'s size. Stable, cheap, low-drama market.' },
  'Sioux Falls, SD': { tax: 'None (SD has no state income tax)', pop: '~300K metro', blurb: 'Banking back-office hub (credit card operations moved here for SD\'s bank-friendly laws) — real accounting employment for a small city. No state income tax.' },
  'Birmingham, AL': { tax: 'AL 2%–5% + ~1% occupational tax in city', pop: '1.1M metro', blurb: 'Regions Bank HQ and a large healthcare sector (UAB).' },
  'Des Moines, IA': { tax: '3.8% flat (IA, 2026)', pop: '~750K metro', blurb: 'Insurance capital of the Midwest (Principal HQ, dozens of carriers) — strong steady demand for accountants. West Des Moines is the office-park suburb.' },
  'New York, NY': { tax: 'NY 4%–10.9% + NYC city tax ~3–3.9%', pop: '19.5M metro', blurb: 'The deepest accounting job market in the country. Shared apartments, outer-borough neighborhoods, or New Jersey can change the housing math substantially. State + city tax stack tops 14%.' },
  'Providence, RI': { tax: 'RI 3.75%–5.99%', pop: '1.7M metro', blurb: 'Boston spillover is pricing this market up fast. Move quick on listings here; it\'s a tightening market, not a soft one.' },
  'Hartford, CT': { tax: 'CT 2%–6.99%', pop: '1.2M metro', blurb: 'Insurance capital (Aetna, Travelers, The Hartford) — dense actuarial/accounting employment. CT taxes are mid-to-high.' },
  'Stamford, CT': { tax: 'CT 2%–6.99%', pop: 'Part of NYC commuter belt', blurb: 'NYC-money market: hedge funds, banks, and corporate HQs (Charter, Philip Morris). Expensive — or look inland (Norwalk, Bridgeport are cheaper).' },
  'Charleston, SC': { tax: 'SC top rate 6.2% (phasing down)', pop: '~850K metro', blurb: 'Booming and priced like it. Boeing, Volvo, and the port drive growth. Moncks Corner and the outer suburbs are the affordable route.' },
  'Columbia, SC': { tax: 'SC top rate 6.2% (phasing down)', pop: '~850K metro', blurb: 'State capital and University of South Carolina — government and regional-firm accounting work. Far cheaper than Charleston.' }
};

/** Generic 2026 state income-tax notes for cities outside the detailed list. */
export const STATE_TAX: Record<string, string> = {
  AL: 'AL 2%–5%', AK: 'None (AK)', AR: 'AR top ~3.9% (2026)', AZ: '2.5% flat (AZ)', CA: 'CA 1%–13.3%', CO: '4.4% flat (CO)', CT: 'CT 2%–6.99%', DC: 'DC 4%–10.75%', DE: 'DE 2.2%–6.6%', FL: 'None (FL)', GA: '4.99% flat (GA, 2026)', HI: 'HI up to 11%', ID: '~5.3% flat (ID)', IL: '4.95% flat (IL)', IN: '2.95% flat (IN, 2026) + county', IA: '3.8% flat (IA)', KS: 'KS up to 5.58%', KY: '3.5% flat (KY, 2026)', LA: '3% flat (LA)', MA: '5% flat (MA, 9% over $1M)', MD: 'MD 2%–5.75% + local', ME: 'ME 5.8%–7.15%', MI: '4.25% flat (MI)', MN: 'MN 5.35%–9.85%', MO: 'MO 2%–4.7%', MS: 'MS ~4.4% flat (phasing down)', MT: 'MT top ~5.9%', NC: '3.99% flat (NC, 2026)', ND: 'ND up to 2.5%', NE: 'NE top ~4.55%', NV: 'None (NV)', NH: 'None on wages (NH)', NJ: 'NJ 1.4%–10.75%', NM: 'NM 1.7%–5.9%', NY: 'NY 4%–10.9%', OH: '2.75% flat (OH, 2026) + city', OK: 'OK top ~4.5%', OR: 'OR 4.75%–9.9%', PA: '3.07% flat (PA) + local', RI: 'RI 3.75%–5.99%', SC: 'SC top 6.2%', SD: 'None (SD)', TN: 'None (TN)', TX: 'None (TX)', UT: '4.55% flat (UT)', VA: 'VA 2%–5.75%', VT: 'VT 3.35%–8.75%', WA: 'None on wages (WA)', WI: 'WI 3.5%–7.65%', WV: 'WV ~4.8%', WY: 'None (WY)'
};

function stateOf(name: string): string {
  return (name.match(/,\s*([A-Za-z]{2})$/) || [])[1]?.toUpperCase() || '';
}

function cityOf(name: string): string {
  return name.replace(/,\s*[A-Za-z]{2}$/, '').trim();
}

function normalizedCityKey(name: string): string {
  const key = name
    .trim()
    .toLowerCase()
    .replace(/[.\-]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
  return key === 'new york city ny' ? 'new york ny' : key;
}

/** Build the immutable seed city map keyed by canonical "City, ST". */
function buildSeed(): Map<string, City> {
  const map = new Map<string, City>();
  const details = new Map(
    Object.entries(DETAILED).map(([name, record]) => [normalizedCityKey(name), record] as const)
  );

  for (const [name, rent] of Object.entries(RENT_DATA.cities)) {
    const d = details.get(normalizedCityKey(name));
    const st = stateOf(name);
    const coord = COORDS[name];
    map.set(name, {
      name,
      city: cityOf(name),
      state: st,
      r1: rent.r1,
      r2: rent.r2,
      yoy: rent.yoy,
      tax: d?.tax ?? STATE_TAX[st] ?? 'varies',
      pop: d?.pop ?? (rent.population > 0 ? rent.population.toLocaleString('en-US') : ''),
      blurb: d?.blurb ?? '',
      lat: coord?.[0],
      lng: coord?.[1],
      source: 'apartment-list',
      rentMetric: 'estimated-median',
      rentArea: name,
      rentYear: RENT_DATA.meta.label
    });
  }

  // Retain curated context for cities missing from this Apartment List release.
  // Their rents are resolved through the normal bundled HUD fallback when selected.
  for (const [name, d] of Object.entries(DETAILED)) {
    if ([...map.keys()].some((candidate) => normalizedCityKey(candidate) === normalizedCityKey(name))) continue;
    const st = stateOf(name);
    const coord = COORDS[name];
    map.set(name, {
      name,
      city: cityOf(name),
      state: st,
      r1: null,
      r2: null,
      yoy: null,
      tax: d.tax,
      pop: d.pop,
      blurb: d.blurb,
      lat: coord?.[0],
      lng: coord?.[1],
      source: 'none',
      rentMetric: 'unknown',
      rentArea: name,
      rentYear: ''
    });
  }

  return map;
}

/** The seed cities as an array, sorted by name. */
export const SEED_CITIES: City[] = [...buildSeed().values()].sort((a, b) =>
  a.name.localeCompare(b.name)
);

const SEED_BY_KEY = new Map(SEED_CITIES.map((city) => [normalizedCityKey(city.name), city]));

/** Punctuation-tolerant lookup of a seed city by "City, ST". */
export function findSeedCity(name: string): City | undefined {
  return SEED_BY_KEY.get(normalizedCityKey(name));
}

export { stateOf, cityOf };
