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

let orders = [];
let stats = null;
let adminAccess = null;

const adminOrders = document.querySelector("#adminOrders");
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
    const response = await fetch("/api/orders", {
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

      <div class="admin-order__actions">
        <select data-status>
          ${Object.entries(statusLabels)
            .map(
              ([value, label]) => `
                <option value="${value}" ${order.status === value ? "selected" : ""}>${label}</option>
              `,
            )
            .join("")}
        </select>
        <button class="primary-button" type="button" data-save>Сохранить</button>
      </div>
    </article>
  `;
}

async function saveOrder(card) {
  const id = card.dataset.orderId;
  const status = card.querySelector("[data-status]").value;
  const managerComment = card.querySelector("[data-manager-comment]").value;

  try {
    const response = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAdminHeaders(),
      },
      body: JSON.stringify({ status, managerComment }),
    });

    if (!response.ok) throw new Error("Не удалось сохранить заявку");

    showToast("Заявка обновлена");
    await loadAdminOrders();
  } catch (error) {
    showToast(error.message);
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

adminOrders.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save]");
  if (!saveButton) return;

  const card = event.target.closest("[data-order-id]");
  if (card) saveOrder(card);
});

adminOrders.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-password-form]");
  if (!form) return;

  event.preventDefault();
  submitPassword(form);
});

statusFilter.addEventListener("change", renderOrders);
refreshButton.addEventListener("click", loadAdminOrders);

loadAdminOrders();
