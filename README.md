# 🎓 ProfMatch AI — Global Academic Discovery & Outreach Platform

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Pro-8E75B2?style=for-the-badge&logo=googlegemini)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

ProfMatch AI is an intelligent, ethical academic outreach and faculty discovery platform designed to connect prospective graduate and PhD students with faculty members and research labs globally.

---

## 🌟 Key Features

- **🔍 AI-Powered Faculty Search:** Natural language search for professors across global institutions by field, country, region, and active recruitment status.
- **⚡ OpenAlex & Tavily Live Integration:** Real-time retrieval of faculty publications, h-index, citations, and active research grants.
- **✍️ Grounded AI Email Generation:** Powered by Google Gemini 1.5 Pro to write personalized, non-hallucinated outreach emails based on student profiles and professor papers.
- **📊 Research Compatibility Scoring:** Automated 0–100 match scoring analyzing alignment between student projects and lab interests.
- **📩 Outreach Tracking & Inbox:** Track sent cold emails, professor responses, and sentiment analysis (Positive, Meeting Requested, Follow-up due).
- **🚀 Transactional Email Delivery:** Integrated with Resend for high-deliverability email dispatching.
- **💳 Tiered Pricing & Subscriptions:** Free, Student, and Pro membership options with Stripe checkout flow.
- **🛡️ Responsible Outreach Policy:** Built-in safeguards against mass spamming and unethical bulk messaging.

---

## 🛠️ Technology Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server Actions, Edge Middleware)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & Lucide Icons
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL with RLS)
- **AI Engine:** [Google Gemini 1.5 Pro](https://aistudio.google.com/)
- **Academic Data Provider:** [OpenAlex API](https://openalex.org/) & [Tavily Search API](https://tavily.com/)
- **Email Service:** [Resend](https://resend.com/)

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Node.js (v18+ or v20+) and npm installed on your machine.

### 2. Clone the Repository
```bash
git clone https://github.com/suleman197/Profmatch-Ai.git
cd Profmatch-Ai
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env.local` file in the root directory and copy the contents from `.env.example`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Provider
AI_PROVIDER=gemini
AI_API_KEY=your-gemini-api-key
AI_MODEL=gemini-1.5-pro

# Search & Academic Data
SEARCH_PROVIDER=tavily
TAVILY_API_KEY=your-tavily-api-key
ACADEMIC_DATA_PROVIDER=openalex
OPENALEX_API_KEY=your-openalex-api-key

# Email Outreach
EMAIL_PROVIDER=resend
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM="ProfMatch AI Outreach <onboarding@resend.dev>"
```

### 5. Set Up the Database
Import the PostgreSQL schema and seed data into your Supabase SQL Editor:
- Load `database/schema.sql` to build tables, enums, triggers, and RLS policies.
- Load `database/seed.sql` to populate initial academic fields and faculty data.

### 6. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📁 Directory Structure

```text
profmatch-ai/
├── app/                  # Next.js 14 App Router Pages & API Routes
│   ├── (auth)/           # Authentication pages (Login, Register, Reset)
│   ├── admin/            # Admin control panel & audit logs
│   ├── api/              # API endpoints (Professors, Outreach, Payments)
│   ├── dashboard/        # Main student dashboard
│   ├── inbox/            # Email reply tracker
│   ├── outreach/         # AI email generation suite
│   ├── professors/       # Professor profile views
│   └── search/           # Discovery & search engine
├── components/           # Reusable UI components
├── database/             # PostgreSQL schema & seed files
├── lib/                  # Business logic & provider implementations
│   ├── providers/ai/     # Gemini & Mock AI Providers
│   ├── providers/email/  # Resend Email Provider
│   ├── providers/search/ # OpenAlex & Tavily Search Providers
│   └── supabase/         # Supabase client & server instances
└── types/                # TypeScript interface definitions
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Made with ❤️ by [Suleman](https://github.com/suleman197) for students and researchers worldwide.
