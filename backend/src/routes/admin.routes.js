import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { Role } from "../utils/enums.js";
import { createStaff } from "../controllers/admin.controller.js";

const router = Router();

router.get("/test", authenticate, requireRole("MESS_ADMIN"), (req, res) => {
  res.json({ message: "Mess Admin access granted.", user: req.user });
});

router.post(
  "/staff",
  authenticate,
  requireRole(Role.MESS_ADMIN),
  createStaff
);
export default router;
