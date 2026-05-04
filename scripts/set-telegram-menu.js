const fs = require("node:fs");
const path = require("node:path");

loadEnvFile();

const botToken = process.env.BOT_TOKEN;
const publicAppUrl = normalizePublicUrl(process.env.PUBLIC_APP_URL);
const menuText = process.env.TELEGRAM_MENU_TEXT || "Открыть ЩаОплатим";

if (!botToken) {
  fail("BOT_TOKEN is missing in .env");
}

if (!publicAppUrl) {
  fail("PUBLIC_APP_URL is missing in .env");
}

if (!publicAppUrl.startsWith("https://")) {
  fail("PUBLIC_APP_URL must be an HTTPS URL for Telegram Mini Apps");
}

setMenuButton()
  .then(() => {
    console.log(`Telegram menu button is set: ${menuText} -> ${publicAppUrl}`);
  })
  .catch((error) => {
    fail(error.message);
  });

async function setMenuButton() {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      menu_button: {
        type: "web_app",
        text: menuText,
        web_app: {
          url: publicAppUrl,
        },
      },
    }),
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.description || "Telegram setChatMenuButton failed");
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
