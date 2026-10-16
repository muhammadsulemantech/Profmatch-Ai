export interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Standard security presets for rate limiting across different endpoint types
 */
export const RATE_LIMIT_PRESETS = {
  GLOBAL_API: { limit: 120, windowMs: 60 * 1000 }, // 120 req / min
  AUTH: { limit: 15, windowMs: 15 * 60 * 1000 }, // 15 req / 15 min
  AUTH_STRICT: { limit: 5, windowMs: 10 * 60 * 1000 }, // 5 req / 10 min (OTP, forgot password)
  CV_PARSE: { limit: 10, windowMs: 5 * 60 * 1000 }, // 10 uploads / 5 min
  AI_COMPUTE: { limit: 20, windowMs: 60 * 1000 }, // 20 requests / min
  CHECKOUT: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 submissions / 15 min
  ADMIN: { limit: 60, windowMs: 60 * 1000 }, // 60 req / min
} as const;

/**
 * Safely extracts client IP address, handling proxies and comma-separated X-Forwarded-For headers
 */
export function getClientIp(request: Request | { headers: Headers }): string {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      const first = forwarded.split(',')[0].trim();
      if (first) return first;
    }
    const realIp = request.headers.get('x-real-ip');
    if (realIp && realIp.trim()) return realIp.trim();

    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    if (cfConnectingIp && cfConnectingIp.trim()) return cfConnectingIp.trim();
  } catch {
    // Fallback if headers cannot be inspected
  }
  return '127.0.0.1';
}

/**
 * Opportunistically prunes expired records when store size grows
 */
function pruneExpiredRecords(now: number): void {
  if (rateLimitStore.size > 2000) {
    rateLimitStore.forEach((record, key) => {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    });
  }
}

/**
 * Core rate limit checker
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 60, windowMs: 60 * 1000 }
): RateLimitResult {
  const now = Date.now();
  pruneExpiredRecords(now);

  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + options.windowMs,
    };
    rateLimitStore.set(identifier, newRecord);
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      reset: newRecord.resetTime,
    };
  }

  if (record.count >= options.limit) {
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: record.resetTime,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - record.count,
    reset: record.resetTime,
  };
}

/**
 * Helper to construct an HTTP 429 Too Many Requests response with standard headers
 */
export function rateLimitResponse(
  resetTime: number,
  limit: number,
  customMessage: string = 'Too many requests. Please slow down and try again later.'
): Response {
  const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
  return new Response(
    JSON.stringify({
      error: customMessage,
      retryAfterSeconds: retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
      },
    }
  );
}

