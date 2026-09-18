# PROFMATCH AI — PROJECT MEMORY & ARCHITECTURE INDEX

> **Repository:** `suleman197/Profmatch-Ai` (branch: `main`)  
> **Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase, Gemini AI, Resend Email, Tavily Search, OpenAlex API  
> **Memory File Location:** [`memory.txt`](file:///e:/student%20sir/memory.txt) & [`PROJECT_MEMORY.md`](file:///e:/student%20sir/PROJECT_MEMORY.md)

---

## 1. Core Credentials & Admin Auth
- **Admin Email:** `sulemanmunir6752@gmail.com`
- **Admin Password:** `suleman6752`
- **Backup Admin Email:** `admin@profmatch.ai`
- **Admin Security Guarantee:** [middleware.ts](file:///e:/student%20sir/middleware.ts) + Server Cookie (`profmatch_role=admin`) automatically enforces admin dashboard privileges whenever logging in from Admin Console.

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
1. [app/layout.tsx](file:///e:/student%20sir/app/layout.tsx) & [app/page.tsx](file:///e:/student%20sir/app/page.tsx):
   - Global Candidate Acceptance Ticker ("1,420+ MS & PhD Candidates Matched across 190+ Countries").
   - Added **Tracker** navigation link (`/tracker`).
   - Sticky Top Navbar overlay fixed (login/signup pages start below navbar).

### 🔐 Auth Pages
2. [app/login/page.tsx](file:///e:/student%20sir/app/login/page.tsx) & [app/signup/page.tsx](file:///e:/student%20sir/app/signup/page.tsx):
   - Scroll overflow locked on auth pages (prevents background site scroll).
   - Fully responsive design on all mobile & desktop screen sizes.

### 👤 Candidate Profile & Resume AI
3. [app/profile/page.tsx](file:///e:/student%20sir/app/profile/page.tsx):
   - 1-Click CV AI Auto-Parser (extracts research keywords, updates bio, target degree, displays feedback banner).

### 🎓 Professor Details & Match Engine
4. [app/professors/[id]/page.tsx](file:///e:/student%20sir/app/professors/[id]/page.tsx):
   - AI Match Analysis Modal (% match calculation between candidate profile & faculty thesis/publications).
   - Live DOI Badges & OpenAlex Paper Links.
   - In-App Publication Inspector Modal (replaces external Google Scholar redirects).
   - Live University Directory Audit Badge.
   - Clean contact row formatting (zero email truncations or double dots).

### ✉️ AI Outreach Generator
5. [app/outreach/generate/page.tsx](file:///e:/student%20sir/app/outreach/generate/page.tsx):
   - Email Deliverability Anti-Spam Health Meter.
   - AI Quality & Tone Grader widget (Professional, Persuasive, Conciseness scores).
   - Grounded Citation Highlighting.
   - 7-Day & 14-Day Automated Follow-Up Reminders scheduler.

### 📋 Application Kanban Tracker
6. [app/tracker/page.tsx](file:///e:/student%20sir/app/tracker/page.tsx):
   - 5 Application Stages: *Saved Faculty*, *Outreach Sent*, *Replied*, *Interview*, *Accepted*.
   - Drag & Move between stages, custom note modal, persistent storage.

### 💳 Payments & Receipts
7. [app/checkout/status/[reference]/page.tsx](file:///e:/student%20sir/app/checkout/status/[reference]/page.tsx):
   - 3-Step Live Payment Verification Audit Progress Bar.
   - Digital PDF Billing Receipt print/download generator.

### ⚙️ Real-Time Admin Panel & Permanent Data Store
8. [app/admin/page.tsx](file:///e:/profmatch%20ai%20project/app/admin/page.tsx) & [database/persistent_store.json](file:///e:/profmatch%20ai%20project/database/persistent_store.json):
   - Dynamic real-time editable pricing plans, hero copy, site settings, payment methods, feature flags, user accounts & audit logs.
   - Permanent JSON file-backed persistence (`loadFromDisk` & `saveToDisk`) surviving logins, reboots, and refreshes.

### 🔑 Google OAuth 2.0 Auth Integration
9. [app/api/auth/google/route.ts](file:///e:/profmatch%20ai%20project/app/api/auth/google/route.ts) & [app/api/auth/google/callback/route.ts](file:///e:/profmatch%20ai%20project/app/api/auth/google/callback/route.ts):
   - Google Client ID & Secret configuration with automatic OAuth token exchange & user profile creation.
   - 1-Click "Continue with Google" buttons on Login, Signup, and Auth Modal components.
