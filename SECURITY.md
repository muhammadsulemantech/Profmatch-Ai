# ProfMatch AI — Security Policy & Architecture

## 1. Security Overview

ProfMatch AI adheres to a strict zero-trust security architecture. The application handles student identity, academic records, and Google OAuth credentials for academic email drafting. Every attack vector identified in security audits has been systematically eliminated and verified through automated test suites.

---

## 2. Threat Model & Mitigations

| Threat | Impact | Implemented Mitigation |
|---|---|---|
| **Credential & Role Forgery** | Unauthorized access to administrative settings or user accounts. | Session tokens are cryptographically signed and verified on every server request. Client-supplied headers (`x-admin-role`) and unauthenticated cookies (`profmatch_role=ADMIN`) are strictly rejected with HTTP 401. |
| **Plaintext Password / OTP Exposure** | Leakage of user passwords or OTP codes in logs or database. | Passwords are salted and hashed using scrypt KDF (`crypto.scryptSync`). OTP codes expire in 15 minutes, are compared using timing-safe comparisons, and are burned immediately upon verification. Raw passwords and OTPs are automatically redacted from logs. |
| **OAuth Token Theft** | Unauthorized access to user Gmail accounts. | Google OAuth access and refresh tokens are encrypted at rest using **AES-256-GCM** with unique initialization vectors (IVs) and authentication tags before being written to PostgreSQL. |
| **Cross-Tenant Data Leakage** | Users accessing other students' records or drafts. | PostgreSQL Row Level Security (RLS) is enabled on all tables. Queries enforce `auth.uid() = user_id`. |
| **Search Path Hijacking** | Privilege escalation in database functions. | All `SECURITY DEFINER` functions in `database/schema.sql` explicitly specify `SET search_path = ''` to prevent search path injection attacks. |
| **Automated Mass Spamming** | Abuse of academic faculty mailboxes. | The AutoPilot engine enforces a 45–90s anti-spam delay between actions and saves outreach as **drafts in Gmail for user review**, rather than dispatching unsupervised cold emails. |
| **Open Redirect Attacks** | Phishing via unvalidated redirect URLs. | OAuth callback endpoints validate redirect URLs against strict domain allowlists and reject open redirect targets. |

---

## 3. Authentication & Session Architecture

### 3.1 Signup & OTP Verification Flow
1. User submits email, full name, and password.
2. Server validates input using Zod, salts and hashes the password with scrypt, generates a cryptographically random 6-digit OTP code, and stores it with a 15-minute expiration timestamp.
3. Server dispatches the OTP code to the student's email.
4. User submits the OTP. The server performs a constant-time comparison (`crypto.timingSafeEqual`) to prevent timing attacks.
5. On success, the pending OTP is burned to prevent replay attacks, the account is created/confirmed in Supabase Auth (`email_confirm: true`), and an initial `FREE` plan subscription is provisioned.

### 3.2 Session Validation
- Sessions are maintained via secure, HTTP-only, `SameSite=Lax` cookies.
- Server route handlers verify sessions strictly using `verifyAuthSession(request)` or `assertAdmin(request)`.
- If a session token is missing, expired, or invalid, route handlers return HTTP 401.

---

## 4. Encryption & Secret Management

### 4.1 Token Encryption at Rest
Google OAuth tokens stored in `connected_email_accounts` are encrypted using AES-256-GCM:
- Cipher: `aes-256-gcm`
- Key: Derived from `SESSION_SECRET` / encryption key
- Format: `iv:authTag:encryptedPayload` (all in hex format)
- Decryption validates the GCM authentication tag to ensure tokens have not been tampered with in storage.

### 4.2 Logging Redaction
The structured logger (`lib/logger.ts`) inspects every log entry and recursively sanitizes sensitive keys:
- `password`, `passwd`
- `otp`, `code`
- `authorization`, `token`, `bearer`
- `access_token`, `refresh_token`
- `secret`, `api_key`, `service_role_key`

---

## 5. Security Headers & Network Protection

Both `next.config.mjs` and `middleware.ts` apply uniform HTTP security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https:; frame-ancestors 'none';
```

---

## 6. Automated Security Verification

The platform maintains automated test suites verifying security invariants:

```bash
# Execute security regression & unit test suite
npm test
```

Test suites verify:
- Rejection of forged admin cookies and headers (`tests/admin-authorization.test.mjs`)
- Constant-time OTP verification and scrypt hashing (`tests/otp-security.test.mjs`)
- Unauthenticated access rejection across all endpoints (`tests/billing-quota-security.test.mjs`)
- Encryption and decryption of OAuth tokens (`tests/db-service.test.mjs`)
- Truthful faculty verification and absence of fabricated verified flags (`tests/verified-pipeline.test.mjs`)
- RLS policy and `SECURITY DEFINER` function integrity (`tests/schema-reconciliation.test.mjs`)
