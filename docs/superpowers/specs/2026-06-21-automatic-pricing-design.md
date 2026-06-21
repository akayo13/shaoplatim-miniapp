# Automatic Pricing Design

## Goal

Show a customer a final RUB price before an order is submitted, freeze that price for the order, update the USDT/RUB rate automatically, and manage official US subscription-price changes without Codex or code changes.

## Pricing rules

- Product region is the United States and product currency is USD.
- The USDT/RUB market rate comes from CoinGecko's `simple/price` endpoint with `ids=tether` and `vs_currencies=rub`.
- The rate is refreshed on the first quote request after eight hours. This produces up to three useful refresh windows per day without a sub-daily Vercel Cron, which is unavailable on Hobby.
- If CoinGecko fails, the last successful rate may be used for up to 24 hours. Older rates cannot produce a new quote.
- The P2P/conversion buffer is 5% and the service commission is 30% of the buffered product cost.
- The exact calculation is:

  `subtotal = usdPrice * usdtRubRate * 1.05`

  `total = subtotal * 1.30`

- The total is rounded upward to the nearest 10 RUB.
- All arithmetic and validation happen on the server. The browser never supplies an authoritative product price, exchange rate, multiplier, or RUB total.

## Customer flow

- The catalog and order form load active plans from the server.
- Selecting a known plan requests a server quote and displays the final RUB total before submission.
- The primary action includes the amount, for example, “Оформить за 2 460 ₽”.
- A quote is valid for 30 minutes. If it expires before submission, the client requests a new quote and displays the new amount before the user can continue.
- Submitting an order sends only the quote ID plus the existing order details. The server verifies ownership, validity, plan identity, and expiry, then copies the full quote snapshot into the order.
- “Другой сервис” remains a manual-calculation order and does not display an automatic price.
- History, order success, payment draft, admin cards, and Telegram messages display the frozen order amount when present.

## Frozen order snapshot

Each automatically priced order stores:

- plan ID and plan name;
- product USD price;
- raw USDT/RUB rate;
- 5% buffered rate;
- 30% commission rate;
- final RUB amount;
- quote creation time.

Later rate or product-price changes never modify existing orders.

## Product catalog

Store services and plans in Neon instead of treating the browser's static service array as the price source. Each plan has a stable ID, service name, plan name, USD price, billing period, official source URL, source mode, active flag, and last-check metadata.

The first catalog covers the 12 existing services:

- ChatGPT
- Spotify
- Netflix
- Apple/iCloud+
- Google One
- Canva
- YouTube Premium
- Adobe Creative Cloud
- Notion
- Midjourney
- PlayStation Plus
- Steam Wallet

Steam Wallet is modeled as fixed USD denominations, not as a subscription. Promotions, trials, student prices, annual commitments billed monthly, taxes, and introductory discounts are excluded unless a plan explicitly represents them. The normal recurring US price is authoritative.

## Official source strategy

There is no universal pricing API. Each source has its own extractor and an explicit expected plan mapping.

Sources that currently expose usable official pricing content include:

- ChatGPT: `https://openai.com/chatgpt/pricing`
- Spotify US: `https://www.spotify.com/us/premium/`
- Apple iCloud+: `https://support.apple.com/en-us/108047`
- Google One: `https://one.google.com/about/plans`
- Adobe Creative Cloud: `https://www.adobe.com/creativecloud/plans.html`
- Notion: `https://www.notion.com/pricing`
- Midjourney: `https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans`

Sources whose public pages may hide the numeric price behind account state, region selection, or client-side rendering use monitored/manual mode:

- Netflix
- Canva
- YouTube Premium
- PlayStation Plus
- Steam Wallet denominations

For monitored/manual sources, the daily check records whether the official page changed and requests a human review; it never invents a numeric price. The admin can enter the verified official USD value and source URL without changing code.

## Daily price checks

- One protected Vercel Cron runs daily at 08:00 UTC, which is compatible with Vercel Hobby.
- The endpoint requires `CRON_SECRET` authorization.
- Each automatic extractor returns a normalized map of stable plan IDs to USD prices.
- A detected difference creates or replaces one pending update for that plan. It does not change the active price.
- A parser failure, missing plan, unexpected currency, non-positive value, or implausible jump leaves the active price unchanged and creates a review alert.
- Price changes larger than 50% are always review alerts even when parsing succeeds.
- Repeated checks do not duplicate an unchanged pending update or repeatedly notify about the same failure state.

## Admin experience

Add a pricing area to the existing protected admin panel:

- “Тарифы” lists service, plan, active USD price, official source, source mode, and last successful check.
- “Изменения цен” lists old and proposed prices with “Принять” and “Отклонить”.
- Accepting updates the active price for future quotes only.
- Rejecting clears the pending proposal and keeps the active price.
- Manual edit is available for monitored/manual sources and as an operational fallback. It requires a positive USD amount and preserves the source URL.
- Failed checks and newly pending prices send one message to `ADMIN_CHAT_ID` with a link to the admin pricing area.

## Data model

Add the following Neon tables through the existing idempotent schema setup:

- `plans`: active catalog and official-source metadata.
- `exchange_rates`: latest successful USDT/RUB rate and source timestamp.
- `quotes`: customer-bound, 30-minute immutable price snapshots.
- `price_updates`: pending proposals and review alerts.

Extend `orders` with nullable pricing snapshot columns so existing and manual-calculation orders remain valid.

## API boundaries

- Public catalog reads return active plans but never internal parser state.
- Quote creation requires verified Telegram init data and a valid active plan ID.
- Order creation requires the same Telegram user as the quote owner.
- Admin pricing reads and mutations use the existing admin authentication.
- The cron endpoint accepts only the configured Vercel cron secret.
- CoinGecko and official-page fetches have short timeouts, response-size limits, status checks, and strict numeric validation.

## Failure behavior

- No fresh USDT rate within 24 hours: disable automatic quotes and show “Расчёт временно недоступен”; manual orders remain available.
- Official price check fails: keep the active price and alert the admin.
- Quote expires: refresh it before allowing submission.
- Pending price is accepted while a customer has a valid quote: the customer's existing quote remains valid until its original expiry.
- Order submission retries with the same quote must not create duplicate orders.

## Verification

One small runnable pricing check covers:

- the exact 5%-then-30% formula and upward 10-RUB rounding;
- stale-rate rejection and 24-hour fallback;
- 30-minute quote expiry and customer ownership;
- frozen order snapshots;
- price-change proposals never changing active prices before approval;
- duplicate update suppression and 50% jump review;
- admin and cron authentication wiring;
- client price display and manual-order fallback.

The existing `npm run check` remains the full verification command.

## Out of scope

- Payment-provider integration and payment confirmation.
- Taxes, promotional trials, student verification, family eligibility, and non-US regions.
- Automatic purchasing through Bybit or access to the user's Bybit account.
- Guaranteed numeric extraction from official pages that do not expose a public price.
