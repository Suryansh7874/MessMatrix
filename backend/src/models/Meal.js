
import mongoose from "mongoose";

const mealSchema = new mongoose.Schema(
  {
    mealType: {
      type: String,
      enum: ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"],
      required: true,
    },

    serviceAt: {
      type: Date,
      required: true,
    },

    cutoffAt: {
      type: Date,
      required: true,
    },

    menu: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["OPEN", "LOCKED", "CLOSED"],
      default: "OPEN",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    lockedAt: {
      type: Date,
      default: null,
    },

    finalHeadcount: {
      type: Number,
      default: null,
      min: 0,
    },

  },
  { timestamps: true }
);

mealSchema.index({ serviceAt: 1, mealType: 1 });

const Meal = mongoose.model("Meal", mealSchema);

export default Meal;
