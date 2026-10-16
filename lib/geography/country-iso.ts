/**
 * ISO 2-letter country code lookup for academic registry APIs (OpenAlex, Crossref, etc.)
 */
const COUNTRY_TO_ISO2: Record<string, string> = {
  'united states': 'US',
  'united states of america': 'US',
  'usa': 'US',
  'us': 'US',
  'united kingdom': 'GB',
  'great britain': 'GB',
  'uk': 'GB',
  'gbr': 'GB',
  'canada': 'CA',
  'can': 'CA',
  'germany': 'DE',
  'deutschland': 'DE',
  'deu': 'DE',
  'japan': 'JP',
  'jpn': 'JP',
  'pakistan': 'PK',
  'pak': 'PK',
  'france': 'FR',
  'fra': 'FR',
  'australia': 'AU',
  'aus': 'AU',
  'china': 'CN',
  'chn': 'CN',
  'switzerland': 'CH',
  'che': 'CH',
  'sweden': 'SE',
  'swe': 'SE',
  'italy': 'IT',
  'ita': 'IT',
  'netherlands': 'NL',
  'nld': 'NL',
  'south korea': 'KR',
  'korea': 'KR',
  'kor': 'KR',
  'india': 'IN',
  'ind': 'IN',
  'singapore': 'SG',
  'sgp': 'SG',
  'spain': 'ES',
  'esp': 'ES',
  'norway': 'NO',
  'nor': 'NO',
  'denmark': 'DK',
  'dnk': 'DK',
  'finland': 'FI',
  'fin': 'FI',
  'belgium': 'BE',
  'bel': 'BE',
  'austria': 'AT',
  'aut': 'AT',
  'ireland': 'IE',
  'irl': 'IE',
  'new zealand': 'NZ',
  'nzl': 'NZ',
  'brazil': 'BR',
  'bra': 'BR',
  'south africa': 'ZA',
  'zaf': 'ZA',
  'saudi arabia': 'SA',
  'sau': 'SA',
  'turkey': 'TR',
  'turkiye': 'TR',
  'tur': 'TR',
  'malaysia': 'MY',
  'mys': 'MY',
};

export function getCountryIso2(countryInput?: string): string | null {
  if (!countryInput) return null;
  const clean = countryInput.trim().toLowerCase();
  if (clean === 'global' || clean === 'all' || clean.includes('all countries')) {
    return null;
  }
  if (COUNTRY_TO_ISO2[clean]) {
    return COUNTRY_TO_ISO2[clean];
  }
  // If already a 2-letter uppercase or lowercase code
  if (clean.length === 2) {
    return clean.toUpperCase();
  }
  return null;
}
