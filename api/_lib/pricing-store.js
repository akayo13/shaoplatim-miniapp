const { calculateRubTotal, createId, isRateFresh, isRateUsable } = require("./pricing");
const { ensureSchema, getSql } = require("./db");

const seedPlans = [
  ["chatgpt-plus", "ChatGPT", "Plus — 1 месяц", 20, "https://openai.com/chatgpt/pricing", "auto"],
  ["chatgpt-pro", "ChatGPT", "Pro — 1 месяц", 200, "https://openai.com/chatgpt/pricing", "auto"],
  ["spotify-individual", "Spotify", "Premium Individual — 1 месяц", 12.99, "https://www.spotify.com/us/premium/", "auto"],
  ["google-one-basic", "Google", "Google One Basic 100 GB — 1 месяц", 1.99, "https://one.google.com/about/plans", "auto"],
  ["google-one-premium", "Google", "Google One Premium 2 TB — 1 месяц", 9.99, "https://one.google.com/about/plans", "auto"],
  ["midjourney-basic", "Midjourney", "Basic — 1 месяц", 10, "https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans", "auto"],
  ["midjourney-standard", "Midjourney", "Standard — 1 месяц", 30, "https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans", "auto"],
  ["midjourney-pro", "Midjourney", "Pro — 1 месяц", 60, "https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans", "auto"],
];

