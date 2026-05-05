const fs = require("node:fs");
const path = require("node:path");

loadEnvFile();

const botToken = process.env.BOT_TOKEN;
const channelId = process.env.CHANNEL_ID;
const miniAppLink = process.env.MINI_APP_LINK || normalizePublicUrl(process.env.PUBLIC_APP_URL);
const postText =
  process.env.CHANNEL_POST_TEXT ||
  [
    "ЩаОплатим теперь в Telegram.",
    "",
    "Оформите оплату зарубежной подписки в пару касаний: выберите сервис, отправьте заявку и получите расчет.",
  ].join("\n");

if (!botToken) fail("BOT_TOKEN is missing in .env");
if (!channelId) fail("CHANNEL_ID is missing in .env");
if (!miniAppLink) fail("MINI_APP_LINK or PUBLIC_APP_URL is missing in .env");

sendChannelPost()
  .then(() => {
    console.log(`Channel post sent to ${channelId}`);
  })
  .catch((error) => {
    fail(error.message);
  });

async function sendChannelPost() {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: channelId,
      text: postText,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Открыть ЩаОплатим",
              url: miniAppLink,
            },
          ],
        ],
      },
    }),
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.description || "Telegram sendMessage failed");
  }
}

function normalizePublicUrl(value) {
  if (!value) return "";
  return value.replace(/\/+$/, "");
}

function loadEnvFile() {
  const envFile = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envFile)) return;

  fs.readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
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

function fail(message) {
  console.error(message);
  process.exit(1);
}
