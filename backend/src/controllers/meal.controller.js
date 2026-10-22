
import { z } from "zod";
import Meal from "../models/Meal.js";

const createMealSchema = z.object({
  mealType: z.enum([
    "BREAKFAST",
    "LUNCH",
    "SNACKS",
    "DINNER",
  ]),
  serviceAt: z.string().datetime({ offset: true }),
  cutoffAt: z.string().datetime({ offset: true }),
  menu: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
});

export async function createMeal(req, res, next) {
  try {
    const parsed = createMealSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid meal schedule",
        errors: parsed.error.issues,
      });
    }

    const { mealType, serviceAt, cutoffAt, menu = [] } = parsed.data;

    const serviceDate = new Date(serviceAt);
    const cutoffDate = new Date(cutoffAt);
    const now = new Date();

    if (serviceDate <= now) {
      return res.status(400).json({
        message: "Meal service time must be in the future.",
      });
    }

    if (cutoffDate <= now || cutoffDate >= serviceDate) {
      return res.status(400).json({
        message: "Cutoff must be in the future and before meal service.",
      });
    }

    const meal = await Meal.create({
      mealType,
      serviceAt: serviceDate,
      cutoffAt: cutoffDate,
      menu,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      message: "Meal scheduled successfully",
      meal,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUpcomingMeals(req, res, next) {
  try {
    const meals = await Meal.find({
      serviceAt: { $gte: new Date() },
    })
      .sort({ serviceAt: 1 })
      .populate("createdBy", "name");

    return res.status(200).json({
      count: meals.length,
      meals,
    });
  } catch (error) {
    next(error);
  }
}
