import { NextRequest, NextResponse } from 'next/server';
import { generateSmartFollowUp } from '@/lib/services/followup-service';
import { verifyAuthSession } from '@/lib/auth/server-auth';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/security/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAuthSession(req);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to generate follow-ups.' },
        { status: 401 }
      );
    }

    const rl = checkRateLimit(`followup:${session.user.id}`, RATE_LIMIT_PRESETS.AI_COMPUTE);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many follow-up generation requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { professorName, originalSubject, researchFocus, studentName, studentDegree, daysPassed } = body;

    if (!professorName || !studentName) {
      return NextResponse.json(
        { error: 'Professor name and student name are required' },
        { status: 400 }
      );
    }

    const followUp = await generateSmartFollowUp({
      professorName,
      originalSubject,
      researchFocus,
      studentName,
      studentDegree,
      daysPassed: daysPassed || 6,
    });

    return NextResponse.json({
      success: true,
      data: followUp,
    });
  } catch (error: any) {
    logger.error('[FOLLOWUP GENERATION ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate follow-up' },
      { status: 500 }
    );
  }
}
