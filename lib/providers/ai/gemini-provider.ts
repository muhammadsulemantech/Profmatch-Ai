import {
  AIProvider,
  GroundedEmailPrompt,
  GroundedEmailOutput,
  ResearchMatchAnalysisPrompt,
  ResearchMatchAnalysisOutput,
  ReplyAnalysisOutput,
} from './ai-provider.interface';
import { MockAIProvider } from './mock-ai-provider';

export class GeminiProvider implements AIProvider {
  name = 'Google Gemini LLM Engine';
  private apiKey: string | undefined;
  private modelName: string;
  private fallback: MockAIProvider;

  constructor(apiKey?: string, modelName?: string) {
    this.apiKey = apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '';
    this.modelName = modelName || process.env.AI_MODEL || 'gemini-3.5-flash-lite';
    this.fallback = new MockAIProvider();
  }

  async generateGroundedEmail(prompt: GroundedEmailPrompt): Promise<GroundedEmailOutput> {
    if (!this.apiKey || this.apiKey.includes('your-ai-api-key')) {
      return this.fallback.generateGroundedEmail(prompt);
    }

    try {
      const systemInstruction = `You are a Senior Academic Outreach Specialist and Graduate Admissions Advisor.
Your job is to generate a highly personalized, respectful, research-grounded outreach email from a prospective graduate student to a professor.
Rules:
- NEVER hallucinate fake papers, fake citations, or fake degrees.
- ONLY reference papers provided in the prompt.
- Connect the student's actual background/projects with the professor's research topics.
- Keep tone professional, concise, and academic (no spam clichés or flattery).
- Return valid JSON matching the GroundedEmailOutput interface with fields: subject, bodyText, personalizationNotes (array of strings), sourceReferences (array of {type, title, url, context}).`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${systemInstruction}\n\nStudent Profile:\n${JSON.stringify(prompt, null, 2)}\n\nGenerate outreach email JSON:`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          }),
        }
      );

      if (!response.ok) {
        return this.fallback.generateGroundedEmail(prompt);
      }

      const data = await response.json();
      const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!contentText) return this.fallback.generateGroundedEmail(prompt);

      return JSON.parse(contentText);
    } catch {
      return this.fallback.generateGroundedEmail(prompt);
    }
  }

  async analyzeResearchMatch(prompt: ResearchMatchAnalysisPrompt): Promise<ResearchMatchAnalysisOutput> {
    if (!this.apiKey || this.apiKey.includes('your-ai-api-key')) {
      return this.fallback.analyzeResearchMatch(prompt);
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `Analyze the research compatibility between this student profile and professor profile.
Return a JSON object with:
overallScore (0-100), researchScore (0-100), projectScore (0-100), skillsScore (0-100), publicationScore (0-100), explanation (string), breakdown ({ matchedTopics: string[], relevantStudentProjects: string[], relevantProfessorPapers: string[], suggestedAngle: string }).

Data:
Student: ${JSON.stringify(prompt.studentProfile)}
Professor: ${JSON.stringify(prompt.professorProfile)}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        }
      );

      if (!response.ok) return this.fallback.analyzeResearchMatch(prompt);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return this.fallback.analyzeResearchMatch(prompt);
      return JSON.parse(text);
    } catch {
      return this.fallback.analyzeResearchMatch(prompt);
    }
  }

  async analyzeProfessorReply(replyText: string, context: { professorName: string; originalEmail: string }): Promise<ReplyAnalysisOutput> {
    if (!this.apiKey || this.apiKey.includes('your-ai-api-key')) {
      return this.fallback.analyzeProfessorReply(replyText, context);
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `Analyze this reply from professor ${context.professorName}.
Original Email: ${context.originalEmail}
Professor Reply: ${replyText}

Return JSON with:
summary (string),
sentiment ('POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MEETING_REQUESTED'),
keyRequests (string[]),
suggestedResponse (string).`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        }
      );

      if (!response.ok) return this.fallback.analyzeProfessorReply(replyText, context);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return this.fallback.analyzeProfessorReply(replyText, context);
      return JSON.parse(text);
    } catch {
      return this.fallback.analyzeProfessorReply(replyText, context);
    }
  }
}
