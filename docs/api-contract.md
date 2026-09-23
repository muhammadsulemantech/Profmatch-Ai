# ProfMatch AI — API Contract Specification

This document defines the complete REST API contract for **ProfMatch AI**. All endpoints strictly conform to the unified JSON response envelope, standard HTTP status codes, and input validation schemas.

---

## 1. Global API Conventions

### 1.1 Request Headers
- `Content-Type: application/json` for all mutating endpoints (`POST`, `PUT`, `PATCH`).
- Cookie-based authentication: All authenticated endpoints expect a signed session cookie `profmatch_session` (managed via HTTP-only cookies).

### 1.2 Unified Response Envelope
Every API response strictly follows this standardized JSON envelope:

#### Successful Response (`HTTP 200..299`)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 120,
    "totalPages": 6,
    "hasMore": true
  }
}
```

#### Error Response (`HTTP 400..599`)
```json
{
  "success": false,
  "error": "Human-readable explanation of error.",
  "code": "INVALID_CREDENTIALS",
  "details": { ... }
}
```

### 1.3 Standard HTTP Status Codes
| Status | Meaning | Usage |
|---|---|---|
| `200 OK` | Success | Request succeeded. |
| `201 Created` | Resource Created | Resource successfully persisted. |
| `400 Bad Request` | Client Validation Error | Malformed body, missing required fields, or Zod validation failure. |
| `401 Unauthorized` | Unauthenticated | Missing, expired, or invalid session token. |
| `403 Forbidden` | Access Denied | Authenticated user lacks permission (e.g. non-admin accessing admin routes, plan tier limit). |
| `404 Not Found` | Not Found | Requested entity does not exist. |
| `409 Conflict` | State Conflict | User email already registered, or duplicate resource. |
| `429 Too Many Requests`| Rate Limited | IP or account exceeded endpoint rate limit. Includes `Retry-After` header. |
| `500 Internal Error` | Server Exception | Unexpected backend exception. |
| `502 Bad Gateway` | Upstream Failure | External third-party API (e.g. Gmail API, Tavily, Gemini) failure. |
| `503 Service Unavailable` | Service Unconfigured | External delivery provider or database unconfigured. |

---

## 2. Authentication & Account APIs

### 2.1 `POST /api/auth/signup/send-otp`
- **Description**: Registers a pending account registration and dispatches a 6-digit OTP code to the user's email.
- **Auth Required**: No.
- **Rate Limit**: 5 requests / 10 minutes per IP.
- **Request Body**:
  ```json
  {
    "fullName": "Alex Mercer",
    "email": "alex.mercer@example.edu",
    "password": "Password123!",
    "targetDegree": "PhD"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Verification code dispatched to your email."
    }
  }
  ```

### 2.2 `POST /api/auth/signup/verify-otp`
- **Description**: Validates the 6-digit OTP code, creates/links user in Supabase Auth with `email_confirm: true`, provisions default `FREE` subscription, and returns user identity.
- **Auth Required**: No.
- **Rate Limit**: 10 attempts / 15 minutes per IP.
- **Request Body**:
  ```json
  {
    "email": "alex.mercer@example.edu",
    "otp": "482910"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Account verified successfully. You can now log in.",
      "user": {
        "id": "usr_9482104921",
        "email": "alex.mercer@example.edu",
        "full_name": "Alex Mercer",
        "role": "USER"
      }
    }
  }
  ```

### 2.3 `POST /api/auth/signup/resend-otp`
- **Description**: Re-generates and re-sends a 6-digit OTP to the registered pending email.
- **Auth Required**: No.
- **Request Body**:
  ```json
  {
    "email": "alex.mercer@example.edu"
  }
  ```
- **Response**: `{ "success": true, "data": { "message": "New verification code sent." } }`

### 2.4 `POST /api/auth/login`
- **Description**: Authenticates user credentials and sets signed HTTP-only `profmatch_session` cookie.
- **Auth Required**: No.
- **Request Body**:
  ```json
  {
    "email": "alex.mercer@example.edu",
    "password": "Password123!"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_9482104921",
        "email": "alex.mercer@example.edu",
        "full_name": "Alex Mercer",
        "role": "USER"
      }
    }
  }
  ```

### 2.5 `POST /api/auth/logout`
- **Description**: Clears the authentication session cookie and logs audit logout.
- **Auth Required**: No.
- **Response**: `{ "success": true, "data": { "message": "Logged out successfully" } }`

### 2.6 `GET /api/auth/me`
- **Description**: Retrieves current authenticated session user profile and active subscription details.
- **Auth Required**: Yes (`profmatch_session` cookie).
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_9482104921",
        "email": "alex.mercer@example.edu",
        "full_name": "Alex Mercer",
        "role": "USER",
        "plan_tier": "FREE",
        "is_suspended": false
      }
    }
  }
  ```

