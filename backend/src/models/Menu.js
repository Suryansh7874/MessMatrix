  import mongoose from "mongoose";
  import { randomUUID } from "node:crypto";
  import { MealType } from "../utils/enums.js";

  const menuSchema = new mongoose.Schema({
    _id: { type: String, default: () => randomUUID() },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: "", maxlength: 1000 },
    mealType: { type: String, enum: Object.values(MealType), required: true },
    date: { type: Date, required: true },
    price: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },
    imageUrl: { type: String, default: "" }
  }, { timestamps: true, versionKey: false });

  menuSchema.index({ date: 1, mealType: 1 });
  export default mongoose.model("Menu", menuSchema);
