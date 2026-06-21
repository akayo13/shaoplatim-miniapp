const crypto = require("node:crypto");
const { statuses } = require("./statuses");

function buildStats(orders) {
  return {
    total: orders.length,
    active: orders.filter((order) => !["done", "declined"].includes(order.status)).length,
    done: orders.filter((order) => order.status === "done").length,
    byStatus: Object.fromEntries(
      Object.keys(statuses).map((status) => [
        status,
        orders.filter((order) => order.status === status).length,
      ]),
    ),
    statuses,
  };
}

function createOrderFromPayload(payload) {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    service: payload.service.trim(),
    plan: payload.plan.trim(),
    access: payload.access || "Уточнить способ",
    comment: payload.comment?.trim() || "",
    quote: payload.quote || "Расчет перед оплатой",
    status: "new",
    managerComment: "",
    customer: normalizeCustomer(payload.customer),
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeCustomer(customer = {}) {
  return {
    id: customer.id || null,
    name: customer.name || "Гость",
    username: customer.username || "",
  };
}

function validateOrderPayload(payload) {
  if (!payload || typeof payload !== "object") return "Invalid payload";
  if (!payload.service || typeof payload.service !== "string") return "Service is required";
  if (!payload.plan || typeof payload.plan !== "string") return "Plan is required";
  if (payload.service.trim().length > 100) return "Service must be 100 characters or fewer";
  if (payload.plan.trim().length > 200) return "Plan must be 200 characters or fewer";
  if (payload.access != null && (typeof payload.access !== "string" || payload.access.length > 100)) {
    return "Access must be 100 characters or fewer";
  }
  if (payload.comment != null && (typeof payload.comment !== "string" || payload.comment.length > 2000)) {
    return "Comment must be 2000 characters or fewer";
  }
  return null;
}

function isOwnOrder(order, user) {
  return Boolean(user?.id && String(order.customer?.id || "") === String(user.id));
}

module.exports = {
  buildStats,
  createOrderFromPayload,
  isOwnOrder,
  validateOrderPayload,
};
