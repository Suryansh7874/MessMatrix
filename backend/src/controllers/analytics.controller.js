
import { z } from "zod";
import MealSlot from "../models/MealSlot.js";
import Booking from "../models/Booking.js";

const dateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  "Date must be in YYYY-MM-DD format."
);

// Interpret dates in Indian Standard Time (IST).
function getISTDayRange(dateString) {
  const start = new Date(`${dateString}T00:00:00+05:30`);

  if (
    Number.isNaN(start.getTime()) ||
    start.toISOString().slice(0, 10) !== dateString
  ) {
    return null;
  }

  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { $gte: start, $lt: end };
}

function getDateRange(from, to) {
  const fromParsed = dateSchema.safeParse(from);
  const toParsed = dateSchema.safeParse(to);

  if (!fromParsed.success || !toParsed.success) {
    return null;
  }

  const startRange = getISTDayRange(from);
  const endRange = getISTDayRange(to);

  if (!startRange || !endRange || from > to) {
    return null;
  }

  return {
    start: startRange.$gte,
    end: endRange.$lt
  };
}

async function buildReport(slots) {
  if (slots.length === 0) {
    return {
      slotCount: 0,
      totalBookings: 0,
      optedOut: 0,
      cancelled: 0,
      preparedPortions: 0,
      recordedLeftovers: 0,
      checkedIn: 0,
      expectedAttendees: 0,
      attendanceRate: 0,
      leftoverRate: 0,
      mealSlots: []
    };
  }

  const slotIds = slots.map((slot) => slot._id);

  const bookingGroups = await Booking.aggregate([
    {
      $match: {
        mealSlotId: { $in: slotIds }
      }
    },
    {
      $group: {
        _id: {
          mealSlotId: "$mealSlotId",
          status: "$status"
        },
        count: { $sum: 1 }
      }
    }
  ]);

  // Build status counts separately for each meal slot.
  const bookingCounts = new Map();

  for (const group of bookingGroups) {
    const slotId = group._id.mealSlotId;

    if (!bookingCounts.has(slotId)) {
      bookingCounts.set(slotId, {});
    }

    bookingCounts.get(slotId)[group._id.status] = group.count;
  }

  const mealSlots = slots.map((slot) => {
    const counts = bookingCounts.get(slot._id) || {};

    const checkedIn = counts.CHECKED_IN || 0;
    const optedIn = counts.OPTED_IN || 0;
    const optedOut = counts.OPTED_OUT || 0;
    const cancelled = counts.CANCELLED || 0;
    const noShow = counts.NO_SHOW || 0;

    // Once the cutoff has been locked, finalHeadcount is the
    // official expected count. Before locking, use active bookings.
    const expectedAttendees =
      slot.finalHeadcount ?? optedIn + checkedIn;

    const prepared = slot.preparedPortions ?? 0;
    const leftovers = slot.recordedLeftovers ?? 0;

    return {
      mealSlotId: slot._id,
      date: slot.date,
      mealType: slot.mealType,
      status: slot.status,
      bookingLocked: slot.bookingLocked,
      finalHeadcount: slot.finalHeadcount,
      totalBookings:
        optedIn + checkedIn + optedOut + cancelled + noShow,
      optedIn,
      checkedIn,
      optedOut,
      cancelled,
      noShow,
      expectedAttendees,
      preparedPortions: prepared,
      recordedLeftovers: leftovers,
      attendanceRate:
        expectedAttendees > 0
          ? Number(((checkedIn / expectedAttendees) * 100).toFixed(2))
          : 0,
      leftoverRate:
        prepared > 0
          ? Number(((leftovers / prepared) * 100).toFixed(2))
          : 0
    };
  });

  const sum = (key) =>
    mealSlots.reduce((total, slot) => total + slot[key], 0);

  const totalPrepared = sum("preparedPortions");
  const totalLeftovers = sum("recordedLeftovers");
  const totalExpected = sum("expectedAttendees");
  const totalCheckedIn = sum("checkedIn");

  return {
    slotCount: mealSlots.length,
    totalBookings: sum("totalBookings"),
    optedOut: sum("optedOut"),
    cancelled: sum("cancelled"),
    preparedPortions: totalPrepared,
    recordedLeftovers: totalLeftovers,
    checkedIn: totalCheckedIn,
    expectedAttendees: totalExpected,
    attendanceRate:
      totalExpected > 0
        ? Number(((totalCheckedIn / totalExpected) * 100).toFixed(2))
        : 0,
    leftoverRate:
      totalPrepared > 0
        ? Number(((totalLeftovers / totalPrepared) * 100).toFixed(2))
        : 0,
    mealSlots
  };
}

// GET /api/analytics/overview
// Optional query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function getOverview(req, res, next) {
  try {
    const hasFrom = req.query.from !== undefined;
    const hasTo = req.query.to !== undefined;

    if (hasFrom !== hasTo) {
      return res.status(400).json({
        message: "Provide both from and to dates."
      });
    }

    let start;
    let end;

    if (hasFrom && hasTo) {
      const range = getDateRange(req.query.from, req.query.to);

      if (!range) {
        return res.status(400).json({
          message: "Invalid date range. Use YYYY-MM-DD and ensure from <= to."
        });
      }

      start = range.start;
      end = range.end;
    } else {
      // Default overview: last 30 calendar days including today (IST).
      const today = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );

      const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
      ].join("-");

      const todayRange = getISTDayRange(todayString);

      end = todayRange.$lt;
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const slots = await MealSlot.find({
      date: { $gte: start, $lt: end }
    }).sort({ date: 1, startTime: 1 }).lean();

    const report = await buildReport(slots);

    return res.json({
      period: { from: start, toExclusive: end },
      ...report
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/analytics/daily?date=YYYY-MM-DD
export async function getDailyReport(req, res, next) {
  try {
    const parsed = dateSchema.safeParse(req.query.date);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Provide date in YYYY-MM-DD format."
      });
    }

    const range = getISTDayRange(parsed.data);

    if (!range) {
      return res.status(400).json({
        message: "Invalid calendar date."
      });
    }

    const slots = await MealSlot.find({
      date: range
    }).sort({ startTime: 1 }).lean();

    const report = await buildReport(slots);

    return res.json({
      date: parsed.data,
      ...report
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/analytics/trends?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function getTrends(req, res, next) {
  try {
    const range = getDateRange(req.query.from, req.query.to);

    if (!range) {
      return res.status(400).json({
        message: "Provide valid from and to dates in YYYY-MM-DD format."
      });
    }

    const slots = await MealSlot.find({
      date: { $gte: range.start, $lt: range.end }
    }).sort({ date: 1, startTime: 1 }).lean();

    const report = await buildReport(slots);
    const dailyMap = new Map();

    for (const slot of report.mealSlots) {
      const day = new Date(slot.date).toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata"
      });

      if (!dailyMap.has(day)) {
        dailyMap.set(day, {
          date: day,
          slotCount: 0,
          preparedPortions: 0,
          recordedLeftovers: 0,
          expectedAttendees: 0,
          checkedIn: 0
        });
      }

      const daily = dailyMap.get(day);

      daily.slotCount += 1;
      daily.preparedPortions += slot.preparedPortions;
      daily.recordedLeftovers += slot.recordedLeftovers;
      daily.expectedAttendees += slot.expectedAttendees;
      daily.checkedIn += slot.checkedIn;
    }

    const dailyTrends = [...dailyMap.values()].map((day) => ({
      ...day,
      attendanceRate:
        day.expectedAttendees > 0
          ? Number(
              ((day.checkedIn / day.expectedAttendees) * 100).toFixed(2)
            )
          : 0,
      leftoverRate:
        day.preparedPortions > 0
          ? Number(
              ((day.recordedLeftovers / day.preparedPortions) * 100).toFixed(2)
            )
          : 0
    }));

    return res.json({
      period: {
        from: req.query.from,
        to: req.query.to
      },
      ...report,
      dailyTrends
    });
  } catch (error) {
    next(error);
  }
}
