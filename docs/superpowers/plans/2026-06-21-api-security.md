# API Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent customer impersonation and lost production orders before launch.

**Architecture:** Verify Telegram init data in the serverless API, derive customer identity server-side, and make production failures visible to the customer. Keep local Node development working without Telegram because it uses `server.js`, not the Vercel handlers.

**Tech Stack:** Node.js, Vercel Functions, Telegram Web App init data, browser JavaScript.

---

### Task 1: Verify customer identity

**Files:**
- Modify: `api/_lib/auth.js`
- Modify: `api/_lib/orders.js`
- Modify: `api/orders.js`
- Create: `scripts/check-api-security.js`
- Modify: `package.json`

- [ ] Add `requireCustomer(req)` that verifies `X-Telegram-Init-Data`, requires a Telegram user ID, and returns the verified user.
- [ ] Move customer-order matching to `api/_lib/orders.js` and compare the verified Telegram ID only.
- [ ] In `GET /api/orders`, use verified customer identity when the Telegram header exists; otherwise require admin access.
- [ ] In `POST /api/orders`, require verified customer identity and replace any body-supplied customer object with the verified Telegram identity.
- [ ] Add a standard-library check that signs valid init data, rejects a tampered signature, validates length limits, and verifies customer isolation.

### Task 2: Make failures honest and bounded

**Files:**
- Modify: `api/_lib/http.js`
- Modify: `api/_lib/orders.js`
- Modify: `api/orders.js`
- Modify: `public/app.js`

- [ ] Limit JSON request bodies to 32 KiB and report malformed or oversized payloads as client errors.
- [ ] Limit service to 100 characters, plan to 200, access to 100, and comment to 2,000.
- [ ] Send Telegram init data in customer GET and POST requests.
- [ ] Remove production local-only success fallback. On API failure, show `Не удалось отправить заявку. Попробуйте ещё раз.` and keep the form intact.
- [ ] Return generic server errors and log only the error name.

### Task 3: Add platform safeguards and release

**Files:**
- Modify: `vercel.json`
- Modify: `DEPLOY.md`

- [ ] Add `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` response headers.
- [ ] Document required production variables, secret rotation, the corrected Mini App link, and Vercel rate limiting for `POST /api/orders`.
- [ ] Run `npm run check` and `git diff --check`.
- [ ] Commit as `Secure customer order API`, push `main`, and verify the Vercel Production deployment is created.
