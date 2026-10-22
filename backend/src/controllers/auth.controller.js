import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import { Role } from "../utils/enums.js";

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
    throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  }
  return jwt.sign({ role: user.role }, process.env.JWT_SECRET, {
    subject: user._id,
    expiresIn: "1h"
  });
}

export async function register(req, res, next) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid registration details", errors: parsed.error.issues });
    const { name, password } = parsed.data;
    const email = parsed.data.email.toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role: Role.STUDENT });
    return res.status(201).json({ message: "Registration successful", user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "An account with this email already exists." });
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid login details." });
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+passwordHash");
    if (!user || !user.isActive || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    return res.status(200).json({ message: "Login successful", token: issueToken(user), expiresIn: "1h", user: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

export function getMe(req, res) {
  return res.json({ user: req.user });
}
