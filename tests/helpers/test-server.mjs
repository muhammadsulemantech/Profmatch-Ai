import { spawn } from 'node:child_process';
import path from 'node:path';

export async function ensureTestServer(port = 3001) {
  if (process.env.BASE_URL) {
    return { baseUrl: process.env.BASE_URL, close: async () => {} };
  }

  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    if (res.status < 500) {
      return { baseUrl, close: async () => {} };
    }
  } catch {
    // Not running yet; start a dedicated Next.js server instance
  }

  const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  const child = spawn(process.execPath, [nextBin, 'start', '-p', String(port), '-H', '127.0.0.1'], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let logs = '';
  let lastErr = '';
  let isReady = false;
  child.stdout?.on('data', (d) => {
    const chunk = d.toString();
    logs += chunk;
    if (chunk.includes('Ready in')) isReady = true;
  });
  child.stderr?.on('data', (d) => {
    logs += d.toString();
  });

  const deadline = Date.now() + 25000;
  while (Date.now() < deadline) {
    if (isReady) {
      return {
        baseUrl,
        close: async () => {
          try {
            child.kill('SIGTERM');
          } catch {}
        },
      };
    }
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.status < 500) {
        return {
          baseUrl,
          close: async () => {
            try {
              child.kill('SIGTERM');
            } catch {}
          },
        };
      }
    } catch (err) {
      lastErr = err?.message || String(err);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  try {
    child.kill('SIGTERM');
  } catch {}
  throw new Error(`Timed out waiting for Next.js test server on ${baseUrl}. LastErr: ${lastErr}. Logs:\n${logs}`);
}
