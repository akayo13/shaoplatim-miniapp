const { statuses } = require("./statuses");

const customerStatusMessages = {
  waiting_payment: "Расчёт готов. Откройте заказ, чтобы проверить сумму и продолжить оплату.",
  processing: "Заказ принят в работу. Сообщим, когда всё будет готово.",
  done: "Заказ выполнен. Спасибо, что выбрали ЩаОплатим.",
  declined: "Заказ не удалось выполнить. Откройте заказ или напишите в поддержку.",
};

async function notifyAdmin(order) {
  const chatId = process.env.ADMIN_CHAT_ID;
  if (!process.env.BOT_TOKEN || !chatId) return;

  const payload = {
    text: buildOrderMessage(order),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: buildStatusKeyboard(order.id),
  };

  try {
    await telegramRequest("sendMessage", {
      ...payload,
      chat_id: chatId,
    });
  } catch (error) {
    const migratedChatId = error.telegram?.parameters?.migrate_to_chat_id;
    if (!migratedChatId) throw error;

    await telegramRequest("sendMessage", {
      ...payload,
      chat_id: migratedChatId,
    });
  }
}

async function notifyPricingAdmin(text) {
  const chatId = process.env.ADMIN_CHAT_ID;
  if (!process.env.BOT_TOKEN || !chatId) return;
  await telegramRequest("sendMessage", { chat_id: chatId, text, disable_web_page_preview: true });
}

async function notifyCustomer(order) {
  const text = customerStatusMessages[order.status];
  const chatId = order.customer?.id;
  if (!text || !chatId) return false;

  const payload = {
    chat_id: chatId,
    parse_mode: "HTML",
    text: [
      `<b>${escapeTelegramHtml(statuses[order.status])}</b>`,
      escapeTelegramHtml(text),
      "",
      `<b>Сервис:</b> ${escapeTelegramHtml(order.service)}`,
      `Заказ: <code>${escapeTelegramHtml(order.id)}</code>`,
    ].join("\n"),
  };
  const miniAppUrl = getMiniAppUrl();
  if (miniAppUrl) {
    payload.reply_markup = { inline_keyboard: [[{ text: "Открыть заказ", url: miniAppUrl }]] };
  }

  await telegramRequest("sendMessage", payload);
  return true;
}

async function editOrderMessage(message, order) {
  if (!message) return;

  await telegramRequest("editMessageText", {
    chat_id: message.chat.id,
    message_id: message.message_id,
    text: buildOrderMessage(order),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: buildStatusKeyboard(order.id),
  });
}

async function answerCallback(callbackQueryId, text) {
  await telegramRequest("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

async function telegramRequest(method, payload) {
  if (!process.env.BOT_TOKEN) {
    throw new Error("BOT_TOKEN is missing");
  }

  const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!data.ok) {
    const error = new Error(data.description || `Telegram ${method} failed`);
    error.telegram = data;
    throw error;
  }

  return data;
}

function buildOrderMessage(order) {
  return [
    order.status === "new" ? "🟢 Новая заявка ЩаОплатим" : "🟡 Заявка ЩаОплатим",
    "",
    `<b>Статус:</b> ${escapeTelegramHtml(statuses[order.status] || order.status)}`,
    `<b>Сервис:</b> ${escapeTelegramHtml(order.service)}`,
    `<b>Тариф:</b> ${escapeTelegramHtml(order.plan)}`,
    `<b>Расчет:</b> ${escapeTelegramHtml(order.quote)}`,
    `<b>Вход:</b> ${escapeTelegramHtml(order.access)}`,
    `<b>Клиент:</b> ${escapeTelegramHtml(formatCustomer(order.customer))}`,
    order.comment ? `<b>Комментарий:</b> ${escapeTelegramHtml(order.comment)}` : "",
    order.managerComment ? `<b>Менеджер:</b> ${escapeTelegramHtml(order.managerComment)}` : "",
    "",
    `ID: <code>${order.id}</code>`,
  ].filter(Boolean).join("\n");
}

function buildStatusKeyboard(orderId) {
  const keyboard = [
    [
      { text: "Расчет", callback_data: `status:${orderId}:pricing` },
      { text: "Ожидает оплаты", callback_data: `status:${orderId}:waiting_payment` },
    ],
    [
      { text: "В работе", callback_data: `status:${orderId}:processing` },
      { text: "Готово", callback_data: `status:${orderId}:done` },
    ],
    [
      { text: "Отклонено", callback_data: `status:${orderId}:declined` },
    ],
  ];
  const adminUrl = buildAdminUrl();

  if (adminUrl) {
    keyboard.push([{ text: "Открыть админку", url: adminUrl }]);
  }

  return {
    inline_keyboard: keyboard,
  };
}

function buildAdminUrl() {
  if (!process.env.PUBLIC_APP_URL) return "";

  try {
    const url = new URL("/admin.html", process.env.PUBLIC_APP_URL);
    if (process.env.ADMIN_PANEL_KEY) {
      url.searchParams.set("admin_key", process.env.ADMIN_PANEL_KEY);
    }
    return url.toString();
  } catch {
    return "";
  }
}

function getMiniAppUrl() {
  try {
    return process.env.MINI_APP_LINK ? new URL(process.env.MINI_APP_LINK).toString() : "";
  } catch {
    return "";
  }
}

function formatCustomer(customer = {}) {
  if (customer.username) return `@${customer.username}`;
  return customer.name || "Гость";
}

function escapeTelegramHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

module.exports = {
  answerCallback,
  editOrderMessage,
  notifyAdmin,
  notifyPricingAdmin,
  notifyCustomer,
  telegramRequest,
};
