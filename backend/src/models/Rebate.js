import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { RebateStatus } from "../utils/enums.js";

const schema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  studentId: { type: String, ref: "User", required: true },
  bookingId: { type: String, ref: "Booking", required: true },
  amount: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },
  status: { type: String, enum: Object.values(RebateStatus), default: RebateStatus.PENDING },
  createdAt: { type: Date, default: Date.now },
  processedAt: { type: Date, default: null },
  approvedBy: { type: String, ref: "User", default: null }
}, { timestamps: false, versionKey: false });
schema.index({ bookingId: 1 }, { unique: true });
export default mongoose.model("Rebate", schema);
