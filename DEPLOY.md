# Deploy

Минимальный production-путь для MVP: VPS + Node.js + nginx + HTTPS.

Для бесплатного постоянного запуска используем Vercel + Neon Postgres:

- Vercel Hobby: бесплатный хостинг и serverless API в рамках лимитов.
- Neon Free: бесплатный serverless Postgres.
- Telegram callbacks: через webhook, без постоянного polling-процесса.

## Vercel Free

### 1. Создать Neon Postgres

Вариант A: через Vercel Marketplace установить Neon в проект.

Вариант B: создать бесплатный проект на Neon и скопировать `DATABASE_URL`.

Нужна строка вида:

```bash
DATABASE_URL=postgresql://...?...sslmode=require
```

### 2. Создать проект на Vercel

Проект можно подключить через GitHub или Vercel CLI.

Environment Variables в Vercel:

```bash
DATABASE_URL=...
BOT_TOKEN=...
ADMIN_CHAT_ID=...
PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
TELEGRAM_MENU_TEXT=Открыть ЩаОплатим
```

### 3. Deploy

```bash
vercel --prod
```

После деплоя проверить:

```bash
curl https://your-vercel-domain.vercel.app/api/health
```

### 4. Подключить Telegram

Локально или в Vercel CLI окружении, когда `.env` содержит production URL:

```bash
npm run telegram:webhook
npm run telegram:menu
```

Webhook нужен для кнопок статусов в Telegram. Menu button нужен, чтобы пользователь открывал Mini App из бота.

## VPS

Альтернативный вариант для платного/своего сервера: VPS + Node.js + nginx + HTTPS.

### 1. Подготовить сервер

```bash
sudo mkdir -p /opt/shaoplatim-miniapp
sudo chown -R $USER:$USER /opt/shaoplatim-miniapp
```

Скопировать проект в `/opt/shaoplatim-miniapp`.

### 2. Настроить `.env`

```bash
cp .env.example .env
```

Заполнить:

```bash
PORT=4173
HOST=127.0.0.1
PUBLIC_APP_URL=https://your-domain.com
DATABASE_URL=
BOT_TOKEN=...
ADMIN_CHAT_ID=...
TELEGRAM_MENU_TEXT=Открыть ЩаОплатим
```

### 3. systemd

```bash
sudo cp deploy/systemd/shaoplatim-miniapp.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable shaoplatim-miniapp
sudo systemctl start shaoplatim-miniapp
sudo systemctl status shaoplatim-miniapp
```

Проверка:

```bash
curl http://127.0.0.1:4173/api/health
```

### 4. nginx

```bash
sudo cp deploy/nginx/shaoplatim-miniapp.conf /etc/nginx/sites-available/shaoplatim-miniapp
sudo ln -s /etc/nginx/sites-available/shaoplatim-miniapp /etc/nginx/sites-enabled/shaoplatim-miniapp
sudo nginx -t
sudo systemctl reload nginx
```

В `deploy/nginx/shaoplatim-miniapp.conf` заменить `example.com` на домен.

### 5. HTTPS

После настройки DNS на VPS:

```bash
sudo certbot --nginx -d your-domain.com
```

Telegram Mini App требует HTTPS.

### 6. Кнопка Mini App в Telegram

Когда `PUBLIC_APP_URL` уже открывается по HTTPS:

```bash
npm run telegram:menu
```

Если `npm` на сервере не используется:

```bash
node scripts/set-telegram-menu.js
```
