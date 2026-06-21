const { requireCustomer } = require("./_lib/auth");
const { methodNotAllowed, readJsonBody, sendJson } = require("./_lib/http");
const { createQuote } = require("./_lib/pricing-store");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") return methodNotAllowed(res);
    const customer = requireCustomer(req);
    if (!customer.ok) return sendJson(res, customer.status, { error: customer.error });
    const payload = await readJsonBody(req);
    if (!payload.planId || typeof payload.planId !== "string") return sendJson(res, 400, { error: "Выберите тариф" });
    sendJson(res, 201, { quote: await createQuote(customer.user.id, payload.planId) });
  } catch (error) {
    console.error("Quote API failed", error.name);
    sendJson(res, error.statusCode || 500, { error: error.statusCode ? error.message : "Internal server error" });
  }
};
