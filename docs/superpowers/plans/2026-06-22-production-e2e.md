# Production E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Проверить production-путь заказа и Telegram-уведомлений без реальной оплаты.

**Architecture:** Пользователь создаёт одну настоящую тестовую заявку через Telegram Mini App. Проверка выполняется через существующие админские кнопки статусов и клиентскую историю; код и схема данных не меняются.

**Tech Stack:** Telegram Mini App, Telegram Bot API, Vercel Functions, Neon Postgres.

---

### Task 1: Создать тестовую заявку

**Files:**
- No code changes.

- [ ] Открыть production Mini App из бота в Telegram.
- [ ] Выбрать `ChatGPT` → `Plus — 1 месяц`.
- [ ] Указать комментарий `E2E TEST — НЕ ВЫПОЛНЯТЬ` и отправить заявку.
- [ ] Передать ID заявки в текущий чат Codex.

Expected: заявка отображается в истории клиента и приходит в админ-чат.

### Task 2: Прогнать статусы

**Files:**
- No code changes unless the production flow reveals a defect.

- [ ] В админке установить `Расчёт` и сверить сумму.
- [ ] Установить `Ожидает оплаты`; проверить сообщение клиенту и историю.
- [ ] Установить `В работе`; проверить сообщение клиенту и историю.
- [ ] Установить `Готово`; проверить сообщение клиенту и историю.
- [ ] Установить `Отклонено`, комментарий менеджера `E2E завершён`; проверить последнее сообщение и историю.

Expected: один и тот же ID и сумма сохраняются на каждом шаге, статусы совпадают во всех поверхностях.

### Task 3: Зафиксировать результат

**Files:**
- Modify only if a defect is found: the smallest responsible production file plus its existing runnable check.

- [ ] Если ошибок нет, записать результат в чат без изменения кода.
- [ ] Если есть ошибка, остановиться на первом сбое и сообщить ожидаемое и фактическое поведение до исправления.
