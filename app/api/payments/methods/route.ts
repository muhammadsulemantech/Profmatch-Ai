import { NextRequest } from 'next/server';
import { getPaymentMethods } from '@/lib/services/payment-service';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || undefined;

    const methods = await getPaymentMethods(country);

    return apiSuccess(
      {
        country: country || 'Global',
        methods,
      },
      { total: methods.length }
    );
  } catch (error: any) {
    return apiError(error.message || 'Failed to retrieve payment methods', 500);
  }
}
