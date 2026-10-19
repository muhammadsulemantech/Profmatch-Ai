import { Client, Receiver } from '@upstash/qstash';

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY;
const NEXT_SIGNING_KEY = process.env.QSTASH_NEXT_SIGNING_KEY;

// Initialize Client only if token is present
export const qstashClient = QSTASH_TOKEN
  ? new Client({
      token: QSTASH_TOKEN,
      baseUrl: process.env.QSTASH_URL || 'https://qstash-eu-central-1.upstash.io',
    })
  : null;

// Initialize Receiver for signature verification on webhook endpoints
export const qstashReceiver =
  CURRENT_SIGNING_KEY && NEXT_SIGNING_KEY
    ? new Receiver({
        currentSigningKey: CURRENT_SIGNING_KEY,
        nextSigningKey: NEXT_SIGNING_KEY,
      })
    : null;

export interface PublishTaskOptions {
  destinationUrl: string;
  body: Record<string, any>;
  delaySeconds?: number;
  retries?: number;
}

export interface PublishTaskResult {
  success: boolean;
  messageId?: string;
  error?: string;
  mode: 'qstash' | 'direct_fallback';
}

/**
 * Publishes a background job to Upstash QStash queue.
 * Automatically falls back to direct execution if QStash is not configured or in development.
 */
export async function enqueueBackgroundTask(
  options: PublishTaskOptions
): Promise<PublishTaskResult> {
  const { destinationUrl, body, delaySeconds = 0, retries = 3 } = options;

  if (qstashClient) {
    try {
      const res = await qstashClient.publishJSON({
        url: destinationUrl,
        body,
        delay: delaySeconds,
        retries,
      });

      return {
        success: true,
        messageId: res.messageId,
        mode: 'qstash',
      };
    } catch (err: any) {
      console.warn('[QSTASH WARNING] Failed to publish task via QStash, falling back:', err.message);
    }
  }

  // Graceful direct execution fallback (e.g., local development or missing token)
  try {
    fetch(destinationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-profmatch-internal-task': 'true',
      },
      body: JSON.stringify(body),
    }).catch((err) => {
      console.error('[DIRECT JOB ERROR] Background fetch failed:', err.message);
    });

    return {
      success: true,
      mode: 'direct_fallback',
    };
  } catch (directErr: any) {
    return {
      success: false,
      error: directErr.message || 'Failed to dispatch background job',
      mode: 'direct_fallback',
    };
  }
}

/**
 * Verify that a webhook request originated from Upstash QStash
 */
export async function verifyQStashSignature(
  signature: string | null,
  body: string
): Promise<boolean> {
  if (!signature || !qstashReceiver) {
    // If not configured, allow internal task header in dev
    return process.env.NODE_ENV !== 'production';
  }

  try {
    const isValid = await qstashReceiver.verify({
      signature,
      body,
    });
    return isValid;
  } catch {
    return false;
  }
}
