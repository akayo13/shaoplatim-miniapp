const assert = require("node:assert/strict");
const {
  calculateRubTotal,
  getMinimumRubPrice,
  isQuoteValid,
  isRateFresh,
  isRateUsable,
  parseUsdPrice,
  requiresReview,
} = require("../api/_lib/pricing");

const calculated = calculateRubTotal(20, 90);
assert.deepEqual(calculated, { bufferedRate: 94.5, subtotal: 1890, total: 2460 });
assert.equal(getMinimumRubPrice([
  { service: "ChatGPT", amountRub: 2460 },
  { service: "ChatGPT", amountRub: 24580 },
], "ChatGPT"), 2460);
assert.equal(getMinimumRubPrice([], "ChatGPT"), null);

const now = new Date("2026-06-21T12:00:00Z");
assert.equal(isRateFresh("2026-06-21T05:00:01Z", now), true);
assert.equal(isRateFresh("2026-06-21T04:00:00Z", now), false);
assert.equal(isRateUsable("2026-06-20T12:00:01Z", now), true);
assert.equal(isRateUsable("2026-06-20T12:00:00Z", now), false);
assert.equal(isQuoteValid("2026-06-21T12:00:01Z", now), true);
assert.equal(isQuoteValid("2026-06-21T12:00:00Z", now), false);
assert.equal(requiresReview(20, 31), true);
assert.equal(requiresReview(20, 30), false);
assert.equal(parseUsdPrice("$12.99"), 12.99);
assert.equal(parseUsdPrice("0"), null);
assert.equal(parseUsdPrice("free"), null);

console.log("Pricing check passed");
