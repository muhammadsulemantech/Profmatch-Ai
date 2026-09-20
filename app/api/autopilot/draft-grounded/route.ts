import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { EmailQualityAgent } from '@/lib/agents';

// Helper to clean messy scraped professor names & titles
function cleanProfessorSalutation(rawName: string): { salutation: string; cleanName: string } {
  if (!rawName) return { salutation: 'Professor', cleanName: 'Professor' };

  let clean = rawName.trim();
  // Strip common academic titles from the front
  clean = clean
    .replace(/^(Full\s+Professor|Associate\s+Professor|Assistant\s+Professor|Distinguished\s+Professor|Chair\s+Professor|Prof\.\s*Dr\.|Professor\s+Dr\.|Prof\.|Dr\.|Professor)\s*/i, '')
    .trim();
  clean = clean.replace(/^(&\s*Chair|Chair\s*of|Head\s*of)\s*/i, '').trim();

  // If the "name" is a department or title rather than a human name (e.g. contains "Intelligence and Machine Learning" or "Department" or is too long)
  const isDepartmentString =
    clean.toLowerCase().includes('intelligence') ||
    clean.toLowerCase().includes('department') ||
    clean.toLowerCase().includes('foundations') ||
    clean.toLowerCase().includes('chair') ||
    clean.toLowerCase().includes('machine learning') ||
    clean.length > 35;

  if (isDepartmentString) {
    return { salutation: 'Dear Professor,', cleanName: 'Professor' };
  }

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { salutation: `Dear Professor ${parts[0]},`, cleanName: parts[0] };
  }
  if (parts.length >= 2) {
    const lastName = parts[parts.length - 1];
    return { salutation: `Dear Professor ${lastName},`, cleanName: `${parts[0]} ${lastName}` };
  }

  return { salutation: 'Dear Professor,', cleanName: 'Professor' };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { professor, studentProfile, tone = 'academic', userId = 'usr_student_001' } = body;

    if (!professor || !professor.name) {
      return NextResponse.json(
        { error: 'Professor details are required to generate personalized outreach' },
        { status: 400 }
      );
    }

    mockDb.loadFromDisk();
    const studentUser = mockDb.profiles.find((u: any) => u.id === userId) || mockDb.profiles[1] || { id: userId, full_name: 'Alex Vance' };
    const academic = mockDb.academicProfiles.find(a => a.student_id === studentUser.id) || mockDb.academicProfiles[0];
    const research = mockDb.researchProfiles.find(r => r.student_id === studentUser.id) || mockDb.researchProfiles[0];

    const studentName = studentUser.full_name || 'Prospective Researcher';
    const targetDegree = studentProfile?.targetDegree || 'PhD';
    const rawKeywords = studentProfile?.researchInterests || [];
    const researchKeywords = rawKeywords.length > 0 ? rawKeywords : (research?.research_interests || ['Artificial Intelligence', 'Computational Methods']);
    const studentUni = academic?.university || 'my undergraduate institution';

    const { salutation, cleanName } = cleanProfessorSalutation(professor.name);
    const profUni = professor.university_name || 'your institution';
    const profDept = professor.primary_discipline || professor.department_name || 'your research group';
    const profInterests = (professor.research_interests && professor.research_interests.length > 0)
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
                temperature: 0.75, // Ensures distinct phrasing for every professor
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            if (parsed.subject && parsed.bodyText) {
              generatedSubject = parsed.subject;
              generatedBody = parsed.bodyText;
              break; // Successfully generated with live Gemini!
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

      if (randomSeed === 0) {
        generatedSubject = `Prospective ${targetDegree} Inquiry: ${focusKeyword} — ${studentName}`;
        generatedBody = `${salutation}\n\nI hope this email finds you well amid your teaching and research responsibilities at ${profUni}.\n\nI am writing to express my strong interest in joining your group as a prospective ${targetDegree} student for the Fall 2027 admissions cycle. Having closely followed your contributions in ${profDept}—specifically your work on "${profPaper}"—I am eager to contribute to your lab's ongoing initiatives.\n\nMy academic background at ${studentUni} focused on ${focusKeyword} and ${secondaryKeyword}. In my recent projects, I explored how computational frameworks in ${focusKeyword} can improve empirical reliability. Your laboratory's focus on ${profInterests} provides the ideal environment to deepen this investigation.\n\nI have attached my academic CV and summary of research projects for your review. Would you have 10-15 minutes in the coming weeks for a brief conversation to discuss prospective student openings in your group?\n\nThank you very much for your time and consideration.\n\nSincerely,\n${studentName}\n${studentUni}`;
      } else if (randomSeed === 1) {
        generatedSubject = `Research Inquiry regarding ${profDept} (${targetDegree} Applicant, ${studentName})`;
        generatedBody = `${salutation}\n\nI hope semester proceedings are going well.\n\nMy name is ${studentName}, and I am preparing my application for the ${targetDegree} program at ${profUni} for Fall 2027. Your published investigations on "${profPaper}" in ${profDept} caught my attention, as they address critical challenges in ${profInterests}.\n\nDuring my studies at ${studentUni}, my research concentrated on ${secondaryKeyword} with applications in ${focusKeyword}. I developed a deep appreciation for the analytical methodologies you employ, and I am very motivated to explore how my technical background can support your current projects.\n\nI have attached my CV and transcripts. Could you kindly let me know if you anticipate accepting new ${targetDegree} research students for the upcoming cycle?\n\nThank you for your time, consideration, and scholarship.\n\nWarm regards,\n${studentName}`;
      } else if (randomSeed === 2) {
        generatedSubject = `Prospective ${targetDegree} Student — Alignment with your work in ${profInterests.split(',')[0]}`;
        generatedBody = `${salutation}\n\nI hope you are having a productive week.\n\nI am reaching out to inquire whether you will be advising new ${targetDegree} researchers at ${profUni} for the upcoming Fall 2027 intake. I have been studying your lab's focus on ${profInterests}, with particular interest in your findings concerning "${profPaper}."\n\nAt ${studentUni}, I completed research exploring ${focusKeyword}. Specifically, I worked on implementing scalable models for ${secondaryKeyword}, which directly parallels the research questions pursued by your group in ${profDept}.\n\nI have attached my curriculum vitae for your review. If your schedule permits, I would be deeply grateful for any insights on prospective openings in your lab.\n\nThank you very much for your guidance.\n\nBest regards,\n${studentName}`;
      } else {
        generatedSubject = `Inquiry on Doctoral Supervision in ${profDept} — ${studentName}`;
        generatedBody = `${salutation}\n\nI hope this note finds you well.\n\nI am writing to inquire about potential research supervision as a prospective ${targetDegree} candidate at ${profUni}. I have long admired your laboratory's scholarship in ${profInterests}, and was inspired by your work on "${profPaper}."\n\nHaving conducted research in ${focusKeyword} at ${studentUni}, I am keen to direct my doctoral studies toward the intersection of ${focusKeyword} and ${profDept}. Your team's innovative approach represents the exact scholarly direction I hope to pursue.\n\nMy complete academic CV and project portfolio are attached. I would appreciate the opportunity to learn if you will be considering new graduate advisees for the upcoming cycle.\n\nThank you for your valuable time and consideration.\n\nRespectfully,\n${studentName}`;
      }
    }

    // Quality check
    const quality = EmailQualityAgent.validateQuality(generatedBody);

    return NextResponse.json({
      success: true,
      subject: generatedSubject,
      bodyText: generatedBody,
      qualityScore: quality.score,
      qualityIssues: quality.issues,
    });
  } catch (error: any) {
    console.error('Error in draft-grounded route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate personalized email draft' },
      { status: 500 }
    );
  }
}
