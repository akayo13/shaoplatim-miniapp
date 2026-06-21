const APP_BRAND = {
  name: "ЩаОплатим",
  logo: "./assets/logo-channel.png",
  support: "@sokratmanager",
  supportUrl: "https://t.me/sokratmanager",
};

const categories = [
  { id: "all", label: "Все" },
  { id: "ai", label: "AI" },
  { id: "media", label: "Видео и музыка" },
  { id: "apple-google", label: "Apple / Google" },
  { id: "work", label: "Работа" },
  { id: "games", label: "Игры" },
];

const services = [
  {
    name: "ChatGPT",
    plan: "Plus / Team",
    note: "Продление подписки или новый аккаунт",
    icon: "AI",
    logo: "./assets/services/chatgpt.png",
    quote: "Расчет перед оплатой",
    tone: "ai",
    category: "ai",
    popular: true,
  },
  {
    name: "Spotify",
    plan: "Premium",
    note: "Индивидуальный или семейный тариф",
    icon: "SP",
    logo: "./assets/services/spotify.svg",
    quote: "Расчет перед оплатой",
    tone: "music",
    category: "media",
    popular: true,
  },
  {
    name: "Netflix",
    plan: "Basic / Standard",
    note: "Оплата профиля или подарочная карта",
    icon: "NF",
    logo: "./assets/services/netflix.svg",
    quote: "Расчет перед оплатой",
    tone: "cinema",
    category: "media",
    popular: true,
  },
  {
    name: "Apple",
    plan: "iCloud / Gift Card",
    note: "Пополнение баланса Apple ID",
    icon: "AP",
    logo: "./assets/services/apple.png",
    quote: "Расчет перед оплатой",
    tone: "apple",
    category: "apple-google",
    popular: true,
  },
  {
    name: "Google",
    plan: "One / Play",
    note: "Подписки и цифровые покупки",
    icon: "G",
    logo: "./assets/services/google.svg",
    quote: "Расчет перед оплатой",
    tone: "google",
    category: "apple-google",
    popular: true,
  },
  {
    name: "Canva",
    plan: "Pro",
    note: "Продление рабочих аккаунтов",
    icon: "CV",
    logo: "./assets/services/canva.svg",
    quote: "Расчет перед оплатой",
    tone: "design",
    category: "work",
    popular: true,
  },
  {
    name: "YouTube",
    plan: "Premium / Music",
    note: "Индивидуальные и семейные подписки",
    icon: "YT",
    logo: "./assets/services/youtube.svg",
    quote: "Расчет перед оплатой",
    tone: "video",
    category: "media",
    popular: false,
  },
  {
    name: "Adobe",
    plan: "Creative Cloud",
    note: "Продление рабочих аккаунтов",
    icon: "AD",
    logo: "./assets/services/adobe.svg",
    quote: "Расчет перед оплатой",
    tone: "design",
    category: "work",
    popular: false,
  },
  {
    name: "Notion",
    plan: "Plus / AI",
    note: "Рабочие пространства и AI-дополнения",
    icon: "NO",
    logo: "./assets/services/notion.svg",
    quote: "Расчет перед оплатой",
    tone: "work",
    category: "work",
    popular: false,
  },
  {
    name: "Midjourney",
    plan: "Basic / Standard",
    note: "Подписки для генерации изображений",
    icon: "MJ",
    logo: "./assets/services/midjourney.svg",
    quote: "Расчет перед оплатой",
    tone: "ai",
    category: "ai",
    popular: false,
  },
  {
    name: "PlayStation",
    plan: "PS Plus / Wallet",
    note: "Пополнение баланса и игровые подписки",
    icon: "PS",
    logo: "./assets/services/playstation.svg",
    quote: "Расчет перед оплатой",
    tone: "games",
    category: "games",
    popular: false,
  },
  {
    name: "Steam",
    plan: "Wallet / Gift",
    note: "Пополнение баланса и цифровые покупки",
    icon: "ST",
    logo: "./assets/services/steam.svg",
    quote: "Расчет перед оплатой",
    tone: "games",
    category: "games",
    popular: false,
  },
];

const historyItems = [];

const statusLabels = {
  new: "Новая заявка",
  pricing: "Расчет",
  waiting_payment: "Ожидает оплаты",
  processing: "В работе",
  done: "Готово",
  declined: "Отклонено",
};

const statusSteps = [
  { id: "new", label: "Заявка" },
  { id: "pricing", label: "Расчет" },
  { id: "waiting_payment", label: "Оплата" },
  { id: "processing", label: "В работе" },
  { id: "done", label: "Готово" },
];

const tg = window.Telegram?.WebApp;
const views = {
  catalog: document.querySelector("#catalogView"),
  order: document.querySelector("#orderView"),
  success: document.querySelector("#successView"),
  payment: document.querySelector("#paymentView"),
  history: document.querySelector("#historyView"),
  profile: document.querySelector("#profileView"),
};

const popularServiceGrid = document.querySelector("#popularServiceGrid");
const serviceList = document.querySelector("#serviceList");
const serviceSearchInput = document.querySelector("#serviceSearchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const catalogCount = document.querySelector("#catalogCount");
const orderServiceList = document.querySelector("#orderServiceList");
const timeline = document.querySelector("#timeline");
const toast = document.querySelector("#toast");
const serviceInput = document.querySelector("#serviceInput");
const customServiceInput = document.querySelector("#customServiceInput");
const customServiceField = document.querySelector("#customServiceField");
const selectedServiceSummary = document.querySelector("#selectedServiceSummary");
const selectedServiceIcon = document.querySelector("#selectedServiceIcon");
const selectedServiceName = document.querySelector("#selectedServiceName");
const selectedServicePlan = document.querySelector("#selectedServicePlan");
const planInput = document.querySelector("#planInput");
const quoteValue = document.querySelector("#quoteValue");
const profileName = document.querySelector("#profileName");
const profileAvatar = document.querySelector("#profileAvatar");
const orderForm = document.querySelector("#orderForm");
const historyCount = document.querySelector("#historyCount");
const successOrderId = document.querySelector("#successOrderId");
const successOrderService = document.querySelector("#successOrderService");
const successOrderStatus = document.querySelector("#successOrderStatus");
const successHistoryButton = document.querySelector("#successHistoryButton");
const successNewOrderButton = document.querySelector("#successNewOrderButton");
const paymentOrderId = document.querySelector("#paymentOrderId");
const paymentService = document.querySelector("#paymentService");
const paymentAmount = document.querySelector("#paymentAmount");
const paymentPrimaryButton = document.querySelector("#paymentPrimaryButton");
const paymentBackButton = document.querySelector("#paymentBackButton");
const profileSupportButton = document.querySelector("#profileSupportButton");
let activeCategory = "all";
let selectedPaymentOrder = null;

function initTelegram() {
  if (!tg) return;

  tg.ready();
  tg.expand();
  tg.MainButton.setText("Отправить заявку");
  tg.MainButton.hide();

  const user = tg.initDataUnsafe?.user;
  if (user?.first_name) {
    profileName.textContent = user.first_name;
  }
  renderProfileAvatar(user);

  document.documentElement.style.setProperty("--tg-bg", tg.themeParams?.bg_color || "#050607");
}

function renderServices() {
  popularServiceGrid.innerHTML = services
    .filter((service) => service.popular)
    .map(
      (service) => `
        <button class="service-card service-card--${service.tone}" type="button" data-service="${service.name}">
          <span class="service-card__icon">
            ${renderServiceIcon(service)}
          </span>
          <h3>${service.name}</h3>
          <p>${service.note}</p>
          <span class="service-card__plan">${service.plan}</span>
        </button>
      `,
    )
    .join("");
}

function renderCatalog() {
  const query = serviceSearchInput.value.trim().toLowerCase();
  const filteredServices = services.filter((service) => {
    const matchesCategory = activeCategory === "all" || service.category === activeCategory;
    const matchesQuery = [service.name, service.plan, service.note].join(" ").toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  catalogCount.textContent = `${filteredServices.length} ${formatServiceWord(filteredServices.length)}`;
  serviceList.innerHTML = filteredServices.length
    ? filteredServices.map(renderServiceRow).join("")
    : `
      <div class="catalog-empty">
        <strong>Не нашли сервис?</strong>
        <p>Оставьте заявку через «Другой сервис», и мы проверим возможность оплаты.</p>
        <button class="text-button" type="button" data-service="custom">Другой сервис</button>
      </div>
    `;
}

function renderCategoryFilter() {
  categoryFilter.innerHTML = categories
    .map(
      (category) => `
        <button class="category-chip ${category.id === activeCategory ? "is-active" : ""}" type="button" data-category="${category.id}">
          ${category.label}
        </button>
      `,
    )
    .join("");
}

function renderServiceRow(service) {
  return `
    <button class="service-row service-card--${service.tone}" type="button" data-service="${service.name}">
      <span class="service-row__icon">${renderServiceIcon(service)}</span>
      <span class="service-row__body">
        <strong>${service.name}</strong>
        <small>${service.note}</small>
      </span>
      <span class="service-row__plan">${service.plan}</span>
    </button>
  `;
}

function renderServiceIcon(service) {
  return service.logo ? `<img src="${service.logo}" alt="" />` : `<span>${service.icon}</span>`;
}

function renderOrderServices() {
  orderServiceList.innerHTML = [
    ...services.map(
      (service) => `
        <button class="order-service-option service-card--${service.tone}" type="button" data-service="${service.name}">
          <span class="order-service-option__icon">
            ${renderServiceIcon(service)}
          </span>
          <span>
            <strong>${service.name}</strong>
            <small>${service.plan}</small>
          </span>
        </button>
      `,
    ),
    `
      <button class="order-service-option order-service-option--custom" type="button" data-service="custom">
        <span class="order-service-option__icon">+</span>
        <span>
          <strong>Другой сервис</strong>
          <small>Укажем вручную</small>
        </span>
      </button>
    `,
  ].join("");
}

function renderProfileAvatar(user) {
  const name = user?.first_name || profileName.textContent || "Гость";
  const initial = name.trim().charAt(0).toUpperCase() || "Г";

  if (user?.photo_url) {
    profileAvatar.innerHTML = `<img src="${user.photo_url}" alt="" />`;
    profileAvatar.classList.add("profile-avatar--image");
    return;
  }

  profileAvatar.textContent = initial;
  profileAvatar.classList.remove("profile-avatar--image");
}

function renderHistory() {
  historyCount.textContent = `${historyItems.length} ${formatOrderWord(historyItems.length)}`;

  if (!historyItems.length) {
    timeline.innerHTML = `
      <div class="history-empty">
        <strong>Пока заказов не было</strong>
        <p>Когда вы оформите первую заявку, ее статус появится здесь.</p>
        <button class="text-button" type="button" data-action="start-order">Оформить заявку</button>
      </div>
    `;
    return;
  }

  timeline.innerHTML = historyItems.map(renderHistoryItem).join("");
}

function renderHistoryItem(item) {
  const service = getService(item.service);
  const orderId = formatOrderId(item.id);
  const status = item.status || "new";
  const isPaymentReady = status === "waiting_payment";

  return `
    <article class="order-card ${getTimelineTone(status)}">
      <div class="order-card__top">
        <span class="order-card__icon ${service ? `service-card--${service.tone}` : ""}">
          ${service ? renderServiceIcon(service) : `<span>${getInitials(item.service)}</span>`}
        </span>
        <div class="order-card__title">
          <h3>${escapeHtml(item.service)}</h3>
          <p>${escapeHtml(item.plan || "Тариф уточняется")}</p>
        </div>
        <span class="status-pill ${getStatusPillClass(status)}">${statusLabels[status] || "Статус"}</span>
      </div>

      <div class="order-card__meta">
        <div>
          <span>Номер</span>
          <strong>#${orderId}</strong>
        </div>
        <div>
          <span>Создан</span>
          <strong>${formatDate(item.createdAt)}</strong>
        </div>
      </div>

      <div class="order-progress" aria-label="Статус заказа">
        ${renderOrderProgress(status)}
      </div>

      <div class="order-card__footer">
        <p>${escapeHtml(getNextStepText(status))}</p>
        <button class="pay-button" type="button" data-action="pay-order" data-order-id="${escapeHtml(item.id || "")}" ${isPaymentReady ? "" : "disabled"}>
          ${isPaymentReady ? "Оплатить" : getPaymentButtonLabel(status)}
        </button>
      </div>
    </article>
  `;
}

function renderOrderProgress(status) {
  if (status === "declined") {
    return `
      <span class="order-progress__step is-declined">
        <i></i>
        Отклонено
      </span>
    `;
  }

  const activeIndex = Math.max(0, statusSteps.findIndex((step) => step.id === status));

  return statusSteps
    .map(
      (step, index) => `
        <span class="order-progress__step ${index <= activeIndex ? "is-active" : ""}">
          <i></i>
          ${step.label}
        </span>
      `,
    )
    .join("");
}

function renderOrderSuccess(order) {
  const orderId = formatOrderId(order.id);

  successOrderId.textContent = `#${orderId}`;
  successOrderService.textContent = `${order.service} · ${order.plan}`;
  successOrderStatus.textContent = statusLabels[order.status] || "Новая заявка";
}

function renderPaymentDraft(order) {
  selectedPaymentOrder = order;
  paymentOrderId.textContent = `#${formatOrderId(order.id)}`;
  paymentService.textContent = `${order.service} · ${order.plan}`;
  paymentAmount.textContent = order.amount ? formatMoney(order.amount) : "Сумма появится после расчета";
}

function getTimelineTone(status) {
  if (status === "done") return "timeline-item--done";
  if (["new", "pricing", "waiting_payment"].includes(status)) return "timeline-item--pending";
  return "timeline-item--active";
}

async function loadOrders() {
  const user = tg?.initDataUnsafe?.user;
  if (!user?.id) {
    historyItems.splice(0, historyItems.length, ...getLocalOrders());
    renderHistory();
    return;
  }

  try {
    const response = await fetch("/api/orders", {
      headers: { "X-Telegram-Init-Data": tg.initData },
    });
    if (!response.ok) throw new Error("Orders request failed");

    const data = await response.json();
    const ownOrders = data.orders.map(normalizeHistoryOrder);

    historyItems.splice(0, historyItems.length, ...ownOrders);
    renderHistory();
  } catch {
    historyItems.splice(0, historyItems.length, ...getLocalOrders());
    renderHistory();
  }
}

function getLocalOrders() {
  return JSON.parse(localStorage.getItem("globalPayOrders") || "[]").map(normalizeHistoryOrder);
}

function normalizeHistoryOrder(order) {
  return {
    id: order.id || createLocalOrderId(),
    service: order.service || "Другой сервис",
    plan: order.plan || "Тариф уточняется",
    quote: order.quote || "Расчет перед оплатой",
    access: order.access || "Уточнить способ",
    comment: order.comment || "",
    status: order.status || "new",
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
  };
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "сегодня";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatOrderWord(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return "заказ";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "заказа";
  return "заказов";
}

function formatServiceWord(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return "сервис";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "сервиса";
  return "сервисов";
}

function formatOrderId(id) {
  return id ? String(id).replace(/^local-/, "").slice(0, 8).toUpperCase() : "НОВЫЙ";
}

function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getInitials(value) {
  return String(value || "?").trim().slice(0, 2).toUpperCase();
}

function getStatusPillClass(status) {
  if (status === "waiting_payment") return "status-pill--waiting";
  if (status === "processing") return "status-pill--processing";
  if (status === "done") return "status-pill--done";
  if (status === "declined") return "status-pill--declined";
  return "status-pill--new";
}

function getNextStepText(status) {
  const messages = {
    new: "Заявка создана. Следующий шаг появится здесь после расчета.",
    pricing: "Расчет формируется. После подтверждения откроется оплата.",
    waiting_payment: "Расчет готов. Оплату можно будет выполнить внутри сервиса.",
    processing: "Оплата принята. Заказ находится в работе.",
    done: "Заказ выполнен. Детали сохраняются в истории.",
    declined: "Заказ не может быть выполнен. Можно оформить новую заявку.",
  };

  return messages[status] || messages.new;
}

function getPaymentButtonLabel(status) {
  if (status === "done") return "Оплачено";
  if (status === "processing") return "В работе";
  if (status === "declined") return "Недоступно";
  return "Ожидает расчета";
}

function showView(viewName, options = { scroll: true }) {
  Object.entries(views).forEach(([name, view]) => {
    view.classList.toggle("is-active", name === viewName);
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.view === viewName);
  });

  if (tg) {
    if (viewName === "order") {
      tg.MainButton.show();
    } else {
      tg.MainButton.hide();
    }
  }

  if (viewName === "order") trackEvent("order_started");

  if (options.scroll) {
    window.requestAnimationFrame(() => {
      views[viewName].scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function getService(name) {
  return services.find((service) => service.name === name);
}

function selectServiceByName(name, options = { openOrder: true }) {
  if (name === "custom") {
    selectCustomService(options);
    return;
  }

  const service = getService(name);
  if (!service) return;

  serviceInput.value = service.name;
  planInput.value = service.plan;
  quoteValue.textContent = service.quote;
  customServiceInput.value = "";
  customServiceField.classList.add("is-hidden");
  selectedServiceIcon.innerHTML = renderServiceIcon(service);
  selectedServiceName.textContent = service.name;
  selectedServicePlan.textContent = service.plan;
  selectedServiceSummary.className = `selected-service service-card--${service.tone} is-selected`;
  updateSelectedService(name);

  if (options.openOrder) showView("order");
}

function selectCustomService(options = { openOrder: true }) {
  serviceInput.value = "";
  planInput.value = "";
  quoteValue.textContent = "Расчет перед оплатой";
  customServiceField.classList.remove("is-hidden");
  selectedServiceIcon.textContent = "+";
  selectedServiceName.textContent = "Другой сервис";
  selectedServicePlan.textContent = "Укажите название ниже";
  selectedServiceSummary.className = "selected-service selected-service--custom is-selected";
  updateSelectedService("custom");

  if (options.openOrder) showView("order");
  window.requestAnimationFrame(() => customServiceInput.focus());
}

function updateSelectedService(name) {
  document.querySelectorAll("[data-service]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.service === name);
  });
}

function selectService(card) {
  selectServiceByName(card.dataset.service);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function collectOrderData() {
  const formData = new FormData(orderForm);
  const user = tg?.initDataUnsafe?.user;

  return {
    service: formData.get("service"),
    plan: formData.get("plan"),
    access: formData.get("access"),
    comment: formData.get("comment"),
    quote: quoteValue.textContent,
    customer: {
      id: user?.id || null,
      name: user?.first_name || profileName.textContent || "Гость",
      username: user?.username || "",
    },
    createdAt: new Date().toISOString(),
  };
}

async function submitOrder() {
  if (!validateSelectedService()) return;
  if (!orderForm.reportValidity()) return;

  const order = collectOrderData();

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Init-Data": tg?.initData || "",
      },
      body: JSON.stringify(order),
    });

    if (!response.ok) throw new Error("Order was not saved");

    const data = await response.json();
    order.id = data.order.id;
    order.status = data.order.status;
  } catch {
    showToast("Не удалось отправить заявку. Попробуйте ещё раз.");
    return;
  }

  if (tg) {
    tg.sendData(JSON.stringify(order));
  }

  order.status = order.status || "new";
  trackEvent("order_submitted");

  historyItems.unshift({
    ...normalizeHistoryOrder(order),
  });
  renderHistory();
  renderOrderSuccess(order);
  showView("success");
  showToast("Заявка создана.");
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => showView(tab.dataset.view));
});

document.querySelector("#startOrderButton").addEventListener("click", () => showView("order"));
document.querySelector("#customServiceButton").addEventListener("click", () => {
  selectCustomService();
});

document.querySelector("#supportButton").addEventListener("click", () => {
  openSupport();
});

profileSupportButton.addEventListener("click", () => {
  openSupport();
});

orderForm.addEventListener("click", (event) => {
  const button = event.target.closest("[data-open-info]");
  if (!button) return;

  const target = document.querySelector(button.dataset.openInfo === "terms" ? "#serviceTerms" : "#privacyInfo");
  showView("profile", { scroll: false });
  target.open = true;
  window.requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
});

popularServiceGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".service-card");
  if (card) selectService(card);
});

serviceList.addEventListener("click", (event) => {
  const item = event.target.closest("[data-service]");
  if (item) selectServiceByName(item.dataset.service);
});

categoryFilter.addEventListener("click", (event) => {
  const chip = event.target.closest(".category-chip");
  if (!chip) return;

  activeCategory = chip.dataset.category;
  renderCategoryFilter();
  renderCatalog();
});

serviceSearchInput.addEventListener("input", renderCatalog);

timeline.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action='start-order']");
  if (button) showView("order");

  const payButton = event.target.closest("[data-action='pay-order']");
  if (payButton) {
    const order = historyItems.find((item) => item.id === payButton.dataset.orderId);
    if (!order) return;
    trackEvent("payment_opened");
    renderPaymentDraft(order);
    showView("payment");
  }
});

paymentPrimaryButton.addEventListener("click", () => {
  if (!selectedPaymentOrder) return;
  showToast("Эквайринг подключим на следующем этапе.");
});

paymentBackButton.addEventListener("click", () => showView("history"));

successHistoryButton.addEventListener("click", () => showView("history"));

successNewOrderButton.addEventListener("click", () => {
  orderForm.reset();
  serviceInput.value = "";
  customServiceInput.value = "";
  customServiceInput.setCustomValidity("");
  customServiceField.classList.add("is-hidden");
  quoteValue.textContent = "Расчет перед оплатой";
  selectedServiceIcon.textContent = "?";
  selectedServiceName.textContent = "Сервис не выбран";
  selectedServicePlan.textContent = "Выберите вариант выше или нажмите «Другой сервис»";
  selectedServiceSummary.className = "selected-service";
  updateSelectedService("");
  showView("catalog");
});

