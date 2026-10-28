
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
    return { status: 404, message: "Meal slot not found." };
  }

  if (slot.status !== SlotStatus.OPEN || !slot.bookingLocked) {
    return {
      status: 409,
      message: "QR generation is available only for locked, open meal slots.",
    };
  }

  if (now < new Date(slot.startTime) || now >= new Date(slot.endTime)) {
    return {
      status: 409,
      message: "QR generation is available only during meal service.",
    };
  }

  const booking = await Booking.findOne({
    studentId,
    mealSlotId,
    status: BookingStatus.OPTED_IN,
  }).lean();

  if (!booking) {
    return {
      status: 409,
      message: "An active opted-in booking is required to generate a QR.",
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
        message: "QR generation conflicted with another request. Please retry.",
      };
    }

    throw error;
  }
}
