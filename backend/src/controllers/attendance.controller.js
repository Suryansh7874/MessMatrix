import { z } from "zod";
import Booking from "../models/Booking.js";
import MealSlot from "../models/MealSlot.js";
import { BookingStatus, SlotStatus } from "../utils/enums.js";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

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

function getQrSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return process.env.JWT_SECRET;
}


export async function generateMealQrToken(req, res, next) {
  try {
    const { mealSlotId } = req.params;

    const slot = await MealSlot.findById(mealSlotId);

    if (!slot) {
      return res.status(404).json({
        message: "Meal slot not found."
      });
    }

    const booking = await Booking.findOne({
      studentId: req.user.id,
      mealSlotId: slot._id,
      status: BookingStatus.OPTED_IN
    });

    if (!booking) {
      return res.status(409).json({
        message: "An active booking is required to generate a QR code."
      });
    }

    if (
      slot.status !== SlotStatus.OPEN ||
      !slot.bookingLocked ||
      new Date() >= slot.endTime
    ) {
      return res.status(409).json({
        message: "QR code is unavailable for this meal slot."
      });
    }

    const token = jwt.sign(
      {
        purpose: "meal-checkin",
        mealSlotId: slot._id,
        jti: randomUUID()
      },
      getQrSecret(),
      {
        subject: req.user.id,
        issuer: "mess-matrix",
        audience: "meal-checkin",
        expiresIn: "5m"
      }
    );

    return res.json({
      message: "QR token generated successfully.",
      token,
      expiresInSeconds: 300,
      mealSlotId: slot._id
    });
  } catch (error) {
    next(error);
  }
}

export async function scanMealQr(req, res, next) {
  try {
    const { mealSlotId } = req.params;
    const { token } = req.body;

    if (typeof token !== "string" || token.length === 0 || token.length > 4096) {
      return res.status(400).json({
        message: "A valid QR token is required."
      });
    }

    let payload;

    try {
      payload = jwt.verify(token, getQrSecret(), {
        issuer: "mess-matrix",
        audience: "meal-checkin",
        algorithms: ["HS256"]
      });
    } catch {
      return res.status(401).json({
        message: "QR token is invalid or expired."
      });
    }

    if (
      typeof payload !== "object" ||
      payload.purpose !== "meal-checkin" ||
      payload.mealSlotId !== mealSlotId ||
      typeof payload.sub !== "string"
    ) {
      return res.status(401).json({
        message: "QR code is not valid for this meal slot."
      });
    }

    const slot = await MealSlot.findById(mealSlotId);

    if (!slot) {
      return res.status(404).json({
        message: "Meal slot not found."
      });
    }

    const now = new Date();

    if (
      slot.status !== SlotStatus.OPEN ||
      now < slot.startTime ||
      now >= slot.endTime
    ) {
      return res.status(409).json({
        message: "Check-in is allowed only during meal service."
      });
    }

    // Atomic update prevents two simultaneous scans from checking
    // in the same booking twice.
    const booking = await Booking.findOneAndUpdate(
      {
        studentId: payload.sub,
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
        studentId: payload.sub,
        mealSlotId: slot._id
      }).select("status");

      if (!existing) {
        return res.status(404).json({
          message: "No booking found for this student and meal."
        });
      }

      if (existing.status === BookingStatus.CHECKED_IN) {
        return res.status(409).json({
          message: "This student has already checked in."
        });
      }

      return res.status(409).json({
        message: "This booking is not eligible for check-in."
      });
    }

    return res.json({
      message: "QR verified. Student checked in successfully.",
      attendance: {
        mealSlotId: slot._id,
        studentId: booking.studentId,
        status: booking.status,
        checkedInAt: booking.checkedInAt
      }
    });
  } catch (error) {
    next(error);
  }
}