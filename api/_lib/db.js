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
};
