
import mongoose from "mongoose";
import { z } from "zod";
import Menu from "../models/Menu.js";
import MealSlot from "../models/MealSlot.js";
import Booking from "../models/Booking.js";
import { BookingStatus, SlotStatus } from "../utils/enums.js";

const createSchema = z.object({
  menuId: z.string().uuid(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER"]),
  date: z.string().datetime({ offset: true }),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  cutoffTime: z.string().datetime({ offset: true }),
});

export async function createMealSlot(req, res, next) {
  try {
    const parsed = createSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid meal slot",
        errors: parsed.error.issues,
      });
    }

    // FIX: Extract validated request data.
    const data = parsed.data;

    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    const cutoffTime = new Date(data.cutoffTime);
    const now = new Date();
    const date = new Date(data.date);

    if (date.toDateString() !== startTime.toDateString()) {
      return res.status(400).json({
        message: "Meal date must match the service start date.",
      });
    }

    if (
      startTime <= now ||
      cutoffTime <= now ||
      cutoffTime >= startTime ||
      endTime <= startTime
    ) {
      return res.status(400).json({
        message:
          "Times must be valid: cutoff < start < end, and service must be in the future.",
      });
    }

    const menu = await Menu.findById(data.menuId);

    if (!menu) {
      return res.status(404).json({
        message: "Menu not found.",
      });
    }

    if (menu.mealType !== data.mealType) {
      return res.status(400).json({
        message: "Meal type must match the selected menu.",
      });
    }

    const slot = await MealSlot.create({
      menuId: data.menuId,
      mealType: data.mealType,
      date: new Date(data.date),
      startTime,
      endTime,
      cutoffTime,
      status: SlotStatus.OPEN,
    });

    return res.status(201).json({
      message: "Meal slot created",
      mealSlot: slot,
    });
  } catch (error) {
    next(error);
  }
}

export async function listMealSlots(req, res, next) {
  try {
    const slots = await MealSlot.find({
      endTime: { $gte: new Date() },
    })
      .populate("menuId")
      .sort({ startTime: 1 });

    return res.json({
      count: slots.length,
      mealSlots: slots,
    });
  } catch (error) {
    next(error);
  }
}

export async function getHeadcount(req, res, next) {
  try {
    const slot = await MealSlot.findById(req.params.mealSlotId);

    if (!slot) {
      return res.status(404).json({
        message: "Meal slot not found.",
      });
    }

    const [
      optedIn,
      checkedIn,
      noShow,
      cancelled,
      optedOut,
    ] = await Promise.all([
      Booking.countDocuments({
        mealSlotId: slot._id,
        status: BookingStatus.OPTED_IN,
      }),
      Booking.countDocuments({
        mealSlotId: slot._id,
        status: BookingStatus.CHECKED_IN,
      }),
      Booking.countDocuments({
        mealSlotId: slot._id,
        status: BookingStatus.NO_SHOW,
      }),
      Booking.countDocuments({
        mealSlotId: slot._id,
        status: BookingStatus.CANCELLED,
      }),
      Booking.countDocuments({
        mealSlotId: slot._id,
        status: BookingStatus.OPTED_OUT,
      }),
    ]);

    const totalBooked = optedIn + checkedIn;

    return res.json({
      mealSlotId: slot._id,
      totalBooked,
      pendingCheckIn: optedIn,
      checkedIn,
      noShow,
      cancelled,
      optedOut,
      finalHeadcount: slot.finalHeadcount,
      bookingLocked: slot.bookingLocked,
    });
  } catch (error) {
    next(error);
  }
}