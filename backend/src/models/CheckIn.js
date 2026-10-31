import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { CheckInStatus } from "../utils/enums.js";

const schema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  // QR scans include qrTokenId; staff-entered manual check-ins do not.
  qrTokenId: { type: String, ref: "QRToken", default: null },
  bookingId: { type: String, ref: "Booking", default: null, index: true },
  studentId: { type: String, ref: "User", required: true },
  mealSlotId: { type: String, ref: "MealSlot", required: true },
  scannedBy: { type: String, ref: "User", required: true },
  status: { type: String, enum: Object.values(CheckInStatus), required: true },
  isSynced: { type: Boolean, default: true },
  deviceId: { type: String, default: null },
  scannedAt: { type: Date, default: Date.now },
  // Stable per-booking event IDs make manual retries idempotent.
  eventId: { type: String, required: true, unique: true }
}, { timestamps: true, versionKey: false });

schema.index({ qrTokenId: 1, status: 1 });
schema.index({ mealSlotId: 1, scannedAt: -1 });

export default mongoose.models.CheckIn || mongoose.model("CheckIn", schema);
