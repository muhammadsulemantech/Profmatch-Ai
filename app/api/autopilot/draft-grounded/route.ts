import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/supabase/mock-db';
import { EmailPersonalizationAgent, EmailQualityAgent } from '@/lib/agents';

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
    const studentUser = mockDb.profiles.find((u: any) => u.id === userId) || mockDb.profiles[1] || { id: userId, full_name: 'Student Researcher' };
    const academic = mockDb.academicProfiles.find(a => a.student_id === studentUser.id) || mockDb.academicProfiles[0];
    const research = mockDb.researchProfiles.find(r => r.student_id === studentUser.id) || mockDb.researchProfiles[0];
    const projects = mockDb.studentProjects.filter(p => p.student_id === studentUser.id);

    // Build grounded draft with AI
    const result = await EmailPersonalizationAgent.generateEmail(
      studentUser.id,
      professor,
      {
        tone,
      }
    );

    // Overwrite recipient & target details if dynamic professor provided
    const profNameClean = professor.name.replace(/^(Dr\.|Prof\.|Professor)\s+/i, '');
    let customSubject = result.subject;
    if (!customSubject || customSubject.includes('undefined')) {
      customSubject = `Prospective ${studentProfile?.targetDegree || 'PhD'} Student — Research Inquiry in ${professor.primary_discipline || 'Your Lab'}`;
    }

    let customBody = result.bodyText;
    if (!customBody || customBody.length < 100) {
      const topPub = professor.publications?.[0]?.title || 'your recent contributions to the field';
      customBody = `Dear Professor ${profNameClean},\n\nI hope this email finds you well.\n\nI am writing to express my strong interest in joining your research group as a prospective ${studentProfile?.targetDegree || 'Ph.D.'} student for the upcoming admissions cycle. Having closely studied your research in ${professor.primary_discipline || 'your lab'} at ${professor.university_name || 'your university'}—particularly your work on "${topPub}"—I am eager to contribute to your ongoing investigations.\n\nMy background includes degree work at ${academic.university || 'university'} (CGPA: ${academic.cgpa || '3.9'}) with research focusing on ${studentProfile?.researchInterests?.join(', ') || research.research_interests?.join(', ') || 'applied methodologies'}. My projects align closely with your group's focus.\n\nI have attached my academic CV for your review and would welcome any opportunity to discuss prospective openings in your lab.\n\nThank you very much for your time and consideration.\n\nSincerely,\n${studentUser.full_name || 'Student Applicant'}`;
    }

    // Quality check
    const quality = EmailQualityAgent.validateQuality(customBody);

    return NextResponse.json({
      success: true,
      subject: customSubject,
      bodyText: customBody,
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
