const { updateOrder } = require("../_lib/db");
const { requireAdmin } = require("../_lib/auth");
const { methodNotAllowed, readJsonBody, sendJson } = require("../_lib/http");
const { statuses } = require("../_lib/statuses");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "PATCH") {
      methodNotAllowed(res);
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

    const id = req.query.id;
    const payload = await readJsonBody(req);

    if (payload.status && !statuses[payload.status]) {
      sendJson(res, 400, { error: "Unknown status" });
      return;
    }

    const order = await updateOrder(id, payload);
    if (!order) {
      sendJson(res, 404, { error: "Order not found" });
      return;
    }

    sendJson(res, 200, { order });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
};
