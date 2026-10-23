export const Role = Object.freeze({
  STUDENT: "STUDENT",
  MESS_ADMIN: "MESS_ADMIN",
  MESS_STAFF: "MESS_STAFF",
});

export const MealType = Object.freeze({
  BREAKFAST: "BREAKFAST",
  LUNCH: "LUNCH",
  DINNER: "DINNER",
});

export const SlotStatus = Object.freeze({
  UPCOMING: "UPCOMING",
  OPEN: "OPEN",
  CLOSED: "CLOSED",
});

export const BookingStatus = Object.freeze({
  OPTED_IN: "OPTED_IN",
  OPTED_OUT: "OPTED_OUT",
  CANCELLED: "CANCELLED",
  CHECKED_IN: "CHECKED_IN",
  NO_SHOW: "NO_SHOW",
});

export const CheckInStatus = Object.freeze({
  VALID: "VALID",
  DUPLICATE: "DUPLICATE",
  EXPIRED: "EXPIRED",
  PENDING_SYNC: "PENDING_SYNC",
});

export const LedgerType = Object.freeze({
  CHARGE: "CHARGE",
  REBATE_CREDIT: "REBATE_CREDIT",
  REFUND: "REFUND",
  ADJUSTMENT: "ADJUSTMENT",
});

export const RebateStatus = Object.freeze({
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
});

export const SyncStatus = Object.freeze({
  QUEUED: "QUEUED",
  SYNCED: "SYNCED",
  FAILED: "FAILED",
});
