# Catalog Ruble Prices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Показывать серверно рассчитанную минимальную рублёвую цену сервиса прямо в каталоге.

**Architecture:** `GET /api/catalog` получает активные тарифы и текущий курс, добавляет каждому тарифу `amountRub`, а при ошибке курса возвращает тарифы без суммы. Клиент группирует тарифы по сервису, выбирает минимальный `amountRub` и показывает его в существующих карточках.

**Tech Stack:** CommonJS, Vercel Functions, vanilla JavaScript, CSS.

---

### Task 1: Серверный ориентир цены

**Files:**
- Modify: `api/_lib/pricing.js`
- Modify: `api/catalog.js`
- Modify: `server.js`
- Modify: `scripts/check-pricing.js`

- [ ] **Step 1: Добавить падающую проверку**

В `scripts/check-pricing.js` проверить:

```js
assert.equal(getMinimumRubPrice([
  { service: "ChatGPT", amountRub: 2460 },
  { service: "ChatGPT", amountRub: 24580 },
], "ChatGPT"), 2460);
assert.equal(getMinimumRubPrice([], "ChatGPT"), null);
```

- [ ] **Step 2: Запустить проверку**

Run: `node scripts/check-pricing.js`
Expected: FAIL, `getMinimumRubPrice is not a function`.

- [ ] **Step 3: Добавить минимальную функцию**

В `api/_lib/pricing.js`:

```js
function getMinimumRubPrice(plans, service) {
  const prices = plans.filter((plan) => plan.service === service && Number.isFinite(plan.amountRub)).map((plan) => plan.amountRub);
  return prices.length ? Math.min(...prices) : null;
}
```

Экспортировать её. В `api/catalog.js` получить `getCurrentRate()`, применить `calculateRubTotal(plan.usdPrice, rate.rate).total` и добавить `amountRub`. Ошибку курса проглотить с `console.error`, вернув исходные тарифы. В `server.js` добавить демо-`amountRub` по курсу 90.

- [ ] **Step 4: Проверить**

Run: `node scripts/check-pricing.js && npm run check`
Expected: `Pricing check passed`, exit 0.

### Task 2: Цена в адаптивном каталоге

**Files:**
- Modify: `public/app.js`
- Modify: `public/styles.css`

- [ ] **Step 1: Вывести минимальную цену**

Добавить helper:

```js
function renderServicePrice(serviceName) {
  const prices = catalogPlans.filter((plan) => plan.service === serviceName && Number.isFinite(plan.amountRub)).map((plan) => plan.amountRub);
  return prices.length ? `от ${Math.min(...prices).toLocaleString("ru-RU")} ₽` : "Расчёт менеджером";
}
```

Использовать его в `renderServices()` и `renderServiceRow()`. После `loadCatalog()` повторно вызвать `renderServices()` и `renderCatalog()`.

- [ ] **Step 2: Защитить мобильный layout**

Добавить `.service-price` с `white-space: nowrap`; на узком экране размещать цену отдельной строкой. Текстовый контейнер получает `min-width: 0`.

- [ ] **Step 3: Проверить и опубликовать**

Run: `npm run check && git diff --check`
Expected: exit 0. Затем проверить каталог в браузере на обычной и мобильной ширине, commit, push и дождаться успешного Vercel deployment.
