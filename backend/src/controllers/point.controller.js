
import {
  getStudentPoints,
  getStudentPointsHistory,
} from "../services/point.service.js";

export async function getMyPoints(req, res, next) {
  try {
    const studentId = req.user.id;

    const points = await getStudentPoints(studentId);

    return res.status(200).json({
      message: "Points balance fetched successfully.",
      ...points,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyPointsHistory(req, res, next) {
  try {
    const studentId = req.user.id;

    const transactions =
      await getStudentPointsHistory(studentId);

    return res.status(200).json({
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    next(error);
  }
}
