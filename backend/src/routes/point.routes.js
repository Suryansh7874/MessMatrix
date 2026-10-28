
import { Router } from "express";

import {
  getMyPoints,
  getMyPointsHistory,
} from "../controllers/point.controller.js";

import {
  authenticate,
  requireRole,
} from "../middleware/auth.middleware.js";

import { Role } from "../utils/enums.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requireRole(Role.STUDENT),
  getMyPoints
);

router.get(
  "/history",
  authenticate,
  requireRole(Role.STUDENT),
  getMyPointsHistory
);

export default router;
