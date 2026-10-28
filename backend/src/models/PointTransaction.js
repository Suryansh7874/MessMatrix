
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const pointTransactionSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
    },

    studentId: {
      type: String,
      ref: "User",
      required: true,
      index: true,
    },

    mealSlotId: {
      type: String,
      ref: "MealSlot",
      required: true,
    },

    bookingId: {
      type: String,
      ref: "Booking",
      required: true,
    },

    points: {
      type: Number,
      required: true,
      enum: [-2, 1, 2],
    },

    reason: {
      type: String,
      enum: [
        "EARLY_CANCELLATION",
        "SUCCESSFUL_REDEMPTION",
        "NO_SHOW",
        "SURPLUS_COLLECTION",
      ],
      required: true,
    },

    referenceKey: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

pointTransactionSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.model(
  "PointTransaction",
  pointTransactionSchema
);
