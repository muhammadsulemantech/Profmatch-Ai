# ProfMatch AI — System Architecture Specification

## 1. System Overview

ProfMatch AI is built on a modern Next.js 14 App Router architecture with a clear separation of concerns between client presentation, route handlers, a centralized business service layer, and managed PostgreSQL storage.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Client Web Application                        │
│   (Next.js 14 Client & Server Components, Tailwind CSS, Lucide UI)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / HTTPS (JSON Envelope)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Edge & Server Route Handlers                     │
│    (app/api/**, Session Verification, Zod Validation, Rate Limiting)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Direct TypeScript Function Calls
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Modular Service Layer                          │
│                      (lib/services/* Business Logic)                   │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│   AuthService   │  OutreachService │ ProfessorService│   AdminService  │
├─────────────────┼──────────────────┼─────────────────┼─────────────────┤
│   GmailService  │   UsageService   │   UserService   │    DbService    │
└────────┬────────┴─────────┬────────┴────────┬────────┴────────┬────────┘
         │                  │                 │                 │
         ▼                  ▼                 ▼                 ▼
┌─────────────────┐ ┌───────────────┐ ┌───────────────┐ ┌────────────────┐
│  Supabase Auth  │ │ Google Gemini │ │   OpenAlex    │ │  Gmail API     │
│   & PostgreSQL  │ │    1.5 Pro    │ │  & Tavily API │ │  (OAuth 2.0)   │
└─────────────────┘ └───────────────┘ └───────────────┘ └────────────────┘
```

---

## 2. Layered Architecture

### 2.1 Presentation Layer (`app/` & `components/`)
- **Server Components:** Utilized by default for static pages, SEO metadata rendering, and initial layout wrappers.
- **Client Components (`'use client'`):** Utilized for interactive dashboards, tab management, dynamic forms, and real-time state synchronization.
- **Component Modularization:** All bloated pages (>500 lines) are factored into single-responsibility components:
  - `components/ui/`: Reusable design primitives (`Button`, `Card`, `Badge`, `Modal`, `VerificationBadge`).
  - `components/admin/`: 8 isolated administrative tabs (`UsersTab`, `PaymentsTab`, `SettingsTab`, `AuditTab`, etc.).
  - `components/search/`: `SearchFilters`, `ProfessorCard`, `PaywallBanner`.
  - `components/inbox/`: `InboundEmailModal`, `ReplyDetailView`, `SentOutreachView`.
  - `components/autopilot/`: `CampaignConfigPanel`, `CampaignTerminal`, `PreparedDraftsList`.
  - `components/profile/`: `AvatarSection`, `TargetDestinationSection`, `AcademicHistorySection`, `ResearchFocusSection`, `AcademicCvSection`.

### 2.2 API Route Handlers (`app/api/**`)
- All route handlers enforce the standard `{ success, data, error }` response envelope via `lib/api/response.ts`.
- Input validation is strictly performed at the boundary using **Zod schemas**.
- Routes never query low-level databases directly; all database, third-party API, and auth logic is delegated to the service layer.
- Administrative endpoints under `app/api/admin/**` enforce `assertAdmin` checks that verify signed session tokens and reject client-side role claims.

### 2.3 Service Layer (`lib/services/`)
The service layer provides decoupled, testable business logic:

| Service | Module File | Primary Responsibilities |
|---|---|---|
| **Database Service** | `db-service.ts` | Unified Supabase PostgreSQL abstraction with transparent fallback caching, usage counters, and profile queries. |
| **Authentication Service** | `auth-service.ts` | OTP generation and timing-safe single-use verification, registration creation, session management. |
| **User Service** | `user-service.ts` | User profile retrieval, pagination, filtering, role modifications, and suspension enforcement. |
| **Gmail Service** | `gmail-service.ts` | Google OAuth 2.0 code exchange, AES-256-GCM token encryption, token refresh, and RFC 2822 MIME formatting. |
| **Outreach Service** | `outreach-service.ts` | Gmail drafts creation, email dispatching, anti-spam delay enforcement, and monthly quota deductions. |
| **Professor Service** | `professor-service.ts` | Faculty search orchestration, multi-provider aggregation (OpenAlex, Tavily), and verification proof validation. |
| **Admin Service** | `admin-service.ts` | Payment gateway configurations, payment receipt approvals, feature flags, and audit logging. |
| **Usage Service** | `usage-service.ts` | Multi-tier plan definitions (`FREE`, `STARTER`, `PRO`, `ELITE`), quota checking, and action gating. |

---

## 3. Data Flow Pipelines

### 3.1 Faculty Discovery & Grounded Search Pipeline
```
[User Query]
     │
     ▼
[GET /api/professors/search]
     │
     ▼
[ProfessorService.searchProfessors()]
     │
     ├─► Query OpenAlex API (Institutional publications, co-authors, citations)
     ├─► Query Tavily API (Faculty lab page, university directory profile)
     │
     ▼
[Evidence Normalization & Verification Pipeline]
     │
     ├─► Institutional Domain Match (.edu, .ac.uk, etc.) -> VERIFIED
     ├─► Web Mention without Institutional Evidence    -> UNVERIFIED
     ├─► Incomplete/Partial Institutional Proof         -> PARTIALLY_VERIFIED
     │
     ▼
[Enforce Academic Plan Quota] (FREE: 3 searches, PRO: 250 searches)
     │
     ▼
[JSON Response to Client Search UI]
```

### 3.2 Grounded Email Personalization & Gmail Drafts Pipeline
```
[User Selects Faculty Member]
     │
     ▼
[POST /api/autopilot/draft-grounded]
     │
     ▼
[Gemini 1.5 Pro LLM Agent]
  - Prompts require explicit citation of faculty papers
  - Prompts ground student thesis abstract and methodology
  - Rejects hallucinations and unsupported laboratory claims
     │
     ▼
[POST /api/autopilot/save-gmail-draft]
     │
     ▼
[GmailService.buildMimeMessage()]
     │
     ▼
[Decrypted Google OAuth Token] -> [Google Gmail API /v1/users/me/drafts]
     │
     ▼
[Draft Created in Student's Real Gmail Account for Review]
```

---

## 4. Database Schema & RLS

The database is built on Supabase PostgreSQL with strict Row Level Security (RLS) policies:

- **`public.profiles`**: Core user accounts extending `auth.users`. RLS grants users read/write permissions on their own record; admin reads all.
- **`public.subscriptions`**: Stores plan tier (`FREE`, `STARTER`, `PRO`, `ELITE`), status, and billing cycle.
- **`public.usage_tracking`**: Monthly usage counters (`searches_count`, `drafts_generated_count`, `emails_sent_count`) reset every cycle.
- **`public.connected_email_accounts`**: Stores AES-256-GCM encrypted Google OAuth tokens. Only accessible by the account owner via RLS.
- **`public.payments` & `public.orders`**: Stores subscription orders, payment references, and approval statuses.
- **`public.audit_logs`**: Immutable audit log of all security, auth, and admin actions.
- **`public.system_settings` & `public.feature_flags`**: Dynamic platform configurations.
