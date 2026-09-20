import { AIProvider } from './ai-provider.interface';
import { MockAIProvider } from './mock-ai-provider';
import { GeminiProvider } from './gemini-provider';

export function getAIProvider(): AIProvider {
  const providerType = process.env.AI_PROVIDER || 'gemini';

  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  if (apiKey && !apiKey.includes('your-ai-api-key')) {
    return new GeminiProvider(apiKey, process.env.AI_MODEL || 'gemini-flash-latest');
  }

  // Default to robust Mock provider if credentials are not configured
  return new MockAIProvider();
}

export * from './ai-provider.interface';
export * from './mock-ai-provider';
export * from './gemini-provider';
