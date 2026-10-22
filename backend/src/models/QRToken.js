import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const schema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  bookingId: { type: String, ref: "Booking", required: true, unique: true },
  studentId: { type: String, ref: "User", required: true },
  mealSlotId: { type: String, ref: "MealSlot", required: true },
  tokenHash: { type: String, required: true, unique: true },
  issuedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  isUsed: { type: Boolean, default: false },
  usedAt: { type: Date, default: null }
}, { timestamps: true, versionKey: false });
schema.index({ mealSlotId: 1, studentId: 1 });
export default mongoose.model("QRToken", schema);
