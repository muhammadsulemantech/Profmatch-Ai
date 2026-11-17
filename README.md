# 🎓 ProfMatch AI — Global Academic Faculty Discovery & Citation-Grounded Outreach Platform

[![CI Pipeline](https://github.com/muhammadsulemantech/Profmatch-Ai/actions/workflows/ci.yml/badge.svg)](https://github.com/muhammadsulemantech/Profmatch-Ai/actions/workflows/ci.yml)
[![Architecture & Guardrails](https://github.com/muhammadsulemantech/Profmatch-Ai/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/muhammadsulemantech/Profmatch-Ai/actions/workflows/pr-checks.yml)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_Postgres-3ECF8E?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![Vitest](https://img.shields.io/badge/Vitest-3.2-6E9F18?style=flat-square&logo=vitest)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**ProfMatch AI** is an enterprise-grade academic discovery, CV-to-faculty compatibility scoring, and citation-grounded outreach platform. Purpose-built for prospective Master’s and Ph.D. applicants, research assistants, and postdoctoral scholars, ProfMatch AI indexes verified university faculty across 250 countries and territories, analyzes candidate CVs against live scholarly publications, prepares personalized outreach drafts, and manages the entire graduate application lifecycle through a single workspace.

---

## 🌟 Core Platform Capabilities

### 1. 🔍 Global Faculty Discovery & Truthful Verification Pipeline
- **Multi-Source Scholarly Indexing:** Real-time faculty, publication, grant, and lab-team retrieval powered by **OpenAlex** and **Tavily Search** (`lib/providers/search/`).
- **Strict Verification Truthfulness:** Every faculty record and email carries explicit verification status (`VERIFIED`, `PARTIALLY_VERIFIED`, `UNVERIFIED`, `SOURCE_UNAVAILABLE`, `STALE`) — zero fabricated verification claims or synthetic fallback profiles.
- **250-Country Searchable Geography:** Custom `SearchableCountrySelect` with instant keyboard type-ahead (e.g., pressing `G` prioritizes **Germany**), A–Z quick-jump strip, tier-based country gating, and state/province subdivision filtering (`lib/geography/`).
- **Faculty Deep-Dive Profiles:** Inspect recent publications, citation counts, grant funding badges (`GrantFundingBadge`), and discovered lab members/postdocs (`/professors/[id]`).

### 2. 📄 AI CV Parsing & Instant Compatibility Matching
- **Authenticated PDF CV Ingestion:** Validates file size (`<= 10MB`) and authentic `%PDF` magic bytes before extracting degrees, CGPA, university, thesis abstracts, and research keywords (`/api/profile/parse-cv`).
- **One-Click CV-to-Professor Match:** Uploads a candidate CV and computes multi-dimensional fit scores (Research Interests, Projects & Grants, Skills Alignment, Publications Overlap) against discovered faculty (`/api/cv/match`, `/api/matches/analyze`).
- **AI Match Breakdown Modal:** Explains why a candidate matches a supervisor and recommends a grounded outreach angle (`MatchAnalysisModal`).

### 3. 🧠 Citation-Grounded Cold Outreach Studio
- **Publication-Grounded Drafting:** Synthesizes the candidate's thesis, skills, and research profile with the professor's recent papers — standardized to `Dear Professor [LastName]` (`lib/templates/email-templates.ts`).
- **Smart Follow-Up Generator:** Generates context-aware polite follow-ups based on elapsed days and original outreach subject (`/api/outreach/generate-followup`).
- **Gmail OAuth 2.0 Integration:** Connects candidate Gmail accounts using minimal compose scope with AES-256-GCM encrypted token storage and direct unsent draft creation (`/api/auth/google/gmail`, `/api/outreach/create-draft`).

### 4. 🤖 Autonomous AutoPilot & Background Job Engine
- **Quota-Gated Batch Discovery:** Discovers high-affinity faculty across target countries while enforcing plan-level batch and country entitlements (`/api/autopilot/discover-next`, `/api/autopilot/draft-grounded`).
- **Signature-Verified Background Processing:** Integrates **Upstash QStash** signature verification for asynchronous faculty discovery batches (`/api/jobs/autopilot-batch`).
- **Live Telemetry Terminal & Draft Queue:** Real-time progress logs and reviewable draft lists before saving to Gmail (`/autopilot`).

### 5. 📬 Faculty Inbox, Campaigns & Kanban Application Tracker
- **Reply Sentiment & Response Assistant:** Analyzes inbound professor replies (`POSITIVE`, `NEUTRAL`, `NEGATIVE`) and drafts suggested follow-up responses (`/inbox`, `/api/inbox/analyze-reply`).
- **Kanban Application Pipeline:** Visual stage tracking across `Saved Faculty` ➔ `Outreach Sent` ➔ `Professor Replied` ➔ `Interview Scheduled` ➔ `Offer Accepted` with interview notes and follow-up dates (`/tracker`, `/applications`, `/campaigns`).

### 6. 💎 Dynamic 4-Tier Pricing & Multi-Channel Billing
- **Subscription Tiers:** `Free Explorer`, `Scholar Starter`, `Pro Researcher`, and `PhD Elite` with live PKR/USD currency switching and `Cache-Control: no-store` real-time CMS synchronization (`/pricing`, `/choose-plan`, `/api/pricing`).
- **Manual Payment Verification Flow:** Supports local & international payment channels (JazzCash, SadaPay/NayaPay, SWIFT Wire, Wise, USDC/Crypto) with validated proof screenshot/URL uploads (`/checkout`, `/api/checkout/submit`), admin email alerts, and instant customer receipts.
- **Authoritative 30-Day Lifecycle:** Automated expiration checks and safe read-time downgrades back to `FREE` entitlements (`/billing`).

### 7. 🛡️ Role-Gated Admin & Governance Console
- **System Telemetry & User Governance:** Paginated user search, role assignment, manual plan upgrades/downgrades, and suspension controls (`/admin`, `/api/admin/users`).
- **Operations & Auditability:** Live feature flags, payment approval workflow, dynamic pricing/CMS editors, global academic data quality metrics, and immutable audit logs (`/api/admin/*`).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, Server Components, Route Handlers, Edge Middleware) |
| **Language** | [TypeScript 5.5](https://www.typescriptlang.org/) (Strict Mode) |
| **UI & Visualization** | React 18, [Tailwind CSS 3.4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Recharts](https://recharts.org/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, SSR Auth) |
| **AI & Document Parsing** | Google Gemini / OpenAI adapters (`lib/providers/ai/`), `pdf-parse`, `zod` |
| **Academic & Search APIs** | [OpenAlex API](https://openalex.org/), [Tavily Search API](https://tavily.com/) |
| **Background Queue & Email** | [Upstash QStash](https://upstash.com/), Google Gmail OAuth 2.0, [Nodemailer](https://nodemailer.com/) |
| **Analytics & Monitoring** | [PostHog](https://posthog.com/), Structured Redacting Logger (`lib/logger.ts`), `/api/health` |
| **Testing & CI/CD** | [Vitest 3.2](https://vitest.dev/) + React Testing Library (`jsdom`), Node.js `node:test`, GitHub Actions, Dependabot |

---

## 🔒 Security, Privacy & Resilience Architecture

- **Authentication & Authorization:** Server-side `verifyAuthSession` and `assertAdmin` guards across private and admin API routes; BOLA/IDOR ownership checks on user sync and saved faculty endpoints; HMAC-SHA256 signed OAuth `state` with open-redirect validation (`lib/security/oauth-state.ts`, `lib/security/url-validation.ts`).
- **Cryptography & Credential Hygiene:** AES-256-GCM encryption for stored OAuth tokens (`lib/security/encryption.ts`), salted `scrypt` password hashing, timing-safe OTP verification, and fail-closed secret enforcement in `production`.
- **Rate Limiting & Edge Hardening:** Category-based edge rate limiting in `middleware.ts` + bounded per-route rate limits (`lib/security/rate-limit.ts`), HSTS, strict CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and CSRF-safe `POST` session cleanup.
- **Compliance & SEO Hygiene:** Google API Services User Data Policy (Limited Use & zero AI model training), GDPR Article 17 account erasure, Schema.org structured data, dynamic `sitemap.xml`, and `noindex` enforcement on private workspaces.

---

## 📁 Project Architecture

```text
profmatch-ai/
├── .github/
│   ├── workflows/             # CI Pipeline, Offline Guardrails & Security Audit
│   └── dependabot.yml         # Automated weekly npm & GitHub Actions updates
├── app/
│   ├── (auth)/                # Login, Signup, Forgot Password, Reset Password
│   ├── admin/                 # Role-gated Admin Console & Login
│   ├── api/                   # REST Route Handlers (admin, auth, autopilot, checkout, cv, inbox, outreach, professors, user)
│   ├── applications/          # Graduate application status console
│   ├── autopilot/             # Autonomous discovery & draft queue UI
│   ├── billing/               # Subscription status, usage & order ledger
│   ├── campaigns/             # Outreach campaign management
│   ├── checkout/              # Multi-channel payment & slip verification flow
│   ├── choose-plan/           # Tier selection view
│   ├── connectors/            # Gmail OAuth 2.0 integration console
│   ├── dashboard/             # Candidate workspace overview & analytics
│   ├── inbox/                 # Faculty reply analysis & response studio
│   ├── onboarding/            # 4-step candidate academic profile wizard
│   ├── outreach/generate/     # Citation-grounded email composer
│   ├── pricing/               # Dynamic PKR/USD 4-tier pricing page
│   ├── professors/[id]/       # Faculty profile, match breakdown, publications & grants
│   ├── profile/               # Candidate academic data & CV manager
│   ├── search/                # Global faculty search & CV instant match
│   ├── settings/              # Account integration settings
│   └── tracker/               # Candidate Kanban pipeline board
├── components/                # Modular UI components (admin, auth, autopilot, home, inbox, navigation, outreach, professors, profile, search, ui)
├── database/                  # PostgreSQL schema, seed data & SQL migrations
├── lib/                       # Core domain services (agents, auth, cms, email, geography, providers, security, seo, services, taxonomy, templates, verification)
├── tests/
│   ├── unit/                  # Vitest + React Testing Library component & utility suites
│   └── *.test.mjs             # Node.js integration, schema, SEO, security & pipeline suites
├── middleware.ts              # Edge security headers, HTTPS redirect & API rate limiting
├── next.config.mjs            # Production Next.js configuration & security headers
└── vitest.config.ts           # Vitest jsdom & TypeScript alias configuration
```

---

## 🧪 Testing & CI/CD Quality Gates

- **Vitest Unit & UI Suite (`tests/unit/`):** Tests React components (such as `SearchableCountrySelect` keyboard search and A–Z jump filtering) and core security utilities in isolated `jsdom`.
- **Node.js Architecture & Security Suites (`tests/*.test.mjs`):** Validates database schema/migration reconciliation, SEO technical readiness, build integrity, OTP/password security, rate limiting, verified faculty pipeline truthfulness, and Supabase connectivity.
- **Automated GitHub Actions:** Every push and pull request to `main` automatically runs TypeScript type-checking (`tsc --noEmit`), ESLint (`next lint`), Vitest (`test:unit`), production build verification (`next build`), and 82 offline guardrail assertions, backed by weekly vulnerability audits (`npm audit`).

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.
