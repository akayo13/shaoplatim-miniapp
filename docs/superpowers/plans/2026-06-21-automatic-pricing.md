# Automatic Pricing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add server-authoritative USD subscription pricing, automatic USDT/RUB conversion, frozen customer quotes, and admin-approved official price updates.

**Architecture:** Keep the current CommonJS Vercel Functions and vanilla frontend. Put pure money logic and source extraction in `api/_lib/pricing.js`, persistence in the existing Neon helper, and expose small catalog, quote, admin-pricing, and daily-check endpoints. Existing orders remain valid because all new order columns are nullable.

**Tech Stack:** Node.js CommonJS, Vercel Functions/Cron, Neon Postgres, Telegram Bot API, vanilla JavaScript/CSS.

---

### Task 1: Pure pricing logic and regression check

**Files:**
- Create: `api/_lib/pricing.js`
- Create: `scripts/check-pricing.js`
- Modify: `package.json`

- [ ] **Step 1: Write a failing Node assert check**

Check `calculateRubTotal(20, 90)` returns `{ bufferedRate: 94.5, subtotal: 1890, total: 2460 }`, rate ages of 8 and 24 hours, 30-minute quote expiry, percentage-jump review, and strict positive USD parsing.

- [ ] **Step 2: Run the focused check**

Run: `node scripts/check-pricing.js`
Expected: FAIL because `api/_lib/pricing.js` does not exist.

- [ ] **Step 3: Implement the pure functions**

Export `calculateRubTotal`, `isRateFresh`, `isRateUsable`, `isQuoteValid`, `requiresReview`, and `parseUsdPrice`. Keep multipliers fixed at `1.05` and `1.30`; round with `Math.ceil(total / 10) * 10`.

- [ ] **Step 4: Add the check to `npm run check` and run it**

Run: `npm run check`
Expected: all existing checks plus `Pricing check passed`.

### Task 2: Neon pricing data and immutable quotes

**Files:**
- Modify: `api/_lib/db.js`
- Modify: `api/_lib/orders.js`
- Modify: `api/orders.js`

- [ ] **Step 1: Extend the idempotent schema**

Create `plans`, `exchange_rates`, `quotes`, and `price_updates`; add nullable pricing snapshot columns and a unique `quote_id` to `orders`. Seed stable plan IDs with verified recurring US prices for readable official sources and manual-mode entries for the remaining catalog.

- [ ] **Step 2: Add focused DB operations**

Add list/get/update plan functions, current-rate functions, quote create/get/consume functions, pending-update functions, and pricing-admin summary reads. Return plain camelCase objects.

- [ ] **Step 3: Make order creation quote-authoritative**

For a known plan, require a valid quote owned by the authenticated Telegram user. Copy all pricing fields from the quote, use the plan's service/name, and reject browser-supplied money fields. Manual custom-service orders keep nullable pricing fields.

- [ ] **Step 4: Preserve idempotency**

If a quote was already used, return its existing order instead of inserting a duplicate.

### Task 3: Catalog, quote, and rate endpoints

**Files:**
- Create: `api/catalog.js`
- Create: `api/quotes.js`
- Modify: `api/_lib/pricing.js`
- Modify: `api/_lib/db.js`

- [ ] **Step 1: Add public catalog reads**

Return active plans grouped by service with IDs, labels, USD prices, and billing periods. Do not return parser state or pending proposals.

- [ ] **Step 2: Add authenticated quote creation**

Verify Telegram init data, load the active plan, refresh CoinGecko only when the stored rate is older than eight hours, permit a stored fallback only up to 24 hours, calculate the price, and create a customer-bound quote expiring in 30 minutes.

- [ ] **Step 3: Bound external fetches**

Use `AbortSignal.timeout(5000)`, reject non-2xx responses, reject non-positive or missing `tether.rub`, and never expose upstream response bodies to clients.

### Task 4: Customer price preview and frozen order display

**Files:**
- Modify: `public/index.html`
- Modify: `public/app.js`
- Modify: `public/styles.css`

- [ ] **Step 1: Add known-plan controls**

Load `/api/catalog`, show a plan selector for known services, retain free-text plan input for “Другой сервис”, and request a quote after plan selection.

- [ ] **Step 2: Show the authoritative total**

Display USD base price and final RUB price, change the submit label to `Оформить за … ₽`, store only the quote ID in browser state, and refresh an expired quote before submission.

- [ ] **Step 3: Display frozen totals everywhere**

Show `amount` in success, history, payment draft, and order cards. Manual orders continue showing “Расчёт перед оплатой”.

- [ ] **Step 4: Keep local development usable**

Add matching local `/api/catalog` and `/api/quotes` behavior with a clearly labeled development rate, without sending Telegram messages or requiring external API access.

### Task 5: Price checks, admin approval, and alerts

**Files:**
- Create: `api/pricing-admin.js`
- Create: `api/price-check.js`
- Modify: `api/_lib/pricing.js`
- Modify: `api/_lib/db.js`
- Modify: `api/_lib/telegram.js`
- Modify: `public/admin.html`
- Modify: `public/admin.js`
- Modify: `public/styles.css`
- Modify: `vercel.json`

- [ ] **Step 1: Add one daily protected check**

Configure `0 8 * * *`. Require `Authorization: Bearer ${CRON_SECRET}` and reject missing secrets. Fetch only the official source registry and normalize exact mapped plans.

- [ ] **Step 2: Record proposals safely**

Create a pending update for a changed valid price; mark changes over 50% for review; never change the active plan price in the cron path; suppress duplicate proposals and repeated identical alerts.

- [ ] **Step 3: Add admin pricing APIs**

Use existing admin auth for list, accept, reject, and manual edit actions. Accept affects future quotes only.

- [ ] **Step 4: Add the admin UI**

Render current tariffs, source/check state, pending changes, and accept/reject/manual-edit controls. Reuse the current toast and admin headers.

- [ ] **Step 5: Notify the admin**

Send one concise Telegram message for new pending changes or source failures with the existing admin URL.

### Task 6: Full verification and deployment

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Document required configuration**

Add `COINGECKO_API_KEY` as optional demo-key support and `CRON_SECRET` as required for daily checks. Do not store real values.

- [ ] **Step 2: Run verification**

Run: `npm run check && git diff --check`
Expected: all checks pass and no whitespace errors.

- [ ] **Step 3: Commit and push to the approved main workflow**

Commit the implementation, push `main`, verify the newest GitHub deployment references the commit, and wait for Vercel `success`.
