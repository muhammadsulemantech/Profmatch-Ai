export interface GroundedEmailPrompt {
  studentName: string;
  studentDegree: string;
  studentUniversity: string;
  targetDegree: string;
  targetIntake: string;
  studentInterests: string[];
  studentThesis?: string;
  studentProjects: { title: string; description: string }[];
  professorName: string;
  professorTitle: string;
  professorUniversity: string;
  professorDepartment?: string;
  professorInterests: string[];
  professorRecentPapers: { title: string; year: number; venue?: string }[];
  professorRecruitingNotes?: string;
  tone?: string;
}

export interface GroundedEmailOutput {
  subject: string;
  bodyText: string;
  personalizationNotes: string[];
  sourceReferences: {
    type: string;
    title: string;
    url: string;
    context: string;
  }[];
}

export interface ResearchMatchAnalysisPrompt {
  studentProfile: {
    interests: string[];
    thesis?: string;
    projects: { title: string; description: string; tech: string[] }[];
    skills: string[];
  };
  professorProfile: {
    name: string;
    university: string;
    interests: string[];
    publications: { title: string; abstract?: string; year: number }[];
    recruitingStatus: string;
  };
}

export interface ResearchMatchAnalysisOutput {
  overallScore: number;
  researchScore: number;
  projectScore: number;
  skillsScore: number;
  publicationScore: number;
  explanation: string;
  breakdown: {
    matchedTopics: string[];
    relevantStudentProjects: string[];
    relevantProfessorPapers: string[];
    suggestedAngle: string;
  };
}

export interface ReplyAnalysisOutput {
  summary: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MEETING_REQUESTED';
  keyRequests: string[];
  suggestedResponse: string;
}

export interface AIProvider {
  name: string;
  generateGroundedEmail(prompt: GroundedEmailPrompt): Promise<GroundedEmailOutput>;
  analyzeResearchMatch(prompt: ResearchMatchAnalysisPrompt): Promise<ResearchMatchAnalysisOutput>;
  analyzeProfessorReply(replyText: string, context: { professorName: string; originalEmail: string }): Promise<ReplyAnalysisOutput>;
}
