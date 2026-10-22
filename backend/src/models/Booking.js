
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    meal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meal",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    choice: {
      type: String,
      enum: ["OPTED_IN", "OPTED_OUT"],
      default: "OPTED_IN",
      required: true,
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One booking per student per meal.
bookingSchema.index(
  { meal: 1, student: 1 },
  { unique: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
