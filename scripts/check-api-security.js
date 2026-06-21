const assert = require("node:assert");
const crypto = require("node:crypto");

process.env.BOT_TOKEN = "test-token";

const { requireCustomer } = require("../api/_lib/auth");
const { isOwnOrder, validateOrderPayload } = require("../api/_lib/orders");

function signedInitData(user) {
  const params = new URLSearchParams({
    auth_date: String(Math.floor(Date.now() / 1000)),
    query_id: "test-query",
    user: JSON.stringify(user),
  });
  const data = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(process.env.BOT_TOKEN).digest();
  params.set("hash", crypto.createHmac("sha256", secret).update(data).digest("hex"));
  return params.toString();
}

const user = { id: 42, first_name: "Тест", username: "tester" };
assert.deepEqual(requireCustomer({ headers: { "x-telegram-init-data": signedInitData(user) } }).user, user);
assert.equal(requireCustomer({ headers: { "x-telegram-init-data": `${signedInitData(user)}x` } }).ok, false);
assert.equal(isOwnOrder({ customer: { id: 42 } }, user), true);
assert.equal(isOwnOrder({ customer: { id: 43, username: "tester" } }, user), false);
assert.equal(validateOrderPayload({ service: "A", plan: "B" }), null);
assert.match(validateOrderPayload({ service: "A".repeat(101), plan: "B" }), /100/);

console.log("API security check passed");
