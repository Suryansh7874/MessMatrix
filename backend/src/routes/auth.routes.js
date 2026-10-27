import { Router } from "express";
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";

const passwordRecoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again later."
  }
});

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);


router.post(
  "/forgot-password",
  passwordRecoveryLimiter,
  forgotPassword
);

router.post(
  "/reset-password",
  passwordRecoveryLimiter,
  resetPassword
);

export default router;