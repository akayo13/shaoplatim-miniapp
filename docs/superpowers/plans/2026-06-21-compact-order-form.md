# Compact Order Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the full service picker after a service is selected while preserving direct access to change it.

**Architecture:** Keep selection state in the existing hidden `serviceInput`. Toggle one `is-collapsed` class on the existing picker and add one native button to reopen it. No new dependency or view.

**Tech Stack:** HTML, CSS, browser JavaScript, Node.js standard-library check.

---

### Task 1: Add a failing source check

**Files:**
- Modify: `scripts/check-trust-content.js`

- [ ] Assert that `public/index.html` contains `id="changeServiceButton"` and that `public/app.js` contains `setServicePickerCollapsed`.
- [ ] Run `node scripts/check-trust-content.js` and verify it fails before implementation.

### Task 2: Implement picker collapse behavior

**Files:**
- Modify: `public/index.html`
- Modify: `public/app.js`
- Modify: `public/styles.css`

- [ ] Add an `Изменить` button to the selected-service card.
- [ ] Add `setServicePickerCollapsed(collapsed)` to toggle `is-collapsed` on `.order-service-picker` and hide the change button when no service is selected.
- [ ] Collapse after selecting a standard or custom service.
- [ ] Expand when opening the order view without a selected service, clicking `Изменить`, or resetting a completed order.
- [ ] Hide only `.order-service-list` and `.field-title` while collapsed; keep the selected card visible.

### Task 3: Verify and release

**Files:**
- Modify: `scripts/check-trust-content.js`

- [ ] Run `npm run check` and `git diff --check`.
- [ ] Reload `http://localhost:4174`, test entry from catalog and direct order-tab entry.
- [ ] Commit as `Compact order service picker`, push `main`, and verify Vercel Production succeeds.
