const { createOrder, listOrders } = require("./_lib/db");
const { requireAdmin } = require("./_lib/auth");
const { methodNotAllowed, readJsonBody, sendJson } = require("./_lib/http");
const {
  buildStats,
  createOrderFromPayload,
  validateOrderPayload,
} = require("./_lib/orders");
const { notifyAdmin } = require("./_lib/telegram");

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const customerId = url.searchParams.get("customerId")?.trim();
      const username = normalizeUsername(url.searchParams.get("username"));

      if (customerId || username) {
        const orders = await listOrders();
        const ownOrders = orders.filter((order) => isOwnOrder(order, { customerId, username }));
        sendJson(res, 200, { orders: ownOrders });
        return;
      }

      const admin = requireAdmin(req);
      if (!admin.ok) {
        sendJson(res, admin.status, {
          error: admin.error,
          userId: admin.userId,
          passwordRequired: admin.passwordRequired || false,
        });
        return;
      }

      const orders = await listOrders();
      sendJson(res, 200, { orders, stats: buildStats(orders) });
      return;
    }

    if (req.method === "POST") {
      const payload = await readJsonBody(req);
      const validationError = validateOrderPayload(payload);

      if (validationError) {
        sendJson(res, 400, { error: validationError });
        return;
      }

      const order = await createOrder(createOrderFromPayload(payload));
      await notifyAdmin(order);
      sendJson(res, 201, { order });
      return;
    }

    methodNotAllowed(res);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
};

function isOwnOrder(order, identity) {
  const customer = order.customer || {};
  const orderCustomerId = customer.id ? String(customer.id) : "";
  const orderUsername = normalizeUsername(customer.username);

  if (identity.customerId && orderCustomerId === identity.customerId) return true;
  if (identity.username && orderUsername === identity.username) return true;

  return false;
}

function normalizeUsername(value) {
  return value ? String(value).trim().replace(/^@/, "").toLowerCase() : "";
}
