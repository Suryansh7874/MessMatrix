
import cron from "node-cron";
import Meal from "../models/Meal.js";
import Booking from "../models/Booking.js";

export async function lockDueMeals() {
  const now = new Date();

  const dueMeals = await Meal.find({
    status: "OPEN",
    cutoffAt: { $lte: now },
  }).select("_id");

  for (const dueMeal of dueMeals) {
    // Atomically claim this meal for locking.
    const lockedMeal = await Meal.findOneAndUpdate(
      {
        _id: dueMeal._id,
        status: "OPEN",
        cutoffAt: { $lte: now },
      },
      {
        $set: {
          status: "LOCKED",
          lockedAt: now,
        },
      },
      { new: true }
    );

    // Another worker may already have locked it.
    if (!lockedMeal) continue;

    const headcount = await Booking.countDocuments({
      meal: lockedMeal._id,
      choice: "OPTED_IN",
    });

    await Meal.updateOne(
      { _id: lockedMeal._id, status: "LOCKED" },
      { $set: { finalHeadcount: headcount } }
    );

    console.log(
      `Meal ${lockedMeal._id} locked. Headcount: ${headcount}`
    );
  }
}

export function startMealLockScheduler() {
  cron.schedule("* * * * *", async () => {
    try {
      await lockDueMeals();
    } catch (error) {
      console.error("Meal lock scheduler failed:", error);
    }
  });

  console.log("Meal lock scheduler started.");
}
