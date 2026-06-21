const { requireAdmin } = require("./_lib/auth");
const { methodNotAllowed, readJsonBody, sendJson } = require("./_lib/http");
const { listPlans, listPriceUpdates, resolvePriceUpdate, setPlanPrice } = require("./_lib/pricing-store");

module.exports = async function handler(req, res) {
  try {
    const admin = requireAdmin(req);
    if (!admin.ok) return sendJson(res, admin.status, { error: admin.error, passwordRequired: admin.passwordRequired || false });
    if (req.method === "GET") return sendJson(res, 200, { plans: await listPlans({ all: true }), updates: await listPriceUpdates() });
    if (req.method === "PATCH") {
      const payload = await readJsonBody(req);
      if (payload.updateId) await resolvePriceUpdate(payload.updateId, payload.action);
      else if (payload.planId) await setPlanPrice(payload.planId, Number(payload.usdPrice));
      else return sendJson(res, 400, { error: "Не указано изменение" });
      return sendJson(res, 200, { ok: true });
    }
    methodNotAllowed(res);
  } catch (error) {
    console.error("Pricing admin API failed", error.name);
    sendJson(res, error.statusCode || 500, { error: error.statusCode ? error.message : "Internal server error" });
  }
};
