const crypto = require("node:crypto");

function requireAdmin(req) {
  const keyAuth = verifyAdminKey(req);
  if (keyAuth.ok) return requireAdminPassword(req, keyAuth);

  const initData = req.headers["x-telegram-init-data"];
  if (!initData) {
    return {
      ok: false,
      status: 401,
      error: keyAuth.error || "Откройте админку из Telegram",
    };
  }

  const verified = verifyTelegramInitData(initData);
  if (!verified.ok) {
    return {
      ok: false,
      status: 401,
      error: verified.error,
    };
  }

  const userId = String(verified.user?.id || "");
  const adminIds = getAdminIds();

  if (!adminIds.length) {
    return {
      ok: false,
      status: 403,
      error: "ADMIN_TELEGRAM_IDS не настроен",
      userId,
    };
  }

  if (!adminIds.includes(userId)) {
    return {
      ok: false,
      status: 403,
      error: "Нет доступа к админке",
      userId,
    };
  }

  return requireAdminPassword(req, {
    ok: true,
    user: verified.user,
  });
}

function requireAdminPassword(req, authResult) {
  const expectedPassword = process.env.ADMIN_PANEL_PASSWORD;
  if (!expectedPassword) return authResult;

  const providedPassword = req.headers["x-admin-password"];
  if (!providedPassword) {
    return {
      ok: false,
      status: 401,
      error: "Введите пароль админки",
      passwordRequired: true,
    };
  }

  if (!safeEqual(String(providedPassword), String(expectedPassword))) {
    return {
      ok: false,
      status: 403,
      error: "Неверный пароль админки",
      passwordRequired: true,
    };
  }

  return authResult;
}

function verifyAdminKey(req) {
  const expectedKey = process.env.ADMIN_PANEL_KEY;
  if (!expectedKey) {
    return { ok: false, error: "" };
  }

  const providedKey = req.headers["x-admin-key"];
  if (!providedKey) {
    return { ok: false, error: "Откройте админку по кнопке из админ-чата" };
  }

  if (!safeEqual(String(providedKey), String(expectedKey))) {
    return {
      ok: false,
      status: 403,
      error: "Неверный ключ админки",
    };
  }

  return {
    ok: true,
    user: { id: "admin-key", first_name: "Admin" },
  };
}

function verifyTelegramInitData(initData) {
  if (!process.env.BOT_TOKEN) {
    return { ok: false, error: "BOT_TOKEN is missing" };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false, error: "Telegram hash is missing" };

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = crypto
    .createHmac("sha256", "WebAppData")
    .update(process.env.BOT_TOKEN)
    .digest();
  const calculatedHash = crypto
    .createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  if (!safeEqual(hash, calculatedHash)) {
    return { ok: false, error: "Telegram подпись не прошла проверку" };
  }

  const authDate = Number(params.get("auth_date") || 0);
  const maxAgeSeconds = 60 * 60 * 24;
  if (authDate && Date.now() / 1000 - authDate > maxAgeSeconds) {
    return { ok: false, error: "Telegram-сессия устарела" };
  }

  try {
    return { ok: true, user: JSON.parse(params.get("user") || "{}") };
  } catch {
    return { ok: false, error: "Telegram user payload invalid" };
  }
}

function getAdminIds() {
  return (process.env.ADMIN_TELEGRAM_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

module.exports = {
  requireAdmin,
};
