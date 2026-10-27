
import mongoose from "mongoose";
import crypto from "node:crypto";

import ScanQueue from "../models/ScanQueue.js";
import CheckIn from "../models/CheckIn.js";
import { SyncStatus } from "../utils/enums.js";
import { validateAndCheckIn } from "./checkin.service.js";

export async function syncOfflineScans({
  scans,
  mealSlotId,
  scannedBy,
}) {
  if (!mongoose.isValidObjectId(mealSlotId)) {
    return { status: 400, message: "Invalid meal slot ID." };
  }

  if (!Array.isArray(scans) || scans.length === 0 || scans.length > 100) {
    return {
      status: 400,
      message: "Submit between 1 and 100 scans per batch.",
    };
  }

  const results = [];

  for (const scan of scans) {
    const { eventId, token, deviceId } = scan ?? {};

    if (
      typeof eventId !== "string" ||
      eventId.length < 1 ||
      eventId.length > 128 ||
      typeof deviceId !== "string" ||
      deviceId.trim().length < 1 ||
      deviceId.length > 128 ||
      typeof token !== "string" ||
      token.length < 1 ||
      token.length > 4096
    ) {
      results.push({
        eventId: eventId ?? null,
        success: false,
        message: "Invalid scan payload.",
      });
      continue;
    }

    try {
      // Idempotency: a previously processed device event must not
      // check in the same student again.
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

      const checkInId = result.attendance.checkInId;

      await ScanQueue.create({
        checkInId: String(checkInId),
        deviceId: deviceId.trim(),
        eventId,
        payload: {
          mealSlotId,
          eventId,
          tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
        },
        status: SyncStatus.SYNCED,
        syncedAt: new Date(),
        lastError: null,
      });

      results.push({
        eventId,
        success: true,
        message: "Offline scan synchronized.",
        attendance: result.attendance,
      });
    } catch (error) {
      if (error?.code === 11000) {
        // A concurrent request may have processed the same event.
        const existing = await ScanQueue.findOne({ eventId });

        results.push({
          eventId,
          success: existing?.status === SyncStatus.SYNCED,
          message: existing
            ? "This scan event was already received."
            : "Duplicate event conflict. Retry after checking sync status.",
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
