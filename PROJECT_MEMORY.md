# PROFMATCH AI — PROJECT MEMORY & ARCHITECTURE INDEX

> **Repository:** `suleman197/Profmatch-Ai` (branch: `main`)  
> **Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase, Gemini AI, Resend Email, Tavily Search, OpenAlex API  
> **Memory File Location:** [`PROJECT_MEMORY.md`](file:///e:/profmatch%20ai%20project/PROJECT_MEMORY.md)

---

## 1. Core Credentials & Admin Auth
- **Support Email:** `profmatchsupport@gmail.com`
- **Admin Email:** `sulemanmunir6752@gmail.com`
- **Admin Password:** `suleman6752`
- **Backup Admin Email:** `admin@profmatch.ai`
- **Admin Security Guarantee:** [middleware.ts](file:///e:/profmatch%20ai%20project/middleware.ts) + Server Cookie (`profmatch_role=admin`) automatically enforces admin dashboard privileges whenever logging in from Admin Console.

---

## 2. Live Environment & API Keys (.env.local)
- **Base App URL:** `http://localhost:3000` / `https://profmatch.ai`
- **Supabase URL:** `https://yofbhdgabzuededvceyr.supabase.co`
- **Supabase Keys:** Anon & Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`) configured in `.env.local` & Vercel
- **AI Engine:** `AI_PROVIDER=gemini` (Google Gemini Pro configured)
- **Search Provider:** `SEARCH_PROVIDER=tavily` (Tavily Search configured)
- **Academic Provider:** `ACADEMIC_DATA_PROVIDER=openalex` (OpenAlex configured)
- **Email Provider:** `EMAIL_PROVIDER=resend` / Gmail SMTP (`SMTP_USER=profmatchsupport@gmail.com`)

---

## 3. Implemented Features & Pages Index

### 🌐 Global & Navigation
1. [app/layout.tsx](file:///e:/profmatch%20ai%20project/app/layout.tsx) & [app/page.tsx](file:///e:/profmatch%20ai%20project/app/page.tsx):
   - Global Candidate Acceptance Ticker ("1,420+ MS & PhD Candidates Matched across 190+ Countries").
   - Added **Tracker** navigation link (`/tracker`).
   - Unified global navbar authentication controls ([components/navigation/navbar-auth-controls.tsx](file:///e:/profmatch%20ai%20project/components/navigation/navbar-auth-controls.tsx)) with Admin role status badge linking directly to `/admin`.
   - `export const dynamic = 'force-dynamic'` enabled so live admin edits (pricing, taglines, announcement banners) immediately reflect to all site visitors.
   - **Footer Branding**: Prominent branding added to site footer: **"Powered by Tonovox technologies"** in bold emerald accent styling.
   - **Client-Side Hydration Safety**: Replaced direct server `mockDb` imports in client-side home components with safe server props and fallbacks, avoiding browser hydration crashes.

### 🔐 Auth Pages & Email OTP Verification
2. [app/login/page.tsx](file:///e:/profmatch%20ai%20project/app/login/page.tsx), [app/signup/page.tsx](file:///e:/profmatch%20ai%20project/app/signup/page.tsx) & [app/api/auth/signup/route.ts](file:///e:/profmatch%20ai%20project/app/api/auth/signup/route.ts):
   - Scroll overflow locked on auth pages (prevents background site scroll).
   - Fully responsive design on all mobile & desktop screen sizes.
   - **Mandatory 6-Digit Email OTP Verification**:
     - Users entering signup details receive a secure 6-digit verification OTP in their email *first*.
     - Welcome email is dispatched **strictly after** the user enters and verifies the OTP code.
     - 15-minute OTP expiration lifetime with rate-limiting.
     - Multi-layer enforcement: Signup modal UI step, `auth-context.tsx` (`signup` handler), and backend `/api/auth/signup` validation route.
     - Server-side store in `database/pending_otps.json` (git-ignored).
     - Automated email delivery via configured SMTP (`profmatchsupport@gmail.com`) and Resend fallback.

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

### ⚙️ Real-Time Admin Panel, Permanent Supabase Cloud Persistence & Settings
8. [app/admin/page.tsx](file:///e:/profmatch%20ai%20project/app/admin/page.tsx), [lib/cms/settings-service.ts](file:///e:/profmatch%20ai%20project/lib/cms/settings-service.ts) & [lib/cms/content-service.ts](file:///e:/profmatch%20ai%20project/lib/cms/content-service.ts):
   - Single unified Sign Out control in top navbar.
   - Dynamic real-time editable pricing plans, tier highlighting, hero copy, site settings, payment methods, feature flags, user accounts & audit logs.
   - **Permanent Supabase Cloud Persistence (Vercel Cold-Start Solution)**:
     - Solved issue where Vercel serverless read-only filesystem was resetting admin panel edits after cold starts.
     - `settings-service.ts` & `content-service.ts` write directly to live Supabase (`site_settings` & `site_content` tables) via `createAdminClient()` using `SUPABASE_SERVICE_ROLE_KEY`, cleanly bypassing RLS restrictions.
     - Reading order prioritizes live Supabase database first with graceful fallback to `mockDb`.
     - Seeded all baseline pricing and site content into Supabase for permanent multi-device synchronization.
   - **Auto User Registration & Plan Tracking**: Every new signup via [`/api/auth/signup`](file:///e:/profmatch%20ai%20project/app/api/auth/signup/route.ts) is automatically saved to the database store and categorized into Free or Paid plan tiers in the Admin Panel.
   - **Floating WhatsApp Support Link**: Direct WhatsApp quick action button linking to `03227342728` (`https://wa.me/923227342728`).
   - **Official Support Email**: Standardized institutional support email to `profmatchsupport@gmail.com` across CMS settings, layout, and notification engines.
   - **Webpack Client Fallback**: Webpack `fs: false` & `path: false` fallback configured in [`next.config.mjs`](file:///e:/profmatch%20ai%20project/next.config.mjs) preventing client-side execution exceptions during browser hydration.

