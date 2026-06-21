const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "../public/index.html"), "utf8");
const hero = html.match(/<section class="hero">[\s\S]*?<\/section>/)?.[0] || "";

for (const text of [
  "Как всё происходит",
  "Частые вопросы",
  "Полный возврат",
  "Как мы используем данные",
  'name="termsAccepted"',
  'id="changeServiceButton"',
  '/_vercel/insights/script.js',
]) {
  assert(html.includes(text), `Missing trust content: ${text}`);
}

const app = fs.readFileSync(path.join(__dirname, "../public/app.js"), "utf8");
assert(app.includes("setServicePickerCollapsed"), "Missing service picker toggle");
for (const event of ["app_opened", "order_started", "order_submitted", "payment_opened", "support_opened"]) {
  assert(app.includes(`trackEvent("${event}")`), `Missing analytics event: ${event}`);
}

assert(!hero.includes("Без паролей"), "Do not raise password concerns in the hero");
assert(
  !hero.includes("Достаточно ссылки или одноразового кода"),
  "Do not raise access concerns in the hero",
);

console.log("Trust content check passed");
