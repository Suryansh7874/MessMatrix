
import Rebate from "../models/Rebate.js";
import { RebateStatus } from "../utils/enums.js";
import BillingLedger from "../models/BillingLedger.js";
import Booking from "../models/Booking.js";

export async function getPendingRebates(req, res, next) {
  try {
    const rebates = await Rebate.find({
      status: RebateStatus.PENDING,
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      count: rebates.length,
      rebates: rebates.map((rebate) => ({
        ...rebate,
        amount: rebate.amount?.toString() ?? "0",
      })),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMyRebates(req, res, next) {
  try {
    const rebates = await Rebate.find({
      studentId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      count: rebates.length,
      rebates: rebates.map((rebate) => ({
        ...rebate,
        amount: rebate.amount?.toString() ?? "0",
      })),
    });
  } catch (error) {
    return next(error);
  }
}

export async function createRebateRequest(req, res, next) {
  try {
    const { bookingId, reason } = req.body;

    if (
      typeof bookingId !== "string" ||
      !bookingId.trim() ||
      typeof reason !== "string" ||
      reason.trim().length < 5 ||
      reason.trim().length > 500
    ) {
      return res.status(400).json({
        message:
          "A booking ID and a reason between 5 and 500 characters are required.",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId.trim(),
      studentId: req.user.id,
    }).populate({
      path: "mealSlotId",
      populate: { path: "menuId" },
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found for your account.",
      });
    }

    if (booking.checkedInAt) {
      return res.status(400).json({
        message:
          "A rebate cannot be requested for a meal already checked in.",
      });
    }

    const existingRebate = await Rebate.findOne({
      bookingId: booking._id,
    });

    if (existingRebate) {
      return res.status(409).json({
        message: "A rebate request already exists for this booking.",
      });
    }

    const mealSlot = booking.mealSlotId;
    const amount = mealSlot?.menuId?.price;

    if (
      amount == null ||
      !Number.isFinite(Number(amount.toString())) ||
      Number(amount.toString()) < 0
    ) {
      return res.status(400).json({
        message: "Could not determine the rebate amount for this booking.",
      });
    }

    const rebate = await Rebate.create({
      studentId: req.user.id,
      bookingId: booking._id,
      amount,
      reason: reason.trim(),
      status: RebateStatus.PENDING,
    });

    return res.status(201).json({
      message: "Rebate request submitted successfully.",
      rebate: {
        ...rebate.toObject(),
        amount: rebate.amount.toString(),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A rebate request already exists for this booking.",
      });
    }

    return next(error);
  }
}

export async function getMyBillingLedger(req, res, next) {
  try {
    const ledgerEntries = await BillingLedger.find({
      studentId: req.user.id,
    })
      .sort({ date: -1, _id: -1 })
      .lean();

    return res.json({
      count: ledgerEntries.length,
      ledger: ledgerEntries.map((entry) => ({
        ...entry,
        amount: entry.amount?.toString() ?? "0",
      })),
    });
  } catch (error) {
    return next(error);
  }
}
