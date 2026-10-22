
import { Router } from "express";
import {
  authenticate,
  requireRole,
} from "../middleware/auth.middleware.js";

const router = Router();

// Only authenticated ADMIN users can access this route.
router.get(
  "/test",
  authenticate,
  requireRole("MESS_ADMIN"),
  (req, res) => {
    res.status(200).json({
      message: "Admin access granted.",
      user: req.user,
    });
  }
);

export default router;
