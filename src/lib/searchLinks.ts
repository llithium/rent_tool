import type { CityParts } from './format';
import { money } from './format';

export interface SearchLink {
  label: string;
  url: string;
}

/** Build pre-filtered apartment-search links for a city + max rent.
 * Migrated from the original artifact (Apartments.com, Zillow, Zumper, HotPads). */
export function buildSearchLinks(parts: CityParts, maxRent: number): SearchLink[] {
  const capped = Math.max(500, Math.floor(maxRent / 100) * 100);

  const zState = {
    usersSearchTerm: `${parts.city}, ${parts.state}`,
    filterState: {
      fr: { value: true },
      fsba: { value: false },
      fsbo: { value: false },
      nc: { value: false },
      cmsn: { value: false },
      auc: { value: false },
      fore: { value: false },
      mp: { min: null, max: Math.round(maxRent) }
    },
    isListVisible: true
  };

  return [
    {
      label: `Apartments.com · under ${money(capped)}`,
      url: `https://www.apartments.com/${parts.slug}-${parts.st}/under-${capped}/`
    },
    {
      label: `Zillow · under ${money(maxRent)}`,
      url: `https://www.zillow.com/${parts.slug}-${parts.st}/rentals/?searchQueryState=${encodeURIComponent(
        JSON.stringify(zState)
      )}`
    },
    {
      label: 'Zumper',
      url: `https://www.zumper.com/apartments-for-rent/${parts.slug}-${parts.st}`
    },
    {
      label: 'HotPads',
      url: `https://hotpads.com/${parts.slug}-${parts.st}/apartments-for-rent`
    }
  ];
}
