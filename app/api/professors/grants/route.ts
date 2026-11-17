import { NextRequest, NextResponse } from 'next/server';
import { detectFacultyGrants } from '@/lib/services/grant-service';
import { checkRateLimit, getClientIp, RATE_LIMIT_PRESETS } from '@/lib/security/rate-limit';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`grants:${ip}`, RATE_LIMIT_PRESETS.AI_COMPUTE);
  if (!rl.success) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please try again shortly.' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name')?.trim();
  const institution = searchParams.get('institution')?.trim() || undefined;

  if (!name || name.length > 150) {
    return NextResponse.json({ error: 'Valid professor name is required' }, { status: 400 });
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
