import { NextRequest, NextResponse } from 'next/server';
import { matchProfessorsFromCV } from '@/lib/services/cv-match-service';
import { verifyAuthSession } from '@/lib/auth/server-auth';
import { checkRateLimit, getClientIp, RATE_LIMIT_PRESETS } from '@/lib/security/rate-limit';
import { logger } from '@/lib/logger';

export const maxDuration = 60; // Allow sufficient time for AI parsing and multi-database search

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAuthSession(req);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to analyze CV and match faculty.' },
        { status: 401 }
      );
    }

    const ip = getClientIp(req);
    const rl = checkRateLimit(`cv_match:${session.user.id}:${ip}`, RATE_LIMIT_PRESETS.CV_PARSE);
    if (!rl.success) {
      const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: 'Too many CV match requests. Please wait a moment before trying again.' },
        { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('cv') as File | null;
    const targetCountry = (formData.get('targetCountry') as string) || undefined;

    if (!file) {
      return NextResponse.json(
        { error: 'No CV document provided. Please upload a PDF file.' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload a valid PDF document.' },
        { status: 400 }
      );
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds maximum 10MB limit.' },
        { status: 400 }
      );
    }

    // Magic bytes verification: Valid PDF files must begin with '%PDF'
    if (buffer.length < 4 || buffer.subarray(0, 4).toString('ascii') !== '%PDF') {
      return NextResponse.json(
        { error: 'Invalid document format. The file header does not match authentic PDF content.' },
        { status: 400 }
      );
    }

    logger.info('[CV MATCH API] Processing student CV upload for faculty match', {
      fileName: file.name,
      fileSize: buffer.length,
      targetCountry,
    });

    const result = await matchProfessorsFromCV(buffer, {
      targetCountry,
      limit: 15,
    });

    logger.info('[CV MATCH API COMPLETED] Generated faculty matches from CV', {
      candidate: result.profile.candidateName,
      matchesCount: result.matches.length,
      topScore: result.matches[0]?.matchScore,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('[CV MATCH API ERROR] Failed processing CV match:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze CV and generate professor matches.' },
      { status: 500 }
    );
  }
}
