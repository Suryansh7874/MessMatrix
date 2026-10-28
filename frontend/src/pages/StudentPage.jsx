
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { QRCodeSVG } from "qrcode.react";
const MEAL_DETAILS = {
  BREAKFAST: {
    name: "Breakfast",
    icon: "☀️",
    description: "A nourishing beginning to your day.",
  },
  LUNCH: {
    name: "Lunch",
    icon: "🍱",
    description: "Restore your energy for the day ahead.",
  },
  DINNER: {
    name: "Dinner",
    icon: "🍲",
    description: "Gather and unwind at day's end.",
  },
};

const NAV_ITEMS = [
  { label: "Overview", icon: "⌂" },
  { label: "My Bookings", icon: "▤" },
  { label: "Today's Menu", icon: "♨" },
  { label: "My Activity", icon: "◷" },
  { label: "Rebate Requests", icon: "₹" },
  { label: "Hall Points", icon: "✧" },
  { label: "Billing History", icon: "₹" },
];
function getSlotId(booking) {
  const value = booking?.mealSlotId;
  return typeof value === "object" ? value?._id : value;
}

function formatTime(value) {
  if (!value) return "Time unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function errorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

export default function StudentPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedMeal, setSelectedMeal] = useState("");
  const [mealSlots, setMealSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");
  const [clock, setClock] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [busySlotId, setBusySlotId] = useState("");
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

 
async function generateQR(booking) {
  if (!booking?._id || qrLoading) return;

  const mealSlotId =
    typeof booking.mealSlotId === "object"
      ? booking.mealSlotId?._id
      : booking.mealSlotId;

  if (!mealSlotId) {
    setNoticeType("error");
    setNotice("Could not find the meal slot for this booking.");
    return;
  }

  setQrLoading(true);
  setNotice("");

  try {
    const response = await api.post(
      `/attendance/meal-slots/${encodeURIComponent(mealSlotId)}/qr-token`
    );

    if (!response.data?.token) {
      throw new Error("The server did not return a QR token.");
    }

    setQrData({
      token: response.data.token,
      mealSlotId: response.data.mealSlotId,
      expiresAt: response.data.expiresAt,
    });
  } catch (error) {
    setNoticeType("error");
    setNotice(
      errorMessage(
        error,
        "Could not generate your meal QR code."
      )
    );
  } finally {
    setQrLoading(false);
  }
}

  const [rebates, setRebates] = useState([]);
  const [rebatesLoading, setRebatesLoading] = useState(false);
  const [rebateBookingId, setRebateBookingId] = useState("");
  const [rebateReason, setRebateReason] = useState("");
  const [rebateSubmitting, setRebateSubmitting] = useState(false);
  const [pointsBalance, setPointsBalance] = useState(null);
  const [pointsTotalTransactions, setPointsTotalTransactions] = useState(null);
  const [pointsTransactions, setPointsTransactions] = useState([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsError, setPointsError] = useState("");
  const [billingLedger, setBillingLedger] = useState([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState("");

  useEffect(() => {
    const timer = window.setInterval(
      () => setClock(new Date()),
      30000
    );

    return () => window.clearInterval(timer);
  }, []);

  const loadStudentData = useCallback(async () => {
    setLoading(true);
    setNotice("");

    try {
      const [slotsResponse, bookingsResponse] = await Promise.all([
        api.get("/meal-slots"),
        api.get("/bookings/my"),
      ]);

      setMealSlots(slotsResponse.data?.mealSlots ?? []);
      setBookings(bookingsResponse.data?.bookings ?? []);
    } catch (error) {
      setNoticeType("error");
      setNotice(
        errorMessage(
          error,
          "Could not load meal slots and bookings. Check that the backend is running and try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  const refreshBookings = useCallback(async () => {
    const response = await api.get("/bookings/my");
    setBookings(response.data?.bookings ?? []);
  }, []);

  const loadMyRebates = useCallback(async () => {
    setRebatesLoading(true);

    try {
      const response = await api.get("/rebates/my-rebates");
      setRebates(response.data?.rebates ?? []);
    } catch (error) {
      setNoticeType("error");
      setNotice(errorMessage(error, "Could not load your rebate requests."));
    } finally {
      setRebatesLoading(false);
    }
  }, []);

  const loadHallPoints = useCallback(async () => {
    setPointsLoading(true);
    setPointsError("");

    try {
      const [balanceResponse, historyResponse] = await Promise.all([
        api.get("/points"),
        api.get("/points/history"),
      ]);

      setPointsBalance(balanceResponse.data?.balance ?? 0);
      setPointsTotalTransactions(
        balanceResponse.data?.totalTransactions ??
          historyResponse.data?.count ??
          0
      );
      setPointsTransactions(
        Array.isArray(historyResponse.data?.transactions)
          ? historyResponse.data.transactions
          : []
      );
    } catch (error) {
      setPointsError(
        errorMessage(error, "Could not load Hall Points. Please try again.")
      );
    } finally {
      setPointsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "Rebate Requests") {
      loadMyRebates();
    }
  }, [activeTab, loadMyRebates]);

  useEffect(() => {
    if (activeTab === "Hall Points") {
      loadHallPoints();
    }
  }, [activeTab, loadHallPoints]);

  const loadBillingLedger = useCallback(async () => {
    setBillingLoading(true);
    setBillingError("");

    try {
      const response = await api.get("/rebates/my-ledger");
      setBillingLedger(
        Array.isArray(response.data?.ledger) ? response.data.ledger : []
      );
    } catch (error) {
      setBillingError(
        errorMessage(error, "Could not load your billing history. Please try again.")
      );
    } finally {
      setBillingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "Billing History") {
      loadBillingLedger();
    }
  }, [activeTab, loadBillingLedger]);

  async function submitRebateRequest(event) {
    event.preventDefault();

    if (!rebateBookingId || !rebateReason.trim()) {
      setNoticeType("error");
      setNotice("Select a booking and enter a reason.");
      return;
    }

    setRebateSubmitting(true);
    setNotice("");

    try {
      await api.post("/rebates", {
        bookingId: rebateBookingId,
        reason: rebateReason.trim(),
      });

      setRebateBookingId("");
      setRebateReason("");
      await loadMyRebates();

      setNoticeType("success");
      setNotice("Your rebate request was submitted successfully.");
    } catch (error) {
      setNoticeType("error");
      setNotice(errorMessage(error, "Could not submit the rebate request."));
    } finally {
      setRebateSubmitting(false);
    }
  }

  const meals = useMemo(() => {
    return mealSlots
      .filter((slot) => MEAL_DETAILS[slot.mealType])
      .map((slot) => {
        const details = MEAL_DETAILS[slot.mealType];

        const booking = bookings.find(
          (item) => getSlotId(item) === slot._id
        );

        const cutoffPassed =
          !slot.cutoffTime ||
          clock >= new Date(slot.cutoffTime);

        const isBooked = booking?.status === "OPTED_IN";

        const canBook =
          slot.status === "OPEN" &&
          !slot.bookingLocked &&
          !cutoffPassed &&
          new Date(slot.endTime) > clock;

        return {
          ...details,
          id: slot._id,
          slot,
          booking,
          menu: slot.menuId?.name || details.name,
          menuDescription:
            slot.menuId?.description || details.description,
          price: slot.menuId?.price,
          time: `${formatTime(slot.startTime)} – ${formatTime(
            slot.endTime
          )}`,
          date: formatDate(slot.date || slot.startTime),
          isBooked,
          canBook,
        };
      })
      .sort(
        (a, b) =>
          new Date(a.slot.startTime) -
          new Date(b.slot.startTime)
      );
  }, [mealSlots, bookings, clock]);

  const activeBookings = useMemo(
    () =>
      bookings.filter(
        (booking) => booking.status === "OPTED_IN"
      ),
    [bookings]
  );

  const getMealForBooking = useCallback(
    (booking) => {
      const slotId = getSlotId(booking);

      const fromSlots = mealSlots.find(
        (item) => item._id === slotId
      );

      const populatedSlot =
        typeof booking.mealSlotId === "object"
          ? booking.mealSlotId
          : null;

      const slot = fromSlots || populatedSlot;

      if (!slot) return null;

      const details = MEAL_DETAILS[slot.mealType];
      if (!details) return null;

      return {
        ...details,
        id: slot._id || slotId,
        menu: slot.menuId?.name || details.name,
        time: `${formatTime(slot.startTime)} – ${formatTime(
          slot.endTime
        )}`,
        date: formatDate(slot.date || slot.startTime),
      };
    },
    [mealSlots]
  );

  async function bookMeal(meal) {
    if (!meal?.id || busySlotId) return;

    if (!meal.canBook) {
      setNoticeType("error");
      setNotice("Booking is closed for this meal slot.");
      return;
    }

    setBusySlotId(meal.id);
    setNotice("");

    try {
      await api.put(
        `/bookings/${encodeURIComponent(meal.id)}`,
        { status: "OPTED_IN" }
      );

      await refreshBookings();

      setSelectedMeal(meal.id);
      setNoticeType("success");
      setNotice(`${meal.name} reserved successfully.`);
    } catch (error) {
      setNoticeType("error");
      setNotice(
        errorMessage(
          error,
          "Could not reserve this meal. Please try again."
        )
      );
    } finally {
      setBusySlotId("");
    }
  }

  async function cancelMeal(booking) {
    const slotId = getSlotId(booking);

    if (!slotId || busySlotId) return;

    setBusySlotId(slotId);
    setNotice("");

    try {
      await api.put(
        `/bookings/${encodeURIComponent(slotId)}`,
        { status: "CANCELLED" }
      );

      await refreshBookings();

      setNoticeType("success");
      setNotice("Your reservation has been cancelled.");
    } catch (error) {
      setNoticeType("error");
      setNotice(
        errorMessage(
          error,
          "Could not cancel this reservation. Please try again."
        )
      );
    } finally {
      setBusySlotId("");
    }
  }

  const availableCount = meals.filter(
    (meal) => !meal.isBooked && meal.canBook
  ).length;

  function MealCard({ meal }) {
    return (
      <article
        className={`mm-meal-card ${
          selectedMeal === meal.id ? "is-selected" : ""
        }`}
      >
        <div className="mm-meal-topline">
          <span className="mm-meal-icon" aria-hidden="true">
            {meal.icon}
          </span>

          <span
            className={`mm-pill ${
              meal.isBooked
                ? "pill-booked"
                : meal.canBook
                  ? "pill-open"
                  : "pill-closed"
            }`}
          >
            {meal.isBooked
              ? "Reserved"
              : meal.canBook
                ? "Booking open"
                : "Closed"}
          </span>
        </div>

        <p className="mm-eyebrow">{meal.name}</p>
        <h3>{meal.menu}</h3>
        <p className="mm-meal-description">
          {meal.menuDescription}
        </p>

        <div className="mm-meal-meta">
          <span>◷ {meal.time}</span>
          <span>▦ {meal.date}</span>
        </div>

        {meal.price !== undefined && meal.price !== null && (
          <p className="mm-price">
            Price: ₹
            {typeof meal.price === "object"
              ? meal.price.$numberDecimal ?? "—"
              : meal.price}
          </p>
        )}

        <button
          className={`mm-primary-button ${
            meal.isBooked ? "button-muted" : ""
          }`}
          type="button"
          disabled={
            !meal.canBook ||
            meal.isBooked ||
            busySlotId === meal.id
          }
          onClick={() => bookMeal(meal)}
        >
          {busySlotId === meal.id
            ? "Please wait…"
            : meal.isBooked
              ? "✓ Reserved"
              : meal.canBook
                ? "Reserve meal"
                : "Booking closed"}
        </button>
      </article>
    );
  }

  function BookingRow({ booking, activity = false }) {
    const meal = getMealForBooking(booking);

    if (!meal) return null;

    return (
      <div className="mm-booking-row" key={booking._id}>
        <div className="mm-booking-left">
          <div className="mm-booking-emoji">{meal.icon}</div>

          <div>
            <strong>
              {meal.name} — {meal.menu}
            </strong>
            <small>
              {meal.date} · {meal.time}
            </small>
          </div>
        </div>

        {activity ? (
  <span className="mm-status">Booked</span>
) : (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    <button
      className="mm-primary-button"
      type="button"
      disabled={
        qrLoading ||
        booking.status !== "OPTED_IN"
      }
      onClick={() => generateQR(booking)}
    >
      Generate QR
    </button>

    <button
      className="mm-cancel-button"
      type="button"
      disabled={busySlotId === meal.id}
      onClick={() => cancelMeal(booking)}
    >
      Cancel
    </button>
  </div>
)}
      </div>
    );
  }

  return (
    <div className="mm-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');

        * {
          box-sizing: border-box;
        }

        .mm-page {
          min-height: 100vh;
          background:
            radial-gradient(ellipse at 72% 0%, rgba(161,119,52,.17), transparent 36%),
            #111a19;
          color: #f4ead4;
          font-family: Manrope, sans-serif;
          padding: 24px;
        }

        .mm-shell {
          width: min(1420px, 100%);
          margin: 0 auto;
          display: grid;
          grid-template-columns: 245px minmax(0, 1fr);
          gap: 22px;
        }

        .mm-sidebar {
          background: linear-gradient(165deg, #202d29, #131c1b 70%);
          border: 1px solid rgba(209,174,103,.28);
          border-radius: 22px;
          padding: 24px 16px;
          min-height: calc(100vh - 48px);
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px #0003;
        }

        .mm-brand {
          padding: 6px 10px 28px;
          border-bottom: 1px solid rgba(215,180,109,.2);
        }

        .mm-brand-mark {
          width: 43px;
          height: 43px;
          border: 1px solid #b99758;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #e8c982;
          font-size: 22px;
          margin-bottom: 12px;
          background: #b9975812;
        }

        .mm-brand-name {
          font-family: Cinzel, serif;
          font-size: 20px;
          letter-spacing: .04em;
          color: #f2d69a;
        }

        .mm-brand-sub {
          font-size: 9px;
          letter-spacing: .18em;
          color: #b6a681;
          margin-top: 5px;
        }

        .mm-nav-label {
          margin: 25px 10px 10px;
          color: #9f9b86;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .18em;
        }

        .mm-nav {
          display: grid;
          gap: 7px;
        }

        .mm-nav button {
          border: 1px solid transparent;
          background: transparent;
          color: #c7c3b4;
          text-align: left;
          padding: 12px 13px;
          border-radius: 12px;
          display: flex;
          gap: 12px;
          align-items: center;
          font: 600 13px Manrope, sans-serif;
          cursor: pointer;
          transition: .2s;
          width: 100%;
        }

        .mm-nav button:hover {
          background: #ffffff09;
          color: #fff0ca;
        }

        .mm-nav button.active {
          color: #f3d99e;
          background: linear-gradient(90deg, #b48b4328, #b48b430a);
          border-color: #b48b4355;
        }

        .mm-nav-icon {
          width: 22px;
          text-align: center;
          font-size: 19px;
        }

        .mm-sidebar-note {
          margin-top: auto;
          padding: 20px 14px 8px;
          color: #a9a38f;
          font-size: 12px;
          line-height: 1.8;
        }

        .mm-sidebar-note strong {
          display: block;
          color: #e0c58b;
          font-family: Cinzel, serif;
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 8px;
        }

        .mm-main {
          min-width: 0;
        }

        .mm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 9px 4px 24px;
        }

        .mm-breadcrumb {
          color: #b6a989;
          font-size: 11px;
          letter-spacing: .06em;
          margin-bottom: 12px;
        }

        .mm-header h1 {
          font: 600 clamp(27px, 3.2vw, 43px) Cinzel, serif;
          letter-spacing: -.025em;
          color: #f6e8ca;
          margin: 0;
        }

        .mm-header p {
          color: #b7b4a5;
          font-size: 13px;
          line-height: 1.8;
          margin: 11px 0 0;
          max-width: 620px;
        }

        .mm-profile {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 14px;
          border: 1px solid #c9a65b40;
          border-radius: 16px;
          background: #ffffff06;
        }

        .mm-avatar {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #b48b4326;
          border: 1px solid #d4b36a;
          color: #f0d38f;
          font-family: Cinzel, serif;
          font-size: 17px;
        }

        .mm-profile strong {
          display: block;
          font-size: 12px;
        }

        .mm-profile small {
          color: #a8a28e;
          font-size: 10px;
          display: block;
          margin-top: 4px;
        }

        .mm-notice {
          margin: 0 0 18px;
          padding: 13px 16px;
          border: 1px solid #bfa25d44;
          border-radius: 12px;
          background: #c7a45e12;
          color: #ead8ad;
          font-size: 12px;
          line-height: 1.6;
        }

        .mm-notice.error {
          border-color: #d97d6b66;
          background: #b8413018;
          color: #ffd1c7;
        }

        .mm-notice.success {
          border-color: #87b88a66;
          background: #3b81451a;
          color: #c8f0c7;
        }

        .mm-section-heading {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 12px;
          margin: 24px 0 14px;
        }

        .mm-section-heading h2 {
          font: 600 21px Cinzel, serif;
          color: #f0dfbd;
          margin: 0;
        }

        .mm-section-heading p {
          font-size: 11px;
          color: #a9a592;
          margin: 7px 0 0;
        }

        .mm-text-link {
          border: 0;
          background: none;
          color: #dfbd77;
          font: 700 11px Manrope, sans-serif;
          cursor: pointer;
        }

        .mm-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 13px;
        }

        .mm-stat {
          padding: 19px;
          border: 1px solid #d0ae6633;
          border-radius: 16px;
          background: linear-gradient(140deg, #ffffff08, #ffffff02);
        }

        .mm-stat-label {
          color: #a9a38f;
          font-size: 11px;
        }

        .mm-stat-value {
          font: 600 29px Cinzel, serif;
          color: #f1d395;
          margin-top: 10px;
        }

        .mm-stat-caption {
          font-size: 10px;
          color: #929989;
          margin-top: 5px;
        }

        .mm-meal-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .mm-meal-card {
          min-width: 0;
          padding: 19px;
          border: 1px solid #d0ae6630;
          border-radius: 17px;
          background: linear-gradient(150deg, #26332e, #1b2522);
          transition: transform .2s, border-color .2s, box-shadow .2s;
        }

        .mm-meal-card:hover {
          transform: translateY(-3px);
          border-color: #c4a35b88;
          box-shadow: 0 12px 32px #0002;
        }

        .mm-meal-card.is-selected {
          border-color: #d4b36a;
          box-shadow: 0 0 0 1px #d4b36a22;
        }

        .mm-meal-topline {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 17px;
        }

        .mm-meal-icon {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: #d0ac5a16;
          border: 1px solid #d0ac5a3b;
          font-size: 21px;
        }

        .mm-pill {
          border-radius: 30px;
          padding: 6px 8px;
          font-size: 9px;
          font-weight: 800;
          white-space: nowrap;
        }

        .pill-open {
          color: #c9e2b5;
          background: #85a96820;
        }

        .pill-booked {
          color: #f0d38e;
          background: #c49b3d20;
        }

        .pill-closed {
          color: #c0b9a7;
          background: #ffffff0c;
        }

        .mm-eyebrow {
          color: #c5a763;
          font-size: 10px;
          letter-spacing: .14em;
          text-transform: uppercase;
          margin: 0 0 6px;
        }

        .mm-meal-card h3 {
          font: 600 18px Cinzel, serif;
          color: #f0dfbd;
          margin: 0 0 9px;
          overflow-wrap: anywhere;
        }

        .mm-meal-description {
          color: #aaa998;
          font-size: 11px;
          line-height: 1.7;
          min-height: 38px;
          margin: 0 0 15px;
        }

        .mm-meal-meta {
          display: grid;
          gap: 8px;
          padding: 13px 0;
          border-top: 1px solid #ffffff10;
          color: #c6c1af;
          font-size: 10px;
        }

        .mm-price {
          color: #e0c58b;
          font-size: 11px;
          margin: 0 0 12px;
        }

        .mm-primary-button {
          border: 1px solid #c9a65b;
          background: linear-gradient(135deg, #d5b36c, #b28b43);
          color: #1b211d;
          border-radius: 10px;
          padding: 11px 12px;
          font: 800 11px Manrope, sans-serif;
          cursor: pointer;
          width: 100%;
          transition: .2s;
        }

        .mm-primary-button:hover:not(:disabled) {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }

        .mm-primary-button:disabled {
          opacity: .58;
          cursor: not-allowed;
        }

        .mm-primary-button.button-muted {
          background: #ffffff0a;
          color: #d9c99f;
          border-color: #d0ae6633;
        }

        .mm-empty {
          grid-column: 1 / -1;
          padding: 28px 20px;
          border: 1px dashed #c9a65b45;
          border-radius: 15px;
          text-align: center;
          color: #aaa794;
          font-size: 12px;
          line-height: 1.8;
        }

        .mm-list-panel {
          border: 1px solid #d0ae6630;
          border-radius: 16px;
          background: #202b27;
          padding: 5px 18px;
        }

        .mm-booking-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          padding: 16px 0;
          border-bottom: 1px solid #ffffff10;
        }

        .mm-booking-row:last-child {
          border-bottom: 0;
        }

        .mm-booking-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .mm-booking-emoji {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          background: #d0ac5a16;
          border: 1px solid #d0ac5a30;
          border-radius: 12px;
          font-size: 20px;
        }

        .mm-booking-left strong {
          display: block;
          color: #e9dfc7;
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .mm-booking-left small {
          display: block;
          color: #a9a592;
          font-size: 10px;
          margin-top: 6px;
        }

        .mm-cancel-button {
          border: 1px solid #b66f5b66;
          background: #8e3d3022;
          color: #ffc4b4;
          padding: 8px 12px;
          border-radius: 9px;
          font: 700 10px Manrope, sans-serif;
          cursor: pointer;
          flex-shrink: 0;
        }

        .mm-cancel-button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .mm-status {
          color: #c9e2b5;
          background: #85a96820;
          padding: 7px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .mm-footer {
          text-align: center;
          color: #777f72;
          font-size: 10px;
          padding: 30px 0 5px;
        }

        @media (max-width: 1050px) {
          .mm-shell {
            grid-template-columns: 210px minmax(0, 1fr);
          }

          .mm-meal-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .mm-page {
            padding: 16px;
          }
        }

        @media (max-width: 760px) {
          .mm-shell {
            grid-template-columns: 1fr;
          }

          .mm-sidebar {
            min-height: 0;
            padding: 15px;
          }

          .mm-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 2px 4px 14px;
          }

          .mm-brand-mark {
            margin: 0;
            flex-shrink: 0;
          }

          .mm-brand-sub {
            font-size: 8px;
          }

          .mm-nav-label,
          .mm-sidebar-note {
            display: none;
          }

          .mm-nav {
            grid-template-columns: repeat(7, minmax(0, 1fr));
            margin-top: 13px;
          }

          .mm-nav button {
            justify-content: center;
            flex-direction: column;
            gap: 5px;
            padding: 9px 4px;
            font-size: 9px;
          }

          .mm-nav-icon {
            font-size: 17px;
          }

          .mm-header {
            align-items: flex-start;
          }

          .mm-profile {
            padding: 8px;
          }

          .mm-profile small {
            display: none;
          }

          .mm-stats {
            gap: 8px;
          }

          .mm-stat {
            padding: 13px;
          }

          .mm-stat-value {
            font-size: 23px;
          }

          .mm-section-heading h2 {
            font-size: 18px;
          }
        }

        @media (max-width: 520px) {
          .mm-page {
            padding: 10px;
          }

          .mm-shell {
            gap: 13px;
          }

          .mm-header {
            display: block;
            padding: 8px 3px 18px;
          }

          .mm-profile {
            display: none;
          }

          .mm-header h1 {
            font-size: 28px;
          }

          .mm-header p {
            font-size: 12px;
          }

          .mm-meal-grid {
            grid-template-columns: 1fr;
          }

          .mm-stats {
            grid-template-columns: 1fr 1fr;
          }

          .mm-stat {
            padding: 13px;
          }

          .mm-stat:last-child {
            grid-column: 1 / -1;
          }

          .mm-booking-row {
            align-items: flex-start;
          }

          .mm-booking-left {
            gap: 9px;
          }

          .mm-booking-left strong {
            font-size: 11px;
          }

          .mm-cancel-button {
            padding: 7px 9px;
          }
        }
      `}</style>

      <div className="mm-shell">
        <aside className="mm-sidebar">
          <div className="mm-brand">
            <div className="mm-brand-mark">✧</div>
            <div>
              <div className="mm-brand-name">MessMatrix</div>
              <div className="mm-brand-sub">
                KAMAR-TAJ REFECTORY
              </div>
            </div>
          </div>

          <div className="mm-nav-label">STUDENT SPACE</div>

          <nav
            className="mm-nav"
            aria-label="Student navigation"
          >
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                type="button"
                className={
                  activeTab === item.label ? "active" : ""
                }
                onClick={() => setActiveTab(item.label)}
              >
                <span
                  className="mm-nav-icon"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mm-sidebar-note">
            <strong>
              Good Food
              <br />
              Builds a Better Tomorrow
            </strong>
            Thoughtfully planned meals make campus life a
            little easier.
          </div>
        </aside>

        <main className="mm-main">
          <header className="mm-header">
            <div>
              <div className="mm-breadcrumb">
                MessMatrix / {activeTab}
              </div>

              <h1>
                {activeTab === "Overview"
                  ? "Good food. Better days."
                  : activeTab}
              </h1>

              <p>
                {activeTab === "Overview"
                  ? "Your dining space, simplified. View upcoming meals, manage bookings, and make every meal count."
                  : activeTab === "My Bookings"
                    ? "Review your active meal reservations and cancel before the booking cutoff."
                    : activeTab === "Today's Menu"
                      ? "Explore available meal slots and reserve your place at the Refectory."
                      : activeTab === "Rebate Requests"
                        ? "Request a rebate for a meal booking and track its status."
                        : activeTab === "Hall Points"
                          ? "Track your Hall Points balance and the transactions you have earned."
                          : activeTab === "Billing History"
                            ? "Review meal charges, rebate credits, refunds, and other billing entries."
                            : "A record of the meal reservations currently linked to your account."}
              </p>
            </div>

            <div className="mm-profile">
              <div className="mm-avatar">S</div>
              <div>
                <strong>Student</strong>
                <small>Campus resident</small>
              </div>
            </div>
          </header>

          {notice && (
            <div
              className={`mm-notice ${noticeType}`}
              role="status"
            >
              {notice}

              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
                style={{
                  float: "right",
                  border: 0,
                  background: "transparent",
                  color: "inherit",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                ×
              </button>
            </div>
          )}

          {qrData && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="mm-qr-title"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                display: "grid",
                placeItems: "center",
                padding: 20,
                background: "rgba(0,0,0,.76)",
                backdropFilter: "blur(8px)",
              }}
              onClick={(event) => {
                if (event.target === event.currentTarget) setQrData(null);
              }}
            >
              <section
                style={{
                  width: "min(100%, 390px)",
                  padding: 26,
                  borderRadius: 22,
                  border: "1px solid rgba(212,179,106,.5)",
                  background: "linear-gradient(155deg, #26332e, #111a19)",
                  boxShadow: "0 25px 90px rgba(0,0,0,.5)",
                  textAlign: "center",
                  color: "#f4ead4",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <span style={{ color: "#d9bb78", fontSize: 10, letterSpacing: ".16em", fontWeight: 800 }}>
                    MESSMATRIX · MEAL PASS
                  </span>
                  <button
                    type="button"
                    aria-label="Close QR code"
                    onClick={() => setQrData(null)}
                    style={{ border: 0, background: "transparent", color: "#f4ead4", fontSize: 24, cursor: "pointer" }}
                  >
                    ×
                  </button>
                </div>
                <h2 id="mm-qr-title" style={{ fontFamily: "Cinzel, serif", fontSize: 23, margin: "18px 0 6px" }}>
                  Your Meal QR
                </h2>
                <p style={{ color: "#b7b4a5", fontSize: 12, margin: "0 0 20px" }}>
                  Show this code to Mess Staff at the meal counter.
                </p>
                <div style={{ display: "inline-flex", padding: 16, background: "#fff", borderRadius: 14 }}>
                  <QRCodeSVG value={qrData.token} size={220} level="M" includeMargin />
                </div>
                <p style={{ color: "#f0d38e", fontSize: 13, fontWeight: 800, margin: "18px 0 5px" }}>
                  {qrData.mealName}
                </p>
                <p style={{ color: "#c6c1af", fontSize: 11, margin: 0 }}>
                  {qrData.expiresAt
                    ? `Expires at ${new Date(qrData.expiresAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`
                    : "This QR code is temporary. Use it promptly."}
                </p>
                <p style={{ color: "#a9a592", fontSize: 10, lineHeight: 1.6, margin: "12px 0 0" }}>
                  Keep this QR private. It can be used only once and may expire shortly.
                </p>
                <button
                  className="mm-primary-button"
                  type="button"
                  style={{ marginTop: 20 }}
                  onClick={() => setQrData(null)}
                >
                  Done
                </button>
              </section>
            </div>
          )}

          {activeTab === "Overview" && (
            <>
              <section
                className="mm-stats"
                aria-label="Booking summary"
              >
                <div className="mm-stat">
                  <div className="mm-stat-label">
                    Active reservations
                  </div>
                  <div className="mm-stat-value">
                    {activeBookings.length}
                  </div>
                  <div className="mm-stat-caption">
                    Meals currently opted in
                  </div>
                </div>

                <div className="mm-stat">
                  <div className="mm-stat-label">
                    Slots available
                  </div>
                  <div className="mm-stat-value">
                    {availableCount}
                  </div>
                  <div className="mm-stat-caption">
                    Open for booking right now
                  </div>
                </div>

                <div className="mm-stat">
                  <div className="mm-stat-label">
                    Upcoming meal slots
                  </div>
                  <div className="mm-stat-value">
                    {meals.length}
                  </div>
                  <div className="mm-stat-caption">
                    Provided by the Refectory
                  </div>
                </div>
              </section>

              <section>
                <div className="mm-section-heading">
                  <div>
                    <h2>Available meal slots</h2>
                    <p>Choose a meal slot to reserve it.</p>
                  </div>

                  <button
                    className="mm-text-link"
                    type="button"
                    onClick={() =>
                      setActiveTab("Today's Menu")
                    }
                  >
                    View menu →
                  </button>
                </div>

                {loading ? (
                  <div className="mm-empty">
                    Opening the Refectory records…
                  </div>
                ) : meals.length === 0 ? (
                  <div className="mm-empty">
                    No upcoming meal slots are available yet.
                    Please check again later.
                  </div>
                ) : (
                  <div className="mm-meal-grid">
                    {meals
                      .map((meal) => (
                        <MealCard
                          key={meal.id}
                          meal={meal}
                        />
                      ))}
                  </div>
                )}
              </section>

              <section>
                <div className="mm-section-heading">
                  <div>
                    <h2>Your upcoming reservations</h2>
                    <p>
                      Bookings confirmed by the server.
                    </p>
                  </div>

                  <button
                    className="mm-text-link"
                    type="button"
                    onClick={() =>
                      setActiveTab("My Bookings")
                    }
                  >
                    All bookings →
                  </button>
                </div>

                <div className="mm-list-panel">
                  {loading ? (
                    <div className="mm-empty">
                      Loading reservations…
                    </div>
                  ) : activeBookings.length === 0 ? (
                    <div className="mm-empty">
                      You have no active reservations yet.
                    </div>
                  ) : (
                    activeBookings
                      .map((booking) => (
                        <BookingRow
                          key={booking._id}
                          booking={booking}
                          activity
                        />
                      ))
                  )}
                </div>
              </section>
            </>
          )}

          {activeTab === "Today's Menu" && (
            <section>
              <div className="mm-section-heading">
                <div>
                  <h2>Meal schedule</h2>
                  <p>
                    Only meal slots created by the mess
                    administrator appear here.
                  </p>
                </div>

                <button
                  className="mm-text-link"
                  type="button"
                  onClick={loadStudentData}
                >
                  Refresh ↻
                </button>
              </div>

              {loading ? (
                <div className="mm-empty">
                  Loading meal slots…
                </div>
              ) : meals.length === 0 ? (
                <div className="mm-empty">
                  No upcoming meal slots are available yet.
                </div>
              ) : (
                <div className="mm-meal-grid">
                  {meals.map((meal) => (
                    <MealCard
                      key={meal.id}
                      meal={meal}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === "My Bookings" && (
            <section>
              <div className="mm-section-heading">
                <div>
                  <h2>Active reservations</h2>
                  <p>
                    Cancel a reservation only while the
                    backend still allows changes.
                  </p>
                </div>

                <button
                  className="mm-text-link"
                  type="button"
                  onClick={loadStudentData}
                >
                  Refresh ↻
                </button>
              </div>

              <div className="mm-list-panel">
                {loading ? (
                  <div className="mm-empty">
                    Loading reservations…
                  </div>
                ) : activeBookings.length === 0 ? (
                  <div className="mm-empty">
                    No active reservations. Visit Today's Menu
                    to book a meal.
                  </div>
                ) : (
                  activeBookings.map((booking) => (
                    <BookingRow
                      key={booking._id}
                      booking={booking}
                    />
                  ))
                )}
              </div>
            </section>
          )}

          {activeTab === "My Activity" && (
            <section>
              <div className="mm-section-heading">
                <div>
                  <h2>Reservation activity</h2>
                  <p>
                    This view shows your current active
                    reservations, not a complete attendance
                    history.
                  </p>
                </div>

                <button
                  className="mm-text-link"
                  type="button"
                  onClick={loadStudentData}
                >
                  Refresh ↻
                </button>
              </div>

              <div className="mm-list-panel">
                {loading ? (
                  <div className="mm-empty">
                    Loading activity…
                  </div>
                ) : activeBookings.length === 0 ? (
                  <div className="mm-empty">
                    No active reservation activity to show yet.
                  </div>
                ) : (
                  activeBookings.map((booking) => (
                    <BookingRow
                      key={booking._id}
                      booking={booking}
                      activity
                    />
                  ))
                )}
              </div>
            </section>
          )}

          {activeTab === "Rebate Requests" && (
            <section>
              <div className="mm-section-heading">
                <div>
                  <h2>Request a rebate</h2>
                  <p>Select a booking and explain why you are requesting a rebate.</p>
                </div>
                <button
                  className="mm-text-link"
                  type="button"
                  onClick={loadMyRebates}
                  disabled={rebatesLoading}
                >
                  {rebatesLoading ? "Refreshing…" : "Refresh ↻"}
                </button>
              </div>

              <div className="mm-list-panel" style={{ padding: 18 }}>
                <form onSubmit={submitRebateRequest}>
                  <div style={{ marginBottom: 16 }}>
                    <label
                      htmlFor="rebate-booking"
                      style={{ display: "block", marginBottom: 8, color: "#e9dfc7", fontSize: 12 }}
                    >
                      Select booking
                    </label>
                    <select
                      id="rebate-booking"
                      value={rebateBookingId}
                      onChange={(event) => setRebateBookingId(event.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: 12,
                        borderRadius: 10,
                        border: "1px solid rgba(209,174,103,.35)",
                        background: "#17221f",
                        color: "#f4ead4",
                        font: "inherit",
                      }}
                    >
                      <option value="">Choose a meal booking</option>
                      {bookings
                        .filter((booking) =>
                          !booking.checkedInAt &&
                          !rebates.some((rebate) => rebate.bookingId === booking._id)
                        )
                        .map((booking) => {
                          const meal = getMealForBooking(booking);
                          return (
                            <option key={booking._id} value={booking._id}>
                              {meal
                                ? `${meal.name} — ${meal.menu} · ${meal.date}`
                                : `Booking ${booking._id}`}
                            </option>
                          );
                        })}
                    </select>
                    <small style={{ display: "block", color: "#a9a592", marginTop: 7 }}>
                      Bookings that already have a rebate request or have been checked in are excluded.
                    </small>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label
                      htmlFor="rebate-reason"
                      style={{ display: "block", marginBottom: 8, color: "#e9dfc7", fontSize: 12 }}
                    >
                      Reason for rebate
                    </label>
                    <textarea
                      id="rebate-reason"
                      value={rebateReason}
                      onChange={(event) => setRebateReason(event.target.value)}
                      placeholder="Explain why you are requesting a rebate…"
                      minLength={5}
                      maxLength={500}
                      required
                      rows={4}
                      style={{
                        width: "100%",
                        padding: 12,
                        borderRadius: 10,
                        border: "1px solid rgba(209,174,103,.35)",
                        background: "#17221f",
                        color: "#f4ead4",
                        resize: "vertical",
                        font: "inherit",
                      }}
                    />
                    <small style={{ display: "block", color: "#a9a592", marginTop: 7 }}>
                      {rebateReason.length}/500 characters
                    </small>
                  </div>

                  <button
                    className="mm-primary-button"
                    type="submit"
                    disabled={rebateSubmitting || !rebateBookingId || rebateReason.trim().length < 5}
                    style={{ maxWidth: 260 }}
                  >
                    {rebateSubmitting ? "Submitting…" : "Submit rebate request"}
                  </button>
                </form>
              </div>

              <div className="mm-section-heading">
                <div>
                  <h2>Your requests</h2>
                  <p>Track the status of your submitted rebate requests.</p>
                </div>
              </div>

              <div className="mm-list-panel">
                {rebatesLoading ? (
                  <div className="mm-empty">Loading rebate requests…</div>
                ) : rebates.length === 0 ? (
                  <div className="mm-empty">You have not submitted any rebate requests yet.</div>
                ) : (
                  rebates.map((rebate) => {
                    const booking = bookings.find((item) => item._id === rebate.bookingId);
                    const meal = booking ? getMealForBooking(booking) : null;
                    const amount = rebate.amount?.$numberDecimal ?? rebate.amount ?? "0";

                    return (
                      <div className="mm-booking-row" key={rebate._id}>
                        <div className="mm-booking-left">
                          <div className="mm-booking-emoji">₹</div>
                          <div>
                            <strong>
                              {meal ? `${meal.name} — ${meal.menu}` : "Meal rebate request"}
                            </strong>
                            <small>{rebate.reason || "No reason provided"}</small>
                            <small>
                              Amount: ₹{String(amount)} · {formatDate(rebate.createdAt)}
                            </small>
                          </div>
                        </div>
                        <span className="mm-status">{rebate.status || "PENDING"}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {activeTab === "Billing History" && (
            <section>
              <div className="mm-section-heading">
                <div>
                  <h2>Your billing ledger</h2>
                  <p>Charges and credits recorded for your meal bookings.</p>
                </div>
                <button
                  className="mm-text-link"
                  type="button"
                  onClick={loadBillingLedger}
                  disabled={billingLoading}
                >
                  {billingLoading ? "Refreshing…" : "Refresh ↻"}
                </button>
              </div>

              {billingError && (
                <div className="mm-notice error" role="alert">
                  {billingError}
                </div>
              )}

              <div className="mm-list-panel">
                {billingLoading ? (
                  <div className="mm-empty">Loading billing history…</div>
                ) : billingError ? (
                  <div className="mm-empty">
                    Could not load billing history. Use Refresh to try again.
                  </div>
                ) : billingLedger.length === 0 ? (
                  <div className="mm-empty">
                    No billing entries recorded yet. Meal charges and credits will appear here when recorded.
                  </div>
                ) : (
                  billingLedger.map((entry, index) => {
                    const amount =
                      entry.amount?.$numberDecimal ?? entry.amount ?? "0";
                    const isCredit = [
                      "REBATE_CREDIT",
                      "REFUND",
                    ].includes(entry.type);
                    const entryId =
                      entry._id ||
                      entry.referenceId ||
                      `${entry.type}-${entry.date}-${index}`;

                    return (
                      <div className="mm-booking-row" key={entryId}>
                        <div className="mm-booking-left">
                          <div className="mm-booking-emoji">
                            {isCredit ? "↙" : entry.type === "CHARGE" ? "₹" : "↔"}
                          </div>
                          <div>
                            <strong>
                              {entry.type === "CHARGE"
                                ? "Meal charge"
                                : entry.type === "REBATE_CREDIT"
                                  ? "Rebate credit"
                                  : entry.type === "REFUND"
                                    ? "Refund"
                                    : entry.type === "ADJUSTMENT"
                                      ? "Billing adjustment"
                                      : entry.type || "Billing entry"}
                            </strong>
                            <small>{entry.reason || "No description provided"}</small>
                            <small>
                              {formatDate(entry.date || entry.createdAt)}
                              {entry.bookingId ? ` · Booking ${String(entry.bookingId).slice(0, 8)}` : ""}
                            </small>
                          </div>
                        </div>
                        <span
                          className="mm-status"
                          style={{
                            color: isCredit ? "#c9e2b5" : "#f0d38e",
                            background: isCredit ? "#85a96820" : "#c49b3d20",
                          }}
                        >
                          {isCredit ? "+" : entry.type === "CHARGE" ? "−" : ""}₹{String(amount)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {activeTab === "Hall Points" && (
            <section>
              <div className="mm-section-heading">
                <div>
                  <h2>Your Hall Points</h2>
                  <p>
                    Earn points through responsible meal bookings and attendance.
                  </p>
                </div>

                <button
                  className="mm-text-link"
                  type="button"
                  onClick={loadHallPoints}
                  disabled={pointsLoading}
                >
                  {pointsLoading ? "Refreshing…" : "Refresh ↻"}
                </button>
              </div>

              <div className="mm-stats" style={{ marginBottom: 22 }}>
                <div className="mm-stat">
                  <div className="mm-stat-label">Points balance</div>
                  <div className="mm-stat-value">
                    {pointsLoading && pointsBalance === null
                      ? "…"
                      : pointsBalance ?? "—"}
                  </div>
                  <div className="mm-stat-caption">Your current Hall Points</div>
                </div>

                <div className="mm-stat">
                  <div className="mm-stat-label">Total transactions</div>
                  <div className="mm-stat-value">
                    {pointsLoading && pointsTotalTransactions === null
                      ? "…"
                      : pointsTotalTransactions ?? pointsTransactions.length}
                  </div>
                  <div className="mm-stat-caption">Recorded points transactions</div>
                </div>

                <div className="mm-stat">
                  <div className="mm-stat-label">How to earn</div>
                  <div
                    style={{
                      color: "#c6c1af",
                      fontSize: 11,
                      lineHeight: 1.9,
                      marginTop: 10,
                    }}
                  >
                    Early cancellation: +2
                    <br />
                    Successful check-in: +1
                    <br />
                    No-show: −2
                  </div>
                </div>
              </div>

              {pointsError && (
                <div className="mm-notice error" role="alert">
                  {pointsError}
                </div>
              )}

              <div className="mm-section-heading">
                <div>
                  <h2>Points history</h2>
                  <p>Your latest recorded Hall Points transactions.</p>
                </div>
              </div>

              <div className="mm-list-panel">
                {pointsLoading ? (
                  <div className="mm-empty">Loading your points history…</div>
                ) : pointsError ? (
                  <div className="mm-empty">
                    Could not load points history. Use Refresh to try again.
                  </div>
                ) : pointsTransactions.length === 0 ? (
                  <div className="mm-empty">
                    No points transactions recorded yet. Your history will appear
                    here when points are awarded.
                  </div>
                ) : (
                  pointsTransactions.map((transaction, index) => {
                    const reasonLabels = {
                      EARLY_CANCELLATION: "Early meal cancellation",
                      SUCCESSFUL_REDEMPTION: "Successful QR check-in",
                      NO_SHOW: "Missed meal (no-show)",
                      SURPLUS_COLLECTION: "Surplus meal collection",
                    };
                    const points = Number(transaction.points) || 0;
                    const transactionId =
                      transaction._id || transaction.referenceKey || `${transaction.reason}-${transaction.createdAt}-${index}`;

                    return (
                      <div className="mm-booking-row" key={transactionId}>
                        <div className="mm-booking-left">
                          <div className="mm-booking-emoji">
                            {points > 0 ? "✧" : "−"}
                          </div>
                          <div>
                            <strong>
                              {reasonLabels[transaction.reason] ||
                                transaction.reason ||
                                "Points transaction"}
                            </strong>
                            <small>
                              {transaction.createdAt
                                ? new Date(transaction.createdAt).toLocaleString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
                                    }
                                  )
                                : "Date unavailable"}
                            </small>
                          </div>
                        </div>

                        <span
                          className="mm-status"
                          style={{
                            color: points > 0 ? "#c9e2b5" : "#ffc4b4",
                            background: points > 0 ? "#85a96820" : "#8e3d3022",
                          }}
                        >
                          {points > 0 ? "+" : ""}
                          {points}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}

          <footer className="mm-footer">
            MESSMATRIX · KAMAR-TAJ REFECTORY · PLAN
            THOUGHTFULLY, DINE MINDFULLY
          </footer>
        </main>
      </div>
    </div>
  );
}
