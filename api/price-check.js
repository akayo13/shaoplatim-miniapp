const { requireAdmin } = require("./_lib/auth");
const { methodNotAllowed, sendJson } = require("./_lib/http");
const { listPlans, proposePriceUpdate, recordPlanCheck } = require("./_lib/pricing-store");
const { notifyPricingAdmin } = require("./_lib/telegram");
const { requiresReview } = require("./_lib/pricing");

const patterns = {
  "chatgpt-plus": /Plus[\s\S]{0,500}?\$\s*(\d+(?:\.\d{1,2})?)/i,
  "chatgpt-pro": /Pro[\s\S]{0,500}?\$\s*(\d+(?:\.\d{1,2})?)/i,
  "spotify-individual": /Individual[\s\S]{0,700}?\$\s*(\d+(?:\.\d{1,2})?)/i,
  "google-one-basic": /Basic[\s\S]{0,700}?\$\s*(\d+(?:\.\d{1,2})?)/i,
  "google-one-premium": /Premium[\s\S]{0,700}?\$\s*(\d+(?:\.\d{1,2})?)/i,
  "midjourney-basic": /Basic[\s\S]{0,700}?\$\s*(\d+(?:\.\d{1,2})?)/i,
  "midjourney-standard": /Standard[\s\S]{0,700}?\$\s*(\d+(?:\.\d{1,2})?)/i,
  "midjourney-pro": /Pro[\s\S]{0,700}?\$\s*(\d+(?:\.\d{1,2})?)/i,
};

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") return methodNotAllowed(res);
    const cronOk = process.env.CRON_SECRET && req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;
    if (!cronOk) {
      const admin = requireAdmin(req);
      if (!admin.ok) return sendJson(res, admin.status, { error: admin.error });
    }
    const plans = await listPlans({ all: true });
    const changes = [];
    for (const plan of plans.filter((item) => item.sourceMode === "auto" && patterns[item.id])) {
      try {
        const response = await fetch(plan.sourceUrl, { headers: { "user-agent": "ShaoplatimPriceMonitor/1.0" } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const match = (await response.text()).match(patterns[plan.id]);
        if (!match) throw new Error("Цена не найдена на странице");
        const proposedPrice = Number(match[1]);
        if (proposedPrice !== plan.usdPrice) {
          const message = requiresReview(plan.usdPrice, proposedPrice) ? "Изменение больше 50% — проверьте вручную" : "Найдена новая цена";
          const id = await proposePriceUpdate(plan, proposedPrice, "change", message);
          if (id) changes.push(`${plan.service} ${plan.name}: $${plan.usdPrice} → $${proposedPrice}`);
        }
        await recordPlanCheck(plan.id, "ok");
      } catch (error) {
        await proposePriceUpdate(plan, null, "error", error.message);
        await recordPlanCheck(plan.id, "error");
      }
    }
    if (changes.length) await notifyPricingAdmin(`Найдены изменения цен:\n${changes.join("\n")}\n\nПодтвердите их в админ-панели.`);
    sendJson(res, 200, { ok: true, changes: changes.length });
  } catch (error) {
    console.error("Price check failed", error.name);
    sendJson(res, 500, { error: "Internal server error" });
  }
};