### 2.7 `GET /api/auth/google/gmail`
- **Description**: Generates a secure CSRF-signed state token and redirects user to Google OAuth consent screen for Gmail Draft & Send permissions (`gmail.compose`, `gmail.modify`, `gmail.send`).
- **Auth Required**: Yes.
- **Response**: HTTP 302 Redirect to `accounts.google.com`.

### 2.8 `GET /api/auth/google/gmail/callback`
- **Description**: Exchanges Google OAuth authorization code for refresh and access tokens, securely encrypts tokens with AES-256-GCM, and persists to `connected_email_accounts`.
- **Auth Required**: Yes (validated state param).
- **Response**: HTTP 302 Redirect to `/settings?tab=connectors&connected=gmail`.

### 2.9 `GET /api/auth/google/gmail/status`
- **Description**: Checks whether the authenticated user has an active, valid Gmail integration.
- **Auth Required**: Yes.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "connected": true,
      "email": "alex.mercer@gmail.com",
      "provider": "google",
      "expiresAt": "2026-09-24T05:00:00Z"
    }
  }
  ```

---

## 3. Faculty Discovery & Match Analysis APIs

### 3.1 `GET /api/professors/search`
- **Description**: Searches verified academic faculty using live academic APIs (OpenAlex & Tavily) and local registry.
- **Auth Required**: Optional (anonymous searches return partial/free results).
- **Query Parameters**:
  - `q` (string): Keyword query (e.g. `LLM reasoning`).
  - `country` (string, optional): Target country.
  - `university` (string, optional): Specific institution.
  - `discipline` (string, optional): Research discipline.
  - `verifiedOnly` (boolean, optional): Only return professors with verified email evidence.
  - `page` (number, default: 1).
  - `pageSize` (number, default: 10).
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "professors": [
        {
          "id": "prof_openalex_W294819",
          "name": "Dr. Greg Durrett",
          "title": "Associate Professor",
          "university_name": "University of Texas at Austin",
          "university_country": "United States",
          "department": "Computer Science",
          "email": "gdurrett@cs.utexas.edu",
          "verification_status": "VERIFIED",
          "recruiting_status": "YES",
          "research_topics": ["NLP", "LLM Reasoning"]
        }
      ]
    },
    "meta": {
      "page": 1,
      "pageSize": 10,
      "total": 42,
      "totalPages": 5
    }
  }
  ```

### 3.2 `POST /api/matches/analyze`
- **Description**: Computes a grounded match score (0-100%) and analytical breakdown between a student's profile and a faculty member's published papers.
- **Auth Required**: Yes.
- **Request Body**:
  ```json
  {
    "professorId": "prof_openalex_W294819",
    "professor": { ... },
    "studentProfile": {
      "field": "Artificial Intelligence",
      "keywords": ["LLM Reasoning", "RAG"]
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "matchScore": 92,
      "rationale": "High overlap on grounded reasoning and generation alignment.",
      "matchingPublications": [ ... ],
      "recommendedAngle": "Emphasize recent work on multi-hop verification."
    }
  }
  ```

---

## 4. Autopilot Engine APIs

### 4.1 `POST /api/autopilot/discover-next`
- **Description**: Finds the next candidate professor matching research criteria that has not yet been drafted or emailed.
- **Auth Required**: Yes.
- **Request Body**:
  ```json
  {
    "targetCountry": "United States",
    "targetDegree": "PhD",
    "discipline": "Artificial Intelligence & NLP",
    "keywords": ["Large Language Models", "AI Reasoning"],
    "alreadyContactedEmails": ["faculty@university.edu"]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "professor": {
        "name": "Dr. Greg Durrett",
        "university_name": "University of Texas at Austin",
        "email": "gdurrett@cs.utexas.edu",
        "research_topics": ["LLM Reasoning"]
      }
    }
  }
  ```

### 4.2 `POST /api/autopilot/draft-grounded`
- **Description**: Synthesizes a factual, citation-grounded cold outreach email referencing specific faculty papers and student background using Gemini AI.
- **Auth Required**: Yes.
- **Request Body**:
  ```json
  {
    "professor": { ... },
    "targetDegree": "PhD",
    "userProfile": { "field": "AI", "keywords": ["NLP"] },
    "tone": "academic"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "subject": "Prospective PhD Student (Fall 2027) — Grounded LLM Reasoning",
      "bodyText": "Dear Professor Durrett,\n\nI have closely followed your lab's recent work...",
      "groundingProof": {
        "referencedPaper": "Grounding Generation Steps in Knowledge Graphs"
      }
    }
  }
  ```

---

## 5. Outreach & Email APIs

### 5.1 `POST /api/outreach/create-draft`
- **Description**: Creates a draft message directly inside the user's connected Gmail Drafts folder.
- **Auth Required**: Yes.
- **Request Body**:
  ```json
  {
    "professorEmail": "faculty@university.edu",
    "professorName": "Dr. Smith",
    "subject": "Research Inquiry",
    "body": "Dear Professor Smith..."
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "draftId": "r-849204910294",
      "messageId": "msg_940291",
      "threadId": "th_492019",
      "accountEmail": "user@gmail.com",
      "message": "Draft created successfully in your connected Gmail account."
    }
  }
  ```

