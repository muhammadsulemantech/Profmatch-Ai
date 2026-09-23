# PROFMATCH AI — PROJECT MEMORY & ARCHITECTURE INDEX

> **Repository:** `suleman197/Profmatch-Ai` (branch: `main`)  
> **Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase, Gemini AI, Resend Email, Tavily Search, OpenAlex API  
> **Memory File Location:** [`PROJECT_MEMORY.md`](file:///e:/profmatch%20ai%20project/PROJECT_MEMORY.md)

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
- **Email Provider:** `EMAIL_PROVIDER=resend` / Gmail SMTP (`SMTP_USER=profmatchsupport@gmail.com`)
- **OAuth Provider:** Google OAuth 2.0 (Gmail Drafts & Messages Compose)

---

## 4. Key Directories & Architecture Map
```text
profmatch-ai/
├── app/                  # Next.js 14 App Router Pages & API Routes
│   ├── admin/            # Role-gated admin control panel (modularized)
│   ├── api/              # Standardized API routes ({ success, data, error })
│   ├── autopilot/        # Autonomous bulk discovery & drafting engine
│   ├── inbox/            # Faculty reply analysis & suggested responses
│   ├── outreach/         # Citation-grounded cold email generator
│   ├── professors/       # Faculty profile & publication analysis
│   ├── profile/          # Researcher profile & academic documents
│   └── search/           # Global faculty discovery search engine
├── components/           # Modular UI components & design system
│   ├── admin/            # 8 modular admin tab components
│   ├── autopilot/        # Campaign panel, terminal, and drafts list
│   ├── inbox/            # Reply threads, modal, and sent view
│   ├── profile/          # Modular profile sections (avatar, destination, cv)
│   ├── search/           # Search filters, cards, and paywall banner
│   └── ui/               # Reusable UI primitives
├── database/             # PostgreSQL schema, seed data, and RLS definitions
├── docs/                 # API contract specification (docs/api-contract.md)
├── lib/                  # Application core libraries & services
│   ├── api/              # Standard response helpers (apiSuccess, apiError)
│   ├── auth/             # OTP store, scrypt hashing, server session guards
│   ├── providers/        # AI, Search, and Email provider adapters
│   ├── services/         # Modular service layer (DB, Gmail, Outreach, Users)
│   ├── config.ts         # Runtime environment configuration & validation
│   └── logger.ts         # Structured JSON logger with credential redaction
└── tests/                # 57 automated unit, security, and integrity tests
```
