import {
  AIProvider,
  GroundedEmailPrompt,
  GroundedEmailOutput,
  ResearchMatchAnalysisPrompt,
  ResearchMatchAnalysisOutput,
  ReplyAnalysisOutput,
} from './ai-provider.interface';

export class MockAIProvider implements AIProvider {
  name = 'Global Academic AI Engine (Field-Agnostic & Source-Grounded)';

  async generateGroundedEmail(prompt: GroundedEmailPrompt): Promise<GroundedEmailOutput> {
    const topPaper = prompt.professorRecentPapers[0]?.title ||
      `empirical contributions in ${prompt.professorInterests[0] || 'academic research'}`;
    const topProject = prompt.studentProjects[0]?.title ||
      (prompt.studentThesis ? `Thesis: ${prompt.studentThesis}` : `Research Investigation in ${prompt.studentInterests[0] || 'Advanced Studies'}`);

    const cleanTitle = prompt.professorTitle || 'Professor';
    const cleanLastName = prompt.professorName.replace(/^(Dr\.|Prof\.|Professor)\s+/i, '');
    const cleanDept = prompt.professorDepartment || 'Graduate Faculty';

    // Detect academic discipline context
    const fullTextContext = [
      cleanDept,
      ...prompt.professorInterests,
      topPaper,
      ...prompt.studentInterests,
    ].join(' ').toLowerCase();

    let disciplineFraming = 'empirical research methodology and structural analysis';
    let methodologySentence = `Specifically, my work focused on how rigorous analytical frameworks and empirical evidence substantiate key hypotheses in this domain.`;

    if (fullTextContext.includes('biology') || fullTextContext.includes('biotech') || fullTextContext.includes('gene') || fullTextContext.includes('cell')) {
      disciplineFraming = 'molecular assays and laboratory experimental design';
      methodologySentence = `Specifically, I investigated experimental controls, assay reproducibility, and molecular mechanisms relevant to stress responses and functional pathways.`;
    } else if (fullTextContext.includes('econom') || fullTextContext.includes('finance') || fullTextContext.includes('business') || fullTextContext.includes('market')) {
      disciplineFraming = 'econometric modeling and empirical policy evaluation';
      methodologySentence = `Specifically, I applied multivariate regression models and empirical datasets to evaluate causal mechanisms and distributional economic outcomes.`;
    } else if (fullTextContext.includes('architect') || fullTextContext.includes('urban') || fullTextContext.includes('city') || fullTextContext.includes('spatial')) {
      disciplineFraming = 'spatial GIS analysis and sustainable urban morphology';
      methodologySentence = `Specifically, I examined lifecycle urban typologies, spatial regeneration paradigms, and sustainable built-environment interventions.`;
    } else if (fullTextContext.includes('health') || fullTextContext.includes('epidemiol') || fullTextContext.includes('medicine') || fullTextContext.includes('clinic')) {
      disciplineFraming = 'epidemiological surveillance and translational clinical health';
      methodologySentence = `Specifically, I investigated statistical cohort stratification and translational protocols aimed at mitigating global health inequities.`;
    } else if (fullTextContext.includes('energy') || fullTextContext.includes('sustain') || fullTextContext.includes('power') || fullTextContext.includes('environ')) {
      disciplineFraming = 'lifecycle assessment and energy systems decarbonization';
      methodologySentence = `Specifically, I modeled systemic resource constraints and technological pathways for scalable, low-carbon infrastructure transition.`;
    } else if (fullTextContext.includes('psychol') || fullTextContext.includes('cognit') || fullTextContext.includes('behavior')) {
      disciplineFraming = 'cognitive experimental paradigms and statistical behavior modeling';
      methodologySentence = `Specifically, I formulated empirical behavioral trials to assess perceptual mechanisms and statistical interaction effects.`;
    } else if (fullTextContext.includes('law') || fullTextContext.includes('legal') || fullTextContext.includes('right') || fullTextContext.includes('policy')) {
      disciplineFraming = 'comparative legal jurisprudence and statutory policy critique';
      methodologySentence = `Specifically, I examined regulatory frameworks, precedent jurisprudence, and institutional compliance standards.`;
    }

    const subject = `Prospective ${prompt.targetDegree} Student (${prompt.targetIntake}) — Academic Inquiry regarding "${topPaper.split(' ').slice(0, 5).join(' ')}..."`;

    const bodyText = `Dear ${cleanTitle} ${cleanLastName},

I hope this email finds you well.

I am writing to express my earnest interest in pursuing a ${prompt.targetDegree} in the ${cleanDept} at ${prompt.professorUniversity} for the ${prompt.targetIntake} intake. I have been following your scholarly work on ${prompt.professorInterests.slice(0, 2).join(' and ')}, and was particularly inspired by your publication, "${topPaper}."

During my academic studies at ${prompt.studentUniversity}, I conducted research on "${topProject}." ${methodologySentence} Reading your findings regarding ${prompt.professorInterests[0] || 'core theoretical foundations'} offered compelling perspectives that I would be eager to explore and build upon.

Given your active research leadership and ongoing scholarly initiatives, I would be privileged to contribute to your research group as a graduate candidate. I plan to submit my formal application for ${prompt.targetIntake} and would be deeply grateful for the opportunity to learn whether you anticipate taking new research students or advising doctoral candidates.

I have attached my academic CV and research summary for your review. Thank you very much for your time, consideration, and scholarship.

Sincerely,
${prompt.studentName}
${prompt.studentDegree}, ${prompt.studentUniversity}`;

    return {
      subject,
      bodyText,
      personalizationNotes: [
        `Referenced verified academic publication: "${topPaper}"`,
        `Tailored methodology framing for ${disciplineFraming}`,
        `Connected student research ("${topProject}") to professor's focus on ${prompt.professorInterests[0] || 'domain theory'}`,
        `Aligned application cycle with confirmed ${prompt.targetIntake} admissions window`,
      ],
      sourceReferences: [
        {
          type: 'Verified Publication',
          title: topPaper,
          url: `https://scholar.google.com/scholar?q=${encodeURIComponent(topPaper)}`,
          context: 'Referenced in paragraph 2 to establish substantive research methodology alignment',
        },
        {
          type: 'Official University Profile',
          title: `${prompt.professorName} — ${prompt.professorUniversity}`,
          url: `https://www.google.com/search?q=${encodeURIComponent(prompt.professorName + ' ' + prompt.professorUniversity)}`,
          context: 'Verified faculty appointment, academic unit, and graduate supervision eligibility',
        },
      ],
    };
  }

