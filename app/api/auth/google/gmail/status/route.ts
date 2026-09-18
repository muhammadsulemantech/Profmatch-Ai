import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';

export async function GET(request: NextRequest) {
  try {
    mockDb.loadFromDisk();

    let userId = 'usr_student_001';
    const userCookie = request.cookies.get('profmatch_user')?.value;
    if (userCookie) {
      try {
        const parsed = JSON.parse(userCookie);
        if (parsed && parsed.id) userId = parsed.id;
      } catch {
        // fallback
      }
    }

    const account = mockDb.getConnectedEmailAccount(userId);
    if (account) {
      return NextResponse.json({
        isConnected: true,
        account: {
          id: account.id,
          email: account.email,
          provider: account.provider,
          connected_at: account.connected_at,
          last_used_at: account.last_used_at,
        },
      });
    }

    return NextResponse.json({ isConnected: false });
  } catch (err: any) {
    return NextResponse.json({ isConnected: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    mockDb.loadFromDisk();

    let userId = 'usr_student_001';
    const userCookie = request.cookies.get('profmatch_user')?.value;
    if (userCookie) {
      try {
        const parsed = JSON.parse(userCookie);
        if (parsed && parsed.id) userId = parsed.id;
      } catch {
        // fallback
      }
    }

    const disconnected = mockDb.deleteConnectedEmailAccount(userId);
    return NextResponse.json({ success: true, disconnected });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
