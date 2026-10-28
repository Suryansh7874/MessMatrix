
import { z } from "zod";

import MealSlot from "../models/MealSlot.js";
import Booking from "../models/Booking.js";
import { BookingStatus } from "../utils/enums.js";
import {
  cancelBookingAndIssueFullRebate,
} from "../services/rebate.service.js";

const choiceSchema = z.object({
  status: z.enum(["OPTED_IN", "OPTED_OUT", "CANCELLED"]),
});

export async function setBooking(req, res, next) {
  try {
    const parsed = choiceSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "status must be OPTED_IN, OPTED_OUT or CANCELLED.",
      });
    }

    const studentId = req.user.id;
    const mealSlotId = req.params.mealSlotId;
    const newStatus = parsed.data.status;


    // Cancellation and rebate are handled by the rebate service.
    if (newStatus === BookingStatus.CANCELLED) {
      const result = await cancelBookingAndIssueFullRebate({
        studentId,
        mealSlotId,
      });

      if (result.status) {
        return res.status(result.status).json({
          message: result.message,
        });
      }

      return res.status(200).json(result);
    }

    const now = new Date();

    const bookingFilter = {
      studentId,
      mealSlotId,
      status: {
        $nin: [
          BookingStatus.CANCELLED,
          BookingStatus.CHECKED_IN,
          BookingStatus.NO_SHOW,
        ],
      },
    };

    const bookingUpdate = {
      $set: {
        status: newStatus,
        cancelledAt: null,
      },
      $setOnInsert: {
        studentId,
        mealSlotId,
        bookedAt: now,
      },
    };

    // Standalone MongoDB compatible: no sessions or transactions.
    const performUpdate = async (upsert) => {
      // Atomically verify that booking changes are still allowed.
      const slot = await MealSlot.findOneAndUpdate(
        {
          _id: mealSlotId,
          status: "OPEN",
          bookingLocked: false,
          cutoffTime: { $gt: now },
        },
        {
          $set: { updatedAt: now },
        },
        {
          new: true,
        }
      );

      if (!slot) {
        const existingSlot = await MealSlot.findById(mealSlotId);

        return {
          httpStatus: existingSlot ? 409 : 404,
          body: {
            message: existingSlot
              ? "Booking changes are closed for this meal slot."
              : "Meal slot not found.",
          },
        };
      }

      const booking = await Booking.findOneAndUpdate(
        bookingFilter,
        bookingUpdate,
        {
          new: true,
          runValidators: true,
          upsert,
          setDefaultsOnInsert: true,
        }
      );

      if (!booking) {
        const existing = await Booking.findOne({
          studentId,
          mealSlotId,
        }).select("status");

        return {
          httpStatus: 409,
          body: {
            message: existing
              ? "This booking can no longer be changed."
              : "Booking update conflict. Please retry.",
            ...(existing ? { status: existing.status } : {}),
          },
        };
      }

      return {
        httpStatus: 200,
        body: {
          message: "Booking updated successfully.",
          booking,
        },
      };
    };

    let result;

    try {
      result = await performUpdate(true);
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }

      // Another request may have created the unique booking first.
      // Retry as an update without inserting another document.
      result = await performUpdate(false);
    }

    return res.status(result.httpStatus).json(result.body);
  } catch (error) {
    next(error);
  }
}

export async function getMyBookings(req, res, next) {
  try {
    const bookings = await Booking.find({
      studentId: req.user.id,
    })
      .populate("mealSlotId")
      .sort({ bookedAt: -1 });

    return res.json({
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
}
