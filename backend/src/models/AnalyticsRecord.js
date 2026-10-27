import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const schema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  mealSlotId: { type: String, ref: "MealSlot", required: true, unique: true }, 
  date: { type: Date, required: true },
  expectedCount: { type: Number, required: true, min: 0 },
  actualCount: { type: Number, required: true, min: 0 },
  noShowCount: { type: Number, required: true, min: 0 },
  surplusCount: { type: Number, required: true, min: 0 },
  preparedPortions: { type: Number, min: 0, default: 0 },
  recordedLeftovers: { type: Number, min: 0, default: 0 }
}, { timestamps: true, versionKey: false });
export default mongoose.model("AnalyticsRecord", schema);
