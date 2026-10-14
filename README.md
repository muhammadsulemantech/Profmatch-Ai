# 🎓 ProfMatch AI — Global Academic Faculty Discovery & Outreach Platform

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_Postgres-3ECF8E?style=for-the-badge&logo=supabase)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Pro-8E75B2?style=for-the-badge&logo=googlegemini)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**ProfMatch AI** is a global academic discovery, research compatibility scoring, and citation-grounded cold outreach platform. Engineered specifically for prospective Master’s and Ph.D. candidates, research assistants, and postdoctoral scholars, ProfMatch AI indexes accredited university faculties across 190+ countries, drafts highly personalized inquiries citing verified publications, and tracks candidate application lifecycles from initial outreach to supervisor interview and acceptance.

---

## 🌟 Key Capabilities & Features

### 1. 🔍 Grounded Global Faculty Discovery
- **Authentic Scholarly Indexing:** Real-time retrieval of active professors, publications, and citations powered by OpenAlex Open Data and Tavily Search.
- **Truthful Verification Badging:** Explicit status labels (`VERIFIED`, `UNVERIFIED`, `PARTIALLY_VERIFIED`). Zero simulated or synthetic verification claims.
- **Granular Multi-Dimensional Filters:** Filter by country (190+ nations), academic discipline, primary field, recruiting status, and institutional email availability.

### 2. 🧠 Citation-Grounded AI Cold Outreach
- **Grounded Personalization:** Utilizes Google Gemini 1.5 Pro to synthesize the student's research interests, undergraduate thesis, and technical skills with the professor's recent publications.
- **Strict Anti-Spam Guardrails:** Guaranteed zero generic spam templates. Mandatory human review before dispatch. 15-second debounce window preventing accidental duplicate transmissions.
- **Direct Web & Gmail Dispatch:** One-click integration with connected Gmail accounts (Google OAuth 2.0 with AES-256-GCM token storage) or one-click browser-based Gmail drafts.

### 3. 🤖 Autonomous AutoPilot Engine
- **Autonomous Batch Discovery:** Discovers high-affinity faculty matching candidate research criteria across multiple target countries.
- **Queue & Draft Engine:** Prepares personalized outreach drafts with configurable anti-spam pacing intervals (45s–90s) without unsupervised bulk spamming.
- **Candidate Safety:** Enforces plan-based batch quotas and destination country restrictions.

### 4. 🎓 Candidate Kanban Application Tracker
- **Stage Progression:** Visual workflow columns:
  - `Saved Faculty` ➔ `Outreach Sent` ➔ `Professor Replied` ➔ `Interview Scheduled` ➔ `Offer Accepted`.
- **Automatic Card Ingestion:** Outreach generated from single drafts or AutoPilot batches is automatically ingested into `Outreach Sent`.
- **Interview & Follow-Up Notes:** Store interview dates, Zoom/Teams links, supervisor expectations, and follow-up deadlines directly on candidate cards.
- **User-Isolated Storage:** Multi-tenant isolated workspace ensuring candidate application data remains strictly private.

### 5. 💎 Dynamic Packages & Global Pricing
- **4-Tier Flat Subscription Model:**
  - `Free Explorer` (Preview Tier, 2 Preview Countries, 3 Searches, 2 AI Outreach Previews).
  - `Scholar Starter` (Focused Intake, 10+ Major Nations, 50 Searches, 30 AI Drafts, Basic AutoPilot).
  - `Pro Researcher` (Full International, 45+ Nations, 250 Searches, 150 AI Drafts, Autonomous AutoPilot).
  - `PhD Elite` (100% Worldwide Ultra, 190+ Countries, Unlimited Searches & AI Drafts, 500 AutoPilot Emails).
- **Dual Currency Switcher:** Instant live toggle between Pakistani Rupees (PKR 🇵🇰) and US Dollars (USD 🌐).
- **Zero-Stale Real-Time Sync:** Real-time CMS configurator in Admin Console with anti-cache headers (`Cache-Control: no-store, no-cache`, `revalidate: 0`) delivering immediate package and highlight updates to all devices without stale client fallbacks.

### 6. 💳 Multi-Channel Payment & Billing Authority
- **Flexible Payment Methods:** Seamless local and cross-border options including JazzCash Mobile Account, International SWIFT Bank Wire, and USDC / Crypto (TRC20 / Polygon).
- **Manual Proof Verification:** Candidate submits transaction reference ID and optional deposit slip screenshot for administrative audit.
- **Admin Alert Notifications:** Platform administrators receive real-time email notifications upon proof submission with direct links for review.
- **Instant Customer Receipts:** Automated payment confirmation emails dispatched directly to students.
- **Authoritative 30-Day Subscriptions:** Live PostgreSQL ledger tracking active subscription countdowns, renewal timelines, and graceful read-time downgrades upon expiration.

