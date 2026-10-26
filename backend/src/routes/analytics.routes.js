
import { Router } from "express";

import {
  getOverview,
  getDailyReport,
  getTrends
} from "../controllers/analytics.controller.js";

import {
  authenticate,
  requireRole
} from "../middleware/auth.middleware.js";

import { Role } from "../utils/enums.js";

const router = Router();

// Only mess administrators can access analytics.
router.use(authenticate, requireRole(Role.MESS_ADMIN));

router.get("/overview", getOverview);
router.get("/daily", getDailyReport);
router.get("/trends", getTrends);

export default router;
