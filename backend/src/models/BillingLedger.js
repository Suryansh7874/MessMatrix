import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { LedgerType } from "../utils/enums.js";

const schema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  studentId: { type: String, ref: "User", required: true },
  mealSlotId: { type: String, ref: "MealSlot", required: true },
  bookingId: { type: String, ref: "Booking", required: true },
  type: { type: String, enum: Object.values(LedgerType), required: true },
  amount: { type: mongoose.Schema.Types.Decimal128, required: true },
  reason: { type: String, required: true },
  date: { type: Date, default: Date.now },
  referenceId: { type: String, unique: true, sparse: true }
}, { timestamps: true, versionKey: false });
schema.index({ studentId: 1, date: -1 });
export default mongoose.model("BillingLedger", schema);
