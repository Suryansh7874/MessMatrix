
import { Router } from "express";
import {
  setBooking,
  getMyBookings,
} from "../controllers/booking.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/my", getMyBookings);
router.put("/:mealId", setBooking);

export default router;
