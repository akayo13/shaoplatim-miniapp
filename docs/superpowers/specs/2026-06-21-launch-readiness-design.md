# Launch readiness and trust design

## Goal

Prepare the Telegram Mini App for a short friends-and-family test followed by a real-customer launch after payment integration. Keep the current order flow and admin panel intact.

## Trust layer

- Add a compact "How it works" section: request, quote, payment, fulfillment.
- Add a calm FAQ covering timing, payment, refunds, order status, and support without introducing account-security fears on the main screen.
- Add service terms and a privacy policy linked from the profile.
- Require acceptance of the service terms before an order is submitted.
- Keep support available in one tap.
- State that failed fulfillment receives a full refund; settlement timing depends on the bank or payment system.
- Describe fulfillment timing as usually within one hour, with possible delays during high demand. Do not promise a hard SLA.

## Launch security

- Verify Telegram Web App init data on customer API requests.
- Derive customer identity on the server; never trust customer IDs or usernames supplied by query parameters or request bodies.
- Do not report a successful order when the production API failed. Show a retryable error instead of silently storing a local-only order.
- Limit request sizes and field lengths.
- Return generic client errors while retaining useful server-side logs without secrets or personal data.
- Add appropriate security headers.
- Configure order-creation rate limiting using Vercel's platform controls rather than a custom in-process limiter.
- Document and verify required production environment variables before deployment.

## Analytics and operations

- Track only the essential funnel events: app opened, order started, order submitted, payment opened, and support opened.
- Keep the existing health endpoint for uptime checks.
- Add small runnable checks for Telegram verification, payload validation, and customer-order isolation.
- Use Vercel logs for operational errors; never log credentials, Telegram init data, tokens, or payment details.

## Release workflow

1. Implement and review the trust layer.
2. Implement API identity verification and failure handling.
3. Add basic analytics, headers, checks, and deployment documentation.
4. Run the complete friends-and-family scenario: create an order, view it in admin, change statuses, verify customer history, and exercise failure/refund handling.
5. For each completed stage: run checks, commit, and push to `origin/main`.

## Secret handling

- Keep runtime secrets only in local `.env` files and Vercel environment variables.
- Never commit secret values.
- Rotate the currently shared bot token, database password, admin key, and admin password before the real-customer launch.
- Correct the Mini App link before deployment by removing the accidental trailing Cyrillic character.

## Out of scope

- Payment-provider integration.
- Admin-panel redesign.
- Major changes to the customer order flow.
- Heavy monitoring, custom infrastructure, or a full analytics stack.
