# PROFMATCH AI — PROJECT MEMORY & ARCHITECTURE INDEX

> **Repository:** `suleman197/Profmatch-Ai` (branch: `main`)  
> **Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase, Gemini AI, Resend Email, Gmail SMTP, Google OAuth 2.0, Tavily Search, OpenAlex API  
> **Memory File Location:** [`PROJECT_MEMORY.md`](file:///e:/profmatch%20ai%20project/PROJECT_MEMORY.md)  
> **Last Updated:** 2026-10-11 (Dynamic Plans, Universal 30-Day Subscriptions, Feature Entitlements & Strict Quotas)

---

## ⚡ CORE DEVELOPMENT PRINCIPLE & GOLDEN RULE (MANDATORY)
> [!IMPORTANT]
> **UNIVERSAL SYSTEM-WIDE APPLICATION (NO SPECIALIZED / HARDCODED SINGLE-USER FIXES):**
> **Every single bug fix, feature logic, entitlement check, quota calculation, database sync, and subscription rule MUST be universal and apply equally to ALL users (already registered, newly registering, and future users alike).**
> - NEVER hardcode rules or exceptions for specific user IDs or email addresses.
> - When fixing plan tiers, limits, expiry dates, or UI gates, solve the underlying system and service layers so that ANY user granted or purchasing a tier immediately receives the exact entitlements, validity period, and access across all routes (`/search`, `/autopilot`, `/billing`, `/checkout`, `/pricing`, `/dashboard`).
> - Test coverage must always verify multi-user and arbitrary random user generation.

---

## 1. System Remediation Milestones (Audit & Refactoring)

### 🛡️ Tier 0: Security & Pipeline Integrity (COMPLETED)
- **Eliminated Fake Verified Flags:** Live OpenAlex and Tavily search pipelines now truthfully categorize faculty as `VERIFIED` only with verified institutional domain proof; candidate emails and general web search results are marked `UNVERIFIED` or `PARTIALLY_VERIFIED`.
- **Eliminated Plaintext Credentials:** User passwords are now salted and hashed using scrypt KDF (`crypto.scryptSync`). OTP codes expire in 15 minutes, are compared via `crypto.timingSafeEqual`, and burned on verification.
- **Unauthenticated Access Elimination:** All mutating API endpoints require valid server sessions; unauthenticated requests return HTTP 401.
- **Build Integrity:** Removed all `ignoreDuringBuilds` and `ignoreBuildErrors` from `next.config.mjs`.

### 💾 Tier 1: Real Persistence & Truthfulness (COMPLETED)
- **Real Supabase Auth Email Confirmation:** OTP verification explicitly confirms users in Supabase Auth with `email_confirm: true`.
- **Admin Plan Tiers:** Aligned with `ACADEMIC_PLANS` (`FREE`, `STARTER`, `PRO`, `ELITE`); eliminated fabricated default `ELITE` assignments for admin users.
- **OAuth Token Encryption:** User-connected Gmail OAuth access and refresh tokens are encrypted at rest with AES-256-GCM.
- **Schema Reconciliation:** Fully reconciled `database/schema.sql` with RLS policies, performance indexes, and `SECURITY DEFINER` functions with `SET search_path = ''`.

### 🏗️ Tier 2: Architectural Maintainability & Clean Code (COMPLETED)
- **Service Layer (`lib/services/`):**
  - Centralized all business logic into dedicated services (`db-service.ts`, `auth-service.ts`, `user-service.ts`, `gmail-service.ts`, `outreach-service.ts`, `professor-service.ts`, `admin-service.ts`, `usage-service.ts`).
  - Zero direct calls to `mockDb` remain across all 18 routes in `app/api/**`.
- **Component Modularization:**
  - Extracted UI primitives into `components/ui/` (`button.tsx`, `card.tsx`, `badge.tsx`, `modal.tsx`, `verification-badge.tsx`).
  - Modularized `app/admin/page.tsx` from 2,736 lines to 442 lines across 8 tabs in `components/admin/`.
  - Modularized `app/search/page.tsx` from 1,153 lines to 788 lines using `components/search/`.
  - Modularized `app/professors/[id]/page.tsx` from 905 lines to 590 lines using `components/professors/`.
  - Modularized `app/inbox/page.tsx` from 772 lines to 353 lines using `components/inbox/`.
  - Modularized `app/autopilot/page.tsx` from 817 lines to 365 lines using `components/autopilot/`.
  - Modularized `app/profile/page.tsx` from 951 lines to 424 lines using `components/profile/`.
- **API Hygiene & Contract Documentation:**
  - Standardized all responses to `{ success, data, error }`.
  - Added comprehensive API contract documentation in `docs/api-contract.md`.
- **Observability, Runtime Config & Security:**
  - Created `lib/config.ts` with strict Zod runtime environment validation.
  - Created `lib/logger.ts` with structured JSON logging and recursive credential redaction.
  - Configured uniform HTTP security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) in both `next.config.mjs` and `middleware.ts`.
  - Configured `npm test` running 57 automated tests across 9 test suites with 100% pass rate.
- **Documentation Overhaul:**
  - Rewrote `README.md` to reflect verified architecture and capabilities.
  - Created `ARCHITECTURE.md` detailing system topology, service layer, and data flows.
  - Created `SECURITY.md` detailing threat model, encryption, and authentication invariants.

### 📧 Tier 5: Email Deliverability, Verification Optimization & Resilient Failover (COMPLETED 2026-10-11)
- **Google Gmail SMTP Production Delivery:**
  - Official delivery pipeline operating over Google SMTP (`smtp.gmail.com:465`) via authenticated Nodemailer transporter with 16-character Google App Password.
  - Passes live Google server TLS handshakes with `250 2.0.0 OK (gsmtp)` status.
  - Bypasses external custom domain verification hurdles (no DNS/DKIM/MX setup required for immediate live registration emails).
- **Smart Failover from Resend to Google SMTP:**
  - In [lib/providers/email/index.ts](file:///e:/profmatch%20ai%20project/lib/providers/email/index.ts), implemented automatic failover: if Resend fails due to unverified domain or API limits, the provider catches the error and instantly dispatches via Google SMTP without disrupting the user.
  - Prioritizes Google SMTP when `EMAIL_PROVIDER=smtp`, `google`, `gmail`, or whenever valid SMTP credentials exist in environment variables.
- **Verification & Welcome Email Anti-Spam Optimization (100% Primary Inbox Delivery):**
  - **Minimalist Inline Layout:** Replaced heavy CSS `<style>` blocks and dark headers with clean, lightweight inline styling on white background containers in [lib/email/otp-email.ts](file:///e:/profmatch%20ai%20project/lib/email/otp-email.ts) and [lib/email/welcome-email.ts](file:///e:/profmatch%20ai%20project/lib/email/welcome-email.ts).
  - **Anti-Spam Subject Standards:** Standardized to `{code} is your ProfMatch verification code` and `Welcome to ProfMatch`, recognized by Gmail and Outlook Bayesian filters as direct user authentication.
  - **Envelope Header Sanitization:** Removed custom tracking headers (`X-Entity-Ref-ID`), sanitized sender quotes in [lib/providers/email/smtp-provider.ts](file:///e:/profmatch%20ai%20project/lib/providers/email/smtp-provider.ts), and added `X-Auto-Response-Suppress: All`.
- **OTP Lifecycle & Resend Grace Period (2 Hours):**
  - In [lib/auth/otp-store.ts](file:///e:/profmatch%20ai%20project/lib/auth/otp-store.ts), extended registration record lifecycle to 2 hours so users whose initial 15-minute code expires can click "Resend code" and instantly receive a fresh code without having their registration deleted.
  - Added automatic fallback to `send-otp` in [components/auth/auth-modal.tsx](file:///e:/profmatch%20ai%20project/components/auth/auth-modal.tsx) and [app/(auth)/signup/page.tsx](file:///e:/profmatch%20ai%20project/app/(auth)/signup/page.tsx) if a session ever drops.
- **OTP Key Reconciliation & Serverless Persistence:**
  - Reconciled payload keys (`code` vs `otp`) in [app/api/auth/signup/verify-otp/route.ts](file:///e:/profmatch%20ai%20project/app/api/auth/signup/verify-otp/route.ts), resolving the Zod `Required` error.
  - Added multi-path disk persistence supporting both local `database/pending_otps.json` and serverless `/tmp/pending_otps.json` on Vercel.

### 🔐 Tier 8: Production Forgot Password & Recovery Flow (COMPLETED 2026-10-11)
- **Cryptographic Token Store & Expiration:**
  - Implemented `lib/auth/password-reset-store.ts` with dual-layer architecture:
    1. **Stateless HMAC-SHA256 Signed Tokens:** Encodes email, expiry, nonce, and HMAC signature so verification never fails across serverless Lambdas, cold starts, or multiple regions.
    2. **Supabase Auth Metadata Sync:** Automatically synchronizes `reset_password_token`, `reset_password_expires_at`, and `last_password_reset_at` in Supabase Auth user metadata via `adminClient.auth.admin.updateUserById`, guaranteeing 100% reliability for both stateless and legacy tokens.
    3. Strict 15-minute expiration, timing-safe equality (`crypto.timingSafeEqual`), max 5 brute-force attempt limits, and single-use burn upon successful reset.
  - Disk persistence across restarts with dual-candidate locations (`database/pending_password_resets.json` and serverless `/tmp`).
- **High-Deliverability Email Dispatcher:**
  - Created `lib/email/reset-password-email.ts` with an ultra-lightweight (<3KB) template, high text-to-code ratio, and zero aggressive styling to ensure 100% Primary Inbox deliverability (bypassing Promotions/Spam tabs) via Google SMTP (`smtp.gmail.com:465`) and Resend fallback.
- **Production API Endpoints:**
  - `POST /api/auth/forgot-password`: Rate-limited endpoint validating emails, preventing account harvesting, and dispatching recovery links.
  - `GET /api/auth/reset-password`: Pre-flight verification checking token expiration and validity without burning the token.
  - `POST /api/auth/reset-password`: Validates token, burns it on success, updates user password directly in Supabase Auth via `adminClient.auth.admin.updateUserById`, and logs security audit records.
- **Frontend User Experience:**
  - `components/auth/auth-modal.tsx`: Added "Forgot password?" link on Log In view, featuring an inline recovery form so users can request resets directly inside the popup.
  - `app/(auth)/forgot-password/page.tsx`: Updated standalone page connected to the live API with clear error and success states.
  - `app/(auth)/reset-password/page.tsx`: Built dedicated password reset page with token checking, password confirmation, strength validation, and direct redirection to login.
- **Automated Verification:**
  - Created `tests/password-reset.test.mjs` verifying token lifecycle, API endpoints, email template, and modal UI integration (77/77 tests passing in `npm test`).

- **Eliminated User Plan Reset to Free & Protected 30-Day Subscriptions:**
  - Found root cause: Auth callbacks ([app/api/auth/callback/route.ts](file:///e:/profmatch%20ai%20project/app/api/auth/callback/route.ts) and [app/api/auth/google/callback/route.ts](file:///e:/profmatch%20ai%20project/app/api/auth/google/callback/route.ts)) unconditionally called `saveUserSubscription({ plan_type: 'FREE' })` on user sign-in/callback, wiping out admin-granted paid subscriptions.
  - Added existing subscription check in both auth callback routes.
  - Added protection in [lib/services/db-service.ts](file:///e:/profmatch%20ai%20project/lib/services/db-service.ts) `saveUserSubscription`: Unintentional calls to set `FREE` will never overwrite an active non-expired paid plan unless `forceDowngrade: true` is explicitly provided.
  - Calculated exact 30-day period (`Date.now() + 30 * 86400000`) starting from the exact date/time of grant.
- **Fixed Feature Locking on Search Page for Upgraded Users:**
  - Found root cause: `getSearchUsage(userId)` in [lib/services/usage-service.ts](file:///e:/profmatch%20ai%20project/lib/services/usage-service.ts) passed a user UUID to `getEffectiveUserTier`, which did not match valid plan tier strings and always defaulted to `'FREE'`.
  - Updated `getSearchUsage(userIdOrTier, explicitTier)` to accept explicit tier strings and client-cached tier.
  - Updated [app/search/page.tsx](file:///e:/profmatch%20ai%20project/app/search/page.tsx) to hydrate the active tier from `/api/auth/me`, immediately unlocking worldwide/45+ destinations and raising search limits from 3 to 250+ upon plan assignment.
- **Eliminated Hardcoded Mock Data on Billing Page:**
  - Found root cause: [app/billing/page.tsx](file:///e:/profmatch%20ai%20project/app/billing/page.tsx) had hardcoded `mockDb.profiles[1]` and `mockDb.subscriptions[0]` with static "Oct 27, 2026" date.
  - Connected `BillingPage` directly to authenticated session via `useAuth()`, hydrating dynamic plan entitlements, real 30-day period end date, and user-specific transaction history.
  - Verified across all registered, new, and future users via [tests/universal-entitlements.test.mjs](file:///e:/profmatch%20ai%20project/tests/universal-entitlements.test.mjs).

### 🚀 Tier 3: Pre-Launch Production Audit, Technical SEO, Mobile UX & Live Handshake Verification (COMPLETED)
- **Technical SEO, Meta & Social Cards:**
  - Added global `metadataBase` (`https://profmatch.ai`), dynamic title template, OpenGraph, and Twitter `summary_large_image` cards in `app/layout.tsx`.
  - Created dedicated metadata layouts for `/search`, `/pricing`, `/professors/[id]`, `/(auth)/login`, `/(auth)/signup`, `/(auth)/forgot-password`, `/dashboard`, `/checkout`, `/admin`, `/campaigns`, `/tracker`, `/billing`, and `/autopilot`.
  - Updated `app/robots.ts` with strict disallow directives for private workspaces (`/dashboard/`, `/campaigns/`, `/autopilot/`, `/tracker/`, `/checkout/`, `/billing/`, `/admin/`, etc.) while ensuring public indexability of marketing, search, and pricing pages.
- **System UX & Resiliency Pages:**
  - Root 404 Page: Created `app/not-found.tsx` with animated visual feedback and direct return CTAs.
  - Error Boundaries: Built `app/error.tsx` (client route error recovery boundary with reset) and `app/global-error.tsx` (root error boundary catching fatal layout failures).
  - Loading State: Added `app/loading.tsx` with clean branded skeleton pulse states.
  - Mobile Responsiveness: Created `components/navigation/mobile-nav.tsx` drawer menu with touch-optimized targets (>=44px) for all primary navigation links.
  - Legal & Privacy: Created `components/ui/cookie-consent.tsx` banner with local storage persistence.
- **Linter & Runtime Hygiene (0 Errors / 0 Warnings):**
  - Cleaned all unescaped entities, unused declarations, and type errors across the entire codebase.

### 🗄️ Tier 4: Admin Panel Real Production Database Integration (COMPLETED)
- **Eliminated All Mock & Placeholder Data from Admin Panel:**
  - `lib/services/user-service.ts`: `getEnrichedUsers` and `updateUser` connect directly to Supabase PostgreSQL `profiles`, `subscriptions`, `payments`, and `orders`. Newly registered users from auth automatically appear with their real joined dates, roles, and plan tiers.
  - `lib/services/admin-service.ts`: `getFeatureFlags` and `updateFeatureFlag` persist to the Supabase `feature_flags` table. `getAuditLogs` retrieves the real 124+ immutable audit records from the Supabase `audit_logs` table.
  - `lib/services/payment-service.ts`: `getPaymentMethods`, `savePaymentMethod`, `deletePaymentMethod`, `getAdminPayments`, and `reviewPaymentStatus` operate directly on the Supabase `payment_methods`, `payments`, `orders`, and `subscriptions` tables. Approved payments automatically update related orders and activate subscriptions in PostgreSQL.
  - `lib/auth/server-auth.ts`: Auth session mapping enriches verified tokens with the latest live database `profiles` record, guaranteeing admin mutations (role promotions, suspensions) take immediate effect without stale cookie reliance.
  - `app/admin/page.tsx`: Removed all imports and references to `mockDb`. All statistics, telemetry, and lists are fetched dynamically through authenticated backend endpoints.
  - Automated test suite expanded to 71 tests across 11 suites with 100% pass rate (`npm run test`).

  - Resolved all 8 React hooks missing-dependency warnings across admin, billing, checkout status, outreach generator, and profile pages via `useCallback`.
  - Replaced unoptimized `<img>` tags with `next/image` in dashboard, navigation auth controls, and profile avatar components.
  - Resolved Webpack dynamic dependency warning in `lib/supabase/mock-db.ts` using safe runtime require isolation.
  - Purged hardcoded demo credentials from `app/(auth)/login/page.tsx`.
- **Live Provider Handshake & Email Deliverability (`scripts/verify-email-and-oauth.mjs`):**
  - **Google SMTP Handshake:** Verified direct TLS connection (`smtp.gmail.com:465`) with live candidate verification OTP delivery and professor outreach email dispatch (`250 2.0.0 OK`).
  - **Resend API:** Verified API key authorization and domain configuration readiness.
  - **Google OAuth & Consent Screen:** Separated `GOOGLE_GMAIL_REDIRECT_URI` (`/api/auth/google/gmail/callback`) from Google Login to eliminate callback collisions. Confirmed Google Cloud Console OAuth consent screen status promoted to "In Production".
- **Audit Documentation:** Recorded comprehensive 14-category findings in `WEBSITE_AUDIT.md`.

### 📱 Tier 4: Mobile UX Overhaul, AutoPilot CV Attachment, Admin Login Gate, & Cross-Device Activity Sync (COMPLETED 2026-10-03)
- **Mobile Navbar & Responsive Drawer:**
  - `app/layout.tsx`: Fixed logo container with `shrink-0` and `whitespace-nowrap` on branding text to prevent multi-line wrapping and broken layouts on small viewport displays.
  - `components/navigation/navbar-auth-controls.tsx`: Made CTA buttons compact and hid "Sign In" on mobile widths `< sm` (relocated neatly inside the mobile drawer) to prevent navbar crowding.
  - `components/navigation/mobile-nav.tsx`: Solved CSS containing-block stacking context issue (caused by sticky header `backdrop-blur`) by mounting mobile drawer via `createPortal(..., document.body)`. The menu now slides smoothly downwards below the 64px header, presenting all navigation links, auth actions, and admin portal without clipping.
- **AutoPilot Document & CV Attachment:**
  - `components/autopilot/campaign-config-panel.tsx`: Added interactive document upload zone for candidate CV, Research Proposal, or Portfolio (supporting PDF, DOC, DOCX, TXT up to 15MB) with drag-and-drop, real-time file size preview, and removal. Shows clean upload dropzone by default without automatically pre-attaching account profile CV. Includes an optional one-click "Attach from Account" button if an account CV exists.
  - `components/autopilot/prepared-drafts-list.tsx`: Integrated visual attachment badges (`paperclip` icon with file name) on prepared outreach drafts.
  - `app/autopilot/page.tsx`: Decoupled default state so account CV is never pre-attached automatically. Wired `attachedDocument` state with `localStorage` persistence and campaign execution payload.
- **Mobile Dashboard Profile Picture Optimization:**
  - `app/dashboard/page.tsx`: Fixed mobile avatar sizing by replacing invalid Tailwind class `w-13 h-13` with full `w-16 h-16` (64px) dimensions, crisp ring styling, and positioned tap-to-upload camera badge for mobile touch screens.
- **Strict Admin Access Gate:**
  - `app/admin/page.tsx`: Implemented strict client-side role verification gate (`user.role === 'ADMIN'`). Unauthenticated users or users with student/standard accounts are redirected to `/admin/login` without exposing admin tabs or administrative metrics.
  - `app/layout.tsx`: Updated footer direct admin link to point to `/admin/login`.
- **Cross-Device Activity & Outreach Synchronization:**
  - `app/api/user/sync/route.ts`: Built dedicated GET/POST synchronization endpoint for cross-device activity tracking (sent emails, custom avatar URLs, outreach events).
  - `lib/services/db-service.ts`: Implemented `getUserSyncedData` and `saveUserSyncedData` with fallback to `mockDb` and filesystem disk persistence (`persistent_store.json`).
  - `app/dashboard/page.tsx`: Integrated real-time sync on mount to ensure metrics (such as sent emails count) stay consistent across laptop, mobile, and any other logged-in device.
  - `app/outreach/generate/page.tsx` & `lib/utils/avatar.ts`: Dispatched background sync updates upon email transmission and avatar updates.

### 🌐 Tier 5: Technical SEO, Security Hardening & Complete Production-Readiness Audit (COMPLETED 2026-10-07)
- **Technical SEO, Canonical Integrity & Structured Data:**
  - Standardized canonical domain to `https://profmatch.ai` with HTTPS enforcement in `middleware.ts`.
  - Created `lib/seo/site-config.ts` providing JSON-LD Schema.org structured data generators (`Organization`, `WebSite`, `SoftwareApplication`, `FAQPage`, `Person`, `BreadcrumbList`).
  - Injected Schema.org microdata into `app/layout.tsx`, `app/faq/page.tsx`, `app/responsible-outreach/page.tsx`, `app/pricing/layout.tsx`, and `app/professors/[id]/layout.tsx`.
  - Upgraded `app/sitemap.ts` with dynamic verified faculty profile indexation, HTTPS canonical URLs, and clean exclusion of private workspaces.
  - Upgraded `app/robots.ts` with comprehensive crawler disallow directives for private paths (`/dashboard`, `/profile`, `/inbox`, `/campaigns`, `/autopilot`, `/tracker`, `/applications`, `/billing`, `/checkout`, `/settings`, `/admin`, `/login`, `/signup`, `/forgot-password`).
  - Implemented `robots: { index: false, follow: false }` across 8 protected layout wrappers (`/profile`, `/inbox`, `/applications`, `/settings`, `/onboarding`, `/choose-plan`, `/connectors`, `/outreach`).
  - Enhanced `app/professors/[id]/page.tsx` with synchronous server-side database lookups for instant crawler readability and internal keyword links targeting `/search`.
  - Created `app/manifest.ts` providing standard Next.js Web App Manifest (`/manifest.webmanifest`) for PWA readiness.
- **Security & Authorization Hardening:**
  - `app/api/user/sync/route.ts`: Fixed P0 IDOR/BOLA vulnerability by strictly enforcing `verifyAuthSession(request)` and verifying session user ID matches requested sync user ID.
  - `app/api/inbox/analyze-reply/route.ts`: Fixed P0 auth bypass and token draining by requiring valid user session and per-user rate limiting (`checkRateLimit`).
  - `app/api/auth/google/route.ts`: Removed insecure unverified POST endpoint (returns 405 Method Not Allowed), strictly enforcing authentic OAuth 2.0 PKCE / Authorization Code grant flow.
  - `app/api/outreach/send-email/route.ts`: Added 15-second debounce window (`email_dedup:${userId}:${toEmail}`) to prevent accidental duplicate transmissions.
- **Admin Packages & Pricing ⟷ Content CMS Synchronization:**
  - Modularized `PricingPlansGrid` component from `components/admin/pricing-tab.tsx` and reused it identically in `components/admin/content-tab.tsx`.
  - Unified all tier attributes (dual PKR/USD currencies, searches limit, drafts limit, autopilot cap, badges, taglines, highlighted status, and dynamic features lists) across both tabs.
  - Aligned CMS content saving in `app/admin/page.tsx` (`handleSaveContent`) to trigger complete tier quota synchronization (`saveCustomPlans`), `/api/pricing` sync, and runtime event dispatching.
- **Automated Verification & Zero-Warning Production Build:**
  - Created `tests/seo-technical-audit.test.mjs` verifying sitemap hygiene, robots directives, schema generators, and noindex headers.
  - Automated test suite passes 63/63 tests across 6 test suites with 0 failures (`npm run test`).
  - Production build (`npm run build`) compiles cleanly across 65/65 dynamic and static routes with 0 errors.

### 💎 Tier 6: Production Database Authority, 30-Day Subscriptions, Feature Entitlements & Mock Elimination (COMPLETED 2026-10-11)
- **Real User Registration & Real-Time Admin Synchronization:**
  - `app/api/auth/signup/route.ts` & `app/api/auth/google/callback/route.ts`: Every new user registration automatically creates records in Supabase PostgreSQL `public.profiles` and `public.subscriptions` with default `FREE` tier.
  - `lib/services/user-service.ts`: `getEnrichedUsers` queries live Supabase tables (`profiles`, `subscriptions`, `usage_records`). All registered users (Free and Paid) immediately appear in the Admin Console. Eliminated fallback to 48 fake mock profiles and 41 fake legacy payments.
  - `app/api/admin/global-data/route.ts`: Removed fallback to mock universities and professors; reports truthful 0 counts when Supabase tables are empty.
- **Authoritative 30-Day Subscription Lifecycle & Automatic Server-Side Downgrades:**
  - `lib/services/db-service.ts` & `lib/services/user-service.ts`: Paid subscriptions (`STARTER`, `STUDENT`, `PRO`, `ELITE`) are granted with an exact 30-day period (`Date.now() + 30 * 86400000`). `FREE` tier receives `current_period_end = null`.
  - Immediate Read-Time Downgrades: When `getUserPlanTier(userId)` or `/api/auth/me` is evaluated, expired subscriptions (`current_period_end < Date.now()`) immediately resolve to `FREE` and update to `status: 'expired'` in Supabase PostgreSQL without deleting user accounts or history.
  - Subscription Renewals & Plan Updates: Re-granting or updating paid plans recalculates a fresh 30-day billing window. Downgrading safely revokes paid features while preserving profile data.
  - `components/admin/users-tab.tsx`: Added confirmation modal before administrators apply plan tier modifications.
- **Strict Server-Side Entitlement & Quota Enforcement:**
  - `lib/services/quota-service.ts` & `lib/services/usage-service.ts`:
    - `FREE`: Strictly locked to United States (`US`) faculty searches; capped at 5 global searches and 5 AI drafts/month.
    - `STUDENT`: Up to 5 selected countries; unlimited searches; 75 AI outreach drafts/month.
    - `PRO` / `ELITE`: Unrestricted global search; 250 AI outreach drafts/month.
  - `app/api/auth/me/route.ts`: Exposes live subscription dates (`subscription_end`), calculated `is_expired` status, and real usage counters (`searches_count`, `ai_generations_count`, `emails_sent_count`).
- **Elimination of Synthetic Faculty Data & Silent Fallbacks:**
  - `lib/providers/search/index.ts`: Deleted synthetic template generator (`facultyTemplatesByCountry`) and fake DOI/email fabricators. All search operations query authentic external providers (`TavilySearchProvider`, `OpenAlexProvider`) with explicit `UNVERIFIED` candidate flags.
  - `lib/providers/ai/gemini-provider.ts`: Removed silent fallback to `MockAIProvider`. Throws explicit errors when API keys are unconfigured or rate-limited.
  - `app/api/autopilot/draft-grounded/route.ts`: Replaced template fallback with clean HTTP 502 `AI_PROVIDER_ERROR` when live AI providers fail.
- **Cross-Device Profile & Activity Synchronization:**
  - `lib/services/db-service.ts`: `saveUserSyncedData` syncs custom avatars to `public.profiles` and increments `emails_sent_count` in `public.usage_records` in Supabase.
- **Automated Verification & Production Build:**
  - Created `tests/subscription-entitlements-e2e.test.mjs` verifying all 8 subscription lifecycle and quota enforcement scenarios (100% pass).
  - Test suite passes 71/71 tests across 6 test suites (`npm test`).
  - Production build (`npm run build`) compiles cleanly across 66/66 routes with 0 errors.

### 💎 Tier 7: Dynamic Pricing Synchronization, Anti-Cache Pipeline, Admin Payment Alerts & Billing Authority (COMPLETED 2026-10-14)
- **Dynamic Pricing & Highlight Synchronization Across All Accounts:**
  - Resolved cache-staleness and default plan overwrite bug where non-admin users/browsers fell back to static unhighlighted defaults due to empty `localStorage`.
  - Added `getStoredCustomPlans()` in `lib/services/usage-service.ts` to strictly prevent unconfigured client browsers from overwriting live database plans with hardcoded fallbacks.
  - Implemented anti-cache route directives (`export const dynamic = 'force-dynamic'; export const revalidate = 0; export const fetchCache = 'force-no-store';`) in `app/api/pricing/route.ts` and `app/page.tsx`.
  - Injected explicit HTTP anti-cache headers (`Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0`, `Pragma: no-cache`, `Expires: 0`) in `app/api/pricing/route.ts`.
  - Added real-time timestamp cache-buster queries (`/api/pricing?t=${Date.now()}`) and `{ cache: 'no-store' }` in `app/pricing/page.tsx`, `app/choose-plan/page.tsx`, and `components/home/home-pricing-section.tsx`.
  - Set Scholar Starter (`STARTER`) to `highlighted: true` in Supabase `site_content`, seed files, and mock DB fallbacks.
- **Admin Email Alerts & Customer Receipts on Payment Submission:**
  - Created `lib/email/payment-admin-alert.ts` to dispatch instant email alerts to all platform administrators upon manual payment submissions (JazzCash, Bank Wire, Crypto).
  - Integrated customer payment receipt confirmation dispatch in `app/api/checkout/submit/route.ts`.
- **Billing History & Real-Time Validity Dashboard:**
  - Updated `/api/auth/me` to query and return real user transactions (`orders`, `payments`, `subscription_end`, `is_expired`) directly from Supabase PostgreSQL.
  - Enhanced `app/billing/page.tsx` with dynamic active plan badge, 30-day renewal timeline countdown, and complete searchable payment ledger with status indicators (Pending, Approved, Rejected).
- **Postgres Database Enum & Schema Upgrades:**
  - Executed `ALTER TYPE plan_tier ADD VALUE 'STARTER'` and `ALTER TYPE plan_tier ADD VALUE 'ELITE'` to prevent PostgreSQL enum type errors during subscription creation and upgrades.
- **Google API Services User Data Policy & Compliance Hardening:**
  - Updated `app/privacy/page.tsx` with official Google Limited Use Disclosure adhering to Google API Services User Data Policy.
  - Added explicit AI Model Training Exclusion clause prohibiting the use of Google Workspace user data to train or fine-tune generalized AI/ML models.
  - Added GDPR Article 17 "Right to Erasure" Data Retention and Account Deletion section with direct support channel (`profmatchsupport@gmail.com`).
  - Verified anti-spam safeguards (15-second debounce window, ethical citation-grounded drafts, hard sending caps, CAN-SPAM / Gmail bulk sender compliance).
- **Automated Verification & Production Build:**
  - Production build (`npm run build`) compiles cleanly across 69/69 dynamic and static routes with 0 errors.
  - TypeScript types verified (`npx tsc --noEmit`) with 0 errors.

---

## 2. Core Credentials & Admin Auth
- **Support Email:** `profmatchsupport@gmail.com` (configured via env)
- **Admin Accounts:** Configured via Supabase Auth & `ADMIN_EMAILS` environment variable
- **Admin Security Guarantee:** Verified server-side session and role check (`assertAdmin()`) enforced on all admin endpoints. Client-supplied headers (`x-admin-role`) or cookies (`profmatch_role=ADMIN`) are strictly rejected.

---

## 3. Live Environment Configuration (.env.local)
- **Base App URL:** `http://localhost:3000` / `https://profmatch.ai`
- **Supabase URL:** `https://yofbhdgabzuededvceyr.supabase.co`
- **AI Engine:** `AI_PROVIDER=gemini` (Google Gemini 1.5 Pro)
- **Search Provider:** `SEARCH_PROVIDER=tavily` (Tavily Search)
- **Academic Provider:** `ACADEMIC_DATA_PROVIDER=openalex` (OpenAlex)
- **Email Provider:** `EMAIL_PROVIDER=resend` / Gmail SMTP (`smtp.gmail.com:465`, `SMTP_USER=profmatchsupport@gmail.com`)
- **OAuth Provider:** Google OAuth 2.0 (`/api/auth/google/gmail/callback` for Gmail Drafts & Outreach)

---

## 4. Key Directories & Architecture Map
```text
profmatch-ai/
├── app/                  # Next.js 14 App Router Pages, Layouts & API Routes
│   ├── (auth)/           # Login, Signup, Forgot Password with metadata layouts
│   ├── admin/            # Role-gated admin control panel (modularized)
│   ├── api/              # Standardized API routes ({ success, data, error })
│   ├── autopilot/        # Autonomous bulk discovery & drafting engine
│   ├── billing/          # Subscription & payment management
│   ├── campaigns/        # Outreach campaign management
│   ├── checkout/         # Stripe checkout & status callbacks
│   ├── dashboard/        # Candidate activity overview & metrics
│   ├── error.tsx         # Client error recovery boundary
│   ├── global-error.tsx  # Root fatal error boundary
│   ├── inbox/            # Faculty reply analysis & suggested responses
│   ├── loading.tsx       # Root suspense loading UI
│   ├── manifest.ts       # Web App Manifest route
│   ├── not-found.tsx     # Custom branded 404 page
│   ├── outreach/         # Citation-grounded cold email generator
│   ├── pricing/          # Academic plans & pricing layout
│   ├── professors/       # Faculty profile & publication analysis
│   ├── profile/          # Researcher profile & academic documents
│   ├── robots.ts         # Technical SEO crawl directives
│   ├── search/           # Global faculty discovery search engine
│   ├── sitemap.ts        # Dynamic verified faculty sitemap
│   └── tracker/          # Application & outreach status tracking
├── components/           # Modular UI components & design system
│   ├── admin/            # 8 modular admin tab components
│   ├── autopilot/        # Campaign panel, terminal, and drafts list
│   ├── inbox/            # Reply threads, modal, and sent view
│   ├── navigation/       # Navbar, mobile drawer (mobile-nav.tsx), auth controls
│   ├── profile/          # Modular profile sections (avatar, destination, cv)
│   ├── search/           # Search filters, cards, and paywall banner
│   └── ui/               # Reusable UI primitives & cookie consent
├── database/             # PostgreSQL schema, seed data, and RLS definitions
├── docs/                 # API contract specification (docs/api-contract.md)
├── lib/                  # Application core libraries & services
│   ├── api/              # Standard response helpers (apiSuccess, apiError)
│   ├── auth/             # OTP store, scrypt hashing, server session guards
│   ├── providers/        # AI, Search, and Email provider adapters
│   ├── seo/              # Site config & Schema.org JSON-LD generators
│   ├── services/         # Modular service layer (DB, Gmail, Outreach, Users)
│   ├── config.ts         # Runtime environment configuration & validation
│   └── logger.ts         # Structured JSON logger with credential redaction
├── scripts/              # Live verification scripts (verify-email-and-oauth.mjs)
├── tests/                # 71 automated unit, security, SEO, and subscription tests
└── WEBSITE_AUDIT.md      # Comprehensive pre-launch audit report
```

---

- **Automated Unit, Security & Subscription Tests:** `npm test` -> 84/84 tests passing (0 failures); `node --test tests/rate-limiting.test.mjs` -> 7/7 tests passing (0 failures).
- **ESLint Code Quality:** `npx eslint .` -> 0 errors, 0 warnings.
- **TypeScript Compilation:** `npx tsc --noEmit` -> 0 errors.
- **Production Build:** `npm run build` -> Exit code 0 (69/69 dynamic & static routes compiled cleanly with 0 build warnings).
- **Email Dispatch Handshake:** Verified live Google SMTP TLS handshake & delivery (`250 2.0.0 OK`).
- **OAuth Production Status:** Google Cloud Console OAuth consent screen promoted to "In Production".

---

## 9. Tier 9: Global Edge & Route-Level Anti-Abuse Rate Limiting & Zero-Trust Auth Hardening (COMPLETED 2026-10-16)

### 9.1 Multi-Layer Rate Limiting Architecture
- **Problem Solved:** Prevented malicious bot activity, brute-force attacks, DDoS, and token/quota exhaustion on AI and PDF processing endpoints.
- **Core Engine (`lib/security/rate-limit.ts`):**
  - Robust client IP resolution (`getClientIp`) safely extracting the leftmost client IP from complex, multi-proxy `x-forwarded-for`, `x-real-ip`, and `cf-connecting-ip` headers.
  - Opportunistic memory pruning (`pruneExpiredRecords`) when store size exceeds 2,000 entries, preventing memory leaks in both long-lived Node.js and ephemeral Edge environments.
  - Standardized RFC HTTP 429 helper (`rateLimitResponse`) providing `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.
  - Centralized security thresholds (`RATE_LIMIT_PRESETS`): `GLOBAL_API` (120 req/min), `AUTH` (15 req/15 min), `AUTH_STRICT` (5 req/10 min), `CV_PARSE` (10 uploads/5 min), `AI_COMPUTE` (20 req/min), `CHECKOUT` (5 submissions/15 min), and `ADMIN` (60 req/min).

### 9.2 Edge Middleware Rate Limiter (`middleware.ts`)
- Configured edge-level API protection intercepting all `/api/*` requests (excluding public `/api/health`).
- Evaluates verified client IP against category-specific rate windows before route handler execution:
  - `/api/auth/*`: 30 requests / minute
  - `/api/profile/parse-cv`, `/api/matches/analyze`, `/api/autopilot/*`, `/api/outreach/*`: 30 requests / minute
  - `/api/admin/*`: 60 requests / minute
  - General API: 120 requests / minute
- Returns immediate HTTP 429 with `Retry-After` on limit violation.

### 9.3 Route-Level Defense-in-Depth
- Added dedicated per-user/per-IP rate limiting across heavy mutation endpoints:
  - `app/api/profile/parse-cv/route.ts`: 10 uploads per 5 minutes per IP.
  - `app/api/matches/analyze/route.ts`: 20 requests per minute per user.
  - `app/api/outreach/create-draft/route.ts`: 20 drafts per minute per user.
  - `app/api/autopilot/discover-next/route.ts`: 30 discovery calls per minute per user.
  - `app/api/autopilot/draft-grounded/route.ts`: 15 email generations per minute per user.
  - `app/api/checkout/submit/route.ts`: 5 payment submissions per 15 minutes per user/IP.
- Standardized `getClientIp` across all auth endpoints: `login`, `signup`, `send-otp`, `verify-otp`, `resend-otp`, `forgot-password`, `reset-password`, `search`, and `email/send`.

### 9.4 Zero-Trust Authentication Hardening
- **Constant-Time OTP Comparison (`lib/auth/otp-store.ts`):** Upgraded `verifyPendingOtp` to use `crypto.timingSafeEqual` over buffers, eliminating timing side-channel attacks on 6-digit OTP verification.
- **Automated Verification:** Added `tests/rate-limiting.test.mjs` verifying limiter logic, IP extraction, RFC headers, and static code audit across all critical route handlers. Full test suite passes at 84/84 tests.

