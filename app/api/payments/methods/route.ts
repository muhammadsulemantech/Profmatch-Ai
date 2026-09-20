import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || undefined;

    mockDb.loadFromDisk();
    const methods = mockDb.getPaymentMethods(country);

    return NextResponse.json({
      success: true,
      country: country || 'Global',
      total: methods.length,
      methods,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve payment methods' },
      { status: 500 }
    );
  }
}
