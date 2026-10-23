import { Router } from "express";
import { createMealSlot, listMealSlots, getHeadcount } from "../controllers/mealSlot.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
const router = Router();
router.get("/", authenticate, listMealSlots);
router.post("/", authenticate, requireRole("MESS_ADMIN", "MESS_STAFF"), createMealSlot);
router.get("/:mealSlotId/headcount", authenticate, requireRole("MESS_ADMIN", "MESS_STAFF"), getHeadcount);
export default router;
