const { getOrder, updateOrder } = require("./_lib/db");
const { readJsonBody, sendJson } = require("./_lib/http");
const { statuses } = require("./_lib/statuses");
const { answerCallback, editOrderMessage, notifyCustomer } = require("./_lib/telegram");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 200, { ok: true });
    return;
  }

  try {
    const update = await readJsonBody(req);
    const callbackQuery = update.callback_query;

    if (!callbackQuery) {
      sendJson(res, 200, { ok: true });
      return;
    }

    const [, orderId, nextStatus] = (callbackQuery.data || "").match(/^status:([^:]+):([^:]+)$/) || [];

    if (!orderId || !statuses[nextStatus]) {
      await answerCallback(callbackQuery.id, "Неизвестная команда");
      sendJson(res, 200, { ok: true });
      return;
    }

    const existing = await getOrder(orderId);
    const order = existing ? await updateOrder(orderId, { status: nextStatus }) : null;

    if (!order) {
      await answerCallback(callbackQuery.id, "Заявка не найдена");
      sendJson(res, 200, { ok: true });
      return;
    }

    await answerCallback(callbackQuery.id, `Статус: ${statuses[nextStatus]}`);
    await editOrderMessage(callbackQuery.message, order);
    if (nextStatus !== existing.status) {
      try {
        await notifyCustomer(order);
      } catch (error) {
        console.error("Customer status notification failed", error.message);
      }
    }
    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendJson(res, 200, { ok: false, error: error.message });
  }
};
