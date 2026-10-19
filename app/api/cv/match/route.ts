import { NextRequest, NextResponse } from 'next/server';
import { matchProfessorsFromCV } from '@/lib/services/cv-match-service';
import { logger } from '@/lib/logger';

export const maxDuration = 60; // Allow sufficient time for AI parsing and multi-database search

export async function POST(req: NextRequest) {
  try {
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
