/**
 * Validates a redirect target to prevent open redirect vulnerabilities.
 * Allows only relative paths or URLs explicitly pointing to the application's domain.
 */
export function validateSafeRedirect(
  targetUrl: string | null | undefined,
  defaultPath: string = '/settings'
): string {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return defaultPath;
  }

  const trimmed = targetUrl.trim();

  // Disallow javascript: or data: URIs
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return defaultPath;
  }

  // Prevent protocol-relative URLs like "//evil.com"
  if (trimmed.startsWith('//')) {
    return defaultPath;
  }

  // Pure relative paths starting with a single '/'
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return trimmed;
  }

  // If absolute URL, check allowed hostnames
  try {
    const parsed = new URL(trimmed);
    const allowedHosts = [
      'localhost',
      '127.0.0.1',
      'profmatch.ai',
      'www.profmatch.ai',
    ];

    if (process.env.NEXT_PUBLIC_APP_URL) {
      try {
        const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL);
        allowedHosts.push(appUrl.hostname);
      } catch {}
    }

    if (allowedHosts.includes(parsed.hostname)) {
      // Keep only pathname + search
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {}

  return defaultPath;
}
