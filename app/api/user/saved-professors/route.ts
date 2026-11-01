import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthSession } from '@/lib/auth/server-auth';
import { getUserSavedProfessors, saveUserSavedProfessors } from '@/lib/services/db-service';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuthSession(request);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const savedProfessors = await getUserSavedProfessors(session.user.id);
    return NextResponse.json({ success: true, savedProfessors });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch saved faculty' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuthSession(request);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    let updatedList: string[] = [];

    const idsArray = Array.isArray(body.savedProfessors) ? body.savedProfessors : Array.isArray(body.professorIds) ? body.professorIds : null;
    if (idsArray) {
      updatedList = await saveUserSavedProfessors(session.user.id, idsArray);
    } else if (body.professorId) {
      const current = await getUserSavedProfessors(session.user.id);
      const profId = String(body.professorId);
      const action = body.action || (current.includes(profId) ? 'remove' : 'add');

      if (action === 'remove') {
        updatedList = await saveUserSavedProfessors(
          session.user.id,
          current.filter((id) => id !== profId)
        );
      } else {
        if (!current.includes(profId)) {
          updatedList = await saveUserSavedProfessors(session.user.id, [...current, profId]);
        } else {
          updatedList = current;
        }
      }
    } else {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    return NextResponse.json({ success: true, savedProfessors: updatedList });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to update saved faculty' }, { status: 500 });
  }
}
