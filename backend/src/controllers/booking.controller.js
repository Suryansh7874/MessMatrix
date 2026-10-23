import { z } from "zod";
import MealSlot from "../models/MealSlot.js";
import Booking from "../models/Booking.js";
import { BookingStatus } from "../utils/enums.js";

const choiceSchema = z.object({ status: z.enum(["OPTED_IN", "OPTED_OUT", "CANCELLED"]) });

export async function setBooking(req, res, next) {
  try {
    const parsed = choiceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "status must be OPTED_IN, OPTED_OUT or CANCELLED." });
    const slot = await MealSlot.findById(req.params.mealSlotId);
    if (!slot) return res.status(404).json({ message: "Meal slot not found." });

    const now = new Date();
    if (slot.status !== "OPEN" || slot.bookingLocked || now >= slot.cutoffTime) {
      return res.status(409).json({ message: "Booking changes are closed for this meal slot." });
    }

    const newStatus = parsed.data.status;
    const existing = await Booking.findOne({ studentId: req.user.id, mealSlotId: slot._id });

    if (existing && ["CHECKED_IN", "NO_SHOW"].includes(existing.status)) {
      return res.status(409).json({ message: "This booking can no longer be changed." });
    }

    const update = {
      status: newStatus,
      ...(newStatus === BookingStatus.CANCELLED ? { cancelledAt: now } : {})
    };

    const booking = await Booking.findOneAndUpdate(
      { studentId: req.user.id, mealSlotId: slot._id },
      { $set: update, $setOnInsert: { studentId: req.user.id, mealSlotId: slot._id, bookedAt: now } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return res.json({ message: "Booking updated", booking });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Concurrent booking update; please retry." });
    next(error);
  }
}

export async function getMyBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ studentId: req.user.id }).populate("mealSlotId").sort({ bookedAt: -1 });
    return res.json({ count: bookings.length, bookings });
  } catch (error) { next(error); }
}
