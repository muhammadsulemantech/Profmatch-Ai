import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'mock_fallback',
      ai: process.env.AI_API_KEY && !process.env.AI_API_KEY.includes('your-') ? 'configured' : 'mock_fallback',
      search: (process.env.SEARCH_API_KEY || process.env.TAVILY_API_KEY || process.env.OPENALEX_API_KEY) ? 'configured' : 'mock_fallback',
      email: process.env.RESEND_API_KEY ? 'configured' : 'mock_fallback',
      payments: process.env.STRIPE_SECRET_KEY ? 'configured' : 'mock_fallback',
    },
    uptime: process.uptime ? `${Math.round(process.uptime())}s` : 'unknown',
  };

  return NextResponse.json(checks, { status: 200 });
}
