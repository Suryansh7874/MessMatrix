# Mess Matrix backend (diagram-aligned foundation)

This backend starter aligns the foundational models and APIs with the submitted
Mess Matrix abstract and class diagram. It includes authentication, role checks,
Menu, MealSlot, Booking and cutoff locking. It also includes schema foundations
for QRToken, CheckIn, ScanQueue, BillingLedger, Rebate and AnalyticsRecord.

## Install and run

1. Back up your existing `backend` folder.
2. Extract this folder's contents into `MessMatrix/backend/` (replace files only
   after backing up).
3. Run `npm install`.
4. Copy `.env.example` to `.env`, then fill in MongoDB URI and strong random secrets.
5. Run `npm run dev`.

Generate a secret with:
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Use a separate development database when migrating from the earlier ObjectId models.
This version uses UUID strings for model IDs and references; old ObjectId-based data
is not automatically migrated.

## Routes

- `POST /api/auth/register` (creates STUDENT only)
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `POST /api/menu` (MESS_ADMIN)
- `GET /api/menu`
- `POST /api/meal-slots` (MESS_ADMIN or MESS_STAFF)
- `GET /api/meal-slots`
- `PUT /api/bookings/:mealSlotId` (Student's own booking)
- `GET /api/bookings/my`
- `GET /api/meal-slots/:mealSlotId/headcount` (MESS_ADMIN or MESS_STAFF)
- `GET /api/admin/test` (MESS_ADMIN)

## Important implementation notes

- `SlotStatus` stays exactly `UPCOMING`, `OPEN`, `CLOSED`.
- Booking cutoff is separate: `bookingLocked` and `lockedAt`.
- MealSlot `CLOSED` means service is finished, not merely cutoff reached.
- Booking writes are conditional and checked against server time. The cutoff job
  locks slots with a conditional atomic update; transactions are recommended for
  future multi-document financial and redemption workflows.
- QR, offline synchronization, rebates, surplus redistribution, audit ledger,
  MealSync points and analytics are not fully implemented by this foundation.
  Their schemas are provided as a map to the diagram, not as a claim that those
  workflows are complete.
