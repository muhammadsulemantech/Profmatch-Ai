import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAIProvider, ResearchMatchAnalysisPrompt } from '@/lib/providers/ai';
import { verifyAuthSession } from '@/lib/auth/server-auth';
import { checkAndIncrementQuota } from '@/lib/services/quota-service';
import { getProfessorById, saveResearchMatch } from '@/lib/services/professor-service';
import { getStudentProfileByUserId } from '@/lib/services/user-service';
import { apiSuccess, apiError } from '@/lib/api/response';
import type { Professor, ResearchMatch } from '@/types/database';

const MatchAnalyzeSchema = z.object({
  professorId: z.string().optional(),
  professor: z.any().optional(),
  studentProfile: z
    .object({
      interests: z.array(z.string()).optional(),
      thesisTitle: z.string().optional(),
      thesisAbstract: z.string().optional(),
      projects: z
        .array(
          z.object({
            title: z.string().optional(),
            description: z.string().optional(),
            tech: z.any().optional(),
          })
        )
        .optional(),
      skills: z.array(z.string()).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuthSession(request);
    if (!session || !session.user || !session.user.id) {
      return apiError('Unauthorized: Authentication required.', 401);
    }
    const userId = session.user.id;

    const quotaCheck = checkAndIncrementQuota(userId, 'search');
    if (!quotaCheck.allowed) {
      return apiError(quotaCheck.error || 'Quota limit reached', 403, 'QUOTA_EXCEEDED', {
        message: quotaCheck.message,
        tier: quotaCheck.tier,
      });
    }

    const body = await request.json();
    const parsed = MatchAnalyzeSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid match request', 400);
    }

    const { professorId, professor, studentProfile: clientProfile } = parsed.data;

    if (!professorId && !professor) {
      return apiError('Professor ID or profile required', 400);
    }

    let prof: Professor | null = professor || null;
    if (!prof && professorId) {
      prof = await getProfessorById(professorId);
    }

    if (!prof) {
      return apiError('Professor not found', 404);
    }

    // Resolve Student / User Profile via user service
    const userProfileData = await getStudentProfileByUserId(userId);
    const baseResearch = userProfileData.research;
    const baseProjects = userProfileData.projects;
    const baseSkills = userProfileData.skills;

    const interests =
      clientProfile?.interests && clientProfile.interests.length > 0
        ? clientProfile.interests
        : baseResearch?.research_interests || ['Computer Science', 'Machine Learning', 'Data Modeling'];

    const thesisTitle =
      clientProfile?.thesisTitle || baseResearch?.thesis_title || 'Applied Methods and Empirical Paradigms';
    const thesisAbstract = clientProfile?.thesisAbstract || baseResearch?.thesis_abstract || '';

    const projects: any[] =
      clientProfile?.projects && clientProfile.projects.length > 0
        ? [...clientProfile.projects]
        : baseProjects.map((p) => ({ title: p.title, description: p.description, tech: p.technologies }));

    if (thesisTitle && !projects.some((p: any) => p.title === thesisTitle)) {
      projects.unshift({
        title: thesisTitle,
        description: thesisAbstract || `Master's / Undergraduate research thesis focused on ${interests.slice(0, 2).join(' & ')}`,
        tech: interests.slice(0, 3),
      });
    }

    const skills =
      clientProfile?.skills && clientProfile.skills.length > 0
        ? clientProfile.skills
        : baseSkills.map((s) => s.skill_name).length > 0
        ? baseSkills.map((s) => s.skill_name)
        : ['Python', 'PyTorch', 'Data Analysis', 'Research Writing', 'Empirical Modeling'];

    const prompt: ResearchMatchAnalysisPrompt = {
      studentProfile: {
        interests,
        thesis: thesisTitle,
        projects: projects.map((p: any) => ({
          title: p.title || 'Academic Project',
          description: p.description || '',
          tech: Array.isArray(p.tech) ? p.tech : [],
        })),
        skills,
      },
      professorProfile: {
        name: prof.name,
        university: prof.university_name || (typeof (prof as any).university === 'string' ? (prof as any).university : 'Academic University'),
        interests: prof.research_interests || [prof.primary_discipline || 'Research'],
        publications: (prof.publications || []).map((p: any) => ({
          title: p.title,
          abstract: p.abstract || '',
          year: p.year || new Date().getFullYear(),
        })),
        recruitingStatus: (prof as any).recruiting_status || 'ACTIVELY_RECRUITING',
      },
    };

    const ai = getAIProvider();
    const result = await ai.analyzeResearchMatch(prompt);

    const matchRecord: ResearchMatch = {
      id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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

    await saveResearchMatch(matchRecord);

    return apiSuccess({ match: matchRecord });
  } catch (err: any) {
    return apiError(err?.message || 'Match analysis failed', 500);
  }
}
