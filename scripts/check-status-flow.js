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
assert.match(app, /paymentPrimaryButton\.hidden = !isPaymentReady/);
assert.match(admin, /window\.confirm/);
assert.match(admin, /JSON\.stringify\(\{ status \}\)/);
assert.match(admin, /JSON\.stringify\(\{ managerComment \}\)/);

console.log("Status flow check passed");