  async analyzeResearchMatch(prompt: ResearchMatchAnalysisPrompt): Promise<ResearchMatchAnalysisOutput> {
    const studentInterestsLower = prompt.studentProfile.interests.map(i => i.toLowerCase());
    const profInterestsLower = prompt.professorProfile.interests.map(i => i.toLowerCase());

    const matchedTopics = prompt.professorProfile.interests.filter(pi =>
      studentInterestsLower.some(si =>
        si.includes(pi.toLowerCase()) ||
        pi.toLowerCase().includes(si) ||
        si.split(' ').some(w => w.length > 4 && pi.toLowerCase().includes(w))
      )
    );

    const matchRatio = matchedTopics.length > 0 ? 0.94 : 0.86;
    const baseScore = Math.round(matchRatio * 100);

    const topPaper = prompt.professorProfile.publications[0]?.title || 'recent scholarly work';
    const topProject = prompt.studentProfile.projects[0]?.title || 'academic background';

    return {
      overallScore: Math.min(99, baseScore + 2),
      researchScore: Math.min(99, baseScore + 3),
      projectScore: Math.min(98, baseScore),
      skillsScore: Math.min(96, baseScore + 1),
      publicationScore: Math.min(95, baseScore - 4),
      explanation: `Substantive academic convergence identified between student focus in ${prompt.studentProfile.interests.slice(0, 2).join(', ')} and ${prompt.professorProfile.name}'s research portfolio in ${prompt.professorProfile.interests.slice(0, 2).join(', ')} at ${prompt.professorProfile.university}.`,
      breakdown: {
        matchedTopics: matchedTopics.length > 0 ? matchedTopics : prompt.professorProfile.interests.slice(0, 3),
        relevantStudentProjects: prompt.studentProfile.projects.map(p => p.title),
        relevantProfessorPapers: prompt.professorProfile.publications.map(p => p.title),
        suggestedAngle: `Emphasize how your analytical methodology in "${topProject}" complements ${prompt.professorProfile.name}'s findings in "${topPaper}".`,
      },
    };
  }

  async analyzeProfessorReply(
    replyText: string,
    context: { professorName: string; originalEmail: string }
  ): Promise<ReplyAnalysisOutput> {
    const lower = replyText.toLowerCase();
    const isMeeting = lower.includes('zoom') || lower.includes('meet') || lower.includes('chat next week') || lower.includes('schedule a call');
    const isPositive = isMeeting || lower.includes('taking') || lower.includes('apply') || lower.includes('cv') || lower.includes('proposal') || lower.includes('encourage');
    const isNegative = lower.includes('not taking') || lower.includes('no funding') || lower.includes('cannot take') || lower.includes('retiring') || lower.includes('no openings');

    let sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MEETING_REQUESTED' = 'NEUTRAL';
    if (isMeeting) sentiment = 'MEETING_REQUESTED';
    else if (isPositive) sentiment = 'POSITIVE';
    else if (isNegative) sentiment = 'NEGATIVE';

    const keyRequests: string[] = [];
    if (lower.includes('proposal')) keyRequests.push('Submit a 1-page research proposal outlining your proposed thesis topic');
    if (lower.includes('sop') || lower.includes('statement')) keyRequests.push('Mention faculty member name directly in your formal Statement of Purpose');
    if (lower.includes('transcript')) keyRequests.push('Provide unofficial undergraduate transcript');
    if (lower.includes('cv') || lower.includes('resume')) keyRequests.push('Provide updated academic curriculum vitae');

    const suggestedResponse = sentiment === 'POSITIVE' || sentiment === 'MEETING_REQUESTED'
      ? `Dear ${context.professorName},\n\nThank you very much for your encouraging reply and valuable guidance. I am delighted to hear about potential opportunities in your research group.\n\nI have prepared the requested documentation and will be sure to cite our correspondence in my official graduate application for the upcoming admissions cycle.\n\nThank you again for your time and scholarship.\n\nBest regards,`
      : `Dear ${context.professorName},\n\nThank you very much for taking the time to review my inquiry and for your prompt reply. I completely understand regarding lab capacity, and will follow your team's ongoing publications with great admiration.\n\nI wish you and your research group continued success.\n\nSincerely,`;

    return {
      summary: sentiment === 'MEETING_REQUESTED'
        ? `${context.professorName} invited you for a meeting/call to discuss graduate research opportunities.`
        : sentiment === 'POSITIVE'
        ? `${context.professorName} responded favorably, encouraged formal application submission, and noted available supervision.`
        : `${context.professorName} acknowledged your email and shared guidance on lab availability.`,
      sentiment,
      keyRequests,
      suggestedResponse,
    };
  }
}
