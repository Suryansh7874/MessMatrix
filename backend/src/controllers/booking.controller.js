
import { z } from "zod";

import MealSlot from "../models/MealSlot.js";
import Booking from "../models/Booking.js";
import Menu from "../models/Menu.js";
import BillingLedger from "../models/BillingLedger.js";
import { BookingStatus, LedgerType } from "../utils/enums.js";
import { cancelBookingAndIssueFullRebate } from "../services/rebate.service.js";

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

    // Preserve existing cancellation and rebate behavior.
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

    // Verify the meal slot is still open before changing a booking.
    const performUpdate = async (upsert) => {
      const slot = await MealSlot.findOneAndUpdate(
        {
          _id: mealSlotId,
          status: "OPEN",
          bookingLocked: false,
          cutoffTime: { $gt: now },
        },
        { $set: { updatedAt: now } },
        { new: true }
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

      // If another request inserted the booking first, update it instead.
      result = await performUpdate(false);
    }

    if (result.httpStatus !== 200) {
      return res.status(result.httpStatus).json(result.body);
    }

    // Add one charge for each successful OPTED_IN booking.
    if (newStatus === BookingStatus.OPTED_IN) {
      const slot = await MealSlot.findById(mealSlotId).select("menuId");

      if (!slot) {
        return res.status(404).json({
          message: "Meal slot not found.",
        });
      }

      const menu = await Menu.findById(slot.menuId).select("price name");

      if (!menu || menu.price == null) {
        return res.status(500).json({
          message:
            "Booking was saved, but the meal price could not be found. Please retry or contact the mess administrator.",
        });
      }

      const booking = result.body.booking;
      const referenceId = `charge:${booking._id}`;

      // Stable referenceId prevents duplicate charge entries on retries.
      const ledgerEntry = await BillingLedger.findOneAndUpdate(
        { referenceId },
        {
          $setOnInsert: {
            studentId,
            mealSlotId,
            bookingId: booking._id,
            type: LedgerType.CHARGE,
            amount: menu.price,
            reason: `Meal charge: ${menu.name || "meal booking"}`,
            date: now,
            referenceId,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      // Verify the ledger entry belongs to this booking and student.
      if (
        !ledgerEntry ||
        ledgerEntry.studentId !== studentId ||
        ledgerEntry.bookingId !== booking._id ||
        ledgerEntry.type !== LedgerType.CHARGE
      ) {
        return res.status(409).json({
          message:
            "Booking was saved, but its billing entry could not be verified. Please contact the mess administrator.",
        });
      }
    }

    return res.status(200).json(result.body);
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
