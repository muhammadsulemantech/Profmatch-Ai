import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthSession } from '@/lib/auth/server-auth';
import { getUserSyncedData, saveUserSyncedData } from '@/lib/services/db-service';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuthSession(request);
    const userId = session?.user?.id || request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: User ID required.' }, { status: 401 });
    }

    const data = await getUserSyncedData(userId);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Sync failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuthSession(request);
    const body = await request.json();
    const userId = session?.user?.id || body.userId;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: User ID required.' }, { status: 401 });
    }

    const updated = await saveUserSyncedData(userId, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Sync update failed' }, { status: 500 });
  }
}
