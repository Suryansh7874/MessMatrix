import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import healthRoutes from "./routes/health.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import mealRoutes from "./routes/meal.routes.js";
import bookingRoutes from "./routes/booking.routes.js";

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Permit requests without an Origin header (e.g. curl/Postman).
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
  })
);

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    name: "Mess Matrix API",
    message: "Backend is running.",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/bookings", bookingRoutes);


app.use(notFound);
app.use(errorHandler);

export default app;
