
import mongoose from "mongoose";
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
    if (!mongoose.isValidObjectId(mealSlotId)) {
      return res.status(400).json({
        message: "Invalid meal slot ID.",
      });
    }
    // Cancellation uses the full-rebate service.
    // The service performs its own slot and cutoff validation.
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

    const filter = {
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

    const update = {
      status: newStatus,
      cancelledAt: null,
    };

    // Keep the existing duplicate-key recovery behavior.
    // Both attempts run transactionally with the slot write.
    const performUpdate = async (upsert) => {
      const session = await mongoose.startSession();
      let outcome;

      try {
        await session.withTransaction(async () => {
          outcome = undefined;

          // This conditional write coordinates with the cutoff-lock job.
          // The transaction must commit the slot touch and booking update
          // together, or neither should commit.
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
              session,
            }
          );

          if (!slot) {
            const existingSlot = await MealSlot.findById(mealSlotId)
              .session(session);

            outcome = existingSlot
              ? {
                  httpStatus: 409,
                  body: {
                    message:
                      "Booking changes are closed for this meal slot.",
                  },
                }
              : {
                  httpStatus: 404,
                  body: { message: "Meal slot not found." },
                };

            return;
          }

          const options = {
            new: true,
            runValidators: true,
            upsert,
            setDefaultsOnInsert: true,
            session,
          };

          const booking = await Booking.findOneAndUpdate(
            filter,
            {
              $set: update,
              $setOnInsert: {
                studentId,
                mealSlotId: slot._id,
                bookedAt: now,
              },
            },
            options
          );

          if (!booking) {
            const existing = await Booking.findOne({
              studentId,
              mealSlotId,
            })
              .select("status")
              .session(session);

            outcome = {
              httpStatus: 409,
              body: {
                message: existing
                  ? "This booking can no longer be changed."
                  : "Booking update conflict. Please retry.",
                ...(existing ? { status: existing.status } : {}),
              },
            };

            return;
          }

          outcome = {
            httpStatus: 200,
            body: {
              message: "Booking updated successfully.",
              booking,
            },
          };
        });

        return outcome;
      } finally {
        await session.endSession();
      }
    };

    let result;

    try {
      result = await performUpdate(true);
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }

      // A concurrent request may have inserted the unique student-slot
      // booking first. Retry as an update without inserting another row.
      result = await performUpdate(false);
    }

    return res.status(result?.httpStatus ?? 500).json(
      result?.body ?? {
        message: "Booking update could not be completed.",
      }
    );
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
