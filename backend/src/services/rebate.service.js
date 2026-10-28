
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

  // 1. Validate slot and cancellation window.
  const slot = await MealSlot.findById(mealSlotId);

  if (!slot) {
    return {
      status: 404,
      message: "Meal slot not found.",
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

  // 2. Validate booking before changing its status.
  const existingBooking = await Booking.findOne({
    studentId,
    mealSlotId,
  });

  if (!existingBooking) {
    return {
      status: 404,
      message: "Booking not found.",
    };
  }

  if (existingBooking.status !== BookingStatus.OPTED_IN) {
    return {
      status: 409,
      message: "This booking is not eligible for cancellation.",
      bookingStatus: existingBooking.status,
    };
  }

  // 3. Validate the full rebate amount before cancellation.
  const menu = await Menu.findById(slot.menuId);

  if (!menu || menu.price == null) {
    return {
      status: 500,
      message: "Menu or meal price is missing.",
    };
  }

  const amount = menu.price;
  const referenceId = `rebate:${existingBooking._id}`;

  // 4. Atomically claim the slot only while cancellation is allowed.
  // This is a single-document atomic operation, not a transaction.
  const updatedSlot = await MealSlot.findOneAndUpdate(
    {
      _id: mealSlotId,
      status: SlotStatus.OPEN,
      bookingLocked: false,
      cutoffTime: { $gt: now },
    },
    {
      $set: { updatedAt: now },
    },
    {
      new: true,
    }
  );

  if (!updatedSlot) {
    return {
      status: 409,
      message: "Cancellation cutoff has passed or bookings are locked.",
    };
  }

  // 5. Atomically cancel only an OPTED_IN booking.
  const booking = await Booking.findOneAndUpdate(
    {
      _id: existingBooking._id,
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

  if (!booking) {
    const latestBooking = await Booking.findById(existingBooking._id)
      .select("status");

    return {
      status: 409,
      message: "Booking was changed by another request. Please retry.",
      ...(latestBooking ? { bookingStatus: latestBooking.status } : {}),
    };
  }

  // 6. Ensure the rebate record exists.
  // The unique bookingId index prevents multiple rebates for one booking.
  let rebate;

  try {
    rebate = await Rebate.findOneAndUpdate(
      { bookingId: booking._id },
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
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );
  } catch (error) {
    // Another request may have inserted the unique rebate first.
    if (error.code !== 11000) throw error;

    rebate = await Rebate.findOne({ bookingId: booking._id });
  }

  if (!rebate) {
    throw new Error(
      `Booking ${booking._id} was cancelled, but its rebate record is missing. Retry/reconcile required.`
    );
  }

  if (
    String(rebate.studentId) !== String(studentId) ||
    String(rebate.bookingId) !== String(booking._id)
  ) {
    throw new Error("Existing rebate does not match the booking.");
  }

  // 7. Ensure the matching ledger credit exists.
  // The stable unique referenceId makes retries idempotent.
  try {
    await BillingLedger.updateOne(
      { referenceId },
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
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;

    // Confirm the competing insert created the expected ledger record.
    const ledger = await BillingLedger.findOne({ referenceId });

    if (
      !ledger ||
      String(ledger.bookingId) !== String(booking._id) ||
      String(ledger.studentId) !== String(studentId) ||
      ledger.type !== LedgerType.REBATE_CREDIT
    ) {
      throw new Error("Ledger credit conflict; manual reconciliation required.");
    }
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