orderServiceList.addEventListener("click", (event) => {
  const option = event.target.closest(".order-service-option");
  if (option) selectServiceByName(option.dataset.service, { openOrder: false });
});

customServiceInput.addEventListener("input", () => {
  const value = customServiceInput.value.trim();
  serviceInput.value = value;
  selectedServiceName.textContent = value || "Другой сервис";
  customServiceInput.setCustomValidity("");
});

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitOrder();
});

if (tg) {
  tg.MainButton.onClick(submitOrder);
}

initTelegram();
trackEvent("app_opened");
renderServices();
renderCategoryFilter();
renderCatalog();
renderOrderServices();
if (!tg) renderProfileAvatar();
loadOrders();

function validateSelectedService() {
  if (!serviceInput.value.trim()) {
    showToast("Выберите сервис из списка или укажите другой.");

    if (!customServiceField.classList.contains("is-hidden")) {
      customServiceInput.setCustomValidity("Укажите название сервиса.");
      customServiceInput.reportValidity();
    }

    return false;
  }

  customServiceInput.setCustomValidity("");
  return true;
}

function createLocalOrderId() {
  return window.crypto?.randomUUID?.() || `local-${Date.now()}`;
}

function openSupport() {
  trackEvent("support_opened");
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(APP_BRAND.supportUrl);
    return;
  }

  window.open(APP_BRAND.supportUrl, "_blank", "noopener");
}

function trackEvent(name) {
  window.va?.("event", { name });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
