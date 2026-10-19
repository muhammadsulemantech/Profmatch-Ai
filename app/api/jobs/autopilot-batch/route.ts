import { NextRequest, NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/services/qstash-service';
import { logger } from '@/lib/logger';
import { discoverFacultyByKeywords, upsertProfessorsBatch } from '@/lib/services/professor-service';
import { mockDb } from '@/lib/supabase/mock-db';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('upstash-signature');

    // 1. Verify QStash signature for security
    const isValid = await verifyQStashSignature(signature, rawBody);
    if (!isValid) {
      logger.warn('[QSTASH JOB] Unauthorized signature verification failure on job queue');
      return NextResponse.json({ error: 'Unauthorized signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { userId, keywords, targetCountries, batchLimit = 5 } = payload;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId in job payload' }, { status: 400 });
    }

    logger.info('[QSTASH JOB STARTED] Processing background AutoPilot queue batch', {
      userId,
      batchLimit,
      keywords,
    });

    // 2. Perform automated asynchronous faculty discovery
    const professors = await discoverFacultyByKeywords(keywords || 'Artificial Intelligence', {
      limit: batchLimit,
      countries: targetCountries,
    });

    // 3. Persist discovered candidates to database/store
    await upsertProfessorsBatch(professors);
    const addedCount = professors.length;

    logger.info('[QSTASH JOB COMPLETED] Background batch successfully finished', {
      userId,
      discoveredTotal: professors.length,
      savedToWorkspace: addedCount,
    });

    return NextResponse.json({
      success: true,
      processed: professors.length,
      saved: addedCount,
    });
  } catch (error: any) {
    logger.error('[QSTASH JOB ERROR] Exception processing background queue task:', error);
    return NextResponse.json({ error: error.message || 'Job execution failed' }, { status: 500 });
  }
}
