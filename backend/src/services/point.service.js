
import PointTransaction from "../models/PointTransaction.js";
import Booking from "../models/Booking.js";
import MealSlot from "../models/MealSlot.js";
import CheckIn from "../models/CheckIn.js";

import {
  BookingStatus,
  CheckInStatus,
  SlotStatus,
} from "../utils/enums.js";

const POINT_RULES = Object.freeze({
  EARLY_CANCELLATION: 2,
  SUCCESSFUL_REDEMPTION: 1,
  NO_SHOW: -2,
  SURPLUS_COLLECTION: 1,
});

export async function awardPoints({
  studentId,
  mealSlotId,
  bookingId,
  reason,
  referenceKey,
}) {
  const points = POINT_RULES[reason];

  if (
    points === undefined ||
    !studentId ||
    !mealSlotId ||
    !bookingId ||
    !referenceKey
  ) {
    throw new Error("Invalid points transaction details.");
  }

  try {
    const transaction = await PointTransaction.create({
      studentId,
      mealSlotId,
      bookingId,
      points,
      reason,
      referenceKey,
    });

    return {
      success: true,
      duplicate: false,
      transaction,
    };
  } catch (error) {
    if (error.code === 11000) {
      return {
        success: true,
        duplicate: true,
        message: "Points event already processed.",
      };
    }

    throw error;
  }
}

export async function getStudentPoints(studentId) {
  const result = await PointTransaction.aggregate([
    { $match: { studentId } },
    {
      $group: {
        _id: null,
        balance: { $sum: "$points" },
        totalTransactions: { $sum: 1 },
      },
    },
  ]);

  return {
    balance: result[0]?.balance ?? 0,
    totalTransactions: result[0]?.totalTransactions ?? 0,
  };
}

export async function getStudentPointsHistory(studentId) {
  return PointTransaction.find({ studentId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
}

export async function reconcilePointTransactions() {
  const result = {
    checked: 0,
    recovered: 0,
    failed: 0,
  };

  async function recover(transactionData) {
    result.checked += 1;

    try {
      const award = await awardPoints(transactionData);

      if (!award.duplicate) {
        result.recovered += 1;
      }
    } catch (error) {
      result.failed += 1;

      console.error(
        "Points reconciliation failed:",
        transactionData.referenceKey,
        error
      );
    }
  }

  // Recover eligible cancellation rewards.
  const cancelledBookings = await Booking.find({
    status: BookingStatus.CANCELLED,
    cancelledAt: { $ne: null },
  })
    .select("_id studentId mealSlotId cancelledAt")
    .lean();

  for (const booking of cancelledBookings) {
    try {
      const slot = await MealSlot.findById(booking.mealSlotId)
        .select("_id cutoffTime bookingLocked")
        .lean();

      if (
        !slot ||
        !slot.bookingLocked ||
        !booking.cancelledAt ||
        new Date(booking.cancelledAt) >= new Date(slot.cutoffTime)
      ) {
        continue;
      }

      await recover({
        studentId: String(booking.studentId),
        mealSlotId: String(booking.mealSlotId),
        bookingId: String(booking._id),
        reason: "EARLY_CANCELLATION",
        referenceKey: `cancel:${booking._id}`,
      });
    } catch (error) {
      result.failed += 1;
      console.error("Cancellation reconciliation failed:", error);
    }
  }

  // Recover rewards only for verified QR check-ins.
  const validCheckIns = await CheckIn.find({
    status: CheckInStatus.VALID,
  })
    .select("studentId mealSlotId")
    .lean();

  for (const checkIn of validCheckIns) {
    try {
      const booking = await Booking.findOne({
        studentId: checkIn.studentId,
        mealSlotId: checkIn.mealSlotId,
        status: BookingStatus.CHECKED_IN,
      })
        .select("_id studentId mealSlotId")
        .lean();

      if (!booking) continue;

      await recover({
        studentId: String(booking.studentId),
        mealSlotId: String(booking.mealSlotId),
        bookingId: String(booking._id),
        reason: "SUCCESSFUL_REDEMPTION",
        referenceKey: `redeem:${booking._id}`,
      });
    } catch (error) {
      result.failed += 1;
      console.error("Redemption reconciliation failed:", error);
    }
  }

  // Recover deductions for bookings already marked NO_SHOW.
  const noShowBookings = await Booking.find({
    status: BookingStatus.NO_SHOW,
  })
    .select("_id studentId mealSlotId")
    .lean();

  for (const booking of noShowBookings) {
    try {
      const slot = await MealSlot.findById(booking.mealSlotId)
        .select("_id status")
        .lean();

      if (!slot || slot.status !== SlotStatus.CLOSED) {
        continue;
      }

      await recover({
        studentId: String(booking.studentId),
        mealSlotId: String(booking.mealSlotId),
        bookingId: String(booking._id),
        reason: "NO_SHOW",
        referenceKey: `noshow:${booking._id}`,
      });
    } catch (error) {
      result.failed += 1;
      console.error("No-show reconciliation failed:", error);
    }
  }

  return result;
}
