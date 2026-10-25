import { Router } from "express";
import {
  checkInStudent,
  getAttendanceSummary,
  updatePreparedPortions,
  recordLeftovers,

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

export default router;