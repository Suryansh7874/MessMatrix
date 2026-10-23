import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
const router = Router();
router.get("/test", authenticate, requireRole("MESS_ADMIN"), (req, res) => {
  res.json({ message: "Mess Admin access granted.", user: req.user });
});
export default router;
