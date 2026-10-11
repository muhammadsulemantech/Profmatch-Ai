---
trigger: manual
---

# Universal System-Wide Scope Rule

## Invariant: All Fixes Must Apply to All Users
Every feature, bug fix, plan entitlement, subscription lifecycle rule, and quota check implemented in this codebase must be **universal and apply to all users**:
1. **Never specialize or hardcode logic for a single user ID or email.**
2. When a user is upgraded, downgraded, or registered, the behavior must work identically for **all current registered users, newly created users, and future users**.
3. All paid subscriptions grant exactly 30 days from the exact grant timestamp (`Date.now() + 30 * 86400000`).
4. Entitlements (search quotas, country unlocks, AutoPilot caps) must immediately apply across all pages (`/search`, `/autopilot`, `/billing`, `/dashboard`) for any user holding that plan.
5. Automated tests must always verify arbitrary and newly-generated random user IDs to ensure zero user-specific hardcoding.