### 5.2 `POST /api/outreach/send-email`
- **Description**: Dispatches an email via connected Gmail or configured SMTP/Resend provider, enforcing monthly plan quota limits.
- **Auth Required**: Yes.
- **Request Body**:
  ```json
  {
    "toEmail": "faculty@university.edu",
    "subject": "Research Inquiry",
    "bodyText": "Dear Professor...",
    "professorName": "Dr. Smith",
    "universityName": "MIT"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "sentVia": "GMAIL",
      "senderEmail": "user@gmail.com",
      "messageId": "msg_94820194",
      "sentAt": "2026-09-24T01:00:00Z",
      "message": "Email dispatched successfully."
    }
  }
  ```

### 5.3 `POST /api/inbox/analyze-reply`
- **Description**: Parses inbound faculty reply text, runs NLP sentiment & meeting intent classification, and generates an actionable response draft.
- **Auth Required**: No (guest/demo supported) or Yes.
- **Request Body**:
  ```json
  {
    "professorName": "Dr. Durrett",
    "senderEmail": "gdurrett@cs.utexas.edu",
    "subject": "Re: Inquiry",
    "bodyText": "Hi, I am taking 1-2 new PhD students...",
    "userId": "usr_student_001"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "reply": {
        "id": "rep_94820194",
        "professor_name": "Dr. Durrett",
        "sender_email": "gdurrett@cs.utexas.edu",
        "sentiment": "POSITIVE",
        "summary": "Dr. Durrett confirmed 1-2 openings for Fall 2027.",
        "suggested_response": "Dear Professor Durrett,\n\nThank you for the update...",
        "status": "UNREAD"
      }
    }
  }
  ```

---

## 6. Billing & Payment APIs

### 6.1 `GET /api/pricing`
- **Description**: Retrieves dynamic plan tiers, pricing, and quota limits.
- **Auth Required**: No.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "plans": [
        {
          "tier": "FREE",
          "name": "Academic Explorer",
          "price": 0,
          "quota": 10
        },
        {
          "tier": "PRO",
          "name": "Graduate Scholar Pro",
          "price": 49,
          "quota": 100
        }
      ]
    }
  }
  ```

### 6.2 `GET /api/payments/methods`
- **Description**: Lists active admin-configured payment gateways and instructions.
- **Auth Required**: No.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "methods": [ ... ]
    }
  }
  ```

### 6.3 `POST /api/checkout/submit`
- **Description**: Submits a manual or automated payment receipt for manual admin review.
- **Auth Required**: Yes.
- **Request Body**:
  ```json
  {
    "planTier": "PRO",
    "billingCycle": "monthly",
    "amount": 49,
    "paymentMethod": "card",
    "proofOfPayment": "Receipt description or screenshot URL",
    "transactionReference": "TXN_49201942"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "orderId": "ord_948201",
      "paymentId": "pay_492019",
      "status": "pending_verification",
      "message": "Payment receipt submitted successfully for verification."
    }
  }
  ```

---

## 7. Admin Control APIs

All endpoints under `/api/admin/*` require role `ADMIN` or `SUPER_ADMIN` in the session. Forged headers (`x-admin-role`) or cookies (`profmatch_role=ADMIN`) are strictly rejected with HTTP 401.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/users` | Paginated user management query with role and tier filtering. |
| `PUT` | `/api/admin/users` | Update user role, suspension status, or academic plan tier. |
| `GET` | `/api/admin/payments` | Paginated payments list. |
| `PUT` | `/api/admin/payments` | Approve or reject submitted user payments. |
| `GET` | `/api/admin/payment-methods` | List configured payment channels. |
| `POST` | `/api/admin/payment-methods` | Create a new payment gateway method. |
| `PUT` | `/api/admin/payment-methods` | Update or toggle payment gateway status. |
| `GET` | `/api/admin/settings` | Read global system configuration. |
| `PUT` | `/api/admin/settings` | Update system configuration parameters. |
| `GET` | `/api/admin/feature-flags` | List system feature flags. |
| `PUT` | `/api/admin/feature-flags` | Toggle feature flags. |
| `GET` | `/api/admin/content` | List dynamic CMS content entries. |
| `PUT` | `/api/admin/content` | Update dynamic CMS content strings. |
| `GET` | `/api/admin/audit-logs` | Retrieve immutable security audit events. |

---

## 8. System Health API

### `GET /api/health`
- **Description**: Service health check reporting database and AI provider status.
- **Auth Required**: No.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy",
      "timestamp": "2026-09-24T01:00:00.000Z",
      "version": "1.0.0"
    }
  }
  ```
