## Soft Booking UI Standard

This standard defines the mobile-first booking surface style used across discovery, professional selection, and appointment flows.
It also applies to professional-facing booking operations so dashboard coverage, services, and appointment states keep the same visual language as customer-facing screens.

### Visual language

- Use soft white surfaces with large radius `24-28px`.
- Use blush gradients for active or summary surfaces, not for every card.
- Keep action hierarchy strict:
  - accent gradient button for the active primary action
  - dark rounded button for secondary choose/select actions
  - white inset pills for metadata, filters, and supporting status
- Keep information density low:
  - one primary title
  - one supporting sentence
  - compact metadata tiles under the summary

### Interaction order

1. User scans list of services.
2. User taps one service card.
3. Service details open in a bottom dialog.
4. User configures mode and schedule inside the dialog.
5. User confirms the choice.
6. Only after confirmation does the summary/resume card appear above search and in the sticky booking bar.
7. User proceeds with the main booking CTA.
8. The same selection language carries into appointments so the service, mode, and flow remain recognizable after ordering.

### Behavior rules

- Do not auto-select the first service on arrival unless the route is explicitly deep-linked with a service query.
- Do not commit service changes while the dialog is still open. Treat dialog edits as draft state until the confirm button is pressed.
- Do not show the resume card before the user has confirmed a service selection.
- The resume card above search becomes the source of truth for "what will be booked next" only after the dialog is saved.
- The sticky booking bar must visually match the resume card and only become actionable after the choice is complete.
- Bottom dialogs must render through a portal so sticky bars do not block the final confirm action.

### Reusable tokens

Use the shared tokens in `apps/frontend/src/components/ui/tokens.ts`:

- `blushPanelClass`
- `blushSubtlePanelClass`
- `blushInputShellClass`
- `softWhitePanelClass`
- `softMetricTileClass`
- `neutralSoftPillClass`
- `accentSoftPillClass`
- `accentPrimaryButtonClass`
- `darkPrimaryButtonClass`

### First rollout

The standard is applied first to:

- explore search and discovery surfaces
- professional detail service selection
- professional detail sticky booking bar
- service catalog cards
- service detail provider cards
- appointment list and appointment detail sheets
- professional dashboard coverage and service-management surfaces that directly affect booking readiness
