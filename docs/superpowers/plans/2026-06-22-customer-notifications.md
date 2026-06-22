# Customer Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать четыре клиентских Telegram-уведомления короткими и показывать сервис, тариф, сумму и короткий номер заказа.

**Architecture:** Существующий `notifyCustomer` остаётся единственной точкой сборки сообщения. Меняются только словарь текстов и формат полей; текущий deep link с полным ID сохраняется.

**Tech Stack:** Node.js, Telegram Bot API, assert-проверка исходников.

---

### Task 1: Обновить клиентские уведомления

**Files:**
- Modify: `api/_lib/telegram.js`
- Test: `scripts/check-status-flow.js`

- [ ] **Step 1: Записать падающие проверки**

В `scripts/check-status-flow.js` проверить точные тексты четырёх статусов, строку `` `${service} · ${plan}` ``, короткий `formatOrderId(order.id)` и сохранение полного ID в `getMiniAppUrl(order.id)`.

- [ ] **Step 2: Запустить проверку и увидеть ожидаемое падение**

Run: `node scripts/check-status-flow.js`

Expected: FAIL на старом тексте или отсутствующем коротком формате ID.

- [ ] **Step 3: Внести минимальное изменение**

В `api/_lib/telegram.js` использовать утверждённые тексты:

```js
const customerStatusMessages = {
  waiting_payment: "Расчёт готов. Проверьте сумму и перейдите к оплате.",
  processing: "Оплата подтверждена. Заказ уже в работе.",
  done: "Заказ выполнен. Спасибо!",
  declined: "Заказ не выполнен. Подробности доступны внутри заказа.",
};
```

Тело сообщения:

```js
`<b>${escapeTelegramHtml(statuses[order.status])}</b>`,
escapeTelegramHtml(text),
"",
`${escapeTelegramHtml(order.service)} · ${escapeTelegramHtml(order.plan)}`,
order.amountRub ? `<b>К оплате:</b> ${escapeTelegramHtml(order.amountRub.toLocaleString("ru-RU"))} ₽` : "",
`Заказ <code>#${formatOrderId(order.id)}</code>`,
```

Добавить локальный форматтер:

```js
function formatOrderId(id) {
  return String(id || "").slice(0, 8).toUpperCase();
}
```

- [ ] **Step 4: Запустить все проверки**

Run: `npm run check`

Expected: `Status flow check passed`, остальные проверки также проходят.

- [ ] **Step 5: Зафиксировать и отправить изменение**

```bash
git add api/_lib/telegram.js scripts/check-status-flow.js docs/superpowers/plans/2026-06-22-customer-notifications.md
git commit -m "Refine customer status notifications"
git push origin main
```

- [ ] **Step 6: Проверить production**

Дождаться статуса Vercel `Ready`. На заявке `#16D81AC0` установить `processing`, затем `done` и `declined`; на каждом шаге сверить текст, сумму, короткий номер и открытие конкретного заказа.
