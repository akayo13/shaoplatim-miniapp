# Compact order form design

## Goal

Reduce visual noise in the order form without changing the current visual identity or order fields.

## Behavior

- When a customer enters the form after choosing a catalog service, hide the full service picker.
- Show the existing selected-service card with a small `Изменить` button.
- Clicking `Изменить` reveals the full service picker.
- Selecting any service, including `Другой сервис`, hides the picker again.
- Opening the `Заявка` tab without a selected service shows the picker immediately.
- Starting a new order resets the selection and shows the picker.

## Visual treatment

- Keep the existing glass style, colors, service cards, and form fields.
- Place the change button inside the selected-service card header area.
- Do not add a wizard, modal, dependency, or new animation.

## Verification

- Add a small source-level check for the picker toggle controls and state classes.
- Run the existing `npm run check` command.
- Verify both entry paths locally: from the catalog and directly through the `Заявка` tab.
