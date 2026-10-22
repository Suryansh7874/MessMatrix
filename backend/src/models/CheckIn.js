import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { CheckInStatus } from "../utils/enums.js";

const schema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  qrTokenId: { type: String, ref: "QRToken", required: true },
  studentId: { type: String, ref: "User", required: true },
  mealSlotId: { type: String, ref: "MealSlot", required: true },
  scannedBy: { type: String, ref: "User", required: true },
  status: { type: String, enum: Object.values(CheckInStatus), required: true },
  isSynced: { type: Boolean, default: true },
  deviceId: { type: String, default: null },
  scannedAt: { type: Date, default: Date.now },
  eventId: { type: String, required: true, unique: true }
}, { timestamps: true, versionKey: false });
schema.index({ qrTokenId: 1, status: 1 });
export default mongoose.model("CheckIn", schema);
