import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthSession } from '@/lib/auth/server-auth';
import { getUserSyncedData, saveUserSyncedData } from '@/lib/services/db-service';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuthSession(request);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const requestedUserId = request.nextUrl.searchParams.get('userId');
    // BOLA/IDOR Guard: Disallow querying other users' private synced records
    if (requestedUserId && requestedUserId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden: Cannot access another user\'s private data.' }, { status: 403 });
    }

    const userId = session.user.id;
    const data = await getUserSyncedData(userId);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Sync failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuthSession(request);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    // BOLA/IDOR Guard: Disallow overwriting other users' private synced records
    if (body.userId && body.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden: Cannot overwrite another user\'s private data.' }, { status: 403 });
    }

    const userId = session.user.id;
    const updated = await saveUserSyncedData(userId, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Sync update failed' }, { status: 500 });
  }
}
