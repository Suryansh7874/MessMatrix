
import crypto from "node:crypto";

import Booking from "../models/Booking.js";
import MealSlot from "../models/MealSlot.js";
import QRToken from "../models/QRToken.js";
import CheckIn from "../models/CheckIn.js";

import {
  BookingStatus,
  CheckInStatus,
  SlotStatus,
} from "../utils/enums.js";

import { hashToken } from "./qr.service.js";

export async function validateAndCheckIn({
  token,
  expectedMealSlotId,
  scannedBy,
  eventId,
}) {
  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > 4096
  ) {
    return { status: 400, message: "A valid QR token is required." };
  }

  if (
    typeof expectedMealSlotId !== "string" ||
    !expectedMealSlotId.trim() ||
    typeof scannedBy !== "string" ||
    !scannedBy.trim()
  ) {
    return {
      status: 400,
      message: "Invalid meal slot or staff ID.",
    };
  }

  const now = new Date();
  const tokenHash = hashToken(token);

  const qrToken = await QRToken.findOne({ tokenHash });

  if (!qrToken || qrToken.expiresAt <= now || qrToken.isUsed) {
    return {
      status: 401,
      message: "QR token is invalid, expired, or already used.",
    };
  }

  const booking = await Booking.findById(qrToken.bookingId);

  if (!booking) {
    return {
      status: 404,
      message: "Booking associated with this QR was not found.",
    };
  }

  if (String(booking.mealSlotId) !== expectedMealSlotId) {
    return {
      status: 401,
      message: "This QR code does not belong to the requested meal slot.",
    };
  }

  const slot = await MealSlot.findById(booking.mealSlotId);

  if (!slot) {
    return { status: 404, message: "Meal slot not found." };
  }

  if (
    slot.status !== SlotStatus.OPEN ||
    now < new Date(slot.startTime) ||
    now >= new Date(slot.endTime)
  ) {
    return {
      status: 409,
      message: "Check-in is allowed only during meal service.",
    };
  }

  if (booking.status === BookingStatus.CHECKED_IN) {
    return {
      status: 409,
      message: "This student has already checked in.",
    };
  }

  if (booking.status !== BookingStatus.OPTED_IN) {
    return {
      status: 409,
      message: "This booking is not eligible for check-in.",
    };
  }

  // Atomically claim the QR token so simultaneous scans cannot both proceed.
  const claimedToken = await QRToken.findOneAndUpdate(
    {
      _id: qrToken._id,
      isUsed: false,
      expiresAt: { $gt: now },
    },
    {
      $set: {
        isUsed: true,
        usedAt: now,
      },
    },
    { new: true }
  );

  if (!claimedToken) {
    return {
      status: 409,
      message: "This QR code has already been used or expired.",
    };
  }

  // Atomically transition the booking from OPTED_IN to CHECKED_IN.
  const updatedBooking = await Booking.findOneAndUpdate(
    {
      _id: booking._id,
      status: BookingStatus.OPTED_IN,
      mealSlotId: expectedMealSlotId,
    },
    {
      $set: {
        status: BookingStatus.CHECKED_IN,
        checkedInAt: now,
        checkedInBy: scannedBy,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedBooking) {
    // Best-effort release: permit a retry if the booking was not changed.
    await QRToken.updateOne(
      { _id: claimedToken._id, isUsed: true, usedAt: now },
      { $set: { isUsed: false, usedAt: null } }
    );

    return {
      status: 409,
      message: "This booking has already been processed.",
    };
  }

  try {
    const actualEventId =
      typeof eventId === "string" && eventId.trim()
        ? eventId
        : crypto.randomUUID();

    const checkIn = await CheckIn.create({
      qrTokenId: String(claimedToken._id),
      studentId: String(updatedBooking.studentId),
      mealSlotId: String(slot._id),
      scannedBy,
      status: CheckInStatus.VALID,
      isSynced: true,
      deviceId: null,
      scannedAt: now,
      eventId: actualEventId,
    });

    return {
      success: true,
      message: "QR verified. Student checked in successfully.",
      attendance: {
        checkInId: checkIn._id,
        bookingId: updatedBooking._id,
        studentId: updatedBooking.studentId,
        mealSlotId: slot._id,
        status: updatedBooking.status,
        checkedInAt: updatedBooking.checkedInAt,
        scannedAt: checkIn.scannedAt,
        eventId: checkIn.eventId,
      },
    };
  } catch (error) {
    // Do not silently undo a completed booking update. A failed CheckIn
    // insert needs reconciliation because standalone MongoDB has no transaction.
    error.checkInPartiallyCompleted = true;
    throw error;
  }
}
