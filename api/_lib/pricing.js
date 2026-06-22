const crypto = require("node:crypto");

const RATE_FRESH_MS = 8 * 60 * 60 * 1000;
const RATE_USABLE_MS = 24 * 60 * 60 * 1000;

function calculateRubTotal(usdPrice, usdtRubRate) {
  if (!Number.isFinite(usdPrice) || usdPrice <= 0 || !Number.isFinite(usdtRubRate) || usdtRubRate <= 0) {
    throw new Error("Invalid pricing input");
  }

  const bufferedRate = roundMoney(usdtRubRate * 1.05);
  const subtotal = roundMoney(usdPrice * bufferedRate);
  const total = Math.ceil((subtotal * 1.30) / 10) * 10;
  return { bufferedRate, subtotal, total };
}

function getMinimumRubPrice(plans, service) {
  const prices = plans
    .filter((plan) => plan.service === service && Number.isFinite(plan.amountRub))
    .map((plan) => plan.amountRub);
  return prices.length ? Math.min(...prices) : null;
}

function isRateFresh(updatedAt, now = new Date()) {
  return ageMs(updatedAt, now) < RATE_FRESH_MS;
}

function isRateUsable(updatedAt, now = new Date()) {
  return ageMs(updatedAt, now) < RATE_USABLE_MS;
}

function isQuoteValid(expiresAt, now = new Date()) {
  const expires = new Date(expiresAt).getTime();
  return Number.isFinite(expires) && expires > now.getTime();
}

function requiresReview(currentPrice, proposedPrice) {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) return true;
  return Math.abs(proposedPrice - currentPrice) / currentPrice > 0.5;
}

function parseUsdPrice(value) {
  const match = String(value ?? "").trim().match(/^\$?\s*(\d+(?:[.,]\d{1,2})?)$/);
  if (!match) return null;
  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function ageMs(value, now) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? Math.max(0, now.getTime() - timestamp) : Infinity;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

module.exports = {
  calculateRubTotal,
  createId,
  getMinimumRubPrice,
  isQuoteValid,
  isRateFresh,
  isRateUsable,
  parseUsdPrice,
  requiresReview,
};
