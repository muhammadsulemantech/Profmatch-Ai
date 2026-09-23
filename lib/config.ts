import { z } from 'zod';

/**
 * ProfMatch AI — Runtime Environment Configuration & Validation
 *
 * Validates environment variables at runtime with type safety,
 * default fallbacks, and fail-fast validation in production.
 */

const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Base Application URL
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal('')),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal('')),

  // AI Configuration
  AI_PROVIDER: z.enum(['gemini', 'openai', 'anthropic', 'mock']).default('gemini'),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('gemini-1.5-pro'),
  GEMINI_API_KEY: z.string().optional(),

  // Academic Search & Faculty Discovery Providers
  SEARCH_PROVIDER: z.enum(['tavily', 'openalex', 'serpapi', 'mock']).default('mock'),
  SEARCH_API_KEY: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),
  OPENALEX_EMAIL: z.string().email().optional().or(z.literal('')),

  // Email Delivery Configuration
  EMAIL_PROVIDER: z.enum(['smtp', 'resend', 'mock']).default('mock'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_SECURE: z.coerce.boolean().optional().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('ProfMatch AI <noreply@profmatch.ai>'),
  EMAIL_REPLY_TO: z.string().optional(),

  // Google OAuth (Gmail Integration)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Billing & Payment Gateways
  PAYMENT_PROVIDER: z.enum(['stripe', 'mock']).default('mock'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Security & Authentication
  SESSION_SECRET: z.string().min(16).default('profmatch-ai-default-jwt-session-secret-change-in-prod'),
  ADMIN_SECRET_PASSPHRASE: z.string().optional().default('admin-dev-passphrase'),
  RATE_LIMIT_MAX_REQUESTS_PER_MINUTE: z.coerce.number().default(60),
});

export type AppConfig = z.infer<typeof envSchema>;

function loadConfig(): AppConfig {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errorDetails = parsed.error.format();
    console.error('❌ [CONFIG ERROR] Environment configuration validation failed:');
    console.error(JSON.stringify(errorDetails, null, 2));

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Fatal: Invalid runtime environment configuration. Terminating startup.');
    }

    // In development/test, return default fallbacks
    return envSchema.parse({
      NODE_ENV: process.env.NODE_ENV || 'development',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    });
  }

  return parsed.data;
}

export const config: AppConfig = loadConfig();
