
import Rebate from "../models/Rebate.js";
import { RebateStatus } from "../utils/enums.js";

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
    next(error);
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
    next(error);
  }
}
