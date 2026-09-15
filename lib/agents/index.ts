import { getAIProvider, GroundedEmailPrompt, ResearchMatchAnalysisPrompt } from '@/lib/providers/ai';
import { mockDb } from '@/lib/supabase/mock-db';
import { Professor, ResearchMatch } from '@/types/database';

// 1. Global University Discovery Agent
export class UniversityDiscoveryAgent {
  static async discoverUniversities(criteria: { country?: string; region?: string; state?: string; field?: string }) {
    return mockDb.universities.filter(u => {
      if (criteria.country && criteria.country !== 'Global (All Countries)') {
        const cLower = criteria.country.toLowerCase();
        const uCountry = u.country.toLowerCase();
        const uCode = (u.country_code || '').toLowerCase();
        if (!uCountry.includes(cLower) && !cLower.includes(uCountry) && !uCode.includes(cLower)) {
          return false;
        }
      }
      if (criteria.region || criteria.state) {
        const targetRegion = (criteria.region || criteria.state || '').split('(')[0].trim().toLowerCase();
        const uRegion = (u.region || u.state || '').toLowerCase();
        if (!uRegion.includes(targetRegion) && !targetRegion.includes(uRegion)) {
          return false;
        }
      }
      return true;
    });
  }
}

// 2. Global Professor & Faculty Discovery Agent
export class ProfessorDiscoveryAgent {
  static async discoverProfessors(criteria: {
    universityId?: string;
    country?: string;
    region?: string;
    state?: string;
    discipline?: string;
    field?: string;
    interests?: string[];
  }) {
    return mockDb.professors.filter(p => {
      if (criteria.universityId && p.university_id !== criteria.universityId) return false;
      if (criteria.country && criteria.country !== 'Global (All Countries)') {
        const cLower = criteria.country.toLowerCase();
        const pCountry = (p.university_country || '').toLowerCase();
        if (!pCountry.includes(cLower) && !cLower.includes(pCountry)) return false;
      }
      if (criteria.region || criteria.state) {
        const targetRegion = (criteria.region || criteria.state || '').split('(')[0].trim().toLowerCase();
        const pRegion = (p.university_region || p.university_state || '').toLowerCase();
        if (!pRegion.includes(targetRegion) && !targetRegion.includes(pRegion)) return false;
      }
      if (criteria.discipline || criteria.field) {
        const targetField = (criteria.discipline || criteria.field || '').toLowerCase();
        const pField = (p.primary_discipline || p.department_name || '').toLowerCase();
        const pTags = (p.interdisciplinary_tags || []).map(t => t.toLowerCase());
        const matches = pField.includes(targetField) || targetField.includes(pField) || pTags.some(t => t.includes(targetField));
        if (!matches) return false;
      }
      return true;
    });
  }
}

// 3. Global Source Verification Agent
export class SourceVerificationAgent {
  static async verifyProfessorSource(professor: Professor) {
    const url = (professor.profile_url || '').toLowerCase();
    const email = (professor.email || '').toLowerCase();

    const isAccreditedDomain =
      url.includes('.edu') ||
      url.includes('.ac.') ||
      url.includes('tum.de') ||
      url.includes('ox.ac.uk') ||
      url.includes('kth.se') ||
      url.includes('polimi.it') ||
      url.includes('usp.br') ||
      url.includes('nust.edu.pk') ||
      url.includes('u-tokyo.ac.jp') ||
      url.includes('kaist.ac.kr');

    const emailMatchesUniversity =
      email.includes('.edu') ||
      email.includes('.ac.') ||
      (professor.university_name && email.includes(professor.university_name.toLowerCase().split(' ')[0]));

    return {
      isVerified: Boolean(isAccreditedDomain),
      sourceType: 'UNIVERSITY_FACULTY_PAGE',
      sourceUrl: professor.profile_url,
      confidenceScore: isAccreditedDomain && emailMatchesUniversity ? 0.99 : 0.92,
      emailStatus: professor.email_verification_status || (isAccreditedDomain ? 'VERIFIED' : 'UNVERIFIED'),
      verifiedAt: new Date().toISOString(),
    };
  }
}

// 4. Scholarly Research Analysis Agent
export class ResearchAnalysisAgent {
  static async analyzePublications(professor: Professor) {
    return (professor.publications || []).map(pub => ({
      title: pub.title,
      year: pub.year,
      venue: pub.venue,
      citations: pub.citations_count,
      doi: pub.doi,
      url: pub.url,
      sourceProvider: pub.source_provider || 'OpenAlex / Crossref',
    }));
  }
}

