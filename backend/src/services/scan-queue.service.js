
import crypto from "node:crypto";

import ScanQueue from "../models/ScanQueue.js";
import CheckIn from "../models/CheckIn.js";
import QRToken from "../models/QRToken.js";
import Booking from "../models/Booking.js";

import { SyncStatus, CheckInStatus, BookingStatus } from "../utils/enums.js";
import { validateAndCheckIn } from "./checkin.service.js";
import { hashToken } from "./qr.service.js";
import { awardPoints } from "./point.service.js";

async function recoverExistingCheckIn({
  eventId,
  token,
  mealSlotId,
}) {
  const checkIn = await CheckIn.findOne({ eventId });

  if (!checkIn) return null;

  // Verify that this event belongs to the submitted token and meal slot.
  const qrToken = await QRToken.findById(checkIn.qrTokenId);

  if (
    !qrToken ||
    qrToken.tokenHash !== hashToken(token) ||
    String(checkIn.mealSlotId) !== mealSlotId ||
    checkIn.status !== CheckInStatus.VALID
  ) {
    return {
      success: false,
      message: "Event ID conflicts with an existing check-in.",
    };
  }

  const booking = await Booking.findOne({
    studentId: checkIn.studentId,
    mealSlotId: checkIn.mealSlotId,
    status: BookingStatus.CHECKED_IN,
  });

  if (!booking) {
    return {
      success: false,
      message: "Existing check-in needs administrative reconciliation.",
    };
  }

  // Safe to retry only if awardPoints uses an idempotent reference key.
  await awardPoints({
    studentId: String(booking.studentId),
    mealSlotId: String(booking.mealSlotId),
    bookingId: String(booking._id),
    reason: "SUCCESSFUL_REDEMPTION",
    referenceKey: `redeem:${booking._id}`,
  });

  return {
    success: true,
    checkIn,
    booking,
  };
}

export async function syncOfflineScans({
  scans,
  mealSlotId,
  scannedBy,
}) {
  if (typeof mealSlotId !== "string" || !mealSlotId.trim()) {
    return { status: 400, message: "Invalid meal slot ID." };
  }

  if (typeof scannedBy !== "string" || !scannedBy.trim()) {
    return { status: 400, message: "Invalid staff ID." };
  }

  if (!Array.isArray(scans) || scans.length === 0 || scans.length > 100) {
    return {
      status: 400,
      message: "Submit between 1 and 100 scans per batch.",
    };
  }

  const results = [];

  for (const scan of scans) {
    const eventId =
      typeof scan?.eventId === "string" ? scan.eventId.trim() : "";
    const deviceId =
      typeof scan?.deviceId === "string" ? scan.deviceId.trim() : "";
    const token = scan?.token;

    if (
      !eventId ||
      eventId.length > 128 ||
      !deviceId ||
      deviceId.length > 128 ||
      typeof token !== "string" ||
      token.length < 1 ||
      token.length > 4096
    ) {
      results.push({
        eventId: eventId || null,
        success: false,
        message: "Invalid scan payload.",
      });
      continue;
    }

    try {
      // First check whether this event has already been synchronized.
      const existingQueue = await ScanQueue.findOne({ eventId });

      if (existingQueue) {
        results.push({
          eventId,
          success: existingQueue.status === SyncStatus.SYNCED,
          status: existingQueue.status,
          message: "This scan event was already received.",
        });
        continue;
      }

      // Recover a check-in saved before a previous request failed.
      const recovered = await recoverExistingCheckIn({
        eventId,
        token,
        mealSlotId,
      });

      if (recovered && !recovered.success) {
        results.push({
          eventId,
          success: false,
          message: recovered.message,
        });
        continue;
      }

      let attendance;

      if (recovered?.success) {
        attendance = {
          checkInId: recovered.checkIn._id,
          bookingId: recovered.booking._id,
          studentId: recovered.booking.studentId,
          mealSlotId: recovered.booking.mealSlotId,
          status: recovered.booking.status,
          checkedInAt: recovered.booking.checkedInAt,
          scannedAt: recovered.checkIn.scannedAt,
          eventId: recovered.checkIn.eventId,
        };
      } else {
        const result = await validateAndCheckIn({
          token,
          expectedMealSlotId: mealSlotId,
          scannedBy,
          eventId,
        });

        if (!result?.success) {
          results.push({
            eventId,
            success: false,
            message: result?.message ?? "Scan could not be verified.",
          });
          continue;
        }

        attendance = result.attendance;
      }

      const checkInId = String(attendance.checkInId);

      await ScanQueue.create({
        checkInId,
        deviceId,
        eventId,
        payload: {
          mealSlotId,
          eventId,
          tokenHash: crypto
            .createHash("sha256")
            .update(token)
            .digest("hex"),
        },
        status: SyncStatus.SYNCED,
        syncedAt: new Date(),
        lastError: null,
      });

      results.push({
        eventId,
        success: true,
        message: recovered?.success
          ? "Previously saved check-in recovered and synchronized."
          : "Offline scan synchronized.",
        attendance,
      });
    } catch (error) {
      // A concurrent request may have created the queue record.
      if (error?.code === 11000) {
        const existing = await ScanQueue.findOne({ eventId });

        results.push({
          eventId,
          success: existing?.status === SyncStatus.SYNCED,
          message: existing
            ? "This scan event was already received."
            : "Duplicate event conflict. Check synchronization status before retrying.",
        });
        continue;
      }

      results.push({
        eventId,
        success: false,
        message: "Server error while processing this scan.",
      });
    }
  }

  const synced = results.filter((item) => item.success).length;

  return {
    success: true,
    summary: {
      received: scans.length,
      synced,
      failed: scans.length - synced,
    },
    results,
  };
}
