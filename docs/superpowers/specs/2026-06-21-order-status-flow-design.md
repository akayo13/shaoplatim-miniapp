# Order Status Flow Design

## Goal

Make order progress clear to customers and reduce the number of actions needed to process an order. Payment integration is outside this change.

## Customer experience

- Send a Telegram message when an order enters `waiting_payment`, `processing`, `done`, or `declined`.
- Do not notify for `new` or `pricing`.
- Do not send a duplicate when the saved status did not change.
- Each message contains the order number, service, new status, a short next-step sentence, and an “Open order” button when `MINI_APP_LINK` is configured.
- A Telegram delivery failure must not roll back or fail the saved status change.
- Reload customer orders whenever the History view opens.
- Add a compact manual refresh button to the History view. Keep the current local-order fallback when the API is unavailable.

## Admin experience

- Clicking a status-flow button immediately sends a status-only PATCH request.
- Disable the card's status buttons while that request is pending, then reload the order list and show the existing toast.
- Require a native confirmation dialog before sending `declined` from the web admin.
- Keep manager comments as a separate explicit save action so a draft comment is not sent with a quick status change.
- Remove the duplicate status select from the save area; the remaining save button saves the manager comment only.
- Telegram admin buttons continue changing status in one click and use the same customer-notification function.

## Server flow

Add one customer-notification helper beside the existing Telegram helpers. Both production status mutation paths call it after a successful database update:

1. The admin `PATCH /api/orders/:id` handler compares the previous and requested statuses, updates the order, then attempts notification only for an actual status change.
2. The Telegram webhook reads the existing order before updating it, updates the status, edits the admin message, then attempts the same notification only for an actual change.

Notification errors are caught and logged in the caller after the status is saved. Admin and webhook responses still report the successful status update.

The local development server should mirror the production behavior where practical so the local UI remains testable, but it must not require live Telegram delivery for local use.

## Message copy

- `waiting_payment`: “Расчёт готов. Откройте заказ, чтобы проверить сумму и продолжить оплату.”
- `processing`: “Заказ принят в работу. Сообщим, когда всё будет готово.”
- `done`: “Заказ выполнен. Спасибо, что выбрали ЩаОплатим.”
- `declined`: “Заказ не удалось выполнить. Откройте заказ или напишите в поддержку.”

## Error handling and safety

- Status requests keep existing admin authentication and status validation.
- UI buttons are restored after either success or failure.
- A failed request leaves the current card unchanged and shows an error toast.
- Customer messages never include manager comments, access details, or other sensitive order fields.

## Verification

A small runnable check verifies:

- exactly the four approved statuses have customer message copy;
- duplicate status changes are guarded;
- both production mutation paths invoke the shared notification helper;
- History reload and manual refresh are wired;
- web-admin rejection requires confirmation and quick status actions do not include manager comments.

Run the existing full `npm run check` command after implementation.
