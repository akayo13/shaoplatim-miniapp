# Trust Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add calm launch information, service rules, privacy information, and explicit order consent without introducing security fears on the main screen.

**Architecture:** Keep the app dependency-free. Add static semantic HTML to the existing views, use native `details` elements for expandable information, and add one small navigation helper in `public/app.js`. Verify the critical copy and required consent with a Node standard-library check.

**Tech Stack:** HTML, CSS, browser JavaScript, Node.js standard library.

---

### Task 1: Add a runnable trust-content check

**Files:**
- Create: `scripts/check-trust-content.js`
- Modify: `package.json`

- [ ] **Step 1: Write the failing check**

Create `scripts/check-trust-content.js` using `node:assert` and `node:fs`. Read `public/index.html` and assert that it contains `Как всё происходит`, `Частые вопросы`, `Полный возврат`, `Как мы используем данные`, and `name="termsAccepted"`. Also assert that the hero does not contain the removed phrases `Без паролей` or `Достаточно ссылки или одноразового кода`.

- [ ] **Step 2: Run the check and verify it fails**

Run: `node scripts/check-trust-content.js`

Expected: non-zero exit because the new content does not exist yet.

- [ ] **Step 3: Add the check to the existing command**

Append `&& node scripts/check-trust-content.js` to the existing `check` script in `package.json`.

### Task 2: Add the trust content and required consent

**Files:**
- Modify: `public/index.html`
- Modify: `public/styles.css`

- [ ] **Step 1: Add the four-step explanation**

After the service catalog, add a `process-card` section with four concise items:

1. Choose a service and submit a request.
2. The manager confirms the amount.
3. The customer pays after confirming the quote.
4. The result and status remain visible in the app.

- [ ] **Step 2: Add required order consent**

Before the submit button, add a required checkbox named `termsAccepted`. Its text links to the service rules and data-use sections through buttons with `data-open-info="terms"` and `data-open-info="privacy"`.

- [ ] **Step 3: Add profile information**

Below support, add native expandable `details` blocks:

- `Частые вопросы`: usual handling is around one hour but can take longer during high demand; the status is shown in the app; support is available through Telegram.
- `Условия сервиса`: the final amount is confirmed before payment; if fulfillment is impossible, the customer receives a full refund; settlement timing depends on the bank or payment system.
- `Как мы используем данные`: the app stores Telegram identity fields and order details only to process and show orders; support is the contact point for questions.

Give the terms and privacy blocks stable IDs `serviceTerms` and `privacyInfo`.

- [ ] **Step 4: Style only the new elements**

Add compact styles for `.process-card`, `.process-list`, `.info-list`, `.info-disclosure`, `.terms-consent`, and `.inline-link`. Reuse existing borders, radii, colors, and spacing variables. Preserve the existing mobile layout and avoid new animation.

- [ ] **Step 5: Run the content check**

Run: `node scripts/check-trust-content.js`

Expected: `Trust content check passed`.

### Task 3: Link consent text to the profile information

**Files:**
- Modify: `public/app.js`

- [ ] **Step 1: Add the minimal navigation helper**

Add one delegated click handler for `[data-open-info]`. It must show the profile view, open the matching native `details` element, and scroll it into view. Map `terms` to `#serviceTerms` and `privacy` to `#privacyInfo`.

- [ ] **Step 2: Verify syntax and the full project check**

Run: `npm run check`

Expected: all `node --check` commands and `Trust content check passed` exit successfully.

- [ ] **Step 3: Verify locally**

Reload `http://localhost:4174/` and check: the process card renders, FAQ/rules/privacy expand, the inline buttons open the correct profile block, and the form cannot submit without consent.

- [ ] **Step 4: Commit and push**

Stage only the trust-layer files and documentation, commit with `Add launch trust information`, then push `main` to `origin`. Verify that GitHub creates a new Vercel Production deployment for that commit.
