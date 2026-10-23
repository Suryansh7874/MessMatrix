import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { MealType, SlotStatus } from "../utils/enums.js";

const mealSlotSchema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  menuId: { type: String, ref: "Menu", required: true },
  mealType: { type: String, enum: Object.values(MealType), required: true },
  date: { type: Date, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  cutoffTime: { type: Date, required: true },
  status: { type: String, enum: Object.values(SlotStatus), default: SlotStatus.UPCOMING, required: true },
  bookingLocked: { type: Boolean, default: false },
  lockedAt: { type: Date, default: null },
  finalHeadcount: { type: Number, default: null, min: 0 },
  preparedPortions: { type: Number, min: 0, default: null },
  recordedLeftovers: { type: Number, min: 0, default: null }
}, { timestamps: true, versionKey: false });

mealSlotSchema.index({ date: 1, mealType: 1 });
mealSlotSchema.index({ status: 1, cutoffTime: 1, bookingLocked: 1 });

export default mongoose.model("MealSlot", mealSlotSchema);
