import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/providers/ai';
import { mockDb } from '@/lib/supabase/mock-db';
import { Professor, ResearchMatch } from '@/types/database';
import { ResearchMatchAnalysisPrompt } from '@/lib/providers/ai/ai-provider.interface';
import { verifyAuthSession } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuthSession(request);
    const userId = session?.user?.id || 'guest';

    const body = await request.json();
    const { professorId, professor, studentProfile: clientProfile } = body;

    if (!professorId && !professor) {
      return NextResponse.json({ error: 'Professor ID or profile required' }, { status: 400 });
    }

    // Resolve Professor
    let prof: Professor | undefined = professor;
    if (!prof && professorId) {
      mockDb.loadFromDisk();
      prof = mockDb.professors.find(p => p.id === professorId);
    }

    if (!prof) {
      return NextResponse.json({ error: 'Professor not found' }, { status: 404 });
    }

    // Resolve Student / User Profile (combine mockDb + client-provided overrides from localStorage)
    const baseStudent = mockDb.studentProfiles.find(s => s.user_id === userId) || mockDb.studentProfiles[0];
    const baseAcademic = mockDb.academicProfiles.find(a => a.student_id === baseStudent?.id) || mockDb.academicProfiles[0];
    const baseResearch = mockDb.researchProfiles.find(r => r.student_id === baseStudent?.id) || mockDb.researchProfiles[0];
    const baseProjects = mockDb.studentProjects.filter(p => p.student_id === baseStudent?.id);
    const baseSkills = mockDb.studentSkills.filter(s => s.student_id === baseStudent?.id);

    // Merge interests
    const interests = clientProfile?.interests && clientProfile.interests.length > 0
      ? clientProfile.interests
      : (baseResearch?.research_interests || ['Computer Science', 'Machine Learning', 'Data Modeling']);

    const thesisTitle = clientProfile?.thesisTitle || baseResearch?.thesis_title || 'Applied Methods and Empirical Paradigms';
    const thesisAbstract = clientProfile?.thesisAbstract || baseResearch?.thesis_abstract || '';

    const projects = clientProfile?.projects && clientProfile.projects.length > 0
      ? clientProfile.projects
      : baseProjects.map(p => ({ title: p.title, description: p.description, tech: p.technologies }));

    if (thesisTitle && !projects.some((p: any) => p.title === thesisTitle)) {
      projects.unshift({
        title: thesisTitle,
        description: thesisAbstract || `Master's / Undergraduate research thesis focused on ${interests.slice(0, 2).join(' & ')}`,
        tech: interests.slice(0, 3)
      });
    }

    const skills = clientProfile?.skills && clientProfile.skills.length > 0
      ? clientProfile.skills
      : (baseSkills.map(s => s.skill_name).length > 0 ? baseSkills.map(s => s.skill_name) : ['Python', 'PyTorch', 'Data Analysis', 'Research Writing', 'Empirical Modeling']);

    const prompt: ResearchMatchAnalysisPrompt = {
      studentProfile: {
        interests,
        thesis: thesisTitle,
        projects: projects.map((p: any) => ({
          title: p.title || 'Academic Project',
          description: p.description || '',
          tech: Array.isArray(p.tech) ? p.tech : []
        })),
        skills,
      },
      professorProfile: {
        name: prof.name,
        university: prof.university_name || (typeof prof.university === 'string' ? prof.university : 'Academic University'),
        interests: prof.research_interests || [prof.primary_discipline || 'Research'],
        publications: (prof.publications || []).map(p => ({
          title: p.title,
          abstract: p.abstract,
          year: p.year || 2024
        })),
        recruitingStatus: prof.recruiting_status || 'ACTIVELY_RECRUITING',
      },
    };

    const ai = getAIProvider();
    const result = await ai.analyzeResearchMatch(prompt);

    const matchRecord: ResearchMatch = {
      id: `rm_${prof.id}_${Date.now()}`,
      user_id: userId,
      professor_id: prof.id,
      overall_score: result.overallScore,
      research_score: result.researchScore,
      project_score: result.projectScore,
      skills_score: result.skillsScore,
      publication_score: result.publicationScore,
      explanation: result.explanation,
      breakdown: {
        matched_topics: result.breakdown.matchedTopics || [],
        relevant_student_projects: result.breakdown.relevantStudentProjects || [],
        relevant_professor_papers: result.breakdown.relevantProfessorPapers || [],
        suggested_angle: result.breakdown.suggestedAngle || '',
        interdisciplinary_alignment: `Interdisciplinary synergy between student focus in ${interests.slice(0, 2).join(', ')} and ${prof.name}'s lab at ${prof.university_name || 'the institution'}.`,
      },
      generated_at: new Date().toISOString(),
    };

    // Cache into mockDb.researchMatches
    const existingIdx = mockDb.researchMatches.findIndex(m => m.professor_id === prof.id);
    if (existingIdx >= 0) {
      mockDb.researchMatches[existingIdx] = matchRecord;
    } else {
      mockDb.researchMatches.push(matchRecord);
    }

    return NextResponse.json({
      success: true,
      match: matchRecord
    });
  } catch (err: any) {
    console.error('[AI MATCH ANALYSIS ERROR]', err);
    return NextResponse.json({ error: err?.message || 'Match analysis failed' }, { status: 500 });
  }
}
