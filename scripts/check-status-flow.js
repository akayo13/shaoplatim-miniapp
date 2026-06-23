const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const telegram = read("api/_lib/telegram.js");
const orderApi = read("api/orders/[id].js");
const webhook = read("api/telegram-webhook.js");
const app = read("public/app.js");
const admin = read("public/admin.js");
const html = read("public/index.html");

for (const status of ["waiting_payment", "processing", "done", "declined"]) {
  assert.match(telegram, new RegExp(`${status}:`));
}
assert.match(telegram, /waiting_payment: "Расчёт готов\. Проверьте сумму и перейдите к оплате\."/);
assert.match(telegram, /processing: "Оплата подтверждена\. Заказ уже в работе\."/);
assert.match(telegram, /done: "Заказ выполнен\. Спасибо!"/);
assert.match(telegram, /declined: "Заказ не выполнен\. Подробности доступны внутри заказа\."/);
assert.match(telegram, /escapeTelegramHtml\(order\.service\).* · .*escapeTelegramHtml\(order\.plan\)/);
assert.match(telegram, /Заказ <code>#\$\{formatOrderId\(order\.id\)\}<\/code>/);
assert.match(telegram, /function formatOrderId\(id\)/);
assert.doesNotMatch(telegram, /customerStatusMessages\s*=\s*{[^}]*\bnew:/s);
assert.match(orderApi, /notifyCustomer/);
assert.match(orderApi, /existing\.status/);
assert.match(webhook, /notifyCustomer/);
assert.match(webhook, /existing\.status/);
assert.match(telegram, /<b>К оплате:<\/b>/);
assert.match(telegram, /getMiniAppUrl\(order\.id\)/);
assert.match(telegram, /searchParams\.set\("startapp", `order_\$\{orderId\}`\)/);
assert.match(html, /id="refreshOrdersButton"/);
assert.match(app, /viewName === "history"[^}]*loadOrders\(\)/s);
assert.match(app, /amountRub: order\.amountRub/);
assert.match(app, /paymentAmount\.textContent = order\.amountRub/);
assert.match(app, /start_param/);
assert.match(app, /function openStartOrder[\s\S]*renderPaymentDraft\(order\);\s*showView\("payment"\)/);
assert.match(app, /paymentPrimaryButton\.hidden = !canOpenPayment/);
assert.match(app, /paymentDetails: order\.paymentDetails/);
assert.match(app, /paymentDetailsBox\.textContent = order\.paymentDetails/);
assert.match(app, /isPaymentUrl\(selectedPaymentOrder\.paymentDetails\)/);
assert.match(admin, /window\.confirm/);
assert.match(admin, /data-payment-details/);
assert.match(admin, /JSON\.stringify\(\{ managerComment, paymentDetails \}\)/);
assert.match(admin, /JSON\.stringify\(\{ status, managerComment, paymentDetails \}\)/);
assert.match(orderApi, /paymentDetails/);

console.log("Status flow check passed");
