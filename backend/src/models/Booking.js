import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { BookingStatus } from "../utils/enums.js";

const bookingSchema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  studentId: { type: String, ref: "User", required: true },
  mealSlotId: { type: String, ref: "MealSlot", required: true },
  status: { type: String, enum: Object.values(BookingStatus), default: BookingStatus.OPTED_IN, required: true },
  bookedAt: { type: Date, default: Date.now },
  cancelledAt: { type: Date, default: null }
}, { timestamps: { createdAt: false, updatedAt: "updatedAt" }, versionKey: false });

bookingSchema.index({ studentId: 1, mealSlotId: 1 }, { unique: true });
bookingSchema.index({ mealSlotId: 1, status: 1 });

export default mongoose.model("Booking", bookingSchema);
