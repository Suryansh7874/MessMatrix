
import bcrypt from "bcryptjs";  // Importing bcryptjs for password hashing and comparison
import jwt from "jsonwebtoken";  // Importing jsonwebtoken for creating and verifying JWT tokens
import { z } from "zod";  // Importing zod for schema validation
import User from "../models/User.js";  // Importing the User model to interact with the users collection in MongoDB

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),  // Validating that the name is a string, trimmed, and between 2 and 80 characters
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),// Validating that the email is a string, trimmed, a valid email format, and not exceeding 254 characters
  password: z.string().min(1).max(72),
});

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    { role: user.role },
    process.env.JWT_SECRET,  
    {
      subject: user._id.toString(),
      expiresIn: "1h",
    }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function register(req, res, next) {
  try {
    const parsed = registerSchema.safeParse(req.body); // Validate the request body against the registration schema

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid registration details",        
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,  // Check if a user with the same email already exists in the database
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Hash the password using bcrypt with a salt round of 12 for security

    // Public registration can only create a STUDENT.
    const user = await User.create({
      name,
      email: normalizedEmail, // Store the email in lowercase to ensure uniqueness and consistency
      password: hashedPassword, // Store the hashed password in the database for security
      role: "STUDENT",
    });

    return res.status(201).json({
      message: "Registration successful",
      user: publicUser(user),
    });
  } catch (error) {
    // Also handles duplicate-email races safely.
    if (error.code === 11000) { // Duplicate key error code in MongoDB, indicating that a user with the same email already exists
      return res.status(409).json({
        message: "An account with this email already exists",
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
        message: "Invalid login details",
      });
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password"); // Select the password field explicitly since it is excluded by default in the User model for security reasons

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      expiresIn: "1h",
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export function getMe(req, res) {
  return res.status(200).json({
    user: req.user,
  });
}
