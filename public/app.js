const APP_BRAND = {
  name: "ЩаОплатим",
  logo: "./assets/logo-channel.png",
  support: "@support",
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
    quote: "Расчет после проверки",
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
    quote: "Расчет после проверки",
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
    quote: "Расчет после проверки",
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
    quote: "Расчет после проверки",
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
    quote: "Расчет после проверки",
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
    quote: "Расчет после проверки",
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
    quote: "Расчет после проверки",
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
    quote: "Расчет после проверки",
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
    quote: "Расчет после проверки",
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
    quote: "Расчет после проверки",
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
    quote: "Расчет после проверки",
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
    quote: "Расчет после проверки",
    tone: "games",
    category: "games",
    popular: false,
  },
];

const historyItems = [
  { title: "ChatGPT Plus", meta: "В работе · ожидаем код входа" },
  { title: "Spotify Premium", meta: "Оплачено · 28 апреля" },
  { title: "Apple Gift Card", meta: "Завершено · 19 апреля" },
];

const statusLabels = {
  new: "Новая заявка",
  pricing: "Расчет",
  waiting_payment: "Ожидает оплаты",
  processing: "В работе",
  done: "Готово",
  declined: "Отклонено",
};

const tg = window.Telegram?.WebApp;
const views = {
  catalog: document.querySelector("#catalogView"),
  order: document.querySelector("#orderView"),
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
let activeCategory = "all";

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
  historyCount.textContent = `${historyItems.length} ${formatOperationWord(historyItems.length)}`;
  timeline.innerHTML = historyItems
    .map(
      (item) => `
        <article class="timeline-item ${getTimelineTone(item.meta)}">
          <span class="timeline-dot" aria-hidden="true"></span>
          <div>
            <h3>${item.title}</h3>
            <p>${item.meta}</p>
          </div>
        </article>
      `,
    )
    .join("");
}

function getTimelineTone(meta) {
  if (/готово|завершено|оплачено/i.test(meta)) return "timeline-item--done";
  if (/ожидает|расчет|новая/i.test(meta)) return "timeline-item--pending";
  return "timeline-item--active";
}

async function loadOrders() {
  try {
    const response = await fetch("/api/orders");
    if (!response.ok) throw new Error("Orders request failed");

    const data = await response.json();
    const ownOrders = data.orders.map((order) => ({
      title: `${order.service} · ${order.plan}`,
      meta: `${statusLabels[order.status] || "Статус"} · ${formatDate(order.createdAt)}`,
    }));

    historyItems.splice(0, historyItems.length, ...ownOrders, ...getSeedHistory());
    renderHistory();
  } catch {
    renderHistory();
  }
}

function getSeedHistory() {
  return [
    { title: "ChatGPT Plus", meta: "В работе · ожидаем код входа" },
    { title: "Spotify Premium", meta: "Оплачено · 28 апреля" },
    { title: "Apple Gift Card", meta: "Завершено · 19 апреля" },
  ];
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

function formatOperationWord(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return "операция";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "операции";
  return "операций";
}

function formatServiceWord(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return "сервис";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "сервиса";
  return "сервисов";
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
  quoteValue.textContent = "Расчет после проверки";
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });

    if (!response.ok) throw new Error("Order was not saved");

    const data = await response.json();
    order.id = data.order.id;
    order.status = data.order.status;
  } catch {
    const saved = JSON.parse(localStorage.getItem("globalPayOrders") || "[]");
    saved.unshift(order);
    localStorage.setItem("globalPayOrders", JSON.stringify(saved));
  }

  if (tg) {
    tg.sendData(JSON.stringify(order));
  }

  historyItems.unshift({
    title: `${order.service} · ${order.plan}`,
    meta: "Новая заявка · расчет в чате",
  });
  renderHistory();
  showView("history");
  showToast("Заявка создана. Менеджер уточнит детали в чате.");
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => showView(tab.dataset.view));
});

document.querySelector("#startOrderButton").addEventListener("click", () => showView("order"));
document.querySelector("#customServiceButton").addEventListener("click", () => {
  selectCustomService();
});

document.querySelector("#supportButton").addEventListener("click", () => {
  showToast(`Напишите в поддержку: ${APP_BRAND.support}`);
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
