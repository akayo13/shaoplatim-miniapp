const APP_BRAND = {
  name: "ЩаОплатим",
  logo: "./assets/logo-channel.png",
  support: "@support",
};

const services = [
  {
    name: "ChatGPT",
    plan: "Plus / Team",
    note: "Продление подписки или новый аккаунт",
    icon: "AI",
    logo: "./assets/services/chatgpt.svg",
    quote: "от 2 450 ₽",
    tone: "ai",
  },
  {
    name: "Spotify",
    plan: "Premium",
    note: "Индивидуальный или семейный тариф",
    icon: "SP",
    logo: "./assets/services/spotify.svg",
    quote: "от 690 ₽",
    tone: "music",
  },
  {
    name: "Netflix",
    plan: "Basic / Standard",
    note: "Оплата профиля или подарочная карта",
    icon: "NF",
    logo: "./assets/services/netflix.svg",
    quote: "от 1 150 ₽",
    tone: "cinema",
  },
  {
    name: "Apple",
    plan: "iCloud / Gift Card",
    note: "Пополнение баланса Apple ID",
    icon: "AP",
    logo: "./assets/services/apple.svg",
    quote: "по расчету",
    tone: "apple",
  },
  {
    name: "Google",
    plan: "One / Play",
    note: "Подписки и цифровые покупки",
    icon: "G",
    logo: "./assets/services/google.svg",
    quote: "по расчету",
    tone: "google",
  },
  {
    name: "Canva",
    plan: "Pro",
    note: "Продление рабочих аккаунтов",
    icon: "CV",
    logo: "./assets/services/canva.svg",
    quote: "от 1 290 ₽",
    tone: "design",
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

const serviceGrid = document.querySelector("#serviceGrid");
const timeline = document.querySelector("#timeline");
const toast = document.querySelector("#toast");
const serviceInput = document.querySelector("#serviceInput");
const planInput = document.querySelector("#planInput");
const quoteValue = document.querySelector("#quoteValue");
const profileName = document.querySelector("#profileName");
const orderForm = document.querySelector("#orderForm");
const historyCount = document.querySelector("#historyCount");

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

  document.documentElement.style.setProperty("--tg-bg", tg.themeParams?.bg_color || "#050607");
}

function renderServices() {
  serviceGrid.innerHTML = services
    .map(
      (service) => `
        <button class="service-card service-card--${service.tone}" type="button" data-service="${service.name}" data-plan="${service.plan}" data-quote="${service.quote}">
          <span class="service-card__icon">
            <img src="${service.logo}" alt="" />
          </span>
          <span class="service-card__quote">${service.quote}</span>
          <h3>${service.name}</h3>
          <p>${service.note}</p>
          <span class="service-card__plan">${service.plan}</span>
        </button>
      `,
    )
    .join("");
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

function selectService(card) {
  serviceInput.value = card.dataset.service;
  planInput.value = card.dataset.plan;
  quoteValue.textContent = card.dataset.quote;
  showView("order");
  serviceInput.focus();
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
document.querySelector("#showHistoryButton").addEventListener("click", () => showView("history"));
document.querySelector("#customServiceButton").addEventListener("click", () => {
  serviceInput.value = "";
  planInput.value = "";
  quoteValue.textContent = "Расчет после проверки";
  showView("order");
  serviceInput.focus();
});

document.querySelector("#supportButton").addEventListener("click", () => {
  showToast(`Напишите в поддержку: ${APP_BRAND.support}`);
});

serviceGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".service-card");
  if (card) selectService(card);
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
loadOrders();
