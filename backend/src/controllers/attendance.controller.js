import { z } from "zod";
import Booking from "../models/Booking.js";
import MealSlot from "../models/MealSlot.js";
import { BookingStatus, SlotStatus } from "../utils/enums.js";

const checkInSchema = z.object({
  studentId: z.string().trim().min(1)
});

export async function checkInStudent(req, res, next) {
  try {
    const parsed = checkInSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "A valid studentId is required."
      });
    }

    const { mealSlotId } = req.params;
    const { studentId } = parsed.data;
    const now = new Date();

    const slot = await MealSlot.findById(mealSlotId);

    if (!slot) {
      return res.status(404).json({
        message: "Meal slot not found."
      });
    }

    if (slot.status !== SlotStatus.OPEN) {
      return res.status(409).json({
        message: "This meal slot is not open for attendance."
      });
    }

    if (now < slot.startTime || now > slot.endTime) {
      return res.status(409).json({
        message: "Check-in is allowed only during the meal serving window."
      });
    }

    // Atomic transition: only one request can change OPTED_IN to CHECKED_IN.
    const booking = await Booking.findOneAndUpdate(
      {
        studentId,
        mealSlotId: slot._id,
        status: BookingStatus.OPTED_IN
      },
      {
        $set: {
          status: BookingStatus.CHECKED_IN,
          checkedInAt: now,
          checkedInBy: req.user.id
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!booking) {
      const existing = await Booking.findOne({
        studentId,
        mealSlotId: slot._id
      });

      if (!existing) {
        return res.status(404).json({
          message: "No booking exists for this student and meal slot."
        });
      }

      if (existing.status === BookingStatus.CHECKED_IN) {
        return res.status(409).json({
          message: "This student has already been checked in."
        });
      }

      return res.status(409).json({
        message: `Student is not eligible for check-in. Current booking status: ${existing.status}.`
      });
    }

    return res.status(200).json({
      message: "Student checked in successfully.",
      attendance: {
        bookingId: booking._id,
        studentId: booking.studentId,
        mealSlotId: booking.mealSlotId,
        status: booking.status,
        checkedInAt: booking.checkedInAt,
        checkedInBy: booking.checkedInBy
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getAttendanceSummary(req, res, next) {
  try {
    const { mealSlotId } = req.params;

    const slot = await MealSlot.findById(mealSlotId);

    if (!slot) {
      return res.status(404).json({
        message: "Meal slot not found."
      });
    }

    const [optedIn, checkedIn, optedOut, cancelled, noShow] =
      await Promise.all([
        Booking.countDocuments({
          mealSlotId: slot._id,
          status: BookingStatus.OPTED_IN
        }),
        Booking.countDocuments({
          mealSlotId: slot._id,
          status: BookingStatus.CHECKED_IN
        }),
        Booking.countDocuments({
          mealSlotId: slot._id,
          status: BookingStatus.OPTED_OUT
        }),
        Booking.countDocuments({
          mealSlotId: slot._id,
          status: BookingStatus.CANCELLED
        }),
        Booking.countDocuments({
          mealSlotId: slot._id,
          status: BookingStatus.NO_SHOW
        })
      ]);

    return res.json({
      mealSlotId: slot._id,
      mealType: slot.mealType,
      startTime: slot.startTime,
      endTime: slot.endTime,
      bookingLocked: slot.bookingLocked,
      finalHeadcount: slot.finalHeadcount,
      attendance: {
        optedIn,
        checkedIn,
        pendingCheckIn: optedIn,
        optedOut,
        cancelled,
        noShow,
        totalExpectedAttendees: optedIn + checkedIn
      }
    });
  } catch (error) {
    next(error);
  }
}

const portionsSchema = z.object({
  portions: z.number().int().min(0)
});

export async function updatePreparedPortions(req, res, next) {
  try {
    const parsed = portionsSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "portions must be a non-negative integer."
      });
    }

    const slot = await MealSlot.findById(req.params.mealSlotId);

    if (!slot) {
      return res.status(404).json({
        message: "Meal slot not found."
      });
    }

    const preparedPortions = parsed.data.portions;

    // Existing recorded leftovers cannot exceed the new prepared quantity.
    if (
      slot.recordedLeftovers !== null &&
      slot.recordedLeftovers > preparedPortions
    ) {
      return res.status(400).json({
        message: "Prepared portions cannot be less than recorded leftovers."
      });
    }

    slot.preparedPortions = preparedPortions;
    await slot.save();

    return res.json({
      message: "Prepared portions recorded successfully.",
      mealSlotId: slot._id,
      preparedPortions: slot.preparedPortions,
      recordedLeftovers: slot.recordedLeftovers
    });
  } catch (error) {
    next(error);
  }
}

export async function recordLeftovers(req, res, next) {
  try {
    const parsed = portionsSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "portions must be a non-negative integer."
      });
    }

    const slot = await MealSlot.findById(req.params.mealSlotId);

    if (!slot) {
      return res.status(404).json({
        message: "Meal slot not found."
      });
    }

    if (slot.preparedPortions === null) {
      return res.status(409).json({
        message: "Record prepared portions before recording leftovers."
      });
    }

    const recordedLeftovers = parsed.data.portions;

    if (recordedLeftovers > slot.preparedPortions) {
      return res.status(400).json({
        message: "Leftovers cannot exceed prepared portions."
      });
    }

    slot.recordedLeftovers = recordedLeftovers;
    await slot.save();

    const wastePercentage =
      slot.preparedPortions === 0
        ? 0
        : Number(
            ((recordedLeftovers / slot.preparedPortions) * 100).toFixed(2)
          );

    return res.json({
      message: "Leftovers recorded successfully.",
      mealSlotId: slot._id,
      preparedPortions: slot.preparedPortions,
      recordedLeftovers: slot.recordedLeftovers,
      wastePercentage
    });
  } catch (error) {
    next(error);
  }
}