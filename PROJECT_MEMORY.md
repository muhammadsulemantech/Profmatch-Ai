# PROFMATCH AI — PROJECT MEMORY & ARCHITECTURE INDEX

> **Repository:** `suleman197/Profmatch-Ai` (branch: `main`)  
> **Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase, Gemini AI, Resend Email, Gmail SMTP, Google OAuth 2.0, Tavily Search, OpenAlex API  
> **Memory File Location:** [`PROJECT_MEMORY.md`](file:///e:/profmatch%20ai%20project/PROJECT_MEMORY.md)  
> **Last Updated:** 2026-10-07 (Technical SEO, Security Hardening, Manifest, and Full Production-Readiness Audit)

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
├── tests/                # 63 automated unit, security, SEO, and integrity tests
└── WEBSITE_AUDIT.md      # Comprehensive pre-launch audit report
```

---

- **Automated Unit, Security & SEO Tests:** `npm test` -> 63/63 tests passing (0 failures).
- **ESLint Code Quality:** `npx eslint .` -> 0 errors, 0 warnings.
- **TypeScript Compilation:** `npx tsc --noEmit` -> 0 errors.
- **Production Build:** `npm run build` -> Exit code 0 (65/65 dynamic & static routes compiled cleanly with 0 build warnings).
- **Email Dispatch Handshake:** Verified live Google SMTP TLS handshake & delivery (`250 2.0.0 OK`).
- **OAuth Production Status:** Google Cloud Console OAuth consent screen promoted to "In Production".
- **Live User Experience & Journey Verification (`scripts/verify-user-experience.mjs`):**
  - **Signup & OTP:** Salted scrypt password hashing verified, 6-digit OTP generated with 15-minute expiry, and live OTP email successfully delivered to inbox via Google SMTP.
  - **Field Search Relevance:** Live OpenAlex graph verified across multiple fields (Machine Learning, Bioinformatics Genomics, Quantum Computing) with real institution/concept mappings.
  - **AI Outreach Quality:** Real-time generation verified with Google Gemini, resilient fallback to `gemini-flash-lite-latest` implemented, achieving a 100/100 score on EmailQualityAgent audit (exact publication citation, zero spam flattery, proper word count, and CV reference).
