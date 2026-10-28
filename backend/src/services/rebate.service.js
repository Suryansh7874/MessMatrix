
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
  if (
    typeof studentId !== "string" ||
    !studentId.trim() ||
    typeof mealSlotId !== "string" ||
    !mealSlotId.trim()
  ) {
    return {
      status: 400,
      message: "Invalid student or meal slot ID.",
    };
  }

  const now = new Date();

  const slot = await MealSlot.findById(mealSlotId);

  if (!slot) {
    return { status: 404, message: "Meal slot not found." };
  }

  let booking = await Booking.findOne({ studentId, mealSlotId });

  if (!booking) {
    return { status: 404, message: "Booking not found." };
  }

  const referenceId = `rebate:${booking._id}`;

  // Find existing records first so retries can repair incomplete operations.
  let rebate = await Rebate.findOne({ bookingId: booking._id });
  let ledger = await BillingLedger.findOne({ referenceId });

  const wasAlreadyCancelled =
    booking.status === BookingStatus.CANCELLED;

  if (wasAlreadyCancelled) {
    // Only recover cancellations that were recorded before the cutoff.
    if (
      !booking.cancelledAt ||
      new Date(booking.cancelledAt) >= new Date(slot.cutoffTime)
    ) {
      return {
        status: 409,
        message: "Cancellation was not recorded before the cutoff.",
      };
    }

    // If a rebate already exists, its original amount is authoritative.
    // Otherwise, use the meal price to complete the interrupted operation.
  } else {
    if (booking.status !== BookingStatus.OPTED_IN) {
      return {
        status: 409,
        message: "This booking is not eligible for cancellation.",
        bookingStatus: booking.status,
      };
    }

    if (
      slot.status !== SlotStatus.OPEN ||
      slot.bookingLocked ||
      now >= new Date(slot.cutoffTime)
    ) {
      return {
        status: 409,
        message: "Cancellation cutoff has passed or bookings are locked.",
      };
    }

    // Atomically verify the slot is still open for changes.
    const updatedSlot = await MealSlot.findOneAndUpdate(
      {
        _id: mealSlotId,
        status: SlotStatus.OPEN,
        bookingLocked: false,
        cutoffTime: { $gt: now },
      },
      { $set: { updatedAt: now } },
      { new: true }
    );

    if (!updatedSlot) {
      return {
        status: 409,
        message: "Cancellation cutoff has passed or bookings are locked.",
      };
    }

    // Only one concurrent request can change OPTED_IN to CANCELLED.
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
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
        runValidators: true,
      }
    );

    if (updatedBooking) {
      booking = updatedBooking;
    } else {
      // Another request may have completed the cancellation.
      booking = await Booking.findOne({ studentId, mealSlotId });

      if (
        !booking ||
        booking.status !== BookingStatus.CANCELLED ||
        !booking.cancelledAt ||
        new Date(booking.cancelledAt) >= new Date(slot.cutoffTime)
      ) {
        return {
          status: 409,
          message: "Booking was changed by another request. Please retry.",
        };
      }
    }
  }

  // Existing rebate amount wins during recovery.
  if (!rebate) {
    const menu = await Menu.findById(slot.menuId);

    if (!menu || menu.price == null) {
      throw new Error(
        `Cannot issue rebate for booking ${booking._id}: menu price unavailable.`
      );
    }

    try {
      rebate = await Rebate.findOneAndUpdate(
        { bookingId: booking._id },
        {
          $setOnInsert: {
            studentId,
            bookingId: booking._id,
            amount: menu.price,
            status: RebateStatus.APPROVED,
            createdAt: booking.cancelledAt ?? now,
            processedAt: now,
            approvedBy: null,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
      rebate = await Rebate.findOne({ bookingId: booking._id });
    }
  }

  if (
    !rebate ||
    String(rebate.studentId) !== String(studentId) ||
    String(rebate.bookingId) !== String(booking._id)
  ) {
    throw new Error("Rebate record is missing or does not match the booking.");
  }

  // A stable reference prevents duplicate ledger credits on retries.
  if (!ledger) {
    try {
      await BillingLedger.updateOne(
        { referenceId },
        {
          $setOnInsert: {
            studentId,
            mealSlotId,
            bookingId: booking._id,
            type: LedgerType.REBATE_CREDIT,
            amount: rebate.amount,
            reason: "Full meal-price rebate for cancellation before cutoff",
            date: booking.cancelledAt ?? now,
            referenceId,
          },
        },
        {
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }

  // Verify the ledger entry even when it already existed or another
  // request inserted it concurrently.
  ledger = await BillingLedger.findOne({ referenceId });

  if (
    !ledger ||
    String(ledger.studentId) !== String(studentId) ||
    String(ledger.bookingId) !== String(booking._id) ||
    ledger.type !== LedgerType.REBATE_CREDIT ||
    String(ledger.amount) !== String(rebate.amount)
  ) {
    throw new Error(
      `Rebate recovery incomplete for booking ${booking._id}; ledger reconciliation required.`
    );
  }

  return {
    success: true,
    message: "Booking cancelled and full rebate issued.",
    bookingId: String(booking._id),
    rebateId: String(rebate._id),
    amount: rebate.amount.toString(),
    rebateStatus: rebate.status,
  };
}
