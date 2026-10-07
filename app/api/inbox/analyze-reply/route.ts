import { NextRequest } from 'next/server';
import { ReplyAnalysisAgent } from '@/lib/agents';
import { verifyAuthSession } from '@/lib/auth/server-auth';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    // 1. Enforce verified user session
    const session = await verifyAuthSession(request);
    if (!session || !session.user || !session.user.id) {
      return apiError('Unauthorized: Authentication required.', 401);
    }

    // 2. Rate limit reply analysis per user to prevent AI quota exhaustion
    const rl = checkRateLimit(`inbox_analyze:${session.user.id}`, { limit: 20, windowMs: 60 * 1000 });
    if (!rl.success) {
      return apiError('Too many analysis requests. Please wait a minute before analyzing more replies.', 429);
    }

    const body = await request.json();
    const { professorName, senderEmail, subject, bodyText, originalEmail } = body;

    if (!bodyText || !bodyText.trim()) {
      return apiError('Email body text is required for AI analysis', 400);
    }

    const cleanProfName = (professorName || 'Professor').trim();
    const cleanEmail = (senderEmail || 'faculty@university.edu').trim();
    const cleanSubject = (subject || 'Research Inquiry Reply').trim();

    // Run AI analysis
    const analysis = await ReplyAnalysisAgent.analyzeReply(
      bodyText,
      cleanProfName,
      originalEmail || ''
    );

    const newReply = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      professor_name: cleanProfName,
      sender_email: cleanEmail,
      subject: cleanSubject,
      body_text: bodyText,
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      suggested_response: analysis.suggestedResponse,
      status: 'UNREAD',
      received_at: new Date().toISOString(),
    };

    return apiSuccess({
      reply: newReply,
    });
  } catch (error: any) {
    console.error('Error analyzing reply:', error);
    return apiError(error.message || 'Failed to analyze professor reply', 500);
  }
}
