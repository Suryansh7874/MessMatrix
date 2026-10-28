
import { Router } from "express";

import {
  getPendingRebates,
  getMyRebates,
  getMyBillingLedger,
} from "../controllers/rebate.controller.js";

import {
  authenticate,
  requireRole,
} from "../middleware/auth.middleware.js";

import { Role } from "../utils/enums.js";


const router = Router();

router.get(
  "/my-rebates",
  authenticate,
  requireRole(Role.STUDENT),
  getMyRebates
);

router.get(
  "/pending",
  authenticate,
  requireRole(Role.MESS_ADMIN),
  getPendingRebates
);

router.get(
  "/my-ledger",
  authenticate,
  requireRole(Role.STUDENT),
  getMyBillingLedger
);

export default router;
