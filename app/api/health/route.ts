import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'mock_fallback',
      ai: (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || (process.env.AI_API_KEY && !process.env.AI_API_KEY.includes('your-'))) ? 'configured' : 'mock_fallback',
      search: (process.env.TAVILY_API_KEY || process.env.OPENALEX_API_KEY || process.env.SEARCH_API_KEY) ? 'configured' : 'mock_fallback',
      email: (process.env.SMTP_HOST && process.env.SMTP_USER) || (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'configured' : 'unconfigured',
      payments: 'manual_checkout_active',
    },
    uptime: process.uptime ? `${Math.round(process.uptime())}s` : 'unknown',
  };

  return NextResponse.json(checks, { status: 200 });
}
