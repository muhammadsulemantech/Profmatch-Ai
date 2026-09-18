# PROFMATCH AI — PROJECT MEMORY & ARCHITECTURE INDEX

> **Repository:** `suleman197/Profmatch-Ai` (branch: `main`)  
> **Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase, Gemini AI, Resend Email, Tavily Search, OpenAlex API  
> **Memory File Location:** [`PROJECT_MEMORY.md`](file:///e:/profmatch%20ai%20project/PROJECT_MEMORY.md)

---

## 1. Core Credentials & Admin Auth
- **Admin Email:** `sulemanmunir6752@gmail.com`
- **Admin Password:** `suleman6752`
- **Backup Admin Email:** `admin@profmatch.ai`
- **Admin Security Guarantee:** [middleware.ts](file:///e:/profmatch%20ai%20project/middleware.ts) + Server Cookie (`profmatch_role=admin`) automatically enforces admin dashboard privileges whenever logging in from Admin Console.

---

## 2. Live Environment & API Keys (.env.local)
- **Base App URL:** `http://localhost:3000` / `https://profmatch.ai`
- **Supabase URL:** `https://yofbhdgabzuededvceyr.supabase.co`
- **Supabase Keys:** Anon & Service Role Keys configured in `.env.local`
- **AI Engine:** `AI_PROVIDER=gemini` (Google Gemini Pro configured)
- **Search Provider:** `SEARCH_PROVIDER=tavily` (Tavily Search configured)
- **Academic Provider:** `ACADEMIC_DATA_PROVIDER=openalex` (OpenAlex configured)
- **Email Provider:** `EMAIL_PROVIDER=resend` (Resend Email configured)

---

## 3. Implemented Features & Pages Index

### 🌐 Global & Navigation
1. [app/layout.tsx](file:///e:/profmatch%20ai%20project/app/layout.tsx) & [app/page.tsx](file:///e:/profmatch%20ai%20project/app/page.tsx):
   - Global Candidate Acceptance Ticker ("1,420+ MS & PhD Candidates Matched across 190+ Countries").
   - Added **Tracker** navigation link (`/tracker`).
   - Unified global navbar authentication controls ([components/navigation/navbar-auth-controls.tsx](file:///e:/profmatch%20ai%20project/components/navigation/navbar-auth-controls.tsx)) with Admin role status badge linking directly to `/admin`.
   - `export const dynamic = 'force-dynamic'` enabled so live admin edits (pricing, taglines, announcement banners) immediately reflect to all site visitors.

### 🔐 Auth Pages
2. [app/login/page.tsx](file:///e:/profmatch%20ai%20project/app/login/page.tsx) & [app/signup/page.tsx](file:///e:/profmatch%20ai%20project/app/signup/page.tsx):
   - Scroll overflow locked on auth pages (prevents background site scroll).
   - Fully responsive design on all mobile & desktop screen sizes.

### 👤 Candidate Profile & Resume AI
3. [app/profile/page.tsx](file:///e:/profmatch%20ai%20project/app/profile/page.tsx):
   - 1-Click CV AI Auto-Parser (extracts research keywords, updates bio, target degree, displays feedback banner).

### 🎓 Professor Details & Match Engine
4. [app/professors/[id]/page.tsx](file:///e:/profmatch%20ai%20project/app/professors/[id]/page.tsx):
   - AI Match Analysis Modal (% match calculation between candidate profile & faculty thesis/publications).
   - Live DOI Badges & OpenAlex Paper Links (`api.openalex.org/works`).
   - Cleaned title prefixes (`Dr.`, `Prof.`) via `cleanProfessorNameForSearch` to prevent zero-result Google Scholar/OpenAlex search errors.
   - Centralized official university email domain resolver ([lib/utils/email-resolver.ts](file:///e:/profmatch%20ai%20project/lib/utils/email-resolver.ts)) mapping global top institutions to real official domains.

### ✉️ AI Outreach Generator & Gmail Drafts
5. [app/outreach/generate/page.tsx](file:///e:/profmatch%20ai%20project/app/outreach/generate/page.tsx):
   - Direct Gmail Drafts integration via Google OAuth 2.0 (`https://www.googleapis.com/auth/gmail.compose`).
   - In-App Email Review Modal prior to draft creation with Base64URL encoded RFC 2822 MIME output.
   - Dedicated Connectors Hub ([app/connectors/page.tsx](file:///e:/profmatch%20ai%20project/app/connectors/page.tsx)) for managing Gmail & external integrations.
   - Deliverability Anti-Spam Health Meter, AI Quality Grader, and 7-Day / 14-Day follow-up scheduler.

### 📋 Application Kanban Tracker
6. [app/tracker/page.tsx](file:///e:/profmatch%20ai%20project/app/tracker/page.tsx):
   - 5 Application Stages: *Saved Faculty*, *Outreach Sent*, *Replied*, *Interview*, *Accepted*.
   - Drag & Move between stages, custom note modal, persistent storage.

### 💳 Payments & Receipts
7. [app/checkout/status/[reference]/page.tsx](file:///e:/profmatch%20ai%20project/app/checkout/status/[reference]/page.tsx):
   - 3-Step Live Payment Verification Audit Progress Bar.
   - Digital PDF Billing Receipt print/download generator.

### ⚙️ Real-Time Admin Panel & Disk Persistence Engine
8. [app/admin/page.tsx](file:///e:/profmatch%20ai%20project/app/admin/page.tsx) & [database/persistent_store.json](file:///e:/profmatch%20ai%20project/database/persistent_store.json):
   - Single unified Sign Out control in top navbar (removed redundant in-page banner logout).
   - Dynamic real-time editable pricing plans, hero copy, site settings, payment methods, feature flags, user accounts & audit logs.
   - Mandatory disk storage re-sync (`mockDb.loadFromDisk()`) added across all API GET handlers (`/api/admin/settings`, `/api/admin/content`, `/api/admin/payment-methods`, `/api/admin/payments`, `/api/admin/audit-logs`) ensuring 100% data persistence across logins, reboots, and multi-day gaps.
