import { NextRequest } from 'next/server';
import { z } from 'zod';
import { EmailQualityAgent } from '@/lib/agents';
import { verifyAuthSession } from '@/lib/auth/server-auth';
import { checkAndIncrementQuota } from '@/lib/services/quota-service';
import { getStudentProfileByUserId } from '@/lib/services/user-service';
import {
  cleanProfessorSalutation,
  renderGroundedEmailTemplate,
} from '@/lib/templates/email-templates';
import { apiSuccess, apiError } from '@/lib/api/response';

const DraftGroundedSchema = z.object({
  professor: z.object({
    name: z.string().min(1, 'Professor name is required'),
    university_name: z.string().optional(),
    primary_discipline: z.string().optional(),
    department_name: z.string().optional(),
    research_interests: z.array(z.string()).optional(),
    publications: z
      .array(
        z.object({
          title: z.string(),
        })
      )
      .optional(),
  }),
  studentProfile: z
    .object({
      targetDegree: z.string().optional(),
      researchInterests: z.array(z.string()).optional(),
    })
    .optional(),
  tone: z.string().optional().default('academic'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuthSession(request);
    if (!session || !session.user || !session.user.id) {
      return apiError('Unauthorized: Authentication required.', 401);
    }
    const userId = session.user.id;

    const body = await request.json();
    const parsed = DraftGroundedSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid request parameters', 400);
    }

    const { professor, studentProfile } = parsed.data;

    const quotaCheck = checkAndIncrementQuota(userId, 'draft');
    if (!quotaCheck.allowed) {
      return apiError(quotaCheck.error || 'Quota limit reached', 403, 'QUOTA_EXCEEDED', {
        message: quotaCheck.message,
        tier: quotaCheck.tier,
        limit: quotaCheck.limit,
        used: quotaCheck.used,
      });
    }

    const userProfileData = await getStudentProfileByUserId(userId);
    const studentUser = session.user;
    const academic = userProfileData.academic;
    const research = userProfileData.research;

    const studentName = studentUser.full_name || 'Prospective Researcher';
    const targetDegree = studentProfile?.targetDegree || 'PhD';
    const rawKeywords = studentProfile?.researchInterests || [];
    const researchKeywords =
      rawKeywords.length > 0
        ? rawKeywords
        : research?.research_interests || ['Artificial Intelligence', 'Computational Methods'];
    const studentUni = academic?.university || 'my undergraduate institution';

    const { salutation, cleanName } = cleanProfessorSalutation(professor.name);
    const profUni = professor.university_name || 'your institution';
    const profDept = professor.primary_discipline || professor.department_name || 'your research group';
    const profInterests =
      professor.research_interests && professor.research_interests.length > 0
        ? professor.research_interests.join(', ')
        : researchKeywords.join(', ');
    const profPaper = professor.publications?.[0]?.title || `recent advances in ${profDept}`;

    // 1. Attempt generation via Live Google Gemini API with model fallback
    const geminiApiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '';
    const candidateModels = [
      process.env.AI_MODEL || 'gemini-flash-latest',
      'gemini-flash-latest',
      'gemini-3.5-flash-lite',
      'gemini-2.5-flash',
    ].filter((m, i, arr) => m && arr.indexOf(m) === i);

    let generatedSubject = '';
    let generatedBody = '';

    const systemPrompt = `You are a Senior Academic Outreach Advisor assisting a prospective student.
Write a 100% unique, personalized, grounded cold email from prospective student ${studentName} to Professor ${cleanName} at ${profUni}.
Professor's Department/Discipline: ${profDept}
Professor's Research Focus: ${profInterests}
Professor's Key Paper/Work: "${profPaper}"
Student Target Degree: ${targetDegree} (Fall 2027 intake)
Student's Specific Keywords & Background: ${researchKeywords.join(', ')}
Student University Background: ${studentUni}

CRITICAL RULES:
1. Address the professor respectfully as "${salutation}".
2. Do NOT use generic template wording. Write a genuine, engaging, human email tailored specifically to this professor's field.
3. Reference the professor's research topics (${profInterests}) and paper/focus ("${profPaper}") naturally.
4. Show how the student's interest in ${researchKeywords.join(', ')} directly aligns with this professor's work.
5. Inquire politely if they are taking prospective ${targetDegree} students for the upcoming intake cycle.
6. Mention that CV and transcripts are attached for review.
7. Return ONLY valid JSON with fields "subject" and "bodyText".`;

    for (const model of candidateModels) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.75,
              },
            }),
            signal: AbortSignal.timeout(15000),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const resultParsed = JSON.parse(text);
            if (resultParsed.subject && resultParsed.bodyText) {
              generatedSubject = resultParsed.subject;
              generatedBody = resultParsed.bodyText;
              break;
            }
          }
        }
      } catch (geminiErr) {
        console.warn(`[GEMINI ATTEMPT FAILED ON ${model}]`, geminiErr);
      }
    }

    // 2. High-diversity dynamic fallback (used only if live AI is completely unreachable)
    if (!generatedBody || generatedBody.length < 100) {
      const randomSeed = Math.floor(Math.random() * 4);
      const focusKeyword = researchKeywords[0] || 'applied research';
      const secondaryKeyword = researchKeywords[1] || researchKeywords[0] || 'methodological design';

      const rendered = renderGroundedEmailTemplate(randomSeed, {
        studentName,
        salutation,
        profUni,
        profDept,
        profPaper,
        profInterests,
        targetDegree,
        focusKeyword,
        secondaryKeyword,
        studentUni,
      });

      generatedSubject = rendered.subject;
      generatedBody = rendered.bodyText;
    }

    // Quality check
    const quality = EmailQualityAgent.validateQuality(generatedBody);

    return apiSuccess({
      subject: generatedSubject,
      bodyText: generatedBody,
      qualityScore: quality.score,
      qualityIssues: quality.issues,
    });
  } catch (error: any) {
    return apiError(error.message || 'Failed to generate personalized email draft', 500);
  }
}
