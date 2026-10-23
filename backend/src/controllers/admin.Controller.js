import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";

import User from "../models/User.js";
import { Role } from "../utils/enums.js";
import { sendPasswordResetEmail } from "../utils/email.js";

export async function createStaff(req, res, next) {
  try {
    const schema = z.object({
      name: z.string().trim().min(2).max(80),
      email: z.string().trim().email().max(254),
      employeeId: z.string().trim().min(1).max(50).optional()
    });

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid staff details.",
        errors: parsed.error.issues
      });
    }

    const { name, employeeId } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists."
      });
    }

    const rawToken = randomBytes(32).toString("hex");

    // Temporary random password: staff will set their own password.
    const temporaryPassword = randomBytes(32).toString("hex");
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const resetPasswordTokenHash = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const resetPasswordExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    const user = await User.create({
      name,
      email,
      employeeId,
      password: passwordHash,
      role: Role.MESS_STAFF,
      isActive: true,
      resetPasswordTokenHash,
      resetPasswordExpiresAt
    });

    try {
      const frontendUrl = process.env.FRONTEND_URL;

      if (!frontendUrl) {
        throw new Error("FRONTEND_URL is not configured.");
      }

      const resetUrl =
        `${frontendUrl.replace(/\/$/, "")}/reset-password` +
        `?token=${encodeURIComponent(rawToken)}`;

      await sendPasswordResetEmail(email, resetUrl);
    } catch (emailError) {
      // Avoid creating an account the staff member cannot set up.
      await User.deleteOne({ _id: user._id });
      throw emailError;
    }

    return res.status(201).json({
      message: "Staff account created. A password setup link has been emailed.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId
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