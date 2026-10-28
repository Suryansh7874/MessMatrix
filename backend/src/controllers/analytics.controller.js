
import { z } from "zod";

import MealSlot from "../models/MealSlot.js";
import Booking from "../models/Booking.js";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Invalid calendar date.");

function getISTDayRange(dateString) {
  const parsed = dateSchema.safeParse(dateString);

  if (!parsed.success) {
    return null;
  }

  const start = new Date(`${dateString}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { $gte: start, $lt: end };
}

function getDateRange(from, to) {
  const fromParsed = dateSchema.safeParse(from);
  const toParsed = dateSchema.safeParse(to);

  if (!fromParsed.success || !toParsed.success || from > to) {
    return null;
  }

  const startRange = getISTDayRange(from);
  const endRange = getISTDayRange(to);

  if (!startRange || !endRange) {
    return null;
  }

  return {
    start: startRange.$gte,
    end: endRange.$lt,
  };
}

function getTodayIST() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function formatISTDate(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

async function buildReport(slots) {
  if (slots.length === 0) {
    return {
      slotCount: 0,
      totalBookings: 0,
      optedIn: 0,
      optedOut: 0,
      cancelled: 0,
      noShow: 0,
      preparedPortions: 0,
      recordedLeftovers: 0,
      checkedIn: 0,
      expectedAttendees: 0,
      attendanceRate: 0,
      leftoverRate: 0,
      mealSlots: [],
    };
  }

  const slotIds = slots.map((slot) => slot._id);

  const bookingGroups = await Booking.aggregate([
    {
      $match: {
        mealSlotId: { $in: slotIds },
      },
    },
    {
      $group: {
        _id: {
          mealSlotId: "$mealSlotId",
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Use string IDs because separate ObjectId instances
  // do not compare equal as JavaScript Map keys.
  const bookingCounts = new Map();

  for (const group of bookingGroups) {
    const slotId = String(group._id.mealSlotId);

    if (!bookingCounts.has(slotId)) {
      bookingCounts.set(slotId, {});
    }

    bookingCounts.get(slotId)[group._id.status] = group.count;
  }

  const mealSlots = slots.map((slot) => {
    const counts = bookingCounts.get(String(slot._id)) || {};

    const optedIn = counts.OPTED_IN || 0;
    const checkedIn = counts.CHECKED_IN || 0;
    const optedOut = counts.OPTED_OUT || 0;
    const cancelled = counts.CANCELLED || 0;
    const noShow = counts.NO_SHOW || 0;

    const expectedAttendees =
      slot.finalHeadcount ?? optedIn + checkedIn;

    const actualAttendees = checkedIn;
    const pendingCheckIn = optedIn;
    const prepared = Number(slot.preparedPortions ?? 0);
    const leftovers = Number(slot.recordedLeftovers ?? 0);

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
          ? Number(
              ((checkedIn / expectedAttendees) * 100).toFixed(2)
            )
          : 0,

      leftoverRate:
        prepared > 0
          ? Number(((leftovers / prepared) * 100).toFixed(2))
          : 0,
    };
  });
  const consumedOrDistributed =
    Math.max(0, prepared - leftovers);
  const sum = (key) =>
    mealSlots.reduce((total, slot) => total + slot[key], 0);

  const totalPrepared = sum("preparedPortions");
  const totalLeftovers = sum("recordedLeftovers");
  const totalExpected = sum("expectedAttendees");
  const totalCheckedIn = sum("checkedIn");

  return {
    slotCount: mealSlots.length,
    totalBookings: sum("totalBookings"),
    optedIn: sum("optedIn"),
    optedOut: sum("optedOut"),
    cancelled: sum("cancelled"),
    noShow: sum("noShow"),
    preparedPortions: totalPrepared,
    recordedLeftovers: totalLeftovers,
    checkedIn: totalCheckedIn,
    expectedAttendees: totalExpected,
    actualAttendees,
    pendingCheckIn, 
    consumedOrDistributed,

    attendanceRate:
      totalExpected > 0
        ? Number(
            ((totalCheckedIn / totalExpected) * 100).toFixed(2)
          )
        : 0,

    leftoverRate:
      totalPrepared > 0
        ? Number(
            ((totalLeftovers / totalPrepared) * 100).toFixed(2)
          )
        : 0,

    mealSlots,
  };
}

// GET /api/analytics/overview
// Optional: ?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function getOverview(req, res, next) {
  try {
    const hasFrom = req.query.from !== undefined;
    const hasTo = req.query.to !== undefined;

    if (hasFrom !== hasTo) {
      return res.status(400).json({
        message: "Provide both from and to dates.",
      });
    }

    let start;
    let end;

    if (hasFrom && hasTo) {
      const range = getDateRange(req.query.from, req.query.to);

      if (!range) {
        return res.status(400).json({
          message:
            "Invalid date range. Use YYYY-MM-DD and ensure from <= to.",
        });
      }

      start = range.start;
      end = range.end;
    } else {
      // Last 30 calendar days, including today in IST.
      const todayRange = getISTDayRange(getTodayIST());

      end = todayRange.$lt;
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const slots = await MealSlot.find({
      date: { $gte: start, $lt: end },
    })
      .sort({ date: 1, startTime: 1 })
      .lean();

    const report = await buildReport(slots);

    return res.json({
      period: {
        from: start,
        toExclusive: end,
      },
      ...report,
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
        message: "Provide a valid date in YYYY-MM-DD format.",
      });
    }

    const range = getISTDayRange(parsed.data);

    const slots = await MealSlot.find({
      date: range,
    })
      .sort({ startTime: 1 })
      .lean();

    const report = await buildReport(slots);

    return res.json({
      date: parsed.data,
      ...report,
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
        message:
          "Provide valid from and to dates in YYYY-MM-DD format.",
      });
    }

    const slots = await MealSlot.find({
      date: { $gte: range.start, $lt: range.end },
    })
      .sort({ date: 1, startTime: 1 })
      .lean();

    const report = await buildReport(slots);
    const dailyMap = new Map();

    for (const slot of report.mealSlots) {
      const day = formatISTDate(new Date(slot.date));

      if (!dailyMap.has(day)) {
        dailyMap.set(day, {
          date: day,
          slotCount: 0,
          preparedPortions: 0,
          recordedLeftovers: 0,
          expectedAttendees: 0,
          checkedIn: 0,
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
          : 0,
    }));

    return res.json({
      period: {
        from: req.query.from,
        to: req.query.to,
      },
      ...report,
      dailyTrends,
    });
  } catch (error) {
    next(error);
  }
}
