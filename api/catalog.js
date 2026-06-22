const { requireCustomer } = require("./_lib/auth");
const { methodNotAllowed, sendJson } = require("./_lib/http");
const { calculateRubTotal } = require("./_lib/pricing");
const { getCurrentRate, listPlans } = require("./_lib/pricing-store");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") return methodNotAllowed(res);
    const customer = requireCustomer(req);
    if (!customer.ok) return sendJson(res, customer.status, { error: customer.error });
    const plans = await listPlans();
    try {
      const { rate } = await getCurrentRate();
      sendJson(res, 200, { plans: plans.map((plan) => ({ ...plan, amountRub: calculateRubTotal(plan.usdPrice, rate).total })) });
    } catch (error) {
      console.error("Catalog pricing unavailable", error.name);
      sendJson(res, 200, { plans });
    }
  } catch (error) {
    console.error("Catalog API failed", error.name);
    sendJson(res, error.statusCode || 500, { error: error.statusCode ? error.message : "Internal server error" });
  }
};
