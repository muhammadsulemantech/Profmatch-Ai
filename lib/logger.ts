/**
 * ProfMatch AI — Structured Logger with Sensitive Credential Redaction
 *
 * Emits structured JSON log entries formatted for CloudWatch/Datadog/Logtail.
 * Automatically sanitizes sensitive credentials, tokens, OTPs, and secrets.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEYS: string[] = [
  'authorization',
  'password',
  'passwd',
  'otp',
  'secret',
  'access_token',
  'refresh_token',
  'token',
  'session_secret',
  'cookie',
  'api_key',
  'apikey',
  'stripe_secret_key',
  'service_role_key',
  'private_key',
];

function redactValue(key: string, value: any): any {
  if (value === null || value === undefined) return value;

  const lowerKey = key.toLowerCase();

  for (let i = 0; i < SENSITIVE_KEYS.length; i++) {
    const sensitive = SENSITIVE_KEYS[i];
    if (lowerKey.includes(sensitive)) {
      if (typeof value === 'string') {
        if (value.length <= 8) return '***[REDACTED]***';
        return `${value.substring(0, 4)}...***[REDACTED]***`;
      }
      return '***[REDACTED]***';
    }
  }

  if (typeof value === 'object') {
    return sanitizeObject(value);
  }

  return value;
}

export function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    cleaned[k] = redactValue(k, v);
  }
  return cleaned;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: Record<string, any>, err?: Error): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = sanitizeObject(context);
    }

    if (err) {
      entry.error = {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      };
    }

    return JSON.stringify(entry);
  }

  public debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'production' && process.env.LOG_LEVEL !== 'debug') return;
    console.debug(this.formatLog('debug', message, context));
  }

  public info(message: string, context?: Record<string, any>): void {
    console.info(this.formatLog('info', message, context));
  }

  public warn(message: string, context?: Record<string, any>, err?: Error): void {
    console.warn(this.formatLog('warn', message, context, err));
  }

  public error(message: string, context?: Record<string, any>, err?: Error): void {
    console.error(this.formatLog('error', message, context, err));
  }
}

export const logger = new Logger();
