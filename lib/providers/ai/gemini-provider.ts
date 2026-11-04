import {
  AIProvider,
  GroundedEmailPrompt,
  GroundedEmailOutput,
  ResearchMatchAnalysisPrompt,
  ResearchMatchAnalysisOutput,
  ReplyAnalysisOutput,
} from './ai-provider.interface';
import { MockAIProvider } from './mock-ai-provider';
import { cleanProfessorSalutation } from '@/lib/templates/email-templates';

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

  private async callGeminiApi(promptText: string, temperature: number = 0.2): Promise<string | null> {
    const candidateModels = Array.from(new Set([
      this.modelName,
      'gemini-flash-latest',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash'
    ]));

    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: promptText }],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (contentText) return contentText;
        }
      } catch {
        // Continue to fallback model
      }
    }
    return null;
  }

  async generateGroundedEmail(prompt: GroundedEmailPrompt): Promise<GroundedEmailOutput> {
    if (!this.apiKey || this.apiKey.includes('your-ai-api-key')) {
      throw new Error('AI Provider unconfigured: A valid Gemini API key is required. Please check AI_API_KEY in configuration.');
    }

    const { salutation, cleanName, lastName } = cleanProfessorSalutation(prompt.professorName);

    try {
      const systemInstruction = `You are a Senior Academic Outreach Specialist and Ivy-League Graduate Admissions Advisor.
Your job is to generate a deeply personalized, respectful, research-grounded outreach email from a prospective graduate student to Professor ${cleanName} at ${prompt.professorUniversity}.

CRITICAL ACADEMIC PROTOCOLS:
1. FORMAL SALUTATION: Always open the email with "${salutation}". In global academic convention, professors are addressed by their family/last name ("Dear Professor ${lastName},"). Never address them casually, by first name alone, or with generic greetings.
2. HYPER-PERSONALIZATION: Deeply customize the email to Professor ${cleanName}'s specific research focus in ${prompt.professorDepartment || 'their academic department'} at ${prompt.professorUniversity}.
3. GROUNDED CITATION: If papers or research publications are provided, reference them naturally (e.g. "Your recent work on..."). NEVER hallucinate fake papers or false citations.
4. STUDENT-FACULTY SYNERGY: Specifically connect the student's background, thesis, and technical projects to the professor's ongoing research direction.
5. CONCISE & RESPECTFUL: Keep the tone polite, humble, and concise (under 220 words). Inquire politely about prospective student advising capacity for ${prompt.targetIntake || 'the upcoming academic intake'}.
6. OUTPUT FORMAT: Return valid JSON matching the GroundedEmailOutput interface with fields: subject, bodyText, personalizationNotes (array of strings explaining how the email was personalized), sourceReferences (array of {type, title, url, context}).`;

      const promptText = `${systemInstruction}\n\nStudent Profile:\n${JSON.stringify(prompt, null, 2)}\n\nGenerate outreach email JSON:`;
      const text = await this.callGeminiApi(promptText, 0.3);

      if (!text) {
        console.warn('[GEMINI AI NOTICE] Model unavailable or rate-limited. Falling back to deterministic academic engine.');
        return this.fallback.generateGroundedEmail(prompt);
      }
      return JSON.parse(text);
    } catch (err: any) {
      console.warn('[GEMINI AI NOTICE] Model error, activating graceful template fallback:', err?.message);
      return this.fallback.generateGroundedEmail(prompt);
    }
  }

  async analyzeResearchMatch(prompt: ResearchMatchAnalysisPrompt): Promise<ResearchMatchAnalysisOutput> {
    if (!this.apiKey || this.apiKey.includes('your-ai-api-key')) {
      throw new Error('AI Provider unconfigured: A valid Gemini API key is required to perform research match scoring.');
    }

    try {
      const promptText = `Analyze the research compatibility between this student profile and professor profile.
Return a JSON object with:
overallScore (0-100), researchScore (0-100), projectScore (0-100), skillsScore (0-100), publicationScore (0-100), explanation (string), breakdown ({ matchedTopics: string[], relevantStudentProjects: string[], relevantProfessorPapers: string[], suggestedAngle: string }).

Data:
Student: ${JSON.stringify(prompt.studentProfile)}
Professor: ${JSON.stringify(prompt.professorProfile)}`;

      const text = await this.callGeminiApi(promptText, 0.2);
      if (!text) {
        console.warn('[GEMINI MATCH NOTICE] Model unavailable. Falling back to deterministic match calculation.');
        return this.fallback.analyzeResearchMatch(prompt);
      }
      return JSON.parse(text);
    } catch (err: any) {
      console.warn('[GEMINI MATCH NOTICE] Model error, activating graceful match fallback:', err?.message);
      return this.fallback.analyzeResearchMatch(prompt);
    }
  }

  async analyzeProfessorReply(replyText: string, context: { professorName: string; originalEmail: string }): Promise<ReplyAnalysisOutput> {
    if (!this.apiKey || this.apiKey.includes('your-ai-api-key')) {
      throw new Error('AI Provider unconfigured: A valid Gemini API key is required to analyze replies.');
    }

    try {
      const promptText = `Analyze this reply from professor ${context.professorName}.
Original Email: ${context.originalEmail}
Professor Reply: ${replyText}

Return JSON with:
summary (string),
sentiment ('POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MEETING_REQUESTED'),
keyRequests (string[]),
suggestedResponse (string).`;

      const text = await this.callGeminiApi(promptText, 0.2);
      if (!text) {
        console.warn('[GEMINI REPLY NOTICE] Model unavailable. Falling back to deterministic reply analyzer.');
        return this.fallback.analyzeProfessorReply(replyText, context);
      }
      return JSON.parse(text);
    } catch (err: any) {
      console.warn('[GEMINI REPLY NOTICE] Model error, activating graceful reply fallback:', err?.message);
      return this.fallback.analyzeProfessorReply(replyText, context);
    }
  }
}

