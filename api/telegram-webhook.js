const { updateOrder } = require("./_lib/db");
const { readJsonBody, sendJson } = require("./_lib/http");
const { statuses } = require("./_lib/statuses");
const { answerCallback, editOrderMessage } = require("./_lib/telegram");

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

    const order = await updateOrder(orderId, { status: nextStatus });

    if (!order) {
      await answerCallback(callbackQuery.id, "Заявка не найдена");
      sendJson(res, 200, { ok: true });
      return;
    }

    await answerCallback(callbackQuery.id, `Статус: ${statuses[nextStatus]}`);
    await editOrderMessage(callbackQuery.message, order);
    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendJson(res, 200, { ok: false, error: error.message });
  }
};
