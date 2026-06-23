const statusLabels = {
  new: "Новая",
  pricing: "Расчет",
  waiting_payment: "Ожидает оплаты",
  processing: "В работе",
  done: "Готово",
  declined: "Отклонено",
};

const statusTone = {
  new: "status-pill--new",
  pricing: "status-pill--pricing",
  waiting_payment: "status-pill--waiting",
  processing: "status-pill--processing",
  done: "status-pill--done",
  declined: "status-pill--declined",
};

const statusFlow = ["new", "pricing", "waiting_payment", "processing", "done"];

let orders = [];
let stats = null;
let adminAccess = null;

const adminOrders = document.querySelector("#adminOrders");
const pricingPlans = document.querySelector("#pricingPlans");
const pricingUpdates = document.querySelector("#pricingUpdates");
const refreshPricingButton = document.querySelector("#refreshPricingButton");
const adminSummary = document.querySelector("#adminSummary");
const statusFilter = document.querySelector("#statusFilter");
const refreshButton = document.querySelector("#refreshButton");
const toast = document.querySelector("#toast");
const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

persistAdminKey();

async function loadAdminOrders() {
  try {
    const response = await fetch("/api/orders?admin=1", {
      headers: getAdminHeaders(),
    });
    if (!response.ok) {
      await handleAdminError(response);
      return;
    }

    const data = await response.json();
    orders = data.orders;
    stats = data.stats;
    renderSummary();
    renderOrders();
  } catch (error) {
    showToast(error.message);
  }
}

function getAdminHeaders() {
  return {
    "X-Telegram-Init-Data": tg?.initData || "",
    "X-Admin-Key": localStorage.getItem("shaoplatim_admin_key") || "",
    "X-Admin-Password": sessionStorage.getItem("shaoplatim_admin_password") || "",
  };
}

function persistAdminKey() {
  const url = new URL(window.location.href);
  const adminKey = url.searchParams.get("admin_key");
  if (!adminKey) return;

  localStorage.setItem("shaoplatim_admin_key", adminKey);
  url.searchParams.delete("admin_key");
  window.history.replaceState({}, "", url.toString());
}

async function handleAdminError(response) {
  const data = await response.json().catch(() => ({}));
  adminAccess = data;
  if (data.passwordRequired) {
    renderPasswordGate(data.error || "Введите пароль админки");
    return;
  }

  renderLockedState(data.error || "Нет доступа к админке", data.userId);
}

function renderPasswordGate(message = "") {
  adminSummary.innerHTML = "";
  adminOrders.innerHTML = `
    <form class="admin-empty admin-password" data-password-form>
      <h2>Вход в админку</h2>
      <p>${escapeHtml(message)}</p>
      <label class="field">
        <span>Пароль</span>
        <input type="password" name="password" placeholder="Введите пароль" autocomplete="current-password" required />
      </label>
      <button class="primary-button primary-button--wide" type="submit">Войти</button>
    </form>
  `;
}

async function submitPassword(form) {
  const password = new FormData(form).get("password");
  sessionStorage.setItem("shaoplatim_admin_password", password);
  await loadAdminOrders();
}

function renderLockedState(message, userId) {
  adminSummary.innerHTML = "";
  adminOrders.innerHTML = `
    <article class="admin-empty admin-empty--locked">
      <h2>${escapeHtml(message)}</h2>
      <p>Откройте эту страницу по кнопке из админ-чата.</p>
      ${userId ? `<p class="admin-empty__code">Ваш Telegram ID: <code>${escapeHtml(userId)}</code></p>` : ""}
    </article>
  `;
}

function renderSummary() {
  const values = [
    { label: "Всего", value: stats?.total || 0 },
    { label: "Активные", value: stats?.active || 0 },
    { label: "Готово", value: stats?.done || 0 },
  ];

  adminSummary.innerHTML = values
    .map(
      (item) => `
        <article>
          <span>${item.label}</span>
          <strong>${item.value}</strong>
        </article>
      `,
    )
    .join("");
}

