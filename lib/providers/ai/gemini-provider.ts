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

  private async callGeminiApi(promptText: string, temperature: number = 0.2): Promise<string | null> {
    const candidateModels = [this.modelName, 'gemini-flash-lite-latest'];

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

    try {
      const systemInstruction = `You are a Senior Academic Outreach Specialist and Graduate Admissions Advisor.
Your job is to generate a highly personalized, respectful, research-grounded outreach email from a prospective graduate student to a professor.
Rules:
- NEVER hallucinate fake papers, fake citations, or fake degrees.
- ONLY reference papers provided in the prompt.
- Connect the student's actual background/projects with the professor's research topics.
- Keep tone professional, concise, and academic (no spam clichés or flattery).
- Return valid JSON matching the GroundedEmailOutput interface with fields: subject, bodyText, personalizationNotes (array of strings), sourceReferences (array of {type, title, url, context}).`;

      const promptText = `${systemInstruction}\n\nStudent Profile:\n${JSON.stringify(prompt, null, 2)}\n\nGenerate outreach email JSON:`;
      const text = await this.callGeminiApi(promptText, 0.3);

      if (!text) {
        throw new Error('Gemini API generation failed: Provider returned an empty response or was rate-limited.');
      }
      return JSON.parse(text);
    } catch (err: any) {
      throw new Error(`AI email draft generation failed: ${err.message || 'Gemini model error'}`);
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
        throw new Error('Gemini API match analysis failed: Provider returned an empty response.');
      }
      return JSON.parse(text);
    } catch (err: any) {
      throw new Error(`Research match analysis failed: ${err.message || 'Gemini model error'}`);
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
        throw new Error('Gemini API reply analysis failed: Provider returned an empty response.');
      }
      return JSON.parse(text);
    } catch (err: any) {
      throw new Error(`Reply analysis failed: ${err.message || 'Gemini model error'}`);
    }
  }
}

