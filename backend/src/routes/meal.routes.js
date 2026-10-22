
import { Router } from "express";
import {
  createMeal,
  getUpcomingMeals,
} from "../controllers/meal.controller.js";
import {
  authenticate,
  requireRole,
} from "../middleware/auth.middleware.js";

const router = Router();

// Any authenticated user can view upcoming meals.
router.get("/", authenticate, getUpcomingMeals);

// Only Admin or Mess Staff can create schedules.
router.post(
  "/",
  authenticate,
  requireRole("MESS_ADMIN", "MESS_STAFF"),
  createMeal
);

export default router;
