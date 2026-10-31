
import crypto from "node:crypto";

import Booking from "../models/Booking.js";
import MealSlot from "../models/MealSlot.js";
import QRToken from "../models/QRToken.js";

import { BookingStatus, SlotStatus } from "../utils/enums.js";

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function generateMealQR({ studentId, mealSlotId }) {
  if (
    typeof studentId !== "string" ||
    !studentId.trim() ||
    typeof mealSlotId !== "string" ||
    !mealSlotId.trim()
  ) {
    return {
      status: 400,
      message: "Valid student and meal slot IDs are required.",
    };
  }

  const now = new Date();

  const slot = await MealSlot.findById(mealSlotId).lean();

  if (!slot) {
    return {
      status: 404,
      message: "Meal slot not found.",
    };
  }

  // The slot must be open, but bookingLocked can be true OR false.
  // Locking bookings must not prevent QR generation for existing bookings.
  if (slot.status !== SlotStatus.OPEN) {
    return {
      status: 409,
      message: "QR generation is available only for open meal slots.",
    };
  }

  // Never generate a QR that is already expired.
  if (!slot.endTime || now >= new Date(slot.endTime)) {
    return {
      status: 409,
      message:
        "QR generation is unavailable because the meal serving window has ended.",
    };
  }

  // The student must already have an eligible booking.
  const booking = await Booking.findOne({
    studentId,
    mealSlotId,
    status: BookingStatus.OPTED_IN,
  }).lean();

  if (!booking) {
    return {
      status: 409,
      message:
        "An active opted-in booking is required to generate a QR.",
    };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  try {
    const qrToken = await QRToken.findOneAndUpdate(
      { bookingId: booking._id },
      {
        $set: {
          studentId: String(booking.studentId),
          mealSlotId: String(booking.mealSlotId),
          tokenHash,
          issuedAt: now,
          expiresAt: slot.endTime,
          isUsed: false,
          usedAt: null,
        },
        $setOnInsert: {
          bookingId: booking._id,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return {
      success: true,
      message: "Meal QR token generated successfully.",
      token: rawToken,
      mealSlotId: String(slot._id),
      expiresAt: qrToken.expiresAt,
    };
  } catch (error) {
    if (error.code === 11000) {
      return {
        status: 409,
        message:
          "QR generation conflicted with another request. Please retry.",
      };
    }

    throw error;
  }
}
