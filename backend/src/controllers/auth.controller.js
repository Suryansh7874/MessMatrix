import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import { Role } from "../utils/enums.js";
import { randomBytes, createHash } from "node:crypto";
import { sendPasswordResetEmail } from "../utils/email.js";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72)
});
const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72)
});

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}
function issueToken(user) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error(
      "JWT_SECRET must be configured with at least 32 characters."
    );
  }

  return jwt.sign(
    {
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0
    },
    process.env.JWT_SECRET,
    {
      subject: user._id,
      expiresIn: "1h"
    }
  );
}


export async function register(req, res, next) {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid registration details",
        errors: parsed.error.issues
      });
    }

    const { name } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    // Hash the original password
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    // Store the hash under the MongoDB field "password"
    const user = await User.create({
      name,
      email,
      password: passwordHash,
      role: Role.STUDENT
    });

    return res.status(201).json({
      message: "Registration successful",
      user: publicUser(user)
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


export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid login details."
      });
    }

    const user = await User.findOne({
      email: parsed.data.email.toLowerCase()
    }).select("+password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    if (typeof user.password !== "string" || !user.password) {
      console.error("Password missing for user:", user._id);

      return res.status(500).json({
        message: "Account credentials are not configured correctly."
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      parsed.data.password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const token = issueToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
}


export function getMe(req, res) {
  return res.json({ user: req.user });
}

export async function forgotPassword(req, res, next) {
  try {
    const emailSchema = z.object({
      email: z.string().trim().email().max(254)
    });

    const parsed = emailSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Please provide a valid email address."
      });
    }

    const user = await User.findOne({
      email: parsed.data.email.toLowerCase(),
      isActive: true
    });

    // Do not reveal whether an account exists.
    const genericResponse = {
      message:
        "If an active account exists for this email, a reset link will be sent."
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // A cryptographically secure, single-use reset token.
    const rawToken = randomBytes(32).toString("hex");

    user.resetPasswordTokenHash = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await user.save();

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      throw new Error("FRONTEND_URL is not configured.");
    }

    const resetUrl =
      `${frontendUrl.replace(/\/$/, "")}/reset-password` +
      `?token=${encodeURIComponent(rawToken)}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailError) {
      // Don't leave a valid reset token behind if email delivery fails.
      user.resetPasswordTokenHash = undefined;
      user.resetPasswordExpiresAt = undefined;
      await user.save();
      throw emailError;
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const resetSchema = z.object({
      token: z.string().regex(/^[a-f0-9]{64}$/i),
      newPassword: z.string().min(8).max(72)
    });

    const parsed = resetSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid reset details. Check your password and token."
      });
    }

    const tokenHash = createHash("sha256")
      .update(parsed.data.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
      isActive: true
    }).select("+resetPasswordTokenHash +resetPasswordExpiresAt");

    if (!user) {
      return res.status(400).json({
        message: "This reset link is invalid or has expired."
      });
    }

    user.password = await bcrypt.hash(parsed.data.newPassword, 12);

    // Make the reset token single-use.
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;

    // Invalidate JWTs issued before the password reset.
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;

    await user.save();

    return res.status(200).json({
      message: "Password reset successful. Please log in again."
    });
  } catch (error) {
    next(error);
  }
}