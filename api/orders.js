const { createOrder, listOrders } = require("./_lib/db");
const { requireAdmin, requireCustomer } = require("./_lib/auth");
const { methodNotAllowed, readJsonBody, sendJson } = require("./_lib/http");
const {
  buildStats,
  createOrderFromPayload,
  isOwnOrder,
  validateOrderPayload,
} = require("./_lib/orders");
const { notifyAdmin } = require("./_lib/telegram");

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      if (url.searchParams.get("admin") === "1") {
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

      const customer = requireCustomer(req);
      if (!customer.ok) return sendJson(res, customer.status, { error: customer.error });
      const orders = await listOrders();
      sendJson(res, 200, { orders: orders.filter((order) => isOwnOrder(order, customer.user)) });
      return;
    }

    if (req.method === "POST") {
      const customer = requireCustomer(req);
      if (!customer.ok) return sendJson(res, customer.status, { error: customer.error });
      const payload = await readJsonBody(req);
      const validationError = validateOrderPayload(payload);

      if (validationError) {
        sendJson(res, 400, { error: validationError });
        return;
      }

      const order = await createOrder(createOrderFromPayload({
        ...payload,
        customer: {
          id: customer.user.id,
          name: customer.user.first_name || "Клиент",
          username: customer.user.username || "",
        },
      }));
      await notifyAdmin(order);
      sendJson(res, 201, { order });
      return;
    }

    methodNotAllowed(res);
  } catch (error) {
    console.error("Orders API failed", error.name);
    sendJson(res, error.statusCode || 500, { error: error.statusCode ? error.message : "Internal server error" });
  }
};
