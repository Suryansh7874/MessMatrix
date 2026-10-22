
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Expected format: Bearer <token>
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required. Please provide a token.",
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message: "Authentication token is missing.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Authentication is not configured.",
      });
    }

    // Verify token signature and expiration.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch current user and role from the database.
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({
        message: "User account not found.",
      });
    }

    // Attach verified identity to the request.
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired authentication token.",
      });
    }

    next(error);
  }
}

export function requireRole(...allowedRoles) {
  return function (req, res, next) {
    // authenticate must run before requireRole.
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to access this resource.",
      });
    }

    next();
  };
}
