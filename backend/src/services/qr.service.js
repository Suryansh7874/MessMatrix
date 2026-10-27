
import crypto from "node:crypto";
import mongoose from "mongoose";

import Booking from "../models/Booking.js";
import MealSlot from "../models/MealSlot.js";
import QRToken from "../models/QRToken.js";
import { BookingStatus, SlotStatus } from "../utils/enums.js";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function generateMealQR({ studentId, mealSlotId }) {
  if (
    !mongoose.isValidObjectId(studentId) ||
    !mongoose.isValidObjectId(mealSlotId)
  ) {
    return { status: 400, message: "Invalid student or meal slot ID." };
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

    if (now >= new Date(slot.endTime)) {
    return {
        status: 409,
        message: "This meal slot has ended.",
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

  // QRToken has a unique bookingId, so update its token rather
  // than creating multiple token documents for the same booking.
  try {
    await QRToken.findOneAndUpdate(
      { bookingId: booking._id },
      {
        $set: { tokenHash },
        $setOnInsert: { bookingId: booking._id },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );
  } catch (error) {
    if (error.code === 11000) {
      return {
        status: 409,
        message: "QR generation conflicted with another request. Please retry.",
      };
    }
    throw error;
  }

  // Return the raw token only once. Never store it in the database.
  return {
    success: true,
    message: "Meal QR token generated successfully.",
    token: rawToken,
    mealSlotId: String(slot._id),
    expiresAt: slot.endTime,
  };
}

export { hashToken };
