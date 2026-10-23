import { Router } from "express";
import { createMenu, listMenus } from "../controllers/menu.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
const router = Router();
router.get("/", authenticate, listMenus);
router.post("/", authenticate, requireRole("MESS_ADMIN"), createMenu);
export default router;
