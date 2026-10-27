
import mongoose from "mongoose";
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
    !mongoose.isValidObjectId(expectedMealSlotId) ||
    !mongoose.isValidObjectId(scannedBy)
  ) {
    return {
      status: 400,
      message: "Invalid meal slot or staff ID.",
    };
  }

  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const tokenHash = hashToken(token);

      const qrToken = await QRToken.findOne({ tokenHash }).session(session);

      if (!qrToken) {
        result = {
          status: 401,
          message: "QR token is invalid or has expired.",
        };
        return;
      }

      const booking = await Booking.findById(qrToken.bookingId)
        .session(session);

      if (!booking) {
        result = {
          status: 404,
          message: "Booking associated with this QR was not found.",
        };
        return;
      }

      // Prevent a QR from being scanned through another meal slot's route.
      if (String(booking.mealSlotId) !== String(expectedMealSlotId)) {
        result = {
          status: 401,
          message: "This QR code does not belong to the requested meal slot.",
        };
        return;
      }

      const slot = await MealSlot.findById(booking.mealSlotId)
        .session(session);

      if (!slot) {
        result = {
          status: 404,
          message: "Meal slot not found.",
        };
        return;
      }

      const now = new Date();

      if (
        slot.status !== SlotStatus.OPEN ||
        now < new Date(slot.startTime) ||
        now >= new Date(slot.endTime)
      ) {
        result = {
          status: 409,
          message: "Check-in is allowed only during meal service.",
        };
        return;
      }

      if (booking.status === BookingStatus.CHECKED_IN) {
        result = {
          status: 409,
          message: "This student has already checked in.",
        };
        return;
      }

      if (booking.status !== BookingStatus.OPTED_IN) {
        result = {
          status: 409,
          message: "This booking is not eligible for check-in.",
        };
        return;
      }

      // Atomic status transition prevents two scans checking in the same booking.
      const updatedBooking = await Booking.findOneAndUpdate(
        {
          _id: booking._id,
          status: BookingStatus.OPTED_IN,
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
          session,
        }
      );

      if (!updatedBooking) {
        result = {
          status: 409,
          message: "This booking has already been processed.",
        };
        return;
      }

      // Match the existing CheckIn schema.
      // eventId is a unique per-check-in identifier, not the mealSlotId.
      const [checkIn] = await CheckIn.create(
        [
          {
            qrTokenId: String(qrToken._id),
            studentId: String(updatedBooking.studentId),
            mealSlotId: String(slot._id),
            scannedBy: String(scannedBy),
            status: CheckInStatus.VALID,
            isSynced: true,
            deviceId: null,
            scannedAt: now,
            eventId: crypto.randomUUID(),
          },
        ],
        { session }
      );

      result = {
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
          eventId: eventId || crypto.randomUUID(),
        },
      };
    });

    return result ?? {
      status: 409,
      message: "Unable to complete check-in. Please retry.",
    };
  } finally {
    await session.endSession();
  }
}
