import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import { Role } from "../utils/enums.js";

export async function createStaff(req, res, next) {
  try {
    const schema = z.object({
      name: z.string().trim().min(2).max(80),
      email: z.string().trim().email().max(254),
      employeeId: z.string().trim().min(1).max(50),
      password: z.string().min(8).max(72)
    });

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid staff details.",
        errors: parsed.error.issues
      });
    }

    const { name, employeeId, password } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      employeeId,
      password: passwordHash,
      role: Role.MESS_STAFF,
      isActive: true
    });

    return res.status(201).json({
      message: "Mess staff account created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        role: user.role
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists."
      });
    }

    next(error);
  }
}