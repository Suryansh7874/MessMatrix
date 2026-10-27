
import cron from "node-cron";
import mongoose from "mongoose";

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
    const session = await mongoose.startSession();

    try {
      let wasLocked = false;

      await session.withTransaction(async () => {
        // Claim the slot only if it is still eligible.
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
            },
          },
          {
            new: true,
            session,
          }
        );

        // Another scheduler or request may have claimed it first.
        if (!slot) {
          wasLocked = false;
          return;
        }

        // Count only students who opted in.
        const finalHeadcount = await Booking.countDocuments({
          mealSlotId: slot._id,
          status: BookingStatus.OPTED_IN,
        }).session(session);

        // Save the headcount in the same transaction as the lock.
        const updateResult = await MealSlot.updateOne(
          {
            _id: slot._id,
            bookingLocked: true,
          },
          {
            $set: { finalHeadcount },
          },
          { session }
        );

        if (updateResult.matchedCount !== 1) {
          throw new Error(
            `Failed to save final headcount for slot ${slot._id}`
          );
        }

        wasLocked = true;
      });

      if (wasLocked) {
        result.locked += 1;

        console.log(
          `Locked booking for slot ${candidate._id}.`
        );
      } else {
        result.skipped += 1;
      }
    } catch (error) {
      // A failed transaction rolls back the lock, allowing a later retry.
      result.failed += 1;

      console.error(
        `Failed to lock meal slot ${candidate._id}:`,
        error
      );
    } finally {
      await session.endSession();
    }
  }

  return result;
}

export function startMealLockScheduler() {
  cron.schedule("* * * * *", async () => {
    try {
      const result = await lockDueMealSlots();

      if (result.locked > 0 || result.failed > 0) {
        console.log("[Meal cutoff scheduler]", result);
      }
    } catch (error) {
      console.error("Meal cutoff scheduler error:", error);
    }
  });
}
