import { Router } from "express";
import { setBooking, getMyBookings } from "../controllers/booking.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
const router = Router();
router.use(authenticate, requireRole("STUDENT"));

router.get("/my", getMyBookings);
router.put("/:mealSlotId", setBooking);
export default router;
