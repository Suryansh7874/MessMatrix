
import cron from "node-cron";

import MealSlot from "../models/MealSlot.js";
import Booking from "../models/Booking.js";
import {
  BookingStatus,
  SlotStatus,
} from "../utils/enums.js";
import { awardPoints,reconcilePointTransactions } from "./point.service.js";

export async function lockDueMealSlots() {
  const now = new Date();

  const due = await MealSlot.find({
    status: SlotStatus.OPEN,
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
      const finalHeadcount = await Booking.countDocuments({
        mealSlotId: candidate._id,
        status: {
          $in: [
            BookingStatus.OPTED_IN,
            BookingStatus.CHECKED_IN,
          ],
        },
      });

      const slot = await MealSlot.findOneAndUpdate(
        {
          _id: candidate._id,
          status: SlotStatus.OPEN,
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

      // Reward eligible cancellations recorded before cutoff.
      const cancelledBookings = await Booking.find({
        mealSlotId: slot._id,
        status: BookingStatus.CANCELLED,
        cancelledAt: { $lt: slot.cutoffTime },
      })
        .select("_id studentId")
        .lean();

      for (const booking of cancelledBookings) {
        try {
          await awardPoints({
            studentId: String(booking.studentId),
            mealSlotId: String(slot._id),
            bookingId: String(booking._id),
            reason: "EARLY_CANCELLATION",
            referenceKey: `cancel:${booking._id}`,
          });
        } catch (error) {
          console.error(
            `Failed to award cancellation points for booking ${booking._id}:`,
            error
          );
        }
      }

      console.log(
        `Locked booking for slot ${slot._id}. Headcount: ${finalHeadcount}`
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

export async function closeDueMealSlots() {
  const now = new Date();

  const due = await MealSlot.find({
    status: SlotStatus.OPEN,
    endTime: { $lte: now },
  })
    .select("_id")
    .lean();

  const result = {
    checked: due.length,
    closed: 0,
    skipped: 0,
    failed: 0,
    noShows: 0,
  };

  for (const candidate of due) {
    try {
      // Only one scheduler run can claim an OPEN slot.
      const slot = await MealSlot.findOneAndUpdate(
        {
          _id: candidate._id,
          status: SlotStatus.OPEN,
          endTime: { $lte: now },
        },
        {
          $set: {
            status: SlotStatus.CLOSED,
            bookingLocked: true,
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

      result.closed += 1;

      // Only bookings still OPTED_IN at closing become NO_SHOW.
      const noShowBookings = await Booking.find({
        mealSlotId: slot._id,
        status: BookingStatus.OPTED_IN,
      })
        .select("_id studentId")
        .lean();

      for (const booking of noShowBookings) {
        try {
          // Conditionally update to avoid penalizing a concurrent check-in.
          const updatedBooking = await Booking.findOneAndUpdate(
            {
              _id: booking._id,
              mealSlotId: slot._id,
              status: BookingStatus.OPTED_IN,
            },
            {
              $set: {
                status: BookingStatus.NO_SHOW,
              },
            },
            {
              new: true,
              runValidators: true,
            }
          );

          if (!updatedBooking) continue;

          await awardPoints({
            studentId: String(updatedBooking.studentId),
            mealSlotId: String(slot._id),
            bookingId: String(updatedBooking._id),
            reason: "NO_SHOW",
            referenceKey: `noshow:${updatedBooking._id}`,
          });

          result.noShows += 1;
        } catch (error) {
          console.error(
            `Failed to process no-show booking ${booking._id}:`,
            error
          );
        }
      }

      console.log(
        `Closed meal slot ${slot._id}. No-shows processed: ${result.noShows}`
      );
    } catch (error) {
      result.failed += 1;
      console.error(
        `Failed to close meal slot ${candidate._id}:`,
        error
      );
    }
  }

  return result;
}

let schedulerRunning = false;

export function startMealLockScheduler() {
  cron.schedule("* * * * *", async () => {
    if (schedulerRunning) return;

    schedulerRunning = true;

    try {
      const lockResult = await lockDueMealSlots();
      const closeResult = await closeDueMealSlots();
      const pointsResult = await reconcilePointTransactions();

      if (pointsResult.recovered > 0 || pointsResult.failed > 0) {
        console.log("[Points reconciliation]", pointsResult);
      }

      if (
        lockResult.locked > 0 ||
        lockResult.failed > 0 ||
        closeResult.closed > 0 ||
        closeResult.failed > 0
      ) {
        console.log("[Meal scheduler]", {
          lock: lockResult,
          close: closeResult,
        });
      }
    } catch (error) {
      console.error("[Meal scheduler] Error:", error);
    } finally {
      schedulerRunning = false;
    }
  });
}
