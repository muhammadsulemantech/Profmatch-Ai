import { AIProvider } from './ai-provider.interface';
import { MockAIProvider } from './mock-ai-provider';
import { GeminiProvider } from './gemini-provider';

export function getAIProvider(): AIProvider {
  const providerType = process.env.AI_PROVIDER || 'mock';

  if (providerType === 'gemini' && process.env.AI_API_KEY && !process.env.AI_API_KEY.includes('your-ai-api-key')) {
    return new GeminiProvider(process.env.AI_API_KEY, process.env.AI_MODEL || 'gemini-1.5-pro');
  }

  // Default to robust Mock provider if credentials are not configured
  return new MockAIProvider();
}

export * from './ai-provider.interface';
export * from './mock-ai-provider';
export * from './gemini-provider';
