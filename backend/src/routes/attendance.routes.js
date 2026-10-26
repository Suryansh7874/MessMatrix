import { Router } from "express";
import {
  checkInStudent,
  getAttendanceSummary,
  updatePreparedPortions,
  recordLeftovers,
  generateMealQrToken,
  scanMealQr,
} from "../controllers/attendance.controller.js";

import {
  authenticate,
  requireRole
} from "../middleware/auth.middleware.js";

import { Role } from "../utils/enums.js";

const router = Router();

const attendanceRoles = [
  Role.MESS_STAFF,
  Role.MESS_ADMIN
];

router.post(
  "/meal-slots/:mealSlotId/check-in",
  authenticate,
  requireRole(...attendanceRoles),
  checkInStudent
);

router.get(
  "/meal-slots/:mealSlotId/summary",
  authenticate,
  requireRole(...attendanceRoles),
  getAttendanceSummary
);

router.patch(
  "/meal-slots/:mealSlotId/portions",
  authenticate,
  requireRole(...attendanceRoles),
  updatePreparedPortions
);

router.patch(
  "/meal-slots/:mealSlotId/leftovers",
  authenticate,
  requireRole(...attendanceRoles),
  recordLeftovers
);

// Student requests a short-lived QR token.
router.post(
  "/meal-slots/:mealSlotId/qr-token",
  authenticate,
  requireRole(Role.STUDENT),
  generateMealQrToken
);

// Staff scans the QR and records attendance.
router.post(
  "/meal-slots/:mealSlotId/scan",
  authenticate,
  requireRole(...attendanceRoles),
  scanMealQr
);

export default router;