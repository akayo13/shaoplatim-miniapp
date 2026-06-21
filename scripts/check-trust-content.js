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
]) {
  assert(html.includes(text), `Missing trust content: ${text}`);
}

assert(!hero.includes("Без паролей"), "Do not raise password concerns in the hero");
assert(
  !hero.includes("Достаточно ссылки или одноразового кода"),
  "Do not raise access concerns in the hero",
);

console.log("Trust content check passed");
