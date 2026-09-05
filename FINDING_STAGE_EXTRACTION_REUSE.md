# Finding — Stage extraction pattern: stage-specific hooks vs. a shared generic hook

**Issue:** #180 ([Q4] Call List: adopt the extraction pattern) — child of spec #174.
**Date:** 2026-09-05
**Status:** Decision recorded. Default kept: **stage-specific**. Revisit trigger defined below.

## Context

The Booking pilot (#175–#178) established a four-part extraction shape for a stage page:

| Part | Booking artifact |
|---|---|
| Action-handler hook | `src/app/(app)/booking/useBookingPageActions.ts` |
| Shared reorder dialog | `src/components/shared/ReorderReasonDialog.tsx` (parameterized, adopted) |
| Toolbar component | `src/components/booking/BookingToolbar.tsx` |
| Modal-state hook | `src/app/(app)/booking/useBookingModals.ts` |

Call List (#180) is the **second** stage to adopt it, which is the point at which the spec asks
whether cross-stage reuse of the *hooks* (not the already-shared dialog/builders) is warranted.

We now have **three** data points for the action-handler hook:

- `src/app/(app)/orders/useOrdersPageHandlers.ts` (pre-pattern, ~525 LOC)
- `src/app/(app)/booking/useBookingPageActions.ts` (~113 LOC)
- `src/app/(app)/call-list/useCallListPageActions.ts` (~121 LOC, this ticket)

## Evidence

### What is genuinely identical across Booking and Call List (plumbing)

- **Param object shape:** `{ applyCommand, effectiveRows, selectedRows, setSelectedRows }`.
- **`handleUpdateOrder`:** identical body — `applyCommand({ type: "patchRow", … })` with `previousValues: {}`,
  returns `Promise.resolve()`. Only the stage string literal differs.
- **`handleSendToArchive`:** identical body — `ids.flatMap` row resolution (drops unknown ids), then
  `for (const cmd of buildSendToArchiveCommands(rows, reason, <stage>)) applyCommand(cmd)`.
- **`handleUpdatePartStatus`:** identical — empty-selection guard, `forEach` patch via `handleUpdateOrder`,
  success toast. (Orders' version is unrelated — it also does VIN auto-move to Call List.)

That is ~40% of each hook by line count.

### What differs and is load-bearing

| Axis | Booking | Call List |
|---|---|---|
| Stage literal | `"booking"` (typed enum member, appears ~6×) | `"call"` |
| Reorder builder | `buildReorderCommands(rows, "booking", reason)` | `buildReorderCommands(rows, "call", reason)` |
| "Calendar" action | `buildRebookingCommands` (reschedule in place) | `buildBookingCommands` (send **to** Booking) |
| Handler count | 6 | 7 (adds `handleDelete` empty-selection **gate** with its own `toast.error("Please select at least one row")`, kept per AC even though the button is also `disabled`) |
| "Calendar" confirm handler | rebooking: guards `if (selectedRows.length === 0) return;`, ignores `applyCommand` return, `onComplete()` **before** `setSelectedRows([])`; `BookingCalendarModal` does **not** self-close, so Booking's page passes `closeRebooking` as `onComplete` | `handleConfirmBooking`: no guard, no `onComplete` param — same as Main Sheet and Archive, which also pass no close callback |
| `handleConfirmDelete` | takes `onComplete`, calls it last | **no** `onComplete` (shared `ConfirmDialog` calls `onOpenChange(false)` itself) |
| Toast copy | "Rescheduled N booking(s) successfully", "Booking(s) deleted" | "N row(s) sent to Booking", "Row(s) deleted", "N row(s) sent back to Orders (Reorder)" |
| Completion ordering | reorder: `applyCommand → setSelectedRows → onComplete → toast`; rebooking: `applyCommand → onComplete → setSelectedRows → toast` (not internally consistent) | reorder: `applyCommand → setSelectedRows → onComplete → toast`; delete has no `onComplete` |

`useOrdersPageHandlers` is **not the same kind of object** at all: it owns data (`useOrdersQuery`,
`useDraftSession`), local state (`gridApi`, `selectedRows`, six modal flags), effects
(`checkNotifications`, `useSelectedRowsSync`), and ~15 handlers, most Orders-only (Beast-Mode
`handleSaveOrder`, `handleCommit`/`handleConfirmCommit`, `handleSendToCallList`,
`handleShareToLogistics`, `handleSetAllRDate`, bulk attachment, print). It cannot be a client of a
generic stage-actions hook without being decomposed first.

The modal-state hooks (`useBookingModals` / `useCallListModals`) tell the same story: near-identical
shape (reorder open + reason + `resetReorder`; one calendar modal; delete confirm) diverging only in
which calendar modal (`isRebookingModalOpen` vs. `isBookingModalOpen`) and naming.

## Decision

**Keep the hooks stage-specific.** Do not introduce a shared generic
`useStageActions(stage, { builders, messages })` / `useStageModals()` now.

Rationale:

1. **The divergences are the hard part.** A generic hook would have to be parameterized on the stage
   enum member, 3+ builder functions, ~6 toast message templates, per-handler completion ordering, and
   the per-handler `onComplete` shape (plus the `applied`-guard pattern that Orders alone uses). That
   configuration object is larger and
   less readable than a ~120-line sibling that is mostly plain `patchRow`-shaped literals.
2. **The reuse that pays off was already extracted at the right seam.** `ReorderReasonDialog` (shared,
   prop-parameterized) and the command builders in `@/lib/orderStageTransitions` (pure functions) are
   where the real duplication lived. What remains in the hooks is shallow and stable.
3. **Two siblings is not a pattern yet.** The DRY case strengthens with each near-identical instance;
   it does not clear the bar at n=2 when n=2 already disagree on toast copy, builder choice, and
   control flow.
4. **Cost of being wrong is low.** If stages 3–4 confirm the shape, factoring two 120-line hooks into
   one generic hook later is a mechanical, well-tested refactor. Building the abstraction now and
   discovering Main Sheet / Archive need yet more knobs is the more expensive mistake.

## Revisit trigger (for Main Sheet #Q? and Archive #Q?)

Adopt a shared generic hook once **both** remaining stages have landed their stage-specific
action-handler hook **and** all four hooks turn out to differ only by:

- the stage enum literal, and
- the stage noun inside otherwise-identical toast templates,

i.e. the builder set, the completion ordering, and the `onComplete`/guard shape are the same across
all four. Track those three axes explicitly when implementing Main Sheet and Archive. If they still
diverge at n=4, stay stage-specific permanently.
