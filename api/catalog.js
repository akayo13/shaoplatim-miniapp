const { requireCustomer } = require("./_lib/auth");
const { methodNotAllowed, sendJson } = require("./_lib/http");
const { listPlans } = require("./_lib/pricing-store");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") return methodNotAllowed(res);
    const customer = requireCustomer(req);
    if (!customer.ok) return sendJson(res, customer.status, { error: customer.error });
    sendJson(res, 200, { plans: await listPlans() });
  } catch (error) {
    console.error("Catalog API failed", error.name);
    sendJson(res, error.statusCode || 500, { error: error.statusCode ? error.message : "Internal server error" });
  }
};