function renderOrders() {
  const filteredOrders = orders.filter((order) => {
    return statusFilter.value === "all" || order.status === statusFilter.value;
  });

  if (!filteredOrders.length) {
    adminOrders.innerHTML = `
      <article class="admin-empty">
        <h2>Заявок пока нет</h2>
        <p>Когда пользователь отправит заявку из Mini App, она появится здесь.</p>
      </article>
    `;
    return;
  }

  adminOrders.innerHTML = filteredOrders.map(renderOrderCard).join("");
}

function renderOrderCard(order) {
  const username = order.customer?.username ? `@${order.customer.username}` : order.customer?.name || "Гость";

  return `
    <article class="admin-order" data-order-id="${order.id}">
      <div class="admin-order__head">
        <div>
          <span class="status-pill ${statusTone[order.status] || ""}">${statusLabels[order.status] || "Статус"}</span>
          <h2>${escapeHtml(order.service)}</h2>
          <p>${escapeHtml(order.plan)} · ${escapeHtml(order.quote || "по расчету")}</p>
        </div>
        <time>${formatDate(order.createdAt)}</time>
      </div>

      <dl class="admin-order__meta">
        <div>
          <dt>Клиент</dt>
          <dd>${escapeHtml(username)}</dd>
        </div>
        <div>
          <dt>Вход</dt>
          <dd>${escapeHtml(order.access || "Обсудить")}</dd>
        </div>
      </dl>

      <p class="admin-order__comment">${escapeHtml(order.comment || "Комментария нет")}</p>

      <label class="field">
        <span>Комментарий менеджера</span>
        <textarea rows="2" data-manager-comment>${escapeHtml(order.managerComment || "")}</textarea>
      </label>

      <label class="field">
        <span>Ссылка или реквизиты оплаты</span>
        <textarea rows="2" data-payment-details placeholder="https://... или короткие реквизиты">${escapeHtml(order.paymentDetails || "")}</textarea>
      </label>

      <div class="admin-status-flow" aria-label="Этапы заказа">
        ${statusFlow
          .map(
            (status) => `
              <button class="${getFlowButtonClass(order.status, status)}" type="button" data-set-status="${status}">
                ${statusLabels[status]}
              </button>
            `,
          )
          .join("")}
        <button class="${getFlowButtonClass(order.status, "declined")}" type="button" data-set-status="declined">
          Отклонить
        </button>
      </div>

      <div class="admin-order__actions">
        <button class="primary-button" type="button" data-save>Сохранить комментарий</button>
      </div>
    </article>
  `;
}

function getFlowButtonClass(currentStatus, status) {
  return `admin-status-button ${currentStatus === status ? "is-active" : ""} ${status === "declined" ? "admin-status-button--danger" : ""}`;
}

async function saveManagerComment(card) {
  const id = card.dataset.orderId;
  const managerComment = card.querySelector("[data-manager-comment]").value;
  const paymentDetails = card.querySelector("[data-payment-details]").value;

  try {
    const response = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAdminHeaders(),
      },
      body: JSON.stringify({ managerComment, paymentDetails }),
    });

    if (!response.ok) throw new Error("Не удалось сохранить заявку");

    showToast("Заявка обновлена");
    await loadAdminOrders();
  } catch (error) {
    showToast(error.message);
  }
}

