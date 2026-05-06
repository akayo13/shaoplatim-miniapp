const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

loadEnvFile();

const port = process.env.PORT || 4173;
const host = process.env.HOST || "0.0.0.0";
const publicAppUrl = process.env.PUBLIC_APP_URL || `http://localhost:${port}`;
const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const ordersFile = path.join(dataDir, "orders.json");

const statuses = {
  new: "Новая",
  pricing: "Расчет",
  waiting_payment: "Ожидает оплаты",
  processing: "В работе",
  done: "Готово",
  declined: "Отклонено",
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

ensureDataFile();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: "Internal server error", detail: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`ЩаОплатим Mini App: ${publicAppUrl}`);
  console.log(`Admin: ${publicAppUrl}/admin.html`);
  startTelegramPolling();
});

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      service: "shaoplatim-miniapp",
      time: new Date().toISOString(),
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/orders") {
    const orders = readOrders();
    const customerId = url.searchParams.get("customerId")?.trim();
    const username = normalizeUsername(url.searchParams.get("username"));
    const filteredOrders = customerId || username
      ? orders.filter((order) => isOwnOrder(order, { customerId, username }))
      : orders;

    sendJson(res, 200, { orders: filteredOrders, stats: buildStats(filteredOrders) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/orders") {
    const payload = await readJsonBody(req);
    const validationError = validateOrderPayload(payload);

    if (validationError) {
      sendJson(res, 400, { error: validationError });
      return;
    }

    const order = createOrder(payload);
    const orders = readOrders();
    orders.unshift(order);
    writeOrders(orders);
    notifyAdmin(order);
    sendJson(res, 201, { order });
    return;
  }

  const orderMatch = url.pathname.match(/^\/api\/orders\/([^/]+)$/);
  if (req.method === "PATCH" && orderMatch) {
    const payload = await readJsonBody(req);
    const orders = readOrders();
    const order = orders.find((item) => item.id === orderMatch[1]);

    if (!order) {
      sendJson(res, 404, { error: "Order not found" });
      return;
    }

    if (payload.status && !statuses[payload.status]) {
      sendJson(res, 400, { error: "Unknown status" });
      return;
    }

    if (payload.status) order.status = payload.status;
    if (typeof payload.managerComment === "string") {
      order.managerComment = payload.managerComment.trim();
    }

    order.updatedAt = new Date().toISOString();
    writeOrders(orders);
    sendJson(res, 200, { order });
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}

function serveStatic(req, res, url) {
  const requestedPath = decodeURIComponent(url.pathname);
  const cleanPath = requestedPath === "/" ? "/index.html" : requestedPath;
  const filePath = path.normalize(path.join(publicDir, cleanPath));

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
}

function createOrder(payload) {
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

function isOwnOrder(order, identity) {
  const customer = order.customer || {};
  const orderCustomerId = customer.id ? String(customer.id) : "";
  const orderUsername = normalizeUsername(customer.username);

  if (identity.customerId && orderCustomerId === identity.customerId) return true;
  if (identity.username && orderUsername === identity.username) return true;

  return false;
}

function normalizeUsername(value) {
  return value ? String(value).trim().replace(/^@/, "").toLowerCase() : "";
}

function validateOrderPayload(payload) {
  if (!payload || typeof payload !== "object") return "Invalid payload";
  if (!payload.service || typeof payload.service !== "string") return "Service is required";
  if (!payload.plan || typeof payload.plan !== "string") return "Plan is required";
  return null;
}

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

function ensureDataFile() {
  fs.mkdirSync(dataDir, { recursive: true });

  if (!fs.existsSync(ordersFile)) {
    fs.writeFileSync(ordersFile, "[]\n");
  }
}

function readOrders() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(ordersFile, "utf8"));
}

function writeOrders(orders) {
  fs.writeFileSync(ordersFile, `${JSON.stringify(orders, null, 2)}\n`);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body is too large"));
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function loadEnvFile() {
  const envFile = path.join(__dirname, ".env");
  if (!fs.existsSync(envFile)) return;

  const lines = fs.readFileSync(envFile, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

async function notifyAdmin(order) {
  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.ADMIN_CHAT_ID;

  if (!botToken || !chatId) {
    console.log("Telegram notification skipped: BOT_TOKEN or ADMIN_CHAT_ID is missing");
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildOrderMessage(order),
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: buildStatusKeyboard(order.id),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.log(`Telegram notification failed: ${body}`);
    }
  } catch (error) {
    console.log(`Telegram notification failed: ${error.message}`);
  }
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
  return {
    inline_keyboard: [
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
    ],
  };
}

async function startTelegramPolling() {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) return;

  let offset = await getInitialTelegramOffset(botToken);
  console.log("Telegram status buttons: polling enabled");

  while (true) {
    try {
      const data = await telegramRequest("getUpdates", {
        offset,
        timeout: 25,
        allowed_updates: ["callback_query"],
      });

      for (const update of data.result || []) {
        offset = update.update_id + 1;
        if (update.callback_query) {
          await handleTelegramCallback(update.callback_query);
        }
      }
    } catch (error) {
      console.log(`Telegram polling failed: ${error.message}`);
      await delay(3000);
    }
  }
}

async function getInitialTelegramOffset(botToken) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?timeout=0`);
    const data = await response.json();
    const updates = data.result || [];
    const lastUpdate = updates[updates.length - 1];
    return lastUpdate ? lastUpdate.update_id + 1 : undefined;
  } catch {
    return undefined;
  }
}

async function handleTelegramCallback(callbackQuery) {
  const data = callbackQuery.data || "";
  const [, orderId, nextStatus] = data.match(/^status:([^:]+):([^:]+)$/) || [];

  if (!orderId || !statuses[nextStatus]) {
    await answerCallback(callbackQuery.id, "Неизвестная команда");
    return;
  }

  const orders = readOrders();
  const order = orders.find((item) => item.id === orderId);

  if (!order) {
    await answerCallback(callbackQuery.id, "Заявка не найдена");
    return;
  }

  order.status = nextStatus;
  order.updatedAt = new Date().toISOString();
  writeOrders(orders);

  await answerCallback(callbackQuery.id, `Статус: ${statuses[nextStatus]}`);
  await editTelegramOrderMessage(callbackQuery.message, order);
}

async function editTelegramOrderMessage(message, order) {
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
  const botToken = process.env.BOT_TOKEN;
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.description || `Telegram ${method} failed`);
  }

  return data;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
