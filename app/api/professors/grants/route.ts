import { NextRequest, NextResponse } from 'next/server';
import { detectFacultyGrants } from '@/lib/services/grant-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  const institution = searchParams.get('institution') || undefined;

  if (!name) {
    return NextResponse.json({ error: 'Professor name is required' }, { status: 400 });
  }

  try {
    const grantInfo = await detectFacultyGrants(name, institution);
    return NextResponse.json({ success: true, data: grantInfo });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to retrieve grant records' },
      { status: 500 }
    );
  }
}
