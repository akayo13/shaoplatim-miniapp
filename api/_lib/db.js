const { neon } = require("@neondatabase/serverless");

let sql;

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }

  if (!sql) {
    sql = neon(process.env.DATABASE_URL);
  }

  return sql;
}

async function ensureSchema() {
  await getSql()`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      service TEXT NOT NULL,
      plan TEXT NOT NULL,
      access TEXT NOT NULL,
      comment TEXT NOT NULL DEFAULT '',
      quote TEXT NOT NULL DEFAULT 'Расчет перед оплатой',
      status TEXT NOT NULL DEFAULT 'new',
      manager_comment TEXT NOT NULL DEFAULT '',
      customer JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await getSql()`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS quote_id TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS plan_id TEXT,
      ADD COLUMN IF NOT EXISTS usd_price NUMERIC,
      ADD COLUMN IF NOT EXISTS usdt_rub_rate NUMERIC,
      ADD COLUMN IF NOT EXISTS buffered_rate NUMERIC,
      ADD COLUMN IF NOT EXISTS subtotal_rub NUMERIC,
      ADD COLUMN IF NOT EXISTS amount_rub INTEGER,
      ADD COLUMN IF NOT EXISTS priced_at TIMESTAMPTZ
  `;
}

function mapOrder(row) {
  return {
    id: row.id,
    service: row.service,
    plan: row.plan,
    access: row.access,
    comment: row.comment,
    quote: row.quote,
    status: row.status,
    managerComment: row.manager_comment,
    customer: row.customer || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    quoteId: row.quote_id || null,
    planId: row.plan_id || null,
    usdPrice: row.usd_price == null ? null : Number(row.usd_price),
    usdtRubRate: row.usdt_rub_rate == null ? null : Number(row.usdt_rub_rate),
    bufferedRate: row.buffered_rate == null ? null : Number(row.buffered_rate),
    subtotalRub: row.subtotal_rub == null ? null : Number(row.subtotal_rub),
    amountRub: row.amount_rub == null ? null : Number(row.amount_rub),
    pricedAt: row.priced_at || null,
  };
}

async function listOrders() {
  await ensureSchema();
  const rows = await getSql()`
    SELECT *
    FROM orders
    ORDER BY created_at DESC
  `;
  return rows.map(mapOrder);
}

async function createOrder(order) {
  await ensureSchema();
  const rows = await getSql()`
    INSERT INTO orders (
      id,
      service,
      plan,
      access,
      comment,
      quote,
      status,
      manager_comment,
      customer,
      created_at,
      updated_at
      , quote_id, plan_id, usd_price, usdt_rub_rate, buffered_rate, subtotal_rub, amount_rub, priced_at
    )
    VALUES (
      ${order.id},
      ${order.service},
      ${order.plan},
      ${order.access},
      ${order.comment},
      ${order.quote},
      ${order.status},
      ${order.managerComment},
      ${JSON.stringify(order.customer)}::jsonb,
      ${order.createdAt},
      ${order.updatedAt}
      , ${order.quoteId || null}, ${order.planId || null}, ${order.usdPrice || null}, ${order.usdtRubRate || null}, ${order.bufferedRate || null}, ${order.subtotalRub || null}, ${order.amountRub || null}, ${order.pricedAt || null}
    )
    RETURNING *
  `;
  return mapOrder(rows[0]);
}

async function updateOrder(id, updates) {
  await ensureSchema();
  const existing = await getOrder(id);
  if (!existing) return null;

  const nextStatus = updates.status || existing.status;
  const nextManagerComment =
    typeof updates.managerComment === "string"
      ? updates.managerComment.trim()
      : existing.managerComment;

  const rows = await getSql()`
    UPDATE orders
    SET
      status = ${nextStatus},
      manager_comment = ${nextManagerComment},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  return rows[0] ? mapOrder(rows[0]) : null;
}

async function getOrder(id) {
  await ensureSchema();
  const rows = await getSql()`
    SELECT *
    FROM orders
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ? mapOrder(rows[0]) : null;
}

module.exports = {
  createOrder,
  getOrder,
  listOrders,
  updateOrder,
  ensureSchema,
  getSql,
  mapOrder,
};
