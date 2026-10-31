// ==========================================================
// PROFMATCH AI — GLOBAL GEOGRAPHIC ARCHITECTURE
// Powered by https://countries.dev/countries + Academic Subdivisions
// ==========================================================

import { COUNTRIES_DATA } from './countries-data';

export interface GlobalCountry {
  code: string;           // ISO 3166-1 alpha-3 code (e.g. USA, GBR, PAK)
  code2?: string;          // ISO 3166-1 alpha-2 code (e.g. US, GB, PK)
  name: string;           // Standard academic/common English name (e.g. United States)
  officialName?: string;  // Full official state name (e.g. United States of America)
  flag?: string;          // Native Unicode Flag emoji (e.g. 🇺🇸, 🇬🇧, 🇵🇰)
  flagUrl?: string;       // Vector SVG or PNG flag image URL
  regionLabel: string;    // State, Province, Prefecture, Bundesland, County, Region, etc.
  continent: string;      // North America, Europe, Asia, Africa, Oceania, South America
  subregion?: string;     // Subregion (e.g. Southern Asia, Western Europe)
  capital?: string;       // Capital city (e.g. Washington, D.C., Islamabad, Berlin)
  currencies?: Array<{ code: string; name: string; symbol: string }>;
  hasSubdivisions: boolean;
  regions?: string[];     // Academic / administrative subdivisions (States, Provinces, Bundeslands)
}

export const COUNTRIES_API_URL = 'https://countries.dev/countries';

// 250 Global Countries and territories enriched with academic subdivision hubs
export const GLOBAL_COUNTRIES: GlobalCountry[] = [...COUNTRIES_DATA] as unknown as GlobalCountry[];

// Indexed lookup map for O(1) matching by code, 2-letter code, common name, or official name
const COUNTRY_MAP = new Map<string, GlobalCountry>();

GLOBAL_COUNTRIES.forEach(c => {
  if (c.code) COUNTRY_MAP.set(c.code.toLowerCase(), c);
  if (c.code2) COUNTRY_MAP.set(c.code2.toLowerCase(), c);
  if (c.name) COUNTRY_MAP.set(c.name.toLowerCase(), c);
  if (c.officialName) COUNTRY_MAP.set(c.officialName.toLowerCase(), c);
});

// Common alternative aliases
const COUNTRY_ALIASES: Record<string, string> = {
  'us': 'USA',
  'usa': 'USA',
  'united states': 'USA',
  'united states of america': 'USA',
  'america': 'USA',
  'uk': 'GBR',
  'gbr': 'GBR',
  'united kingdom': 'GBR',
  'great britain': 'GBR',
  'england': 'GBR',
  'uae': 'ARE',
  'united arab emirates': 'ARE',
  'south korea': 'KOR',
  'republic of korea': 'KOR',
  'korea': 'KOR',
  'pakistan': 'PAK',
  'germany': 'DEU',
  'deutschland': 'DEU',
  'russia': 'RUS',
  'russian federation': 'RUS',
};

Object.entries(COUNTRY_ALIASES).forEach(([alias, targetCode]) => {
  const match = COUNTRY_MAP.get(targetCode.toLowerCase());
  if (match) {
    COUNTRY_MAP.set(alias.toLowerCase(), match);
  }
});

/**
 * Returns all 250 sovereign countries and territories with flags and metadata.
 */
export function getAllCountries(): GlobalCountry[] {
  return GLOBAL_COUNTRIES;
}

/**
 * Lookup a country by name, alpha-3 code, alpha-2 code, or common alias.
 */
export function getCountryByNameOrCode(query: string): GlobalCountry | null {
  if (!query) return null;
  const clean = query.trim().toLowerCase();

  // Fast map lookup
  if (COUNTRY_MAP.has(clean)) {
    return COUNTRY_MAP.get(clean)!;
  }

  // Exact name or code match
  for (const c of GLOBAL_COUNTRIES) {
    if (c.name.toLowerCase() === clean || c.code.toLowerCase() === clean || (c.code2 && c.code2.toLowerCase() === clean)) {
      return c;
    }
  }

  // Substring match for longer queries (>3 chars to prevent accidental sub-matches)
  if (clean.length >= 3) {
    for (const c of GLOBAL_COUNTRIES) {
      if (c.name.toLowerCase().includes(clean) || clean.includes(c.name.toLowerCase())) {
        return c;
      }
    }
  }

  return null;
}

/**
 * Returns academic subdivisions (states, provinces, bundeslands, cantons) for a country.
 */
export function getRegionsForCountry(countryNameOrCode: string): string[] {
  const country = getCountryByNameOrCode(countryNameOrCode);
  if (country && country.regions) {
    return country.regions;
  }
  return [];
}

/**
 * Parses location text (e.g. university address or professor profile bio) to find country & region.
 */
export function parseLocationFromText(text: string): { country?: string; region?: string; city?: string } {
  if (!text) return {};
  const lower = text.toLowerCase();

  for (const c of GLOBAL_COUNTRIES) {
    // Check country name or isolated 3-letter code
    const countryMatch =
      lower.includes(c.name.toLowerCase()) ||
      (c.code.length >= 3 && (lower.includes(` ${c.code.toLowerCase()} `) || lower.endsWith(` ${c.code.toLowerCase()}`) || lower.startsWith(`${c.code.toLowerCase()} `)));

    // Check regions
    if (c.regions && c.regions.length > 0) {
      for (const r of c.regions) {
        const cleanRegion = r.split('(')[0].trim().toLowerCase();
        if (cleanRegion.length >= 3 && lower.includes(cleanRegion)) {
          return { country: c.name, region: r };
        }
      }
    }

    if (countryMatch) {
      return { country: c.name };
    }
  }

  return {};
}

/**
 * Dynamic fetcher from the live Countries API (https://countries.dev/countries)
 * with graceful fallback to cached 250-country dataset.
 */
export async function fetchCountriesFromApi(): Promise<GlobalCountry[]> {
  try {
    const res = await fetch(COUNTRIES_API_URL, {
      next: { revalidate: 86400 }, // Cache on edge for 24 hours
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      // Map API countries while retaining local academic subdivisions
      return data.map((item: any) => {
        const code = item.alpha3Code || item.cioc || item.alpha2Code;
        const localMatch = COUNTRY_MAP.get(code?.toLowerCase());
        return {
          code: code || '',
          code2: item.alpha2Code || '',
          name: localMatch?.name || item.name,
          officialName: item.name,
          flag: item.flag || localMatch?.flag || '',
          flagUrl: item.flags?.svg || item.flags?.png || localMatch?.flagUrl || '',
          regionLabel: localMatch?.regionLabel || 'State / Province / Region',
          continent: item.region || localMatch?.continent || 'Other',
          subregion: item.subregion || localMatch?.subregion || '',
          capital: item.capital || localMatch?.capital || '',
          currencies: (item.currencies || []).map((cur: any) => ({
            code: cur.code,
            name: cur.name,
            symbol: cur.symbol,
          })),
          hasSubdivisions: Boolean(localMatch?.regions && localMatch.regions.length > 0),
          regions: localMatch?.regions || [],
        };
      });
    }
    return GLOBAL_COUNTRIES;
  } catch (err) {
    console.warn('[CountriesApi] Fallback to embedded geography dataset:', err);
    return GLOBAL_COUNTRIES;
  }
}
