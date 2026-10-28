import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import {
  lockDueMealSlots,
  closeDueMealSlots,
  startMealLockScheduler,
} from "./services/meal-lock.service.js";

import { reconcilePointTransactions } from "./services/point.service.js";

if (!process.env.JWT_SECRET) {
  console.error("Startup failed: JWT_SECRET is missing.");
  process.exit(1);
}
const PORT = process.env.PORT || 5000;

try {
  await connectDB();
  await lockDueMealSlots();
  await closeDueMealSlots();
  await reconcilePointTransactions();

  startMealLockScheduler();

  app.listen(PORT, () => console.log(`Mess Matrix API running on port ${PORT}`));
} catch (error) {
  console.error("Backend startup failed:", error);
  process.exit(1);
}