async function ensurePricingSchema() {
  await ensureSchema();
  await getSql()`CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY, service TEXT NOT NULL, name TEXT NOT NULL, usd_price NUMERIC NOT NULL,
    billing_period TEXT NOT NULL DEFAULT 'month', source_url TEXT NOT NULL, source_mode TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE, last_checked_at TIMESTAMPTZ, last_check_status TEXT NOT NULL DEFAULT 'seeded',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await getSql()`CREATE TABLE IF NOT EXISTS exchange_rates (
    id TEXT PRIMARY KEY, rate NUMERIC NOT NULL, source_updated_at TIMESTAMPTZ, fetched_at TIMESTAMPTZ NOT NULL
  )`;
  await getSql()`CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, plan_id TEXT NOT NULL, service TEXT NOT NULL,
    plan_name TEXT NOT NULL, usd_price NUMERIC NOT NULL, usdt_rub_rate NUMERIC NOT NULL,
    buffered_rate NUMERIC NOT NULL, subtotal_rub NUMERIC NOT NULL, total_rub INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL, expires_at TIMESTAMPTZ NOT NULL, used_order_id TEXT
  )`;
  await getSql()`CREATE TABLE IF NOT EXISTS price_updates (
    id TEXT PRIMARY KEY, plan_id TEXT NOT NULL, old_price NUMERIC, proposed_price NUMERIC,
    kind TEXT NOT NULL DEFAULT 'change', status TEXT NOT NULL DEFAULT 'pending', message TEXT NOT NULL DEFAULT '',
    source_url TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), resolved_at TIMESTAMPTZ
  )`;

  for (const plan of seedPlans) {
    await getSql()`INSERT INTO plans (id, service, name, usd_price, source_url, source_mode)
      VALUES (${plan[0]}, ${plan[1]}, ${plan[2]}, ${plan[3]}, ${plan[4]}, ${plan[5]})
      ON CONFLICT (id) DO NOTHING`;
  }
}

function mapPlan(row) {
  return { id: row.id, service: row.service, name: row.name, usdPrice: Number(row.usd_price), billingPeriod: row.billing_period, sourceUrl: row.source_url, sourceMode: row.source_mode, active: row.active, lastCheckedAt: row.last_checked_at, lastCheckStatus: row.last_check_status };
}

async function listPlans({ all = false } = {}) {
  await ensurePricingSchema();
  const rows = all
    ? await getSql()`SELECT * FROM plans ORDER BY service, usd_price`
    : await getSql()`SELECT * FROM plans WHERE active = TRUE ORDER BY service, usd_price`;
  return rows.map(mapPlan);
}

async function getCurrentRate() {
  await ensurePricingSchema();
  let rows = await getSql()`SELECT * FROM exchange_rates WHERE id = 'usdt_rub' LIMIT 1`;
  let current = rows[0];
  if (!current || !isRateFresh(current.fetched_at)) {
    try {
      const headers = process.env.COINGECKO_API_KEY ? { "x-cg-demo-api-key": process.env.COINGECKO_API_KEY } : {};
      const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=rub&include_last_updated_at=true", { headers });
      if (!response.ok) throw new Error(`CoinGecko ${response.status}`);
      const data = await response.json();
      const rate = Number(data.tether?.rub);
      if (!Number.isFinite(rate) || rate <= 0) throw new Error("CoinGecko rate missing");
      const sourceUpdatedAt = data.tether?.last_updated_at ? new Date(data.tether.last_updated_at * 1000) : new Date();
      rows = await getSql()`INSERT INTO exchange_rates (id, rate, source_updated_at, fetched_at)
        VALUES ('usdt_rub', ${rate}, ${sourceUpdatedAt.toISOString()}, NOW())
        ON CONFLICT (id) DO UPDATE SET rate = EXCLUDED.rate, source_updated_at = EXCLUDED.source_updated_at, fetched_at = NOW()
        RETURNING *`;
      current = rows[0];
    } catch (error) {
      if (!current || !isRateUsable(current.fetched_at)) throw Object.assign(new Error("Актуальный курс временно недоступен"), { statusCode: 503 });
      console.error("Rate refresh failed", error.message);
    }
  }
  return { rate: Number(current.rate), fetchedAt: current.fetched_at };
}

async function createQuote(customerId, planId) {
  await ensurePricingSchema();
  const plans = await getSql()`SELECT * FROM plans WHERE id = ${planId} AND active = TRUE LIMIT 1`;
  if (!plans[0]) throw Object.assign(new Error("Тариф не найден"), { statusCode: 404 });
  const rate = await getCurrentRate();
  const totals = calculateRubTotal(Number(plans[0].usd_price), rate.rate);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
  const rows = await getSql()`INSERT INTO quotes (id, customer_id, plan_id, service, plan_name, usd_price, usdt_rub_rate, buffered_rate, subtotal_rub, total_rub, created_at, expires_at)
    VALUES (${createId("quote")}, ${String(customerId)}, ${planId}, ${plans[0].service}, ${plans[0].name}, ${Number(plans[0].usd_price)}, ${rate.rate}, ${totals.bufferedRate}, ${totals.subtotal}, ${totals.total}, ${now.toISOString()}, ${expiresAt.toISOString()}) RETURNING *`;
  return mapQuote(rows[0]);
}

function mapQuote(row) {
  return { id: row.id, service: row.service, planId: row.plan_id, plan: row.plan_name, usdPrice: Number(row.usd_price), usdtRubRate: Number(row.usdt_rub_rate), bufferedRate: Number(row.buffered_rate), subtotalRub: Number(row.subtotal_rub), amountRub: Number(row.total_rub), createdAt: row.created_at, expiresAt: row.expires_at, usedOrderId: row.used_order_id };
}

async function getQuoteForOrder(quoteId, customerId) {
  await ensurePricingSchema();
  const rows = await getSql()`SELECT * FROM quotes WHERE id = ${quoteId} AND customer_id = ${String(customerId)} LIMIT 1`;
  if (!rows[0]) throw Object.assign(new Error("Расчёт не найден"), { statusCode: 404 });
  if (rows[0].used_order_id) return { quote: mapQuote(rows[0]), usedOrderId: rows[0].used_order_id };
  if (new Date(rows[0].expires_at).getTime() <= Date.now()) throw Object.assign(new Error("Расчёт истёк — обновите цену"), { statusCode: 409 });
  return { quote: mapQuote(rows[0]), usedOrderId: null };
}

async function markQuoteUsed(quoteId, orderId) {
  await getSql()`UPDATE quotes SET used_order_id = ${orderId} WHERE id = ${quoteId} AND used_order_id IS NULL`;
}

async function listPriceUpdates() {
  await ensurePricingSchema();
  const rows = await getSql()`SELECT u.*, p.service, p.name AS plan_name FROM price_updates u LEFT JOIN plans p ON p.id = u.plan_id ORDER BY u.created_at DESC LIMIT 100`;
  return rows.map((row) => ({ id: row.id, planId: row.plan_id, service: row.service, plan: row.plan_name, oldPrice: row.old_price == null ? null : Number(row.old_price), proposedPrice: row.proposed_price == null ? null : Number(row.proposed_price), kind: row.kind, status: row.status, message: row.message, sourceUrl: row.source_url, createdAt: row.created_at, resolvedAt: row.resolved_at }));
}

async function proposePriceUpdate(plan, proposedPrice, kind = "change", message = "") {
  await ensurePricingSchema();
  const duplicate = await getSql()`SELECT id FROM price_updates WHERE plan_id = ${plan.id} AND status = 'pending' AND kind = ${kind} AND proposed_price IS NOT DISTINCT FROM ${proposedPrice} LIMIT 1`;
  if (duplicate[0]) return null;
  const rows = await getSql()`INSERT INTO price_updates (id, plan_id, old_price, proposed_price, kind, message, source_url)
    VALUES (${createId("update")}, ${plan.id}, ${plan.usdPrice}, ${proposedPrice}, ${kind}, ${message}, ${plan.sourceUrl}) RETURNING id`;
  return rows[0]?.id || null;
}

async function resolvePriceUpdate(updateId, action) {
  await ensurePricingSchema();
  const rows = await getSql()`SELECT * FROM price_updates WHERE id = ${updateId} AND status = 'pending' LIMIT 1`;
  const update = rows[0];
  if (!update) throw Object.assign(new Error("Изменение не найдено"), { statusCode: 404 });
  if (action === "accept") {
    if (update.proposed_price == null) throw Object.assign(new Error("Для ошибки проверки нет новой цены"), { statusCode: 400 });
    await getSql()`UPDATE plans SET usd_price = ${Number(update.proposed_price)}, updated_at = NOW(), last_check_status = 'approved' WHERE id = ${update.plan_id}`;
  } else if (action !== "reject") {
    throw Object.assign(new Error("Неизвестное действие"), { statusCode: 400 });
  }
  await getSql()`UPDATE price_updates SET status = ${action === "accept" ? "accepted" : "rejected"}, resolved_at = NOW() WHERE id = ${updateId}`;
}

async function setPlanPrice(planId, usdPrice) {
  await ensurePricingSchema();
  if (!Number.isFinite(usdPrice) || usdPrice <= 0 || usdPrice > 10000) throw Object.assign(new Error("Некорректная цена"), { statusCode: 400 });
  const rows = await getSql()`UPDATE plans SET usd_price = ${usdPrice}, updated_at = NOW(), last_check_status = 'manual' WHERE id = ${planId} RETURNING *`;
  if (!rows[0]) throw Object.assign(new Error("Тариф не найден"), { statusCode: 404 });
  return mapPlan(rows[0]);
}

async function recordPlanCheck(planId, status) {
  await ensurePricingSchema();
  await getSql()`UPDATE plans SET last_checked_at = NOW(), last_check_status = ${status} WHERE id = ${planId}`;
}

module.exports = { createQuote, ensurePricingSchema, getCurrentRate, getQuoteForOrder, listPlans, listPriceUpdates, markQuoteUsed, proposePriceUpdate, recordPlanCheck, resolvePriceUpdate, setPlanPrice };
