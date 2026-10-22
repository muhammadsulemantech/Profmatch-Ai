/**
 * ProfMatch AI — Smart Follow-Up Sequence Generator
 *
 * Generates gentle, non-intrusive, grounded academic follow-up drafts
 * when a faculty member has not replied within 5-7 days.
 */

import { cleanProfessorSalutation } from '@/lib/templates/email-templates';

export interface FollowUpRequest {
  professorName: string;
  originalSubject?: string;
  researchFocus?: string;
  studentName: string;
  studentDegree?: string;
  studentUniversity?: string;
  daysPassed?: number;
}

export interface FollowUpResponse {
  subject: string;
  bodyText: string;
  followUpStep: number;
  recommendation: string;
}

export async function generateSmartFollowUp(
  params: FollowUpRequest
): Promise<FollowUpResponse> {
  const {
    professorName,
    originalSubject = 'Prospective Research Inquiry',
    researchFocus = 'recent publications',
    studentName,
    studentDegree = 'Graduate Applicant',
    studentUniversity = 'University',
    daysPassed = 6,
  } = params;

  const { salutation, cleanName, lastName } = cleanProfessorSalutation(professorName);
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  const candidateModels = [
    process.env.AI_MODEL || 'gemini-3.5-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
  ];

  const prompt = `You are an elite academic admissions advisor at MIT/Stanford. Write a polite, gentle, and highly respectful academic follow-up email from a student to Professor ${cleanName}.
The student sent an initial email ${daysPassed} days ago about potential graduate/PhD advisorship.

Professor: ${cleanName}
Student: ${studentName} (${studentDegree}, ${studentUniversity})
Research Topic: ${researchFocus}
Original Subject: ${originalSubject}

CRITICAL RULES:
- SALUTATION: Always open the email with "${salutation}". In global academia, professors are addressed by their family/last name ("Dear Professor ${lastName},"). Never address them casually or as "Dear Professor ${cleanName},".
- Length: Concise, under 120 words.
- Tone: Humble, respectful of professor's busy schedule, not pushy.
- Mention: Briefly re-iterate specific passion for their lab's research in ${researchFocus}.
- Call to Action: Inquire if they might have 10 minutes in the coming weeks for a brief chat, or if they recommend speaking with one of their current PhD students or postdocs.

Return ONLY a JSON object:
{
  "subject": "Re: ${originalSubject.replace(/^Re:\s*/i, '')}",
  "bodyText": "The full email body text with salutation and sign-off."
}`;

  if (apiKey) {
    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            return {
              subject: parsed.subject || `Re: ${originalSubject}`,
              bodyText: parsed.bodyText,
              followUpStep: 1,
              recommendation: 'Professors typically respond to polite 1st follow-ups within 48 hours.',
            };
          }
        }
      } catch {
        // Fall through to next model or grounded fallback
      }
    }
  }

  // High-standard academic follow-up template fallback
  const cleanSubject = originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`;
  const fallbackBody = `${salutation}

I hope this message finds you having a productive week.

I wanted to gently follow up on my previous note regarding potential doctoral/graduate advisorship in your lab, specifically relating to your work in ${researchFocus}. I remain deeply excited by your group's methodologies and would be honored to contribute to your ongoing investigations.

I recognize your schedule is exceptionally demanding. If you have 10 minutes for a brief introductory conversation in the coming weeks, I would greatly appreciate the opportunity. Alternatively, please let me know if you would recommend I connect with any of your current postdocs or graduate researchers first.

Thank you very much for your time and guidance.

Sincerely,

${studentName}
${studentDegree}
${studentUniversity}`;

  return {
    subject: cleanSubject,
    bodyText: fallbackBody,
    followUpStep: 1,
    recommendation: 'Sent 6 days post initial outreach. Maintains pristine academic decorum.',
  };
}
