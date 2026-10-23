import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { Role } from "../utils/enums.js";

const userSchema = new mongoose.Schema({
  _id: { type: String, default: () => randomUUID() },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: Object.values(Role), default: Role.STUDENT, required: true },
  isActive: { type: Boolean, default: true },
  studentId: { type: String, default: undefined },
  hostel: { type: String, default: undefined },
  course: { type: String, default: undefined },
  employeeId: { type: String, default: undefined },
  resetPasswordTokenHash: {
    type: String,
    default: undefined,
    select: false
  },
  resetPasswordExpiresAt: {
    type: Date,
    default: undefined,
    select: false
  },
  tokenVersion: {
    type: Number,
    default: 0
  }
}, { timestamps: { createdAt: "createdAt", updatedAt: false }, versionKey: false });

export default mongoose.model("User", userSchema);
