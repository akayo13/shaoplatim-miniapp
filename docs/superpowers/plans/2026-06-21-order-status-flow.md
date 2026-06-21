# Order Status Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Notify customers about meaningful order changes and make admin status handling one click.

**Architecture:** Keep the existing API and UI structure. Add one Telegram customer-notification helper, call it after successful status changes in both production mutation paths, and wire the existing client/admin screens to refresh and save with minimal requests.

**Tech Stack:** Node.js CommonJS, Vercel Functions, Neon Postgres, Telegram Bot API, vanilla JavaScript/CSS.

---

### Task 1: Add the status-flow check

**Files:**
- Create: `scripts/check-status-flow.js`
- Modify: `package.json`

- [ ] **Step 1: Write the failing check**

Create a Node script that reads the relevant source files and asserts: four customer message definitions, shared notification calls in both API handlers, history refresh wiring, `window.confirm` for decline, and status-only quick PATCH behavior.

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/check-status-flow.js`
Expected: FAIL because the notification helper and UI wiring do not exist.

- [ ] **Step 3: Add the check to `npm run check`**

Append `&& node scripts/check-status-flow.js` to the existing check script.

### Task 2: Add customer notifications

**Files:**
- Modify: `api/_lib/telegram.js`
- Modify: `api/orders/[id].js`
- Modify: `api/telegram-webhook.js`

- [ ] **Step 1: Add the shared helper**

Define message copy keyed by `waiting_payment`, `processing`, `done`, and `declined`. Export `notifyCustomer(order)` which returns without sending for other statuses, sends only the order ID/service/status/next step, and adds a URL button when `MINI_APP_LINK` is valid.

- [ ] **Step 2: Wire the admin API**

Load the existing order with `getOrder(id)`, update it, and when `payload.status !== existing.status`, call `notifyCustomer(order).catch(error => console.error(...))` after persistence.

- [ ] **Step 3: Wire the Telegram webhook**

Load the existing order before `updateOrder`; after updating and editing the admin message, call the same helper only when the status changed. Notification failure must not change the successful webhook response.

- [ ] **Step 4: Run the focused check**

Run: `node scripts/check-status-flow.js`
Expected: still FAIL only on the unimplemented browser/admin assertions.

### Task 3: Add customer refresh and quick admin actions

**Files:**
- Modify: `public/index.html`
- Modify: `public/app.js`
- Modify: `public/styles.css`
- Modify: `public/admin.js`

- [ ] **Step 1: Add History refresh**

Add a compact `#refreshOrdersButton` beside the history count. In `showView`, call `loadOrders()` when `viewName === "history"`; wire the button to the same function and disable it while loading.

- [ ] **Step 2: Make status buttons save immediately**

Replace the duplicate select with a comment-save button. Implement a status-only helper whose JSON body is `{ status }`, disables status buttons during the request, confirms `declined`, reloads on success, and restores buttons on failure.

- [ ] **Step 3: Keep comment save separate**

The existing save action sends only `{ managerComment }`. Quick status requests must never read or send the textarea value.

- [ ] **Step 4: Run all checks**

Run: `npm run check && git diff --check`
Expected: all syntax, trust, security, and status-flow checks pass with no whitespace errors.

- [ ] **Step 5: Commit and deploy**

Run:

```bash
git add package.json scripts/check-status-flow.js api/_lib/telegram.js api/orders/[id].js api/telegram-webhook.js public/index.html public/app.js public/styles.css public/admin.js docs/superpowers/plans/2026-06-21-order-status-flow.md
git commit -m "Improve order status flow"
git push origin main
```

Verify the Vercel deployment references the new commit and reaches `success`.
