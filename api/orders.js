const { createOrder, listOrders } = require("./_lib/db");
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