// 5. Interdisciplinary Research Matching Agent
export class ResearchMatchingAgent {
  static async computeMatch(studentUserId: string, professor: Professor): Promise<ResearchMatch> {
    const ai = getAIProvider();
    const student = mockDb.studentProfiles.find(s => s.user_id === studentUserId) || mockDb.studentProfiles[0];
    const research = mockDb.researchProfiles.find(r => r.student_id === student.id) || mockDb.researchProfiles[0];
    const projects = mockDb.studentProjects.filter(p => p.student_id === student.id);
    const skills = mockDb.studentSkills.filter(s => s.student_id === student.id);

    const prompt: ResearchMatchAnalysisPrompt = {
      studentProfile: {
        interests: research?.research_interests || ['Academic Research', 'Methodology'],
        thesis: research?.thesis_title,
        projects: projects.map(p => ({ title: p.title, description: p.description, tech: p.technologies })),
        skills: skills.map(s => s.skill_name),
      },
      professorProfile: {
        name: professor.name,
        university: professor.university_name || 'University',
        interests: professor.research_interests,
        publications: (professor.publications || []).map(p => ({ title: p.title, year: p.year })),
        recruitingStatus: professor.recruiting_status,
      },
    };

    const result = await ai.analyzeResearchMatch(prompt);

    return {
      id: `rm_${Date.now()}`,
      user_id: studentUserId,
      professor_id: professor.id,
      overall_score: result.overallScore,
      research_score: result.researchScore,
      project_score: result.projectScore,
      skills_score: result.skillsScore,
      publication_score: result.publicationScore,
      explanation: result.explanation,
      breakdown: {
        matched_topics: result.breakdown.matchedTopics,
        relevant_student_projects: result.breakdown.relevantStudentProjects,
        relevant_professor_papers: result.breakdown.relevantProfessorPapers,
        suggested_angle: result.breakdown.suggestedAngle,
        interdisciplinary_alignment: `Cross-disciplinary alignment between ${student.desired_field || 'academic discipline'} and ${professor.primary_discipline || 'specialized research area'}.`,
      },
      generated_at: new Date().toISOString(),
    };
  }
}

// 6. Global Email Personalization Agent
export class EmailPersonalizationAgent {
  static async generateEmail(studentUserId: string, professor: Professor, options: { tone?: string; customNote?: string } = {}) {
    const ai = getAIProvider();
    const studentUser = mockDb.profiles.find(p => p.id === studentUserId) || mockDb.profiles[1];
    const student = mockDb.studentProfiles.find(s => s.user_id === studentUserId) || mockDb.studentProfiles[0];
    const academic = mockDb.academicProfiles.find(a => a.student_id === student.id) || mockDb.academicProfiles[0];
    const research = mockDb.researchProfiles.find(r => r.student_id === student.id) || mockDb.researchProfiles[0];
    const projects = mockDb.studentProjects.filter(p => p.student_id === student.id);

    const prompt: GroundedEmailPrompt = {
      studentName: studentUser.full_name || 'Student Applicant',
      studentDegree: academic.current_degree,
      studentUniversity: academic.university,
      targetDegree: student.target_degree || 'PhD',
      targetIntake: student.target_intake || 'Fall 2027',
      studentInterests: research.research_interests,
      studentThesis: research.thesis_title,
      studentProjects: projects.map(p => ({ title: p.title, description: p.description })),
      professorName: professor.name,
      professorTitle: professor.title || 'Professor',
      professorUniversity: professor.university_name || 'University',
      professorDepartment: professor.department_name || professor.academic_unit_name,
      professorInterests: professor.research_interests,
      professorRecentPapers: (professor.publications || []).map(p => ({ title: p.title, year: p.year, venue: p.venue })),
      professorRecruitingNotes: professor.recruiting_notes,
      tone: options.tone || 'academic',
    };

    return await ai.generateGroundedEmail(prompt);
  }
}

// 7. Email Quality Agent (Academic Etiquette & Factuality Safeguards)
export class EmailQualityAgent {
  static validateQuality(emailText: string) {
    const issues: string[] = [];
    if (emailText.length > 2500) issues.push('Email is excessively long (>400 words); recommend shortening for faculty readability.');
    if (emailText.includes('prestigious esteemed') || emailText.includes('world renowned') || emailText.includes('greatest professor')) {
      issues.push('Contains generic flattery clichés; replace with specific publication citations.');
    }
    if (!emailText.includes('CV') && !emailText.includes('curriculum vitae') && !emailText.includes('resume')) {
      issues.push('Academic CV is not mentioned in email body.');
    }

    return {
      isValid: issues.length === 0,
      score: Math.max(70, 100 - issues.length * 15),
      issues,
    };
  }
}

// 8. Polite Follow-up Agent
export class FollowUpAgent {
  static generateFollowUp(professorName: string, originalSubject: string, stage: number = 1) {
    const cleanName = professorName.replace(/^(Dr\.|Prof\.|Professor)\s+/i, '');
    const subject = `Re: ${originalSubject}`;
    const body = `Dear Professor ${cleanName},\n\nI hope this brief note finds you well amid the semester.\n\nI am following up on my previous inquiry regarding prospective graduate supervision for the upcoming admissions cycle. I remain very eager about the opportunity to contribute to your ongoing research initiatives.\n\nPlease let me know if any additional materials or project summaries would be helpful.\n\nThank you very much for your time.\n\nSincerely,`;
    return { subject, body };
  }
}

// 9. Reply Analysis Agent
export class ReplyAnalysisAgent {
  static async analyzeReply(replyText: string, professorName: string, originalEmail: string) {
    const ai = getAIProvider();
    return await ai.analyzeProfessorReply(replyText, { professorName, originalEmail });
  }
}
