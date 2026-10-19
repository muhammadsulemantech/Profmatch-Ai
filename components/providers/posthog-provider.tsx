'use client';

import React, { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useAuth } from '@/lib/auth/auth-context';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_nf2yxYE7z7HpCWuhxayHkNH5PKyrPQe5wUVJHZVUddvX';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

export function PostHogPageView(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && typeof window !== 'undefined') {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogUserSync(): null {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.full_name,
        role: user.role,
        tier: user.tier || 'FREE',
      });
    } else if (!isAuthenticated && typeof window !== 'undefined') {
      posthog.reset();
    }
  }, [user, isAuthenticated]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && POSTHOG_KEY) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: 'identified_only',
        capture_pageview: false, // captured manually in PostHogPageView for App Router
        capture_pageleave: true,
        autocapture: true,
      });
    }
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <PostHogUserSync />
      {children}
    </PHProvider>
  );
}

/**
 * Universal client-side event tracking utility for ProfMatch AI
 */
export function trackAnalyticsEvent(event: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    try {
      posthog.capture(event, properties);
    } catch (err) {
      console.warn('[PostHog] Event capture error:', err);
    }
  }
}
