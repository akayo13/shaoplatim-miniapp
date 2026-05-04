# ЩаОплатим Mini App

Стартовый Telegram Mini App для сервиса оплаты зарубежных сервисов и подписок.

## Запуск

Открыть напрямую:

```bash
open public/index.html
```

Или через локальный сервер:

```bash
node server.js
```

То же через package script:

```bash
npm run start
```

После запуска: `http://localhost:4173`.

Админка: `http://localhost:4173/admin.html`.

## Структура

- `public/index.html` — разметка Mini App.
- `public/admin.html` — панель управления заявками.
- `public/styles.css` — дизайн-система и адаптив.
- `public/app.js` — сценарии, каталог, оформление заявки, Telegram WebApp API.
- `public/admin.js` — загрузка заявок, фильтр и смена статусов.
- `public/assets/logo-banner.png` — баннерный логотип для hero.
- `public/assets/logo-channel.png` — круглый логотип для Telegram-формата.
- `data/orders.json` — локальное JSON-хранилище заявок.
- `DEPLOY.md` — инструкция для VPS, nginx, HTTPS и кнопки Mini App в Telegram.
- `scripts/set-telegram-menu.js` — настройка кнопки меню бота.
- `deploy/` — примеры systemd и nginx.
- `api/` — Vercel serverless API для production.
- `vercel.json` — конфиг Vercel.

## API

- `GET /api/orders` — список заявок и статистика.
- `POST /api/orders` — создать заявку.
- `PATCH /api/orders/:id` — обновить статус и комментарий менеджера.

## Telegram

Настройки лежат в `.env`:

```bash
BOT_TOKEN=...
ADMIN_CHAT_ID=...
```

Когда `ADMIN_CHAT_ID` заполнен, сервер отправляет менеджеру уведомление при каждой новой заявке.

Уведомление содержит inline-кнопки статуса. Сервер слушает callback-кнопки через polling и обновляет заявку в `data/orders.json`.

Для кнопки Mini App в Telegram нужен публичный HTTPS URL. Когда домен будет готов и `PUBLIC_APP_URL` заполнен:

```bash
node scripts/set-telegram-menu.js
```

Подробно: `DEPLOY.md`.

## Бесплатный постоянный запуск

Для постоянного бесплатного запуска используем Vercel + Neon:

- Vercel отдает Mini App, админку и serverless API.
- Neon хранит заявки в Postgres.
- Telegram-кнопки работают через webhook `/api/telegram-webhook`, без polling.

Подробная инструкция: `DEPLOY.md`.

## Стиль

Интерфейс адаптирован под темную айдентику логотипа: черный глянцевый фон, лаймовый акцент и полупрозрачные glass-кнопки.
