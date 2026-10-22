import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { lockDueMealSlots, startMealLockScheduler } from "./services/meal-lock.service.js";

const PORT = process.env.PORT || 5000;

try {
  await connectDB();
  await lockDueMealSlots();
  startMealLockScheduler();
  app.listen(PORT, () => console.log(`Mess Matrix API running on port ${PORT}`));
} catch (error) {
  console.error("Backend startup failed:", error);
  process.exit(1);
}
