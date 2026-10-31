import { NextRequest } from 'next/server';
import { getAllCountries, getCountryByNameOrCode, fetchCountriesFromApi } from '@/lib/geography/global-geography';
import { apiSuccess, apiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const code = searchParams.get('code');
    const live = searchParams.get('live') === 'true';

    // Fetch live from https://countries.dev/countries if requested, otherwise use high-speed cached dataset
    const countries = live ? await fetchCountriesFromApi() : getAllCountries();

    if (code) {
      const match = getCountryByNameOrCode(code);
      if (!match) {
        return apiError('Country not found', 404);
      }
      return apiSuccess({ country: match });
    }

    if (query) {
      const q = query.toLowerCase().trim();
      const filtered = countries.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (c.code2 && c.code2.toLowerCase().includes(q)) ||
          c.continent.toLowerCase().includes(q) ||
          (c.capital && c.capital.toLowerCase().includes(q)) ||
          (c.officialName && c.officialName.toLowerCase().includes(q))
      );
      return apiSuccess({
        countries: filtered,
        total: filtered.length,
      });
    }

    return apiSuccess({
      countries,
      total: countries.length,
      source: 'https://countries.dev/countries (cached & enriched with academic subdivisions)',
    });
  } catch (err: any) {
    return apiError(err.message || 'Failed to fetch countries data', 500);
  }
}
