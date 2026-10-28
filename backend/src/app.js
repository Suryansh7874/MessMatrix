
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import mealSlotRoutes from "./routes/mealSlot.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import rebateRoutes from "./routes/rebate.routes.js";
import pointRoutes from "./routes/point.routes.js";

import {
  notFound,
  errorHandler,
} from "./middleware/error.middleware.js";

const app = express();

const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(helmet());
app.use(express.json({ limit: "10kb" }));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/", (req, res) =>
  res.json({ name: "Mess Matrix API", status: "running" })
);

app.get("/api/health", (req, res) =>
  res.json({ status: "ok" })
);

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/meal-slots", mealSlotRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/rebates", rebateRoutes);
app.use("/api/points", pointRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
