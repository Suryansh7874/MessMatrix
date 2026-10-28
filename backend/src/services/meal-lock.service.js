
import cron from "node-cron";

import MealSlot from "../models/MealSlot.js";
import Booking from "../models/Booking.js";
import { BookingStatus } from "../utils/enums.js";

export async function lockDueMealSlots() {
  const now = new Date();

  const due = await MealSlot.find({
    status: "OPEN",
    bookingLocked: false,
    cutoffTime: { $lte: now },
  })
    .select("_id")
    .lean();

  const result = {
    checked: due.length,
    locked: 0,
    skipped: 0,
    failed: 0,
  };

  for (const candidate of due) {
    try {
      // Calculate the number of students who opted in.
      const finalHeadcount = await Booking.countDocuments({
        mealSlotId: candidate._id,
        status: BookingStatus.OPTED_IN,
      });

      // Claim the slot with a conditional atomic update.
      // If another scheduler run claimed it first, this returns null.
      const slot = await MealSlot.findOneAndUpdate(
        {
          _id: candidate._id,
          status: "OPEN",
          bookingLocked: false,
          cutoffTime: { $lte: now },
        },
        {
          $set: {
            bookingLocked: true,
            lockedAt: now,
            finalHeadcount,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!slot) {
        result.skipped += 1;
        continue;
      }

      result.locked += 1;

      console.log(
        `Locked booking for slot ${candidate._id}. Final headcount: ${finalHeadcount}`
      );
    } catch (error) {
      result.failed += 1;

      console.error(
        `Failed to lock meal slot ${candidate._id}:`,
        error
      );
    }
  }

  return result;
}

let schedulerRunning = false;

export function startMealLockScheduler() {
  cron.schedule("* * * * *", async () => {
    if (schedulerRunning) {
      return;
    }

    schedulerRunning = true;

    try {
      const result = await lockDueMealSlots();

      if (result.locked > 0 || result.failed > 0) {
        console.log("[Meal cutoff scheduler]", result);
      }
    } catch (error) {
      console.error("Meal cutoff scheduler error:", error);
    } finally {
      schedulerRunning = false;
    }
  });
}
