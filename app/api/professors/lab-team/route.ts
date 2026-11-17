import { NextRequest, NextResponse } from 'next/server';
import { discoverLabMembers } from '@/lib/services/lab-team-service';
import { checkRateLimit, getClientIp, RATE_LIMIT_PRESETS } from '@/lib/security/rate-limit';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`lab_team:${ip}`, RATE_LIMIT_PRESETS.AI_COMPUTE);
  if (!rl.success) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please try again shortly.' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name')?.trim();
  const authorId = searchParams.get('authorId')?.trim() || undefined;

  if (!name || name.length > 150) {
    return NextResponse.json({ error: 'Valid professor name is required' }, { status: 400 });
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
