
import mongoose from "mongoose";
import { z } from "zod";
import Meal from "../models/Meal.js";
import Booking from "../models/Booking.js";

const bookingSchema = z.object({
  choice: z.enum(["OPTED_IN", "OPTED_OUT"]),
});

export async function setBooking(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.mealId)) {
      return res.status(400).json({
        message: "Invalid meal ID.",
      });
    }

    const parsed = bookingSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "choice must be OPTED_IN or OPTED_OUT.",
      });
    }

    const meal = await Meal.findById(req.params.mealId);

    if (!meal) {
      return res.status(404).json({
        message: "Meal not found.",
      });
    }

    const now = new Date();

    if (meal.status !== "OPEN" || now >= meal.cutoffAt) {
      return res.status(409).json({
        message: "Booking is closed for this meal.",
      });
    }

    const booking = await Booking.findOneAndUpdate(
      {
        meal: meal._id,
        student: req.user.id,
      },
      {
        $set: {
          choice: parsed.data.choice,
          changedAt: now,
        },
        $setOnInsert: {
          meal: meal._id,
          student: req.user.id,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      message: "Meal booking updated successfully.",
      booking,
    });
  } catch (error) {
    // Concurrent first-time requests may race on the unique index.
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A booking update conflicted. Please retry.",
      });
    }

    next(error);
  }
}

export async function getMyBookings(req, res, next) {
  try {
    const bookings = await Booking.find({
      student: req.user.id,
    })
      .populate("meal")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
}
