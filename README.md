# 🎓 ProfMatch AI — Academic Faculty Discovery & Grounded Outreach Platform

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_Postgres-3ECF8E?style=for-the-badge&logo=supabase)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Pro-8E75B2?style=for-the-badge&logo=googlegemini)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

ProfMatch AI is an academic faculty discovery, research compatibility scoring, and citation-grounded outreach platform designed to assist graduate students and postdocs in finding prospective research advisors globally.

---

## 🌟 Architecture & Capabilities

- **🔍 Live Academic Search:** Real-time retrieval of faculty publications, affiliations, and citation metrics powered by OpenAlex API and Tavily Search API.
- **🛡️ Truthful Verification Badging:** Distinct classification between verified institutional records (`VERIFIED`), web search candidates (`UNVERIFIED`), and partially sourced entries (`PARTIALLY_VERIFIED`). Zero simulated or synthetic verification claims.
- **🧠 Citation-Grounded Cold Outreach:** Gemini 1.5 Pro generates personalized outreach referencing specific recent publications from faculty labs and student thesis abstracts.
- **✉️ User-Isolated Gmail Integration:** Google OAuth 2.0 integration with AES-256-GCM encrypted token persistence, allowing students to save drafts directly into their connected Gmail accounts for human-in-the-loop review.
- **🤖 Autonomous AutoPilot Engine:** Rate-limited bulk outreach with configurable anti-spam delays (45s–90s) that creates reviewable drafts directly in Gmail without automated unsupervised dispatch.
- **🔐 Hardened Authentication & Security:** Supabase Auth integration, scrypt password hashing, timing-safe 15-minute OTP lifecycle, HTTP-only session cookies, and Row Level Security (RLS) across all user tables.
- **💳 Multi-Tier Academic Plans:** Quota enforcement across `FREE`, `STARTER`, `PRO`, and `ELITE` plan tiers with manual and Stripe checkout verification flows.
- **⚡ Service Layer Architecture:** Modular service layer in `lib/services/` separating database queries, third-party integrations, and route handlers.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 14 (App Router, Route Handlers, Edge Middleware)
- **Language:** TypeScript 5.5
- **Styling:** Vanilla CSS, Tailwind CSS, Lucide Icons
- **Database & Auth:** Supabase (PostgreSQL with Row Level Security)
- **AI Engine:** Google Gemini 1.5 Pro
- **Academic Data Providers:** OpenAlex API & Tavily Search API
- **Email Delivery:** Connected Gmail API (OAuth 2.0) or SMTP/Resend provider
- **Test Framework:** Node.js native test runner (`node:test`, `node:assert/strict`)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18.17+ or v20+)
- npm or pnpm
- Supabase project account (for PostgreSQL database & Auth)
- Google Cloud Console Project (for Gemini API & Gmail OAuth)

### 2. Clone & Install
```bash
git clone https://github.com/suleman197/Profmatch-Ai.git
cd Profmatch-Ai
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local` and set required credentials:
```bash
cp .env.example .env.local
```

Key environment configuration:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Database & Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Provider
AI_PROVIDER=gemini
AI_API_KEY=your-gemini-api-key
GEMINI_API_KEY=your-gemini-api-key
AI_MODEL=gemini-1.5-pro

# Academic Search Providers
SEARCH_PROVIDER=tavily
TAVILY_API_KEY=your-tavily-api-key
OPENALEX_EMAIL=your-email@university.edu

# Google OAuth (Gmail Drafts Integration)
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Security Secrets
SESSION_SECRET=your-minimum-32-char-random-secret
ADMIN_SECRET_PASSPHRASE=your-admin-passphrase
```

### 4. Database Setup
Execute the SQL migration scripts in your Supabase SQL Editor:
1. `database/schema.sql`: Creates enums, tables, RLS policies, triggers, and performance indexes.
2. `database/seed.sql`: Populates academic taxonomy domains and seed faculty records.

### 5. Running the Application
```bash
# Start local development server
npm run dev

# Run comprehensive test suite
npm test

# Build production bundle
npm run build
```

---

## 📁 Repository Structure

```text
profmatch-ai/
├── app/                  # Next.js 14 App Router Pages & API Routes
│   ├── admin/            # Role-gated admin control panel
│   ├── api/              # Standardized API routes ({ success, data, error })
│   ├── autopilot/        # Autonomous bulk discovery & drafting engine
│   ├── inbox/            # Faculty reply analysis & suggested responses
│   ├── outreach/         # Citation-grounded cold email generator
│   ├── professors/       # Faculty profile & publication analysis
│   ├── profile/          # Researcher profile & academic documents
│   └── search/           # Global faculty discovery search engine
├── components/           # Modular UI components & design system
│   ├── admin/            # Extracted admin tabs (users, payments, flags, audit)
│   ├── autopilot/        # Autopilot config, terminal logs, and drafts list
│   ├── inbox/            # Reply threads, modals, and sent views
│   ├── profile/          # Avatar, CV, target destinations, and research focus
│   ├── search/           # Search filters, professor cards, paywall banners
│   └── ui/               # Reusable UI primitives (Button, Card, Badge, Modal)
├── database/             # PostgreSQL schema, seed data, and RLS definitions
├── docs/                 # System documentation & API contract specifications
├── lib/                  # Application core libraries & services
│   ├── api/              # Standard API response helpers (apiSuccess, apiError)
│   ├── auth/             # OTP store, scrypt hashing, and server session guards
│   ├── providers/        # AI, Search, and Email provider adapters
│   ├── services/         # Modular service layer (DB, Gmail, Outreach, Users)
│   ├── config.ts         # Runtime environment configuration & validation
│   └── logger.ts         # Structured JSON logger with credential redaction
└── tests/                # Automated security, auth, and unit test suites
```

---

## 📄 Documentation

- [Architecture Specification (ARCHITECTURE.md)](ARCHITECTURE.md): System architecture, component hierarchy, service layer, and data flows.
- [Security Model (SECURITY.md)](SECURITY.md): Threat model, authentication architecture, RLS policies, and secret management.
- [API Contract (docs/api-contract.md)](docs/api-contract.md): Complete REST endpoint documentation, schemas, and status codes.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
