// ==========================================================
// PROFMATCH AI — GLOBAL GEOGRAPHIC ARCHITECTURE
// ==========================================================

export interface GlobalCountry {
  code: string;
  name: string;
  regionLabel: string; // e.g. State, Province, Prefecture, Bundesland, County, Region, Canton, Emirate
  continent: string;
  hasSubdivisions: boolean;
  regions?: string[];
}

export const GLOBAL_COUNTRIES: GlobalCountry[] = [
  {
    code: 'USA',
    name: 'United States',
    regionLabel: 'State',
    continent: 'North America',
    hasSubdivisions: true,
    regions: [
      'California', 'Texas', 'Massachusetts', 'New York', 'Washington', 'Illinois', 'Pennsylvania',
      'Michigan', 'Georgia', 'North Carolina', 'Ohio', 'Florida', 'Virginia', 'New Jersey', 'Colorado',
      'Maryland', 'Indiana', 'Minnesota', 'Wisconsin', 'Arizona', 'Missouri', 'Tennessee', 'Connecticut',
      'Oregon', 'Utah', 'Iowa', 'Alabama', 'Kentucky', 'Louisiana', 'Kansas', 'Oklahoma', 'Rhode Island',
      'New Mexico', 'Nebraska', 'New Hampshire', 'Delaware', 'District of Columbia', 'Hawaii', 'Maine',
      'Idaho', 'Montana', 'West Virginia', 'Arkansas', 'Nevada', 'Mississippi', 'South Dakota', 'North Dakota',
      'Alaska', 'Vermont', 'Wyoming'
    ],
  },
  {
    code: 'GBR',
    name: 'United Kingdom',
    regionLabel: 'Nation / County',
    continent: 'Europe',
    hasSubdivisions: true,
    regions: ['England', 'Scotland', 'Wales', 'Northern Ireland', 'Greater London', 'Oxfordshire', 'Cambridgeshire', 'West Midlands', 'Greater Manchester', 'Yorkshire'],
  },
  {
    code: 'CAN',
    name: 'Canada',
    regionLabel: 'Province / Territory',
    continent: 'North America',
    hasSubdivisions: true,
    regions: ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan', 'Nova Scotia', 'New Brunswick', 'Newfoundland and Labrador'],
  },
  {
    code: 'DEU',
    name: 'Germany',
    regionLabel: 'State (Bundesland)',
    continent: 'Europe',
    hasSubdivisions: true,
    regions: ['Bavaria', 'Baden-Württemberg', 'Berlin', 'North Rhine-Westphalia', 'Hesse', 'Saxony', 'Lower Saxony', 'Hamburg', 'Rhineland-Palatinate'],
  },
  {
    code: 'JPN',
    name: 'Japan',
    regionLabel: 'Prefecture',
    continent: 'Asia',
    hasSubdivisions: true,
    regions: ['Tokyo', 'Kyoto', 'Osaka', 'Kanagawa', 'Aichi', 'Hokkaido', 'Fukuoka', 'Miyagi', 'Hiroshima', 'Tsukuba / Ibaraki'],
  },
  {
    code: 'AUS',
    name: 'Australia',
    regionLabel: 'State / Territory',
    continent: 'Oceania',
    hasSubdivisions: true,
    regions: ['Victoria', 'New South Wales', 'Australian Capital Territory', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania'],
  },
  {
    code: 'ITA',
    name: 'Italy',
    regionLabel: 'Region',
    continent: 'Europe',
    hasSubdivisions: true,
    regions: ['Lombardy (Milan)', 'Lazio (Rome)', 'Emilia-Romagna (Bologna)', 'Piedmont (Turin)', 'Tuscany (Florence)', 'Veneto (Venice)'],
  },
  {
    code: 'PAK',
    name: 'Pakistan',
    regionLabel: 'Province / Federal Territory',
    continent: 'Asia',
    hasSubdivisions: true,
    regions: ['Islamabad Capital Territory', 'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Gilgit-Baltistan', 'Azad Kashmir'],
  },
  {
    code: 'BRA',
    name: 'Brazil',
    regionLabel: 'State',
    continent: 'South America',
    hasSubdivisions: true,
    regions: ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Rio Grande do Sul', 'Paraná', 'Bahia', 'Distrito Federal (Brasília)'],
  },
  {
    code: 'SWE',
    name: 'Sweden',
    regionLabel: 'County / Region',
    continent: 'Europe',
    hasSubdivisions: true,
    regions: ['Stockholm', 'Skåne (Lund/Malmö)', 'Västra Götaland (Gothenburg)', 'Uppsala', 'Östergötland (Linköping)', 'Västerbotten (Umeå)'],
  },
  {
    code: 'KOR',
    name: 'South Korea',
    regionLabel: 'Province / Special City',
    continent: 'Asia',
    hasSubdivisions: true,
    regions: ['Seoul', 'Daejeon (KAIST)', 'Gyeonggi', 'Busan', 'Incheon', 'Daegu', 'Pohang (POSTECH)', 'Gwangju'],
  },
  {
    code: 'ARE',
    name: 'United Arab Emirates',
    regionLabel: 'Emirate',
    continent: 'Asia',
    hasSubdivisions: true,
    regions: ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Ras Al Khaimah'],
  },
  {
    code: 'NGA',
    name: 'Nigeria',
    regionLabel: 'State / Territory',
    continent: 'Africa',
    hasSubdivisions: true,
    regions: ['Oyo (Ibadan)', 'Lagos', 'Abuja (FCT)', 'Kaduna (Zaria)', 'Enugu (Nsukka)', 'Edo (Benin City)', 'Kano'],
  },
  {
    code: 'FRA',
    name: 'France',
    regionLabel: 'Region',
    continent: 'Europe',
    hasSubdivisions: true,
    regions: ['Île-de-France (Paris)', 'Auvergne-Rhône-Alpes (Lyon/Grenoble)', 'Occitanie (Toulouse/Montpellier)', 'Provence-Alpes-Côte d\'Azur', 'Nouvelle-Aquitaine (Bordeaux)'],
  },
  {
    code: 'CHE',
    name: 'Switzerland',
    regionLabel: 'Canton',
    continent: 'Europe',
    hasSubdivisions: true,
    regions: ['Zurich (ETH Zurich)', 'Vaud (EPFL Lausanne)', 'Geneva', 'Basel', 'Bern'],
  },
  {
    code: 'SGP',
    name: 'Singapore',
    regionLabel: 'District / Zone',
    continent: 'Asia',
    hasSubdivisions: false,
    regions: ['Central Region', 'West Region (NUS/NTU)', 'East Region'],
  },
  {
    code: 'NLD',
    name: 'Netherlands',
    regionLabel: 'Province',
    continent: 'Europe',
    hasSubdivisions: true,
    regions: ['North Holland (Amsterdam)', 'South Holland (Delft/Rotterdam/Leiden)', 'Utrecht', 'North Brabant (Eindhoven)', 'Gelderland (Wageningen)'],
  },
  {
    code: 'IND',
    name: 'India',
    regionLabel: 'State / UT',
    continent: 'Asia',
    hasSubdivisions: true,
    regions: ['Delhi NCR', 'Karnataka (Bangalore)', 'Maharashtra (Mumbai/Pune)', 'Tamil Nadu (Chennai)', 'Telangana (Hyderabad)', 'West Bengal (Kolkata)', 'Uttar Pradesh'],
  },
  {
    code: 'CHN',
    name: 'China',
    regionLabel: 'Province / Municipality',
    continent: 'Asia',
    hasSubdivisions: true,
    regions: ['Beijing (Tsinghua/Peking)', 'Shanghai', 'Zhejiang (Hangzhou)', 'Jiangsu (Nanjing)', 'Guangdong (Guangzhou/Shenzhen)', 'Hubei (Wuhan)', 'Sichuan (Chengdu)'],
  },
  {
    code: 'NZL',
    name: 'New Zealand',
    regionLabel: 'Region',
    continent: 'Oceania',
    hasSubdivisions: true,
    regions: ['Auckland', 'Wellington', 'Canterbury (Christchurch)', 'Otago (Dunedin)'],
  },
  {
    code: 'IRL',
    name: 'Ireland',
    regionLabel: 'Province / County',
    continent: 'Europe',
    hasSubdivisions: true,
    regions: ['Dublin', 'Cork', 'Galway', 'Limerick'],
  },
  {
    code: 'ESP',
    name: 'Spain',
    regionLabel: 'Autonomous Community',
    continent: 'Europe',
    hasSubdivisions: true,
    regions: ['Madrid', 'Catalonia (Barcelona)', 'Valencia', 'Andalusia', 'Basque Country'],
  },
  {
    code: 'FIN',
    name: 'Finland',
    regionLabel: 'Region',
    continent: 'Europe',
    hasSubdivisions: true,
    regions: ['Uusimaa (Helsinki/Aalto)', 'Pirkanmaa (Tampere)', 'North Ostrobothnia (Oulu)', 'Southwest Finland (Turku)'],
  },
  {
    code: 'NOR',
    name: 'Norway',
    regionLabel: 'County',
    continent: 'Europe',
    hasSubdivisions: true,
    regions: ['Oslo', 'Trøndelag (Trondheim - NTNU)', 'Vestland (Bergen)', 'Troms og Finnmark (Tromsø)'],
  },
  {
    code: 'DNK',
    name: 'Denmark',
    regionLabel: 'Region',
    continent: 'Europe',
    hasSubdivisions: true,
    regions: ['Capital Region (Copenhagen/DTU)', 'Central Denmark (Aarhus)', 'North Denmark (Aalborg)', 'Southern Denmark (Odense)'],
  },
  {
    code: 'AUT',
    name: 'Austria',
    regionLabel: 'State (Bundesland)',
    continent: 'Europe',
    hasSubdivisions: true,
    regions: ['Vienna', 'Styria (Graz)', 'Tyrol (Innsbruck)', 'Upper Austria (Linz)', 'Salzburg'],
  },
  {
    code: 'BEL',
    name: 'Belgium',
    regionLabel: 'Region / Province',
    continent: 'Europe',
    hasSubdivisions: true,
    regions: ['Flemish Region (KU Leuven / Ghent)', 'Brussels-Capital Region', 'Walloon Region (Louvain-la-Neuve / Liège)'],
  },
  {
    code: 'ZAF',
    name: 'South Africa',
    regionLabel: 'Province',
    continent: 'Africa',
    hasSubdivisions: true,
    regions: ['Western Cape (Cape Town / Stellenbosch)', 'Gauteng (Witwatersrand / Pretoria)', 'KwaZulu-Natal'],
  },
  {
    code: 'MYS',
    name: 'Malaysia',
    regionLabel: 'State / Territory',
    continent: 'Asia',
    hasSubdivisions: true,
    regions: ['Kuala Lumpur (Universiti Malaya)', 'Selangor (UKM/UPM)', 'Penang (USM)', 'Johor (UTM)'],
  },
  {
    code: 'SAU',
    name: 'Saudi Arabia',
    regionLabel: 'Province',
    continent: 'Asia',
    hasSubdivisions: true,
    regions: ['Makkah Region (KAUST / Jeddah)', 'Riyadh (KSU / Alfaisal)', 'Eastern Province (KFUPM)'],
  },
  {
    code: 'TUR',
    name: 'Turkey',
    regionLabel: 'Province',
    continent: 'Europe / Asia',
    hasSubdivisions: true,
    regions: ['Istanbul (Boğaziçi / ITU / Koç / Sabancı)', 'Ankara (METU / Bilkent)', 'Izmir (Ege / Dokuz Eylül)'],
  },
  {
    code: 'MEX',
    name: 'Mexico',
    regionLabel: 'State',
    continent: 'North America',
    hasSubdivisions: true,
    regions: ['Mexico City (UNAM / IPN / ITAM)', 'Nuevo León (Tec de Monterrey)', 'Jalisco (Univ of Guadalajara)'],
  },
  {
    code: 'ARG',
    name: 'Argentina',
    regionLabel: 'Province / City',
    continent: 'South America',
    hasSubdivisions: true,
    regions: ['Autonomous City of Buenos Aires (UBA)', 'Buenos Aires Province (UNLP)', 'Córdoba (UNC)'],
  },
  {
    code: 'CHL',
    name: 'Chile',
    regionLabel: 'Region',
    continent: 'South America',
    hasSubdivisions: true,
    regions: ['Santiago Metropolitan Region (PUC / Univ of Chile)', 'Valparaíso', 'Biobío (Concepción)'],
  },
  {
    code: 'EGY',
    name: 'Egypt',
    regionLabel: 'Governorate',
    continent: 'Africa',
    hasSubdivisions: true,
    regions: ['Cairo (Cairo Univ / AUC / Ain Shams)', 'Giza', 'Alexandria', 'Assiut'],
  },
  {
    code: 'KEN',
    name: 'Kenya',
    regionLabel: 'County',
    continent: 'Africa',
    hasSubdivisions: true,
    regions: ['Nairobi (Univ of Nairobi / Strathmore)', 'Uasin Gishu (Moi Univ)', 'Kiambu (KU/JKUAT)'],
  },
  {
    code: 'IDN',
    name: 'Indonesia',
    regionLabel: 'Province',
    continent: 'Asia',
    hasSubdivisions: true,
    regions: ['Jakarta (Univ of Indonesia)', 'West Java (ITB Bandung)', 'Yogyakarta (UGM)', 'East Java (ITS/Airlangga)'],
  },
  {
    code: 'THA',
    name: 'Thailand',
    regionLabel: 'Province',
    continent: 'Asia',
    hasSubdivisions: true,
    regions: ['Bangkok (Chulalongkorn / Mahidol)', 'Chiang Mai', 'Khon Kaen', 'Songkhla (PSU)'],
  },
  {
    code: 'POL',
    name: 'Poland',
    regionLabel: 'Voivodeship',
    continent: 'Europe',
    hasSubdivisions: true,
    regions: ['Masovian (Warsaw)', 'Lesser Poland (Kraków - Jagiellonian)', 'Lower Silesian (Wrocław)', 'Greater Poland (Poznań)'],
  },
  {
    code: 'PRT',
    name: 'Portugal',
    regionLabel: 'District / Region',
    continent: 'Europe',
    hasSubdivisions: true,
    regions: ['Lisbon (Univ of Lisbon / NOVA)', 'Porto (Univ of Porto)', 'Coimbra', 'Minho (Braga)'],
  },
  {
    code: 'GRC',
    name: 'Greece',
    regionLabel: 'Region',
    continent: 'Europe',
    hasSubdivisions: true,
    regions: ['Attica (Univ of Athens / NTUA)', 'Central Macedonia (Aristotle Univ of Thessaloniki)', 'Crete'],
  },
  {
    code: 'QAT',
    name: 'Qatar',
    regionLabel: 'Municipality',
    continent: 'Asia',
    hasSubdivisions: false,
    regions: ['Doha (Qatar Foundation / Qatar University)'],
  },
  {
    code: 'ISR',
    name: 'Israel',
    regionLabel: 'District',
    continent: 'Asia',
    hasSubdivisions: true,
    regions: ['Jerusalem (Hebrew Univ)', 'Tel Aviv', 'Haifa (Technion)', 'Central District (Weizmann Institute)'],
  },
  {
    code: 'HKG',
    name: 'Hong Kong (SAR)',
    regionLabel: 'District',
    continent: 'Asia',
    hasSubdivisions: false,
    regions: ['Hong Kong Island (HKU)', 'Kowloon (HKUST / PolyU)', 'New Territories (CUHK)'],
  },
  {
    code: 'TWN',
    name: 'Taiwan',
    regionLabel: 'City / County',
    continent: 'Asia',
    hasSubdivisions: true,
    regions: ['Taipei (National Taiwan Univ)', 'Hsinchu (NTHU / NYCU)', 'Tainan (NCKU)', 'Taichung'],
  },
];

// Fallback lookup dictionary
const COUNTRY_MAP = new Map<string, GlobalCountry>();
GLOBAL_COUNTRIES.forEach(c => {
  COUNTRY_MAP.set(c.code.toLowerCase(), c);
  COUNTRY_MAP.set(c.name.toLowerCase(), c);
});

export function getAllCountries(): GlobalCountry[] {
  return GLOBAL_COUNTRIES;
}

export function getCountryByNameOrCode(query: string): GlobalCountry | null {
  if (!query) return null;
  const clean = query.trim().toLowerCase();
  if (COUNTRY_MAP.has(clean)) return COUNTRY_MAP.get(clean)!;

  // Fuzzy match
  for (const c of GLOBAL_COUNTRIES) {
    if (c.name.toLowerCase().includes(clean) || clean.includes(c.name.toLowerCase())) {
      return c;
    }
  }
  return null;
}

export function getRegionsForCountry(countryNameOrCode: string): string[] {
  const country = getCountryByNameOrCode(countryNameOrCode);
  if (country && country.regions) {
    return country.regions;
  }
  return [];
}

export function parseLocationFromText(text: string): { country?: string; region?: string; city?: string } {
  if (!text) return {};
  const lower = text.toLowerCase();

  for (const c of GLOBAL_COUNTRIES) {
    // Check country name or code
    const countryMatch = lower.includes(c.name.toLowerCase()) || lower.includes(` ${c.code.toLowerCase()} `);
    
    // Check regions
    if (c.regions) {
      for (const r of c.regions) {
        // Extract simple region name without parentheses
        const cleanRegion = r.split('(')[0].trim().toLowerCase();
        if (lower.includes(cleanRegion)) {
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