### 7. 🛡️ Security, Governance & Compliance
- **Google API User Data Policy Compliance:** Fully adheres to the Google API Services User Data Policy, including explicit Limited Use requirements and AI model training exclusion clauses.
- **GDPR & CCPA Compliant:** Transparent data collection practices, strict Row Level Security (RLS), and explicit GDPR Article 17 "Right to Erasure" account deletion rights.
- **Role-Gated Admin Console:** Comprehensive system telemetry, user management, feature flags, audit logging, and payment verification protected by server-side session guards.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [Next.js 14](https://nextjs.org/) (App Router, Server Components, Route Handlers) |
| **Language** | [TypeScript 5.5](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling & Icons** | Vanilla CSS, [Tailwind CSS 3.4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 15+, Row Level Security, Storage) |
| **AI Generation** | [Google Gemini 1.5 Pro](https://deepmind.google/technologies/gemini/) (`gemini-flash-latest`) |
| **Academic Discovery** | [OpenAlex API](https://openalex.org/) & [Tavily Search API](https://tavily.com/) |
| **Email Infrastructure** | Connected Gmail OAuth 2.0 / Google SMTP / [Resend](https://resend.com/) |
| **Testing** | Native Node.js Test Runner (`node:test`, `node:assert/strict`) |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18.17+ or v20+)
- npm or pnpm
- Supabase Project (PostgreSQL & Authentication)
- Google Cloud Console Project (OAuth 2.0 Client ID & Gemini API Key)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/suleman197/Profmatch-Ai.git
cd Profmatch-Ai

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Application Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AI Engine (Google Gemini)
AI_PROVIDER=gemini
AI_API_KEY=your-gemini-api-key
AI_MODEL=gemini-flash-latest

# Academic Search Providers
SEARCH_PROVIDER=tavily
TAVILY_API_KEY=your-tavily-api-key
ACADEMIC_DATA_PROVIDER=openalex
OPENALEX_API_KEY=your-openalex-key

# Email Provider (SMTP / Resend)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-support-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="ProfMatch AI <your-support-email@gmail.com>"
EMAIL_REPLY_TO="your-support-email@gmail.com"

# Google OAuth (Sign-In & Gmail Integration)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Platform Security & Administration
ADMIN_EMAILS=admin@profmatch.ai,your-admin-email@gmail.com
ADMIN_SECRET_PASSPHRASE=your-secure-admin-passphrase
RATE_LIMIT_MAX_REQUESTS_PER_MINUTE=60
```

### 4. Database Setup
Apply schema migrations in your Supabase SQL Editor:
1. `database/schema.sql`: Sets up enums (`plan_tier`, `user_role`), tables, RLS policies, triggers, and performance indexes.
2. `database/seed.sql`: Seeds initial content sections, academic taxonomy, and verification telemetry.

### 5. Running Locally
```bash
# Start local development server
npm run dev

# Run TypeScript type-checking
npx tsc --noEmit

# Run automated tests
npm test

# Build production bundle
npm run build
```

---

## 📁 Project Architecture

```text
profmatch-ai/
├── app/                       # Next.js 14 App Router
│   ├── (auth)/                # Login, Signup, Forgot Password, Reset Flow
│   ├── admin/                 # Role-gated Admin Telemetry & Governance Console
│   ├── api/                   # Standardized REST Route Handlers
│   │   ├── admin/             # CMS content, payments, users, flags, audit logs
│   │   ├── auth/              # Signup, OTP, session verification, OAuth
│   │   ├── autopilot/         # Batch faculty discovery & drafting
│   │   ├── checkout/          # Manual payment submission & proof handling
│   │   ├── pricing/           # Real-time dynamic pricing with anti-cache pipeline
│   │   └── professors/        # Grounded search & matching endpoints
│   ├── autopilot/             # Autonomous outreach queue & draft manager
│   ├── billing/               # Active plan status, renewal countdown & ledger
│   ├── campaigns/             # Candidate campaign manager
│   ├── checkout/              # Multi-channel checkout & proof upload
│   ├── choose-plan/           # Onboarding tier selection
│   ├── dashboard/             # Candidate analytics overview
│   ├── inbox/                 # Faculty reply analysis & suggested responses
│   ├── outreach/              # Citation-grounded cold email generator
│   ├── pricing/               # 4-Tier worldwide academic packages
│   ├── privacy/               # Google Limited Use & GDPR privacy policy
│   ├── professors/[id]/       # Comprehensive faculty research profile
│   ├── responsible-outreach/  # Anti-spam ethical inquiry standards
│   ├── search/                # Global faculty directory search engine
│   ├── terms/                 # Platform Terms of Service
│   └── tracker/               # Candidate Kanban application tracker
├── components/                # Modular UI Components & Design System
│   ├── admin/                 # Admin tabs (Pricing, Content, Users, Payments)
│   ├── home/                  # Homepage showcase & pricing section
│   ├── navigation/            # Global Navbar, Mobile Drawer & Auth controls
│   └── tracker/               # Kanban column components
├── database/                  # PostgreSQL schema, seed data, and RLS definitions
├── lib/                       # Core Application Layer & Utilities
│   ├── api/                   # Standard envelope helpers (apiSuccess, apiError)
│   ├── auth/                  # Scrypt password hashing, session guards, OTP
│   ├── cms/                   # Site content & settings service
│   ├── email/                 # Admin alert dispatch & transaction templates
│   ├── providers/             # Gemini AI, Tavily Search & OpenAlex adapters
│   └── services/              # Modular services (DB, Outreach, Usage, Quota)
└── tests/                     # Automated unit, security, and subscription suites
```

---

## 🔒 Security & Data Compliance

- **Google API Services User Data Policy:** ProfMatch AI’s use and transfer to any other app of information received from Google APIs adheres to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.
- **AI Training Prohibitions:** Student research documents and Google Workspace data are never used to train, fine-tune, or develop generalized artificial intelligence or machine learning models.
- **Anti-Spam Safeguards:** Daily sending limits, 15-second dispatch debouncing, and mandatory student review protect institutional email reputations.
- **GDPR Article 17 "Right to Erasure":** Users retain full rights to delete accounts, uploaded portfolios, and application data via settings or direct support request.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.
