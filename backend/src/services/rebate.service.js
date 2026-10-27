
import mongoose from "mongoose";

import Booking from "../models/Booking.js";
import MealSlot from "../models/MealSlot.js";
import Menu from "../models/Menu.js";
import Rebate from "../models/Rebate.js";
import BillingLedger from "../models/BillingLedger.js";

import {
  BookingStatus,
  SlotStatus,
  LedgerType,
  RebateStatus,
} from "../utils/enums.js";

export async function cancelBookingAndIssueFullRebate({
  studentId,
  mealSlotId,
}) {
  // Validate IDs before opening a transaction.
  if (
    !mongoose.isValidObjectId(studentId) ||
    !mongoose.isValidObjectId(mealSlotId)
  ) {
    return {
      status: 400,
      message: "Invalid student or meal slot ID.",
    };
  }

  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      // Reset result because a transaction callback may be retried.
      result = undefined;

      const now = new Date();

      // 1. Find the meal slot.
      const slot = await MealSlot.findById(mealSlotId).session(session);

      if (!slot) {
        result = {
          status: 404,
          message: "Meal slot not found.",
        };
        return;
      }

      // 2. Check whether cancellation is allowed.
      if (
        slot.status !== SlotStatus.OPEN ||
        slot.bookingLocked ||
        now >= new Date(slot.cutoffTime)
      ) {
        result = {
          status: 409,
          message: "Cancellation cutoff has passed or bookings are locked.",
        };
        return;
      }

      // 3. Atomically verify that the slot is still open for changes.
      // This write coordinates with the cutoff-lock scheduler.
      const updatedSlot = await MealSlot.findOneAndUpdate(
        {
          _id: slot._id,
          status: SlotStatus.OPEN,
          bookingLocked: false,
          cutoffTime: { $gt: now },
        },
        {
          $set: {
            updatedAt: now,
          },
        },
        {
          new: true,
          session,
          runValidators: true,
        }
      );

      if (!updatedSlot) {
        result = {
          status: 409,
          message: "Cancellation cutoff has passed or bookings are locked.",
        };
        return;
      }

      // 4. Cancel only an active OPTED_IN booking.
      const booking = await Booking.findOneAndUpdate(
        {
          studentId,
          mealSlotId,
          status: BookingStatus.OPTED_IN,
        },
        {
          $set: {
            status: BookingStatus.CANCELLED,
            cancelledAt: now,
          },
        },
        {
          new: true,
          session,
          runValidators: true,
        }
      );

      if (!booking) {
        const existingBooking = await Booking.findOne({
          studentId,
          mealSlotId,
        })
          .select("status")
          .session(session);

        result = existingBooking
          ? {
              status: 409,
              message: "This booking is not eligible for cancellation.",
              bookingStatus: existingBooking.status,
            }
          : {
              status: 404,
              message: "Booking not found.",
            };

        return;
      }

      // 5. Fetch the menu to determine the full meal-price rebate.
      const menu = await Menu.findById(updatedSlot.menuId).session(session);

      if (!menu) {
        throw new Error("Meal slot references a missing menu.");
      }

      // Keep Decimal128 throughout. Do not convert money to JS Number.
      const amount = menu.price;

      if (amount == null) {
        throw new Error("Menu price is missing.");
      }

      // 6. Create the approved rebate.
      // bookingId is unique in the Rebate schema.
      const rebate = await Rebate.findOneAndUpdate(
        {
          bookingId: booking._id,
        },
        {
          $setOnInsert: {
            studentId,
            bookingId: booking._id,
            amount,
            status: RebateStatus.APPROVED,
            createdAt: now,
            processedAt: now,
            approvedBy: null,
          },
        },
        {
          upsert: true,
          new: true,
          session,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      // Defensive check: an existing rebate must match this cancellation.
      if (
        String(rebate.studentId) !== String(studentId) ||
        String(rebate.bookingId) !== String(booking._id)
      ) {
        throw new Error("Existing rebate does not match the booking.");
      }

      // 7. Add the corresponding credit to the billing ledger.
      // A stable referenceId prevents duplicate credits on retries.
      const referenceId = `rebate:${booking._id}`;

      await BillingLedger.updateOne(
        {
          referenceId,
        },
        {
          $setOnInsert: {
            studentId,
            mealSlotId: updatedSlot._id,
            bookingId: booking._id,
            type: LedgerType.REBATE_CREDIT,
            amount: rebate.amount,
            reason: "Full meal-price rebate for cancellation before cutoff",
            date: now,
            referenceId,
          },
        },
        {
          upsert: true,
          session,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      // 8. Return success only after the transaction commits.
      result = {
        success: true,
        message: "Booking cancelled and full rebate issued.",
        bookingId: String(booking._id),
        rebateId: String(rebate._id),
        amount: rebate.amount.toString(),
        rebateStatus: rebate.status,
      };
    });

    return (
      result ?? {
        status: 500,
        message: "Cancellation could not be completed.",
      }
    );
  } finally {
    await session.endSession();
  }
}
