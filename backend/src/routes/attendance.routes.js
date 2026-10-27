
import { Router } from "express";

import {
  checkInStudent,
  getAttendanceSummary,
  updatePreparedPortions,
  recordLeftovers,
  generateMealQrToken,
  scanMealQr,
  getMyAttendance,
  getMealSlotAttendance,
} from "../controllers/attendance.controller.js";

import { syncScans } from "../controllers/scan-queue.controller.js";

import {
  authenticate,
  requireRole,
} from "../middleware/auth.middleware.js";

import { Role } from "../utils/enums.js";

const router = Router();

const attendanceRoles = [
  Role.MESS_STAFF,
  Role.MESS_ADMIN,
];

// Student attendance history
router.get(
  "/my-attendance",
  authenticate,
  requireRole(Role.STUDENT),
  getMyAttendance
);

// Manual attendance
router.post(
  "/meal-slots/:mealSlotId/check-in",
  authenticate,
  requireRole(...attendanceRoles),
  checkInStudent
);

// Attendance summary
router.get(
  "/meal-slots/:mealSlotId/summary",
  authenticate,
  requireRole(...attendanceRoles),
  getAttendanceSummary
);

// Individual check-in report
router.get(
  "/meal-slots/:mealSlotId/attendance",
  authenticate,
  requireRole(...attendanceRoles),
  getMealSlotAttendance
);

// Prepared food portions
router.patch(
  "/meal-slots/:mealSlotId/portions",
  authenticate,
  requireRole(...attendanceRoles),
  updatePreparedPortions
);

// Leftovers and food waste
router.patch(
  "/meal-slots/:mealSlotId/leftovers",
  authenticate,
  requireRole(...attendanceRoles),
  recordLeftovers
);

// Student QR generation
router.post(
  "/meal-slots/:mealSlotId/qr-token",
  authenticate,
  requireRole(Role.STUDENT),
  generateMealQrToken
);

// Staff QR scanning
router.post(
  "/meal-slots/:mealSlotId/scan",
  authenticate,
  requireRole(...attendanceRoles),
  scanMealQr
);

// Offline scan synchronization
router.post(
  "/meal-slots/:mealSlotId/sync-scans",
  authenticate,
  requireRole(...attendanceRoles),
  syncScans
);

export default router;
