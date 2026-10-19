import { NextRequest, NextResponse } from 'next/server';
import { discoverLabMembers } from '@/lib/services/lab-team-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  const authorId = searchParams.get('authorId') || undefined;

  if (!name) {
    return NextResponse.json({ error: 'Professor name is required' }, { status: 400 });
  }

  try {
    const report = await discoverLabMembers(name, authorId);
    return NextResponse.json({ success: true, data: report });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to resolve lab team' },
      { status: 500 }
    );
  }
}