async function saveStatus(card, status) {
  if (status === "declined" && !window.confirm("Отклонить эту заявку?")) return;

  const buttons = card.querySelectorAll("[data-set-status]");
  const managerComment = card.querySelector("[data-manager-comment]").value;
  const paymentDetails = card.querySelector("[data-payment-details]").value;
  buttons.forEach((button) => { button.disabled = true; });

  try {
    const response = await fetch(`/api/orders/${card.dataset.orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAdminHeaders(),
      },
      body: JSON.stringify({ status, managerComment, paymentDetails }),
    });
    if (!response.ok) throw new Error("Не удалось изменить статус");

    showToast(`Статус: ${statusLabels[status]}`);
    await loadAdminOrders();
  } catch (error) {
    showToast(error.message);
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadPricing() {
  try {
    const response = await fetch("/api/pricing-admin", { headers: getAdminHeaders() });
    if (!response.ok) return;
    const data = await response.json();
    renderPricing(data.plans || [], data.updates || []);
  } catch {
    showToast("Не удалось загрузить цены");
  }
}

function renderPricing(plans, updates) {
  const pending = updates.filter((item) => item.status === "pending");
  pricingUpdates.innerHTML = pending.length ? `
    <h3>Ждут решения</h3>
    ${pending.map((item) => `<article class="pricing-card pricing-card--update" data-update-id="${escapeHtml(item.id)}">
      <div><strong>${escapeHtml(item.service || item.planId)} · ${escapeHtml(item.plan || "")}</strong><small>${item.kind === "error" ? escapeHtml(item.message) : `$${item.oldPrice} → $${item.proposedPrice}`}</small></div>
      <div class="pricing-card__actions">${item.proposedPrice == null ? "" : '<button class="primary-button" type="button" data-price-action="accept">Принять</button>'}<button class="ghost-button" type="button" data-price-action="reject">Отклонить</button></div>
    </article>`).join("")}
  ` : "";
  pricingPlans.innerHTML = plans.map((plan) => `<article class="pricing-card" data-plan-id="${escapeHtml(plan.id)}">
    <div><strong>${escapeHtml(plan.service)} · ${escapeHtml(plan.name)}</strong><small>${escapeHtml(plan.sourceMode)} · ${plan.lastCheckedAt ? formatDate(plan.lastCheckedAt) : "ещё не проверялся"}</small></div>
    <label><span>USD</span><input type="number" min="0.01" max="10000" step="0.01" value="${plan.usdPrice}" data-plan-price></label>
    <button class="ghost-button" type="button" data-save-price>Сохранить</button>
  </article>`).join("");
}

async function patchPricing(payload) {
  const response = await fetch("/api/pricing-admin", { method: "PATCH", headers: { "Content-Type": "application/json", ...getAdminHeaders() }, body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Не удалось сохранить");
  await loadPricing();
}

document.addEventListener("click", async (event) => {
  const actionButton = event.target.closest("[data-price-action]");
  const savePriceButton = event.target.closest("[data-save-price]");
  try {
    if (actionButton) {
      const card = actionButton.closest("[data-update-id]");
      await patchPricing({ updateId: card.dataset.updateId, action: actionButton.dataset.priceAction });
      showToast("Изменение обработано");
    } else if (savePriceButton) {
      const card = savePriceButton.closest("[data-plan-id]");
      await patchPricing({ planId: card.dataset.planId, usdPrice: Number(card.querySelector("[data-plan-price]").value) });
      showToast("Цена сохранена");
    }
  } catch (error) {
    showToast(error.message);
  }
});

adminOrders.addEventListener("click", (event) => {
  const statusButton = event.target.closest("[data-set-status]");
  if (statusButton) {
    const card = event.target.closest("[data-order-id]");
    if (!card) return;
    saveStatus(card, statusButton.dataset.setStatus);
    return;
  }

  const saveButton = event.target.closest("[data-save]");
  if (!saveButton) return;

  const card = event.target.closest("[data-order-id]");
  if (card) saveManagerComment(card);
});

adminOrders.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-password-form]");
  if (!form) return;

  event.preventDefault();
  submitPassword(form);
});

statusFilter.addEventListener("change", renderOrders);
refreshButton.addEventListener("click", loadAdminOrders);
refreshPricingButton.addEventListener("click", loadPricing);

loadAdminOrders();
loadPricing();
