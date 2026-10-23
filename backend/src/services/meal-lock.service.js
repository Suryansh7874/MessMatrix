import cron from "node-cron";
import MealSlot from "../models/MealSlot.js";
import Booking from "../models/Booking.js";
import { BookingStatus } from "../utils/enums.js";

export async function lockDueMealSlots() {
  const now = new Date();
  const due = await MealSlot.find({
    status: "OPEN",
    bookingLocked: false,
    cutoffTime: { $lte: now }
  }).select("_id");

  for (const candidate of due) {
    // Claim the lock with a conditional atomic update.
    const slot = await MealSlot.findOneAndUpdate(
      { _id: candidate._id, status: "OPEN", bookingLocked: false, cutoffTime: { $lte: now } },
      { $set: { bookingLocked: true, lockedAt: now } },
      { new: true }
    );
    if (!slot) continue;

    const finalHeadcount = await Booking.countDocuments({
      mealSlotId: slot._id,
      status: BookingStatus.OPTED_IN
    });

    await MealSlot.updateOne(
      { _id: slot._id, bookingLocked: true },
      { $set: { finalHeadcount } }
    );
    console.log(`Locked booking for slot ${slot._id}; final headcount ${finalHeadcount}`);
  }
}

export function startMealLockScheduler() {
  cron.schedule("* * * * *", async () => {
    try { await lockDueMealSlots(); }
    catch (error) { console.error("Meal cutoff scheduler error:", error); }
  });
}
