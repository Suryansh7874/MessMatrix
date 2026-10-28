
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const navigation = [
  { id: "Overview", icon: "⌂", label: "Overview" },
  { id: "Meals", icon: "♨", label: "Meal Management" },
  { id: "Bookings", icon: "▤", label: "Bookings" },
  { id: "Rebates", icon: "₹", label: "Rebates" },
  { id: "Students", icon: "♙", label: "Students" },
  { id: "Staff", icon: "♟", label: "Staff Registry" },
  { id: "Inventory", icon: "▧", label: "Inventory" },
  { id: "Reports", icon: "◷", label: "Reports & Insights" },
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function MessAdmin() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [meals, setMeals] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [rebates, setRebates] = useState([]);
  const [rebatesLoading, setRebatesLoading] = useState(false);
  const [rebatesError, setRebatesError] = useState("");
  const [rebateRefresh, setRebateRefresh] = useState(0);
  const [staff, setStaff] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [overview, setOverview] = useState(null);
  const [search, setSearch] = useState("");
  const [bookingFilter, setBookingFilter] = useState("All");
  const [toast, setToast] = useState("");
  const [clock, setClock] = useState(new Date());
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showMealForm, setShowMealForm] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Kitchen Staff",
    shift: "Morning",
    password: "",
  });
  const [mealForm, setMealForm] = useState({
    name: "",
    time: "",
    menu: "",
    price: "0",
    capacity: "200",
  });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load registered staff from the database whenever the dashboard opens.
  useEffect(() => {
    let cancelled = false;

    async function loadStaff() {
      try {
        const response = await api.get("/admin/staff");

        if (cancelled) return;

        const staffRecords = Array.isArray(response.data?.staff)
          ? response.data.staff
          : [];

        setStaff(
          staffRecords.map((member) => ({
            id: member._id ?? member.id,
            name: member.name ?? "",
            email: member.email ?? "",
            employeeId: member.employeeId || "—",
            phone: "—",
            role: member.role ?? "MESS_STAFF",
            shift: "Not assigned",
            active: member.isActive ?? true,
          }))
        );
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Could not load registered staff:",
            error.response?.data || error.message
          );
          setToast(
            error.response?.data?.message ||
              "Could not load registered staff."
          );
        }
      }
    }

    loadStaff();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      setLoadingData(true);
      const [menusResult, slotsResult, overviewResult] = await Promise.allSettled([
        api.get("/menu"),
        api.get("/meal-slots"),
        api.get("/analytics/overview"),
      ]);
      if (cancelled) return;

      if (menusResult.status === "rejected") {
        setToast(menusResult.reason?.response?.data?.message || "Could not load menus.");
      }

      if (overviewResult.status === "fulfilled") {
        setOverview(overviewResult.value.data);
      } else {
        setToast(overviewResult.reason?.response?.data?.message || "Could not load analytics.");
      }

      if (slotsResult.status === "fulfilled") {
        const slots = slotsResult.value.data.mealSlots ?? [];
        const headcounts = await Promise.all(slots.map((slot) =>
          api.get(`/meal-slots/${slot._id}/headcount`)
            .then((response) => response.data)
            .catch(() => ({ currentOptedInCount: 0, finalHeadcount: null }))
        ));
        if (cancelled) return;

        const availableMenus = menusResult.status === "fulfilled"
          ? (menusResult.value.data.menus ?? [])
          : [];
        setMeals(slots.map((slot, index) => {
          const menu = slot.menuId && typeof slot.menuId === "object"
            ? slot.menuId
            : availableMenus.find((item) => item._id === slot.menuId);
          const headcount = headcounts[index] ?? {};
          return {
            id: slot._id,
            name: String(slot.mealType ?? "Meal").charAt(0) + String(slot.mealType ?? "Meal").slice(1).toLowerCase(),
            time: `${formatTime(new Date(slot.startTime))} – ${formatTime(new Date(slot.endTime))}`,
            menu: menu?.description || menu?.name || "Menu details unavailable",
            price: Number(menu?.price?.$numberDecimal ?? menu?.price ?? 0),
            capacity: Number(slot.preparedPortions ?? slot.finalHeadcount ?? 0),
            booked: Number(headcount.currentOptedInCount ?? 0),
            open: slot.status === "OPEN" && !slot.bookingLocked && new Date(slot.cutoffTime) > new Date(),
            status: slot.status,
            menuId: menu?._id ?? slot.menuId,
          };
        }));
      } else {
        setToast(slotsResult.reason?.response?.data?.message || "Could not load meal slots.");
      }

      if (!cancelled) setLoadingData(false);
    }

    loadDashboardData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (activeTab !== "Rebates") return undefined;

    let cancelled = false;
    async function loadPendingRebates() {
      setRebatesLoading(true);
      setRebatesError("");
      try {
        const response = await api.get("/rebates/pending");
        if (cancelled) return;
        setRebates(Array.isArray(response.data?.rebates) ? response.data.rebates : []);
      } catch (error) {
        if (cancelled) return;
        setRebatesError(
          error?.response?.data?.message ||
          "Could not load pending rebates. Please try again."
        );
      } finally {
        if (!cancelled) setRebatesLoading(false);
      }
    }

    loadPendingRebates();
    return () => { cancelled = true; };
  }, [activeTab, rebateRefresh]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = (message) => setToast(message);

  const totalCapacity = meals.reduce((sum, meal) => sum + meal.capacity, 0);
  const totalBooked = meals.reduce((sum, meal) => sum + meal.booked, 0);
  const checkedInAttendees = Number(overview?.checkedIn ?? 0);
  const totalBookingsRecorded = Number(overview?.totalBookings ?? bookings.length);
  const pendingBookings = bookings.filter((b) => b.status === "Pending").length;
  const pendingRebateAmount = rebates.reduce((sum, rebate) => sum + (Number.parseFloat(rebate.amount) || 0), 0);
  const activeStaff = staff.filter((member) => member.active).length;
  const lowStock = inventory.filter((item) => item.quantity < item.minimum).length;

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch = `${booking.id} ${booking.student} ${booking.meal}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        bookingFilter === "All" || booking.status === bookingFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, bookingFilter]);

  const filteredStaff = useMemo(() => {
    return staff.filter((member) =>
      `${member.name} ${member.email} ${member.role}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [staff, search]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearch("");
    setMobileMenu(false);
  };

  const updateBooking = () => {
    notify("The backend does not yet provide an admin booking-update endpoint.");
  };

  const toggleMeal = () => {
    notify("The backend does not yet provide an endpoint to open or close an existing meal slot.");
  };

  const registerStaff = async (event) => {
    event.preventDefault();

    if (!/^\d{10}$/.test(staffForm.phone)) {
      notify("Enter a valid 10-digit phone number.");
      return;
    }

    if (staffForm.password.length < 8) {
      notify("Password must contain at least 8 characters.");
      return;
    }

    try {
      const response = await api.post("/admin/staff", {
        name: staffForm.name.trim(),
        email: staffForm.email.trim(),
        employeeId: `EMP-${Date.now()}`,
        password: staffForm.password,
      });

      const user = response.data.user;
      setStaff((current) => [...current, {
        id: user.id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        phone: staffForm.phone.trim(),
        role: staffForm.role,
        shift: staffForm.shift,
        active: true,
      }]);

      setStaffForm({
        name: "",
        email: "",
        phone: "",
        role: "Kitchen Staff",
        shift: "Morning",
        password: "",
      });
      setShowStaffForm(false);
      notify("Staff account created. The backend does not yet provide a staff-list endpoint.");
    } catch (error) {
      notify(error.response?.data?.message || "Could not create staff account.");
    }
  };

  const addMeal = async (event) => {
    event.preventDefault();

    if (!mealForm.name.trim() || !mealForm.time.trim()) {
      notify("Enter a meal name and serving time.");
      return;
    }

    const price = Number(mealForm.price);
    if (
      mealForm.price.trim() === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      notify("Enter a valid meal price of ₹0 or more.");
      return;
    }

    const mealText = `${mealForm.name} ${mealForm.menu}`.toLowerCase();
    const mealType = mealText.includes("breakfast")
      ? "BREAKFAST"
      : mealText.includes("lunch")
        ? "LUNCH"
        : mealText.includes("dinner")
          ? "DINNER"
          : null;

    if (!mealType) {
      notify("The backend supports BREAKFAST, LUNCH, or DINNER. Include one in the meal name.");
      return;
    }

    let serviceWindow;
    try {
      serviceWindow = parseServingWindow(mealForm.time);
    } catch (error) {
      notify(error.message);
      return;
    }

    try {
      const menuResponse = await api.post("/menu", {
        name: mealForm.name.trim(),
        description: mealForm.menu.trim(),
        mealType,
        date: serviceWindow.start.toISOString(),
        price,
        imageUrl: "",
      });

      await api.post("/meal-slots", {
        menuId: menuResponse.data.menu._id,
        mealType,
        date: serviceWindow.start.toISOString(),
        startTime: serviceWindow.start.toISOString(),
        endTime: serviceWindow.end.toISOString(),
        cutoffTime: serviceWindow.cutoff.toISOString(),
      });

      setMealForm({ name: "", time: "", menu: "", price: "0", capacity: "200" });
      setShowMealForm(false);
      notify("Meal slot created. Capacity is not stored by the current backend model.");

      const [menusResponse, slotsResponse] = await Promise.all([
        api.get("/menu"),
        api.get("/meal-slots"),
      ]);
      const refreshedMenus = menusResponse.data.menus ?? [];
      const slots = slotsResponse.data.mealSlots ?? [];
      const headcounts = await Promise.all(slots.map((slot) =>
        api.get(`/meal-slots/${slot._id}/headcount`)
          .then((response) => response.data)
          .catch(() => ({ currentOptedInCount: 0, finalHeadcount: null }))
      ));

      setMeals(slots.map((slot, index) => {
        const menu = slot.menuId && typeof slot.menuId === "object"
          ? slot.menuId
          : refreshedMenus.find((item) => item._id === slot.menuId);
        const count = headcounts[index] ?? {};
        return {
          id: slot._id,
          name: String(slot.mealType ?? "Meal").charAt(0) + String(slot.mealType ?? "Meal").slice(1).toLowerCase(),
          time: `${formatTime(new Date(slot.startTime))} – ${formatTime(new Date(slot.endTime))}`,
          menu: menu?.description || menu?.name || "Menu details unavailable",
          price: Number(menu?.price?.$numberDecimal ?? menu?.price ?? 0),
          capacity: Number(slot.preparedPortions ?? slot.finalHeadcount ?? 0),
          booked: Number(count.currentOptedInCount ?? 0),
          open: slot.status === "OPEN" && !slot.bookingLocked && new Date(slot.cutoffTime) > new Date(),
          status: slot.status,
          menuId: menu?._id ?? slot.menuId,
        };
      }));
    } catch (error) {
      notify(error.response?.data?.message || "Could not create meal slot. Check the menu type and serving times.");
    }
  };

  const toggleStaff = () => {
    notify("The backend does not yet provide an endpoint to activate or deactivate staff.");
  };

  const updateStock = () => {
    notify("Inventory is not connected because no inventory API is currently available.");
  };

  const exportBookings = () => {
    const rows = [
      ["Booking ID", "Student", "Meal", "Date", "Status"],
      ...filteredBookings.map((b) => [
        b.id,
        b.student,
        b.meal,
        b.date,
        b.status,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "messmatrix-bookings.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify("Booking report exported.");
  };

  const exportStaff = () => {
    const rows = [
      ["Name", "Email", "Phone", "Role", "Shift", "Status"],
      ...staff.map((member) => [
        member.name,
        member.email,
        member.phone,
        member.role,
        member.shift,
        member.active ? "Active" : "Inactive",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "messmatrix-staff.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify("Staff directory exported.");
  };

  const resetSearch = () => setSearch("");

  return (
    <div className="mm-app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        :root {
          --mm-bg: #071322;
          --mm-panel: rgba(15, 33, 55, .87);
          --mm-panel-light: rgba(22, 44, 69, .82);
          --mm-blue: #73b8f3;
          --mm-gold: #e4bd73;
          --mm-gold-bright: #ffe3a1;
          --mm-text: #edf3fa;
          --mm-muted: #9eafc3;
          --mm-line: rgba(228, 189, 115, .19);
        }

        * { box-sizing: border-box; }

        .mm-app {
          min-height: 100vh;
          background:
            radial-gradient(ellipse at 80% 4%, rgba(39, 111, 173, .19), transparent 35%),
            radial-gradient(ellipse at 12% 95%, rgba(177, 123, 48, .10), transparent 35%),
            linear-gradient(135deg, #06101e 0%, #0a1b2d 48%, #071322 100%);
          color: var(--mm-text);
          font-family: 'DM Sans', sans-serif;
          display: flex;
          overflow: hidden;
          position: relative;
          isolation: isolate;
        }

        .mm-app::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          opacity: .19;
          background-image:
            repeating-linear-gradient(0deg, transparent 0 5px, rgba(255,255,255,.018) 6px),
            repeating-linear-gradient(90deg, transparent 0 7px, rgba(228,189,115,.025) 8px);
        }

        .mm-stars {
          position: fixed;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }

        .mm-star {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--mm-gold-bright);
          box-shadow: 0 0 12px 2px rgba(228,189,115,.4);
          animation: mmFloat 8s ease-in-out infinite;
          opacity: .42;
        }

        @keyframes mmFloat {
          0%, 100% { transform: translateY(0) translateX(0); opacity: .2; }
          50% { transform: translateY(-26px) translateX(12px); opacity: .8; }
        }

        @keyframes mmAppear {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes mmShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes mmGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(228,189,115,0); }
          50% { box-shadow: 0 0 24px rgba(228,189,115,.10); }
        }

        .mm-sidebar {
          width: 254px;
          flex-shrink: 0;
          min-height: 100vh;
          padding: 26px 17px 20px;
          background: linear-gradient(180deg, rgba(7,19,34,.97), rgba(10,26,43,.95));
          border-right: 1px solid var(--mm-line);
          position: relative;
          z-index: 5;
          display: flex;
          flex-direction: column;
        }

        .mm-sidebar::after {
          content: "";
          position: absolute;
          top: 0;
          right: -1px;
          height: 180px;
          width: 1px;
          background: linear-gradient(transparent, var(--mm-gold), transparent);
          opacity: .6;
        }

        .mm-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 5px 7px 25px;
          border-bottom: 1px solid var(--mm-line);
          margin-bottom: 25px;
        }

        .mm-emblem {
          width: 48px;
          height: 54px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          position: relative;
          color: var(--mm-gold-bright);
          font-size: 25px;
          border: 1px solid rgba(228,189,115,.65);
          border-radius: 48% 48% 10px 10px;
          background: linear-gradient(145deg, rgba(228,189,115,.14), rgba(39,111,173,.18));
          box-shadow: inset 0 0 16px rgba(228,189,115,.09), 0 0 20px rgba(228,189,115,.07);
        }

        .mm-emblem::before {
          content: "";
          position: absolute;
          inset: 4px;
          border: 1px solid rgba(228,189,115,.3);
          border-radius: inherit;
        }

        .mm-brand-name {
          font-family: 'Cinzel', serif;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 1px;
          color: var(--mm-gold-bright);
          line-height: 1.3;
        }

        .mm-brand-sub {
          color: var(--mm-muted);
          font-size: 9px;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 5px;
        }

        .mm-nav-label {
          font-size: 9px;
          font-weight: 700;
          color: #6f849a;
          letter-spacing: 2.3px;
          padding: 0 12px;
          margin: 0 0 12px;
          text-transform: uppercase;
        }

        .mm-nav {
          display: grid;
          gap: 6px;
        }

        .mm-nav-btn {
          border: 1px solid transparent;
          color: #a9bacd;
          background: transparent;
          padding: 12px 12px;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
          border-radius: 11px;
          font-family: inherit;
          font-size: 12px;
          cursor: pointer;
          transition: .25s ease;
          position: relative;
        }

        .mm-nav-btn:hover {
          color: var(--mm-gold-bright);
          background: rgba(228,189,115,.06);
          transform: translateX(3px);
        }

        .mm-nav-btn.active {
          color: var(--mm-gold-bright);
          border-color: rgba(228,189,115,.24);
          background: linear-gradient(100deg, rgba(228,189,115,.12), rgba(38,106,163,.11));
          box-shadow: inset 3px 0 0 var(--mm-gold);
        }

        .mm-nav-icon {
          width: 25px;
          height: 25px;
          display: grid;
          place-items: center;
          font-size: 17px;
          color: var(--mm-gold);
          background: rgba(228,189,115,.07);
          border-radius: 7px;
        }

        .mm-sidebar-bottom { margin-top: auto; }

        .mm-archive-card {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(228,189,115,.24);
          background: linear-gradient(145deg, rgba(228,189,115,.08), rgba(24,62,93,.25));
          padding: 16px;
          border-radius: 13px;
        }

        .mm-archive-card::before {
          content: "✧";
          position: absolute;
          right: 9px;
          top: -17px;
          color: rgba(228,189,115,.13);
          font-size: 76px;
        }

        .mm-archive-card h4 {
          margin: 0 0 8px;
          font-family: 'Cinzel', serif;
          font-size: 11px;
          color: var(--mm-gold-bright);
          letter-spacing: .5px;
        }

        .mm-archive-card p {
          margin: 0;
          color: var(--mm-muted);
          font-size: 10px;
          line-height: 1.7;
        }

        .mm-status-line {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 13px;
          color: #a9d8c0;
          font-size: 10px;
        }

        .mm-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #6ed6a3;
          box-shadow: 0 0 10px rgba(110,214,163,.6);
        }

        .mm-main {
          flex: 1;
          min-width: 0;
          padding: 25px 31px 38px;
          position: relative;
          z-index: 1;
        }

        .mm-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 30px;
          padding-bottom: 19px;
          border-bottom: 1px solid rgba(228,189,115,.12);
        }

        .mm-breadcrumb {
          color: var(--mm-muted);
          font-size: 11px;
          letter-spacing: .5px;
          margin-bottom: 7px;
        }

        .mm-breadcrumb span { color: var(--mm-gold); }

        .mm-page-title {
          font-family: 'Cinzel', serif;
          font-size: clamp(21px, 2.1vw, 30px);
          font-weight: 600;
          letter-spacing: .2px;
          margin: 0;
          color: #f6f1e7;
        }

        .mm-page-title span { color: var(--mm-gold-bright); }

        .mm-top-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mm-clock {
          text-align: right;
          color: var(--mm-gold-bright);
          font-family: 'Cinzel', serif;
          font-size: 13px;
          white-space: nowrap;
        }

        .mm-date {
          display: block;
          color: var(--mm-muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          margin-top: 5px;
        }

        .mm-avatar {
          width: 41px;
          height: 41px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          border: 1px solid rgba(228,189,115,.42);
          background: linear-gradient(145deg, rgba(228,189,115,.2), rgba(31,99,155,.3));
          color: var(--mm-gold-bright);
          font-family: 'Cinzel', serif;
          font-weight: 700;
        }

        .mm-menu-toggle { display: none !important; }

        .mm-welcome {
          border: 1px solid rgba(228,189,115,.28);
          border-radius: 19px;
          padding: 25px 27px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(ellipse at 92% 0%, rgba(84,154,215,.20), transparent 38%),
            linear-gradient(115deg, rgba(16,38,61,.96), rgba(13,32,53,.82));
          animation: mmAppear .55s ease both;
        }

        .mm-welcome::before {
          content: "";
          position: absolute;
          right: 4%;
          top: -100px;
          width: 250px;
          height: 250px;
          border: 1px solid rgba(228,189,115,.13);
          border-radius: 50%;
          box-shadow: 0 0 0 19px rgba(228,189,115,.025), 0 0 0 39px rgba(228,189,115,.02);
          pointer-events: none;
        }

        .mm-welcome::after {
          content: "✧";
          position: absolute;
          right: 11%;
          top: 20px;
          font-size: 95px;
          line-height: 1;
          color: rgba(228,189,115,.17);
          pointer-events: none;
        }

        .mm-eyebrow {
          display: flex;
          align-items: center;
          gap: 9px;
          color: var(--mm-gold);
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 9px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .mm-eyebrow::before {
          content: "";
          width: 22px;
          height: 1px;
          background: var(--mm-gold);
        }

        .mm-welcome h2 {
          font-family: 'Cinzel', serif;
          font-size: clamp(20px, 2.5vw, 29px);
          font-weight: 500;
          margin: 0 0 10px;
          max-width: 570px;
          line-height: 1.4;
        }

        .mm-welcome h2 em {
          color: var(--mm-gold-bright);
          font-style: normal;
        }

        .mm-welcome p {
          margin: 0;
          max-width: 550px;
          color: #a8bbd0;
          font-size: 12px;
          line-height: 1.8;
        }

        .mm-welcome-meta {
          display: flex;
          gap: 17px;
          flex-wrap: wrap;
          margin-top: 19px;
          color: #b7c6d6;
          font-size: 10px;
        }

        .mm-welcome-meta span {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .mm-welcome-meta b { color: var(--mm-gold); }

        .mm-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin: 25px 0 15px;
        }

        .mm-section-head h3 {
          margin: 0;
          font-family: 'Cinzel', serif;
          font-size: 15px;
          font-weight: 600;
          color: #f0e8d9;
        }

        .mm-section-head p {
          color: var(--mm-muted);
          font-size: 10px;
          margin: 5px 0 0;
        }

        .mm-gold-link {
          border: 0;
          background: transparent;
          color: var(--mm-gold-bright);
          cursor: pointer;
          font-family: inherit;
          font-size: 11px;
          transition: .2s;
        }

        .mm-gold-link:hover { color: white; transform: translateX(2px); }

        .mm-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
        }

        .mm-stat {
          position: relative;
          overflow: hidden;
          padding: 18px 17px 16px;
          border-radius: 15px;
          border: 1px solid var(--mm-line);
          background: linear-gradient(145deg, rgba(21,44,69,.88), rgba(11,28,47,.92));
          transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
          animation: mmAppear .5s ease both;
          min-width: 0;
        }

        .mm-stat:nth-child(2) { animation-delay: .06s; }
        .mm-stat:nth-child(3) { animation-delay: .12s; }
        .mm-stat:nth-child(4) { animation-delay: .18s; }

        .mm-stat:hover {
          transform: translateY(-5px);
          border-color: rgba(228,189,115,.54);
          box-shadow: 0 13px 35px rgba(0,0,0,.17), 0 0 20px rgba(228,189,115,.045);
        }

        .mm-stat::after {
          content: "";
          position: absolute;
          width: 100px;
          height: 100px;
          right: -50px;
          bottom: -57px;
          border-radius: 50%;
          background: rgba(228,189,115,.055);
          transition: transform .4s ease;
        }

        .mm-stat:hover::after { transform: scale(1.8); }

        .mm-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .mm-stat-icon {
          width: 37px;
          height: 37px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          color: var(--mm-gold-bright);
          font-size: 18px;
          border: 1px solid rgba(228,189,115,.23);
          background: rgba(228,189,115,.08);
        }

        .mm-stat-trend {
          color: #93d8b5;
          font-size: 9px;
          background: rgba(76,171,121,.1);
          padding: 5px 7px;
          border-radius: 6px;
        }

        .mm-stat-label {
          color: var(--mm-muted);
          font-size: 10px;
          margin: 16px 0 7px;
        }

        .mm-stat-value {
          font-family: 'Cinzel', serif;
          font-size: clamp(22px, 2.1vw, 29px);
          font-weight: 600;
          letter-spacing: .2px;
          color: #f4f0e8;
        }

        .mm-stat-foot {
          margin-top: 8px;
          color: #8298ae;
          font-size: 9px;
        }

        .mm-grid-2 {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(260px, .8fr);
          gap: 17px;
        }

        .mm-panel {
          min-width: 0;
          border: 1px solid var(--mm-line);
          background: linear-gradient(145deg, var(--mm-panel-light), rgba(11,27,45,.94));
          border-radius: 16px;
          padding: 20px;
          animation: mmAppear .45s ease both;
        }

        .mm-panel-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 17px;
        }

        .mm-panel-title h3 {
          margin: 0;
          font-family: 'Cinzel', serif;
          font-size: 13px;
          font-weight: 600;
          color: #f0e8d9;
        }

        .mm-panel-title p {
          margin: 5px 0 0;
          font-size: 10px;
          color: var(--mm-muted);
        }

        .mm-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 20px;
          font-size: 9px;
          color: var(--mm-gold-bright);
          background: rgba(228,189,115,.09);
          border: 1px solid rgba(228,189,115,.17);
          white-space: nowrap;
        }

        .mm-meal-list { display: grid; gap: 10px; }

        .mm-meal-row {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid rgba(150,180,207,.09);
          background: rgba(5,18,31,.32);
          border-radius: 12px;
          padding: 12px;
          transition: .2s;
        }

        .mm-meal-row:hover {
          border-color: rgba(228,189,115,.25);
          background: rgba(228,189,115,.035);
        }

        .mm-meal-symbol {
          flex-shrink: 0;
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          font-size: 18px;
          background: rgba(86,151,210,.12);
          border: 1px solid rgba(115,184,243,.15);
        }

        .mm-meal-info { min-width: 0; flex: 1; }

        .mm-meal-info strong {
          font-size: 11px;
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
        }

        .mm-meal-info span {
          font-size: 9px;
          color: var(--mm-muted);
          display: block;
          overflow-wrap: anywhere;
        }

        .mm-meal-progress {
          height: 4px;
          background: rgba(135,161,187,.13);
          border-radius: 8px;
          overflow: hidden;
          margin-top: 9px;
        }

        .mm-meal-progress div {
          height: 100%;
          border-radius: 8px;
          background: linear-gradient(90deg, #347eb7, var(--mm-gold));
          transition: width .5s ease;
        }

        .mm-meal-count {
          min-width: 43px;
          text-align: right;
          font-size: 10px;
          color: var(--mm-gold-bright);
        }

        .mm-meal-count small {
          display: block;
          margin-top: 5px;
          font-size: 8px;
          color: var(--mm-muted);
        }

        .mm-chart {
          display: flex;
          align-items: end;
          justify-content: space-around;
          gap: 10px;
          height: 176px;
          padding: 18px 3px 0;
          border-bottom: 1px solid rgba(228,189,115,.15);
          background: repeating-linear-gradient(to bottom, transparent 0 42px, rgba(150,180,207,.06) 43px);
        }

        .mm-chart-col {
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: end;
          gap: 8px;
          min-width: 0;
        }

        .mm-chart-bar {
          width: min(31px, 75%);
          border-radius: 7px 7px 2px 2px;
          background: linear-gradient(180deg, #e8c77f, #4a91c9 95%);
          min-height: 5px;
          position: relative;
          transition: height .5s ease, filter .2s;
          animation: mmAppear .7s ease both;
        }

        .mm-chart-bar:hover {
          filter: brightness(1.25);
          animation: mmGlow 1.5s ease infinite;
        }

        .mm-chart-label {
          color: var(--mm-muted);
          font-size: 9px;
          padding-bottom: 9px;
        }

        .mm-chart-legend {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 9px;
          color: var(--mm-muted);
          margin-top: 14px;
        }

        .mm-chart-legend i {
          width: 8px;
          height: 8px;
          background: var(--mm-gold);
          border-radius: 3px;
        }

        .mm-activity {
          display: grid;
          gap: 0;
        }

        .mm-activity-item {
          display: flex;
          gap: 11px;
          padding: 11px 0;
          border-bottom: 1px solid rgba(150,180,207,.09);
        }

        .mm-activity-item:last-child { border-bottom: 0; }

        .mm-activity-icon {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 9px;
          color: var(--mm-gold);
          background: rgba(228,189,115,.09);
        }

        .mm-activity-copy { min-width: 0; }

        .mm-activity-copy strong {
          font-size: 10px;
          font-weight: 500;
          display: block;
          line-height: 1.5;
        }

        .mm-activity-copy span {
          display: block;
          margin-top: 4px;
          color: var(--mm-muted);
          font-size: 9px;
        }

        .mm-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin: 18px 0;
        }

        .mm-search {
          min-width: 180px;
          flex: 1;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 13px;
          height: 41px;
          border-radius: 10px;
          border: 1px solid rgba(228,189,115,.18);
          background: rgba(6,18,31,.56);
          color: var(--mm-gold);
          transition: border-color .2s, box-shadow .2s;
        }

        .mm-search:focus-within {
          border-color: rgba(228,189,115,.65);
          box-shadow: 0 0 0 3px rgba(228,189,115,.05);
        }

        .mm-search input {
          width: 100%;
          min-width: 0;
          background: transparent;
          color: var(--mm-text);
          border: 0;
          outline: 0;
          font-family: inherit;
          font-size: 11px;
        }

        .mm-search input::placeholder { color: #72869c; }

        .mm-select, .mm-input, .mm-textarea {
          width: 100%;
          padding: 11px 12px;
          background: rgba(5,17,30,.7);
          color: var(--mm-text);
          border: 1px solid rgba(228,189,115,.2);
          border-radius: 9px;
          outline: none;
          font-family: inherit;
          font-size: 11px;
          transition: border-color .2s, box-shadow .2s;
        }

        .mm-select { width: auto; min-width: 130px; height: 41px; }
        .mm-input:focus, .mm-textarea:focus, .mm-select:focus {
          border-color: var(--mm-gold);
          box-shadow: 0 0 0 3px rgba(228,189,115,.06);
        }

        .mm-select option { background: #10243a; color: white; }

        .mm-btn {
          border: 1px solid rgba(228,189,115,.38);
          background: linear-gradient(110deg, rgba(228,189,115,.15), rgba(43,111,167,.14));
          color: var(--mm-gold-bright);
          padding: 11px 15px;
          border-radius: 10px;
          font-family: inherit;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          white-space: nowrap;
          transition: transform .2s, background .2s, border-color .2s, box-shadow .2s;
        }

        .mm-btn:hover {
          transform: translateY(-2px);
          background: linear-gradient(110deg, rgba(228,189,115,.24), rgba(43,111,167,.22));
          border-color: rgba(228,189,115,.7);
          box-shadow: 0 5px 18px rgba(0,0,0,.15);
        }

        .mm-btn:active { transform: translateY(0); }

        .mm-btn.primary {
          background: linear-gradient(115deg, #cba15a, #ecd093);
          color: #152336;
          border-color: #e5c27d;
        }

        .mm-btn.primary:hover {
          background: linear-gradient(115deg, #e0b96f, #ffe5a7);
          box-shadow: 0 5px 22px rgba(228,189,115,.17);
        }

        .mm-btn.danger {
          border-color: rgba(231,119,119,.28);
          color: #f3a3a3;
          background: rgba(175,63,63,.09);
        }

        .mm-btn.small { padding: 7px 10px; font-size: 9px; border-radius: 8px; }

        .mm-table-wrap {
          width: 100%;
          overflow-x: auto;
          border: 1px solid rgba(228,189,115,.13);
          border-radius: 13px;
          background: rgba(5,17,30,.26);
        }

        .mm-table {
          width: 100%;
          min-width: 620px;
          border-collapse: collapse;
          text-align: left;
        }

        .mm-table th {
          background: rgba(228,189,115,.055);
          color: #b6c4d4;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 9px;
          font-weight: 600;
          padding: 14px 15px;
          white-space: nowrap;
          border-bottom: 1px solid rgba(228,189,115,.15);
        }

        .mm-table td {
          padding: 14px 15px;
          border-bottom: 1px solid rgba(150,180,207,.08);
          font-size: 10px;
          color: #d5dfeb;
          white-space: nowrap;
        }

        .mm-table tr:last-child td { border-bottom: 0; }
        .mm-table tbody tr { transition: background .2s; }
        .mm-table tbody tr:hover { background: rgba(228,189,115,.035); }

        .mm-table-name {
          font-size: 11px;
          font-weight: 600;
          color: #f0f3f8;
        }

        .mm-table-sub {
          font-size: 9px;
          color: var(--mm-muted);
          display: block;
          margin-top: 4px;
        }

        .mm-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 30px;
          font-size: 9px;
          border: 1px solid transparent;
        }

        .mm-pill::before {
          content: "";
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: currentColor;
        }

        .mm-pill.success { color: #8ddbb1; background: rgba(75,169,117,.09); border-color: rgba(75,169,117,.17); }
        .mm-pill.warning { color: #f0c97c; background: rgba(228,189,115,.09); border-color: rgba(228,189,115,.16); }
        .mm-pill.danger { color: #efa2a2; background: rgba(211,91,91,.09); border-color: rgba(211,91,91,.17); }
        .mm-pill.neutral { color: #9db5cc; background: rgba(115,184,243,.08); border-color: rgba(115,184,243,.15); }

        .mm-card-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .mm-meal-card {
          padding: 19px;
          border-radius: 14px;
          border: 1px solid var(--mm-line);
          background: linear-gradient(145deg, rgba(22,45,69,.85), rgba(9,25,42,.91));
          transition: .25s ease;
        }

        .mm-meal-card:hover {
          transform: translateY(-3px);
          border-color: rgba(228,189,115,.5);
        }

        .mm-meal-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .mm-meal-card h4 {
          font-family: 'Cinzel', serif;
          font-size: 14px;
          margin: 0 0 7px;
        }

        .mm-meal-card p {
          color: var(--mm-muted);
          font-size: 10px;
          line-height: 1.8;
          margin: 10px 0;
        }

        .mm-meal-card .mm-meal-progress { margin: 14px 0 8px; }

        .mm-meal-card-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          color: var(--mm-muted);
          font-size: 9px;
        }

        .mm-form-panel {
          border: 1px solid rgba(228,189,115,.3);
          border-radius: 15px;
          background: linear-gradient(145deg, rgba(19,42,65,.97), rgba(8,23,39,.97));
          padding: 21px;
          margin-bottom: 19px;
          animation: mmAppear .3s ease both;
        }

        .mm-form-panel h3 {
          font-family: 'Cinzel', serif;
          font-size: 14px;
          margin: 0 0 7px;
        }

        .mm-form-panel > p {
          font-size: 10px;
          color: var(--mm-muted);
          margin: 0 0 18px;
          line-height: 1.7;
        }

        .mm-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .mm-field { min-width: 0; }
        .mm-field.full { grid-column: 1 / -1; }

        .mm-field label {
          display: block;
          color: #b9c7d6;
          font-size: 10px;
          margin-bottom: 7px;
        }

        .mm-form-actions {
          display: flex;
          gap: 9px;
          justify-content: flex-end;
          flex-wrap: wrap;
          margin-top: 17px;
        }

        .mm-note {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 12px 14px;
          border-radius: 10px;
          background: rgba(228,189,115,.055);
          border: 1px solid rgba(228,189,115,.15);
          color: #c1cddd;
          font-size: 10px;
          line-height: 1.7;
          margin-bottom: 17px;
        }

        .mm-note b { color: var(--mm-gold-bright); }

        .mm-empty {
          text-align: center;
          padding: 45px 20px;
          color: var(--mm-muted);
          font-size: 11px;
        }

        .mm-empty div {
          font-size: 27px;
          color: var(--mm-gold);
          margin-bottom: 11px;
        }

        .mm-inventory-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 13px;
        }

        .mm-stock-card {
          padding: 17px;
          border: 1px solid var(--mm-line);
          border-radius: 14px;
          background: linear-gradient(145deg, rgba(20,43,66,.84), rgba(9,25,42,.93));
          transition: .25s;
        }

        .mm-stock-card:hover { transform: translateY(-3px); border-color: rgba(228,189,115,.43); }

        .mm-stock-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .mm-stock-icon {
          font-size: 21px;
          width: 41px;
          height: 41px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: rgba(228,189,115,.08);
          border: 1px solid rgba(228,189,115,.16);
        }

        .mm-stock-card h4 { margin: 15px 0 4px; font-size: 12px; }
        .mm-stock-card > p { color: var(--mm-muted); font-size: 9px; margin: 0; }

        .mm-stock-quantity {
          margin-top: 14px;
          font-family: 'Cinzel', serif;
          font-size: 23px;
          color: var(--mm-gold-bright);
        }

        .mm-stock-quantity span {
          font-family: 'DM Sans', sans-serif;
          color: var(--mm-muted);
          font-size: 10px;
        }

        .mm-stock-actions {
          display: flex;
          gap: 7px;
          margin-top: 14px;
        }

        .mm-stock-actions button { flex: 1; }

        .mm-report-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .mm-report-value {
          font-family: 'Cinzel', serif;
          color: var(--mm-gold-bright);
          font-size: 27px;
          margin: 8px 0;
        }

        .mm-report-copy {
          font-size: 10px;
          color: var(--mm-muted);
          line-height: 1.8;
        }

        .mm-progress-line {
          height: 6px;
          border-radius: 8px;
          background: rgba(150,180,207,.12);
          overflow: hidden;
          margin-top: 14px;
        }

        .mm-progress-line div {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #367fb6, var(--mm-gold));
          transition: width .5s ease;
        }

        .mm-footer {
          margin-top: 30px;
          padding-top: 17px;
          border-top: 1px solid rgba(228,189,115,.12);
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          color: #748aa0;
          font-size: 9px;
          letter-spacing: .4px;
        }

        .mm-footer span { color: var(--mm-gold); }

        .mm-toast {
          position: fixed;
          right: 25px;
          bottom: 25px;
          z-index: 100;
          max-width: min(380px, calc(100vw - 35px));
          padding: 14px 18px;
          border-radius: 12px;
          color: #f7e7c5;
          font-size: 11px;
          background: rgba(13,34,53,.97);
          border: 1px solid rgba(228,189,115,.48);
          box-shadow: 0 12px 38px rgba(0,0,0,.32), 0 0 20px rgba(228,189,115,.07);
          animation: mmAppear .25s ease both;
        }

        .mm-toast::before { content: "✧  "; color: var(--mm-gold-bright); }

        @media (min-width: 1500px) {
          .mm-main { padding-left: 42px; padding-right: 42px; }
          .mm-stat { padding: 22px; }
        }

        @media (max-width: 1150px) {
          .mm-sidebar { width: 225px; }
          .mm-main { padding: 22px; }
          .mm-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .mm-grid-2 { grid-template-columns: minmax(0, 1fr); }
          .mm-inventory-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 760px) {
          .mm-app { display: block; }
          .mm-sidebar {
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            width: 260px;
            min-height: 100vh;
            transform: translateX(-105%);
            transition: transform .28s ease;
            box-shadow: 15px 0 40px rgba(0,0,0,.3);
          }
          .mm-sidebar.open { transform: translateX(0); }
          .mm-main { padding: 19px 15px 28px; }
          .mm-menu-toggle { display: inline-flex !important; }
          .mm-topbar { margin-bottom: 20px; }
          .mm-clock { display: none; }
          .mm-welcome { padding: 21px 18px; }
          .mm-welcome::after { right: 4%; opacity: .55; }
          .mm-stats { gap: 10px; }
          .mm-stat { padding: 14px; }
          .mm-stat-value { font-size: 23px; }
          .mm-card-grid, .mm-report-grid { grid-template-columns: minmax(0, 1fr); }
          .mm-inventory-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .mm-panel { padding: 15px; }
        }

        @media (max-width: 420px) {
          .mm-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .mm-stat-icon { width: 32px; height: 32px; }
          .mm-stat-trend { font-size: 8px; padding: 4px; }
          .mm-stat-label { font-size: 9px; }
          .mm-stat-value { font-size: 21px; }
          .mm-inventory-grid { grid-template-columns: minmax(0, 1fr); }
          .mm-form-grid { grid-template-columns: minmax(0, 1fr); }
          .mm-field.full { grid-column: auto; }
          .mm-section-head { align-items: flex-start; }
          .mm-toolbar .mm-btn { flex: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .mm-app *, .mm-app *::before, .mm-app *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div className="mm-stars" aria-hidden="true">
        {Array.from({ length: 24 }, (_, i) => (
          <span
            className="mm-star"
            key={i}
            style={{
              left: `${(i * 41 + 7) % 100}%`,
              top: `${(i * 29 + 8) % 100}%`,
              animationDelay: `${(i % 8) * -0.8}s`,
              animationDuration: `${6 + (i % 5)}s`,
              opacity: 0.2 + (i % 5) * 0.09,
            }}
          />
        ))}
      </div>

      <aside className={`mm-sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="mm-brand">
          <div className="mm-emblem">✧</div>
          <div>
            <div className="mm-brand-name">MessMatrix</div>
            <div className="mm-brand-sub">The Royal Refectory</div>
          </div>
        </div>

        <div className="mm-nav-label">Administration</div>
        <nav className="mm-nav">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`mm-nav-btn ${activeTab === item.id ? "active" : ""}`}
              onClick={() => changeTab(item.id)}
            >
              <span className="mm-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "Bookings" && pendingBookings > 0 && (
                <span style={{
                  marginLeft: "auto",
                  color: "#f0c97c",
                  fontSize: 9,
                  background: "rgba(228,189,115,.12)",
                  borderRadius: 20,
                  padding: "3px 6px",
                }}>
                  {pendingBookings}
                </span>
              )}
              {item.id === "Rebates" && rebates.length > 0 && (
                <span style={{
                  marginLeft: "auto",
                  color: "#f0c97c",
                  fontSize: 9,
                  background: "rgba(228,189,115,.12)",
                  borderRadius: 20,
                  padding: "3px 6px",
                }}>
                  {rebates.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mm-sidebar-bottom">
          <div className="mm-archive-card">
            <h4>✧ The Keeper's Archive</h4>
            <p>Menus, meal slots, and analytics are loaded from the backend.</p>
            <div className="mm-status-line">
              <span className="mm-dot" />
              {loadingData ? "Loading live data…" : "API connection attempted"}
            </div>
          </div>
          <div style={{
            textAlign: "center",
            marginTop: 17,
            color: "#61778d",
            fontSize: 9,
            letterSpacing: 1,
          }}>
            EST. WITH CARE · SERVED WITH HONOUR
          </div>
        </div>
      </aside>

      <main className="mm-main">
        <header className="mm-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="mm-btn mm-menu-toggle"
              onClick={() => setMobileMenu((value) => !value)}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
            <div>
              <div className="mm-breadcrumb">
                MessMatrix <span>/</span> Administration <span>/</span> {activeTab}
              </div>
              <h1 className="mm-page-title">
                {activeTab === "Overview" ? (
                  <>The <span>Grand Hall</span></>
                ) : (
                  <>{activeTab === "Staff" ? "Staff " : ""}<span>{activeTab === "Staff" ? "Registry" : activeTab}</span></>
                )}
              </h1>
            </div>
          </div>

          <div className="mm-top-actions">
            <div className="mm-clock">
              {clock.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
              <span className="mm-date">
                {clock.toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="mm-avatar" title="Mess Administrator">MA</div>
          </div>
        </header>

        {activeTab === "Overview" && (
          <>
            <section className="mm-welcome">
              <div className="mm-eyebrow">The Refectory Command Centre</div>
              <h2>Order in the hall. <em>Harmony at every table.</em></h2>
              <p>
                Welcome, Keeper. Oversee the daily rhythm of the refectory,
                manage the meal roster, guide your staff, and keep every resource
                in balance.
              </p>
              <div className="mm-welcome-meta">
                <span><b>✧</b> Live dashboard clock</span>
                <span><b>✧</b> {meals.length} meal sessions configured</span>
                <span><b>✧</b> {activeStaff} active staff members</span>
              </div>
            </section>

            <div className="mm-stats">
              <Stat icon="♙" label="Registered Staff" value={staff.length} trend={`${activeStaff} active`} foot="Staff directory records" />
              <Stat icon="♨" label="Prepared Portions" value={totalCapacity.toLocaleString("en-IN")} trend="All sessions" foot={`${totalBooked.toLocaleString("en-IN")} opted-in bookings`} />
              <Stat icon="▤" label="Checked-In Attendees" value={checkedInAttendees} trend="Attendance" foot={`${Number(overview?.expectedAttendees ?? 0)} expected attendees`} />
              <Stat icon="▧" label="Low Stock Alerts" value={lowStock} trend={lowStock ? "Attention needed" : "All in order"} foot="Inventory below minimum level" />
            </div>

            <div className="mm-section-head">
              <div>
                <h3>Today's Operations</h3>
                <p>A view of the refectory's daily rhythm.</p>
              </div>
              <button className="mm-gold-link" onClick={() => changeTab("Meals")}>
                Manage meal roster ↗
              </button>
            </div>

            <div className="mm-grid-2">
              <section className="mm-panel">
                <div className="mm-panel-title">
                  <div>
                    <h3>The Meal Roster</h3>
                    <p>Capacity and availability by session</p>
                  </div>
                  <span className="mm-tag">✧ {meals.filter((m) => m.open).length} Open</span>
                </div>
                <div className="mm-meal-list">
                  {meals.map((meal) => (
                    <div className="mm-meal-row" key={meal.id}>
                      <div className="mm-meal-symbol">
                        {meal.name === "Breakfast" ? "☼" : meal.name === "Lunch" ? "♨" : meal.name === "Dinner" ? "☾" : "✧"}
                      </div>
                      <div className="mm-meal-info">
                        <strong>{meal.name}</strong>
                        <span>{meal.time} · {meal.open ? "Accepting bookings" : "Currently closed"}</span>
                        <div className="mm-meal-progress">
                          <div style={{ width: `${Math.min(100, meal.capacity ? (meal.booked / meal.capacity) * 100 : 0)}%` }} />
                        </div>
                      </div>
                      <div className="mm-meal-count">
                        {meal.booked}
                        <small>{meal.capacity ? `/ ${meal.capacity} prepared` : "opted in"}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mm-panel">
                <div className="mm-panel-title">
                  <div>
                    <h3>Booking Distribution</h3>
                    <p>Current seats booked by meal</p>
                  </div>
                  <span className="mm-tag">Live state</span>
                </div>
                <div className="mm-chart">
                  {meals.map((meal) => (
                    <div className="mm-chart-col" key={meal.id}>
                      <div
                        className="mm-chart-bar"
                        title={`${meal.name}: ${meal.booked} bookings`}
                        style={{
                          height: `${Math.max(4, (meal.booked / Math.max(1, ...meals.map((m) => m.booked))) * 100)}%`,
                        }}
                      />
                      <span className="mm-chart-label">
                        {meal.name === "Breakfast" ? "Brkfst" : meal.name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mm-chart-legend">
                  <i /> Number of opted-in bookings
                </div>
                <div style={{
                  marginTop: 19,
                  padding: 13,
                  borderRadius: 10,
                  background: "rgba(228,189,115,.045)",
                  border: "1px solid rgba(228,189,115,.1)",
                }}>
                  <div style={{ color: "var(--mm-muted)", fontSize: 10 }}>Total opted-in bookings</div>
                  <div style={{ fontFamily: "'Cinzel', serif", color: "var(--mm-gold-bright)", fontSize: 25, marginTop: 5 }}>
                    {totalBooked.toLocaleString("en-IN")}
                  </div>
                </div>
              </section>
            </div>

            <div className="mm-section-head">
              <div>
                <h3>Recent Booking Activity</h3>
                <p>Latest entries in the booking ledger.</p>
              </div>
              <button className="mm-gold-link" onClick={() => changeTab("Bookings")}>
                Open ledger ↗
              </button>
            </div>

            <section className="mm-panel">
              {bookings.length === 0 ? (
                <div className="mm-empty"><div>✧</div>No bookings recorded yet.</div>
              ) : (
                <div className="mm-activity">
                  {bookings.slice(-4).reverse().map((booking) => (
                    <div className="mm-activity-item" key={booking.id}>
                      <div className="mm-activity-icon">▤</div>
                      <div className="mm-activity-copy" style={{ flex: 1 }}>
                        <strong>{booking.student} · {booking.meal}</strong>
                        <span>{booking.id} · {booking.date}</span>
                      </div>
                      <StatusPill status={booking.status} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === "Meals" && (
          <>
            <div className="mm-section-head">
              <div>
                <h3>Meal Session Registry</h3>
                <p>Create meal sessions and control booking availability.</p>
              </div>
              <button className="mm-btn primary" onClick={() => setShowMealForm((value) => !value)}>
                {showMealForm ? "✕ Close form" : "+ Add meal session"}
              </button>
            </div>

            {showMealForm && (
              <form className="mm-form-panel" onSubmit={addMeal}>
                <h3>✧ Inscribe a New Meal Session</h3>
                <p>Set the meal's name, serving time, menu, price, and seating capacity.</p>
                <div className="mm-form-grid">
                  <Field label="Meal name" full>
                    <input className="mm-input" required placeholder="e.g. Special Dinner" value={mealForm.name} onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })} />
                  </Field>
                  <Field label="Serving time">
                    <input className="mm-input" required placeholder="e.g. 7:30 PM – 9:00 PM" value={mealForm.time} onChange={(e) => setMealForm({ ...mealForm, time: e.target.value })} />
                  </Field>
                  <Field label="Maximum capacity">
                    <input className="mm-input" required type="number" min="1" value={mealForm.capacity} onChange={(e) => setMealForm({ ...mealForm, capacity: e.target.value })} />
                  </Field>
                  <Field label="Meal price (₹)">
                    <input className="mm-input" required type="number" min="0" step="0.01" inputMode="decimal" placeholder="e.g. 60.00" value={mealForm.price} onChange={(e) => setMealForm({ ...mealForm, price: e.target.value })} />
                  </Field>
                  <Field label="Menu details" full>
                    <textarea className="mm-textarea" rows="2" placeholder="Enter planned menu items" value={mealForm.menu} onChange={(e) => setMealForm({ ...mealForm, menu: e.target.value })} />
                  </Field>
                </div>
                <div className="mm-form-actions">
                  <button type="button" className="mm-btn" onClick={() => setShowMealForm(false)}>Cancel</button>
                  <button className="mm-btn primary" type="submit">✧ Create session</button>
                </div>
              </form>
            )}

            <div className="mm-card-grid">
              {meals.map((meal) => (
                <article className="mm-meal-card" key={meal.id}>
                  <div className="mm-meal-card-top">
                    <div>
                      <h4>{meal.name}</h4>
                      <span style={{ fontSize: 10, color: "var(--mm-muted)" }}>◷ {meal.time}</span>
                    </div>
                    <StatusPill status={meal.open ? "Open" : "Closed"} />
                  </div>
                  <p>{meal.menu}</p>
                  <p style={{ color: "var(--mm-gold-bright)", fontWeight: 600 }}>
                    Price: ₹{Number.isFinite(Number(meal.price)) ? Number(meal.price).toFixed(2) : "0.00"}
                  </p>
                  <div className="mm-meal-progress">
                    <div style={{ width: `${Math.min(100, (meal.booked / meal.capacity) * 100)}%` }} />
                  </div>
                  <div className="mm-meal-card-foot">
                    <span>{meal.booked} opted in · {meal.capacity ? `${meal.capacity} portions recorded` : "capacity not configured"}</span>
                    <span>{meal.capacity ? `${Math.max(0, meal.capacity - meal.booked)} remaining` : "availability unknown"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <button className={`mm-btn small ${meal.open ? "danger" : "primary"}`} onClick={() => toggleMeal(meal.id)}>
                      {meal.open ? "Close bookings" : "Open bookings"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {activeTab === "Bookings" && (
          <>
            <div className="mm-section-head">
              <div>
                <h3>The Booking Ledger</h3>
                <p>Review, confirm, and manage student meal bookings.</p>
              </div>
              <button className="mm-btn primary" onClick={exportBookings}>↓ Export CSV</button>
            </div>

            <div className="mm-stats">
              <Stat icon="▤" label="All Bookings" value={totalBookingsRecorded} trend="Analytics" foot="Records in the analytics period" />
              <Stat icon="✓" label="Checked In" value={checkedInAttendees} trend="Attendance" foot="Verified attendance records" />
              <Stat icon="◷" label="Pending Review" value={pendingBookings} trend="Unavailable" foot="Admin booking-list API not available" />
              <Stat icon="×" label="Cancelled" value={bookings.filter((b) => b.status === "Cancelled").length} trend="Closed" foot="Cancelled entries" />
            </div>

            <div className="mm-toolbar">
              <div className="mm-search">
                <span>⌕</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ID, student or meal..." />
                {search && <button className="mm-gold-link" onClick={resetSearch}>×</button>}
              </div>
              <select className="mm-select" value={bookingFilter} onChange={(e) => setBookingFilter(e.target.value)}>
                <option>All</option>
                <option>Confirmed</option>
                <option>Pending</option>
                <option>Cancelled</option>
              </select>
            </div>

            <section className="mm-panel">
              <div className="mm-panel-title">
                <div>
                  <h3>Booking Records</h3>
                  <p>{filteredBookings.length} records match your selection</p>
                </div>
                <span className="mm-tag">✧ Ledger</span>
              </div>
              <div className="mm-table-wrap">
                <table className="mm-table">
                  <thead>
                    <tr>
                      <th>Booking</th><th>Student</th><th>Meal</th><th>Date</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td><span className="mm-table-name">{booking.id}</span></td>
                        <td>{booking.student}</td>
                        <td>{booking.meal}</td>
                        <td>{booking.date}</td>
                        <td><StatusPill status={booking.status} /></td>
                        <td>
                          {booking.status === "Pending" ? (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button className="mm-btn small primary" onClick={() => updateBooking(booking.id, "Confirmed")}>Confirm</button>
                              <button className="mm-btn small danger" onClick={() => updateBooking(booking.id, "Cancelled")}>Cancel</button>
                            </div>
                          ) : (
                            <span style={{ color: "var(--mm-muted)" }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredBookings.length === 0 && <div className="mm-empty"><div>⌕</div>No matching bookings found.</div>}
              </div>
            </section>
          </>
        )}

        {activeTab === "Rebates" && (
          <>
            <div className="mm-section-head">
              <div>
                <h3>Pending Rebate Ledger</h3>
                <p>Review rebate requests currently awaiting processing.</p>
              </div>
              <button
                className="mm-btn primary"
                onClick={() => setRebateRefresh((value) => value + 1)}
                disabled={rebatesLoading}
              >
                {rebatesLoading ? "↻ Loading…" : "↻ Refresh"}
              </button>
            </div>

            <div className="mm-stats">
              <Stat
                icon="₹"
                label="Pending Requests"
                value={rebates.length}
                trend="Live API"
                foot="Requests returned by the backend"
              />
              <Stat
                icon="◈"
                label="Total Pending Amount"
                value={money(pendingRebateAmount)}
                trend="Pending only"
                foot="Sum of the listed pending rebate amounts"
              />
            </div>

            {rebatesError && (
              <div className="mm-panel" role="alert" style={{ marginBottom: 18 }}>
                <div className="mm-panel-title">
                  <div>
                    <h3>Rebates could not be loaded</h3>
                    <p>{rebatesError}</p>
                  </div>
                  <button
                    className="mm-btn primary"
                    onClick={() => setRebateRefresh((value) => value + 1)}
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            <section className="mm-panel">
              <div className="mm-panel-title">
                <div>
                  <h3>Rebate Requests</h3>
                  <p>{rebatesLoading ? "Fetching pending requests…" : `${rebates.length} pending request${rebates.length === 1 ? "" : "s"}`}</p>
                </div>
                <span className="mm-tag">✧ Rebate ledger</span>
              </div>
              <div className="mm-table-wrap">
                <table className="mm-table">
                  <thead>
                    <tr>
                      <th>Rebate</th>
                      <th>Student Reference</th>
                      <th>Booking Reference</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Requested On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rebates.map((rebate) => {
                      const studentRef = rebate.studentId && typeof rebate.studentId === "object"
                        ? (rebate.studentId.name || rebate.studentId.email || rebate.studentId._id || "Student")
                        : rebate.studentId;
                      const bookingRef = rebate.bookingId && typeof rebate.bookingId === "object"
                        ? (rebate.bookingId._id || rebate.bookingId.id || "Booking")
                        : rebate.bookingId;
                      const requestedAt = rebate.createdAt ? new Date(rebate.createdAt) : null;
                      const requestedLabel = requestedAt && !Number.isNaN(requestedAt.getTime())
                        ? requestedAt.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "—";
                      return (
                        <tr key={rebate._id}>
                          <td><span className="mm-table-name" title={rebate._id || ""}>{rebate._id ? `…${String(rebate._id).slice(-8)}` : "—"}</span></td>
                          <td title={studentRef ? String(studentRef) : "Not provided"}>{studentRef ? `…${String(studentRef).slice(-10)}` : "—"}</td>
                          <td title={bookingRef ? String(bookingRef) : "Not provided"}>{bookingRef ? `…${String(bookingRef).slice(-10)}` : "—"}</td>
                          <td>{money(Number.parseFloat(rebate.amount) || 0)}</td>
                          <td><StatusPill status={rebate.status || "PENDING"} /></td>
                          <td>{requestedLabel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!rebatesLoading && !rebatesError && rebates.length === 0 && (
                  <div className="mm-empty"><div>₹</div>No pending rebate requests were found.</div>
                )}
              </div>
            </section>
            <p style={{ color: "var(--mm-muted)", fontSize: 11, marginTop: 12 }}>
              This view is read-only because the current backend exposes a pending-rebates fetch endpoint, but no admin approval or rejection endpoint.
            </p>
          </>
        )}

        {activeTab === "Students" && (
          <>
            <div className="mm-section-head">
              <div>
                <h3>Student Directory</h3>
                <p>Student records require an admin-authorized student-list endpoint.</p>
              </div>
              <span className="mm-tag">API endpoint required</span>
            </div>
            <div className="mm-toolbar">
              <div className="mm-search">
                <span>⌕</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student or booking..." />
                {search && <button className="mm-gold-link" onClick={resetSearch}>×</button>}
              </div>
            </div>
            <section className="mm-panel">
              <div className="mm-table-wrap">
                <table className="mm-table">
                  <thead>
                    <tr><th>Student</th><th>Booking ID</th><th>Meal</th><th>Booking Date</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {bookings.filter((booking) => `${booking.student} ${booking.id} ${booking.meal}`.toLowerCase().includes(search.toLowerCase())).map((booking) => (
                      <tr key={booking.id}>
                        <td><span className="mm-table-name">{booking.student}</span></td>
                        <td>{booking.id}</td>
                        <td>{booking.meal}</td>
                        <td>{booking.date}</td>
                        <td><StatusPill status={booking.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bookings.filter((booking) => `${booking.student} ${booking.id} ${booking.meal}`.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                  <div className="mm-empty"><div>♙</div>No students match your search.</div>
                )}
              </div>
            </section>
            <div className="mm-note" style={{ marginTop: 16 }}>
              <span>✧</span>
              <div><b>Data note:</b> the current backend does not expose an admin-authorized student-list endpoint.</div>
            </div>
          </>
        )}

        {activeTab === "Staff" && (
          <>
            <div className="mm-section-head">
              <div>
                <h3>Staff Registry</h3>
                <p>The administrator maintains staff records and assigns their duties.</p>
              </div>
              <button className="mm-btn primary" onClick={() => setShowStaffForm((value) => !value)}>
                {showStaffForm ? "✕ Close form" : "+ Register staff"}
              </button>
            </div>

            {showStaffForm && (
              <form className="mm-form-panel" onSubmit={registerStaff}>
                <h3>✧ Enrol a New Member</h3>
                <p>Enter the staff member's details. The administrator initiates their registration.</p>

                <div className="mm-note">
                  <span>✧</span>
                  <div><b>Secure registration:</b> this form creates a real MESS_STAFF account through the protected backend. Employee ID is generated automatically; phone, shift, and the selected display role are not stored by the current model.</div>
                </div>

                <div className="mm-form-grid">
                  <Field label="Full name">
                    <input className="mm-input" required maxLength={80} placeholder="Enter full name" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} />
                  </Field>
                  <Field label="Email address">
                    <input className="mm-input" type="email" required maxLength={120} placeholder="staff@example.com" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} />
                  </Field>
                  <Field label="Phone number">
                    <input className="mm-input" type="tel" required maxLength={10} inputMode="numeric" placeholder="10-digit mobile number" value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} />
                  </Field>
                  <Field label="Staff role">
                    <select className="mm-select" style={{ width: "100%" }} value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}>
                      <option>Kitchen Staff</option>
                      <option>Kitchen Manager</option>
                      <option>Dining Hall Staff</option>
                      <option>Inventory Manager</option>
                      <option>Cleaning Staff</option>
                    </select>
                  </Field>
                  <Field label="Assigned shift">
                    <select className="mm-select" style={{ width: "100%" }} value={staffForm.shift} onChange={(e) => setStaffForm({ ...staffForm, shift: e.target.value })}>
                      <option>Morning</option>
                      <option>Afternoon</option>
                      <option>Evening</option>
                      <option>Night</option>
                      <option>Rotational</option>
                    </select>
                  </Field>
                  <Field label="Temporary password">
                    <input className="mm-input" type="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} />
                  </Field>
                </div>

                <div className="mm-form-actions">
                  <button type="button" className="mm-btn" onClick={() => setShowStaffForm(false)}>Cancel</button>
                  <button type="submit" className="mm-btn primary">✧ Add staff record</button>
                </div>
              </form>
            )}

            <div className="mm-stats">
              <Stat icon="♟" label="Total Staff Records" value={staff.length} trend="Directory" foot="Created during this session" />
              <Stat icon="✓" label="Active Members" value={activeStaff} trend="Active" foot="Created during this session" />
              <Stat icon="◷" label="Inactive Members" value={staff.length - activeStaff} trend="Inactive" foot="Can be reactivated" />
              <Stat icon="✧" label="Assigned Roles" value={new Set(staff.map((member) => member.role)).size} trend="Role types" foot="Across the staff directory" />
            </div>

            <div className="mm-toolbar">
              <div className="mm-search">
                <span>⌕</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff name, email or role..." />
                {search && <button className="mm-gold-link" onClick={resetSearch}>×</button>}
              </div>
              <button className="mm-btn" onClick={exportStaff}>↓ Export directory</button>
            </div>

            <section className="mm-panel">
              <div className="mm-panel-title">
                <div>
                  <h3>Members of the Refectory</h3>
                  <p>{filteredStaff.length} staff records displayed</p>
                </div>
                <span className="mm-tag">✧ Staff ledger</span>
              </div>
              <div className="mm-table-wrap">
                <table className="mm-table">
                  <thead>
                    <tr><th>Staff member</th><th>Contact</th><th>Role</th><th>Shift</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((member) => (
                      <tr key={member.id}>
                        <td>
                          <span className="mm-table-name">{member.name}</span>
                          <span className="mm-table-sub">Staff ID: {String(member.id).slice(-6)}</span>
                        </td>
                        <td>
                          {member.email}
                          <span className="mm-table-sub">{member.phone}</span>
                        </td>
                        <td>{member.role}</td>
                        <td>{member.shift}</td>
                        <td><StatusPill status={member.active ? "Active" : "Inactive"} /></td>
                        <td>
                          <button className={`mm-btn small ${member.active ? "danger" : "primary"}`} onClick={() => toggleStaff(member.id)}>
                            {member.active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStaff.length === 0 && <div className="mm-empty"><div>♟</div>No matching staff records.</div>}
              </div>
            </section>
          </>
        )}

        {activeTab === "Inventory" && (
          <>
            <div className="mm-section-head">
              <div>
                <h3>Resource Inventory</h3>
                <p>Monitor available ingredients and keep the pantry balanced.</p>
              </div>
              <span className="mm-tag">✧ {lowStock} low-stock alerts</span>
            </div>

            {lowStock > 0 && (
              <div className="mm-note">
                <span>⚠</span>
                <div><b>Attention required:</b> {lowStock} inventory item(s) have fallen below their minimum stock level. Update quantities after a verified stock count.</div>
              </div>
            )}

            <div className="mm-inventory-grid">
              {inventory.map((item) => {
                const isLow = item.quantity < item.minimum;
                return (
                  <article className="mm-stock-card" key={item.id}>
                    <div className="mm-stock-top">
                      <div className="mm-stock-icon">
                        {item.category === "Dairy" ? "♨" : item.category === "Grains" ? "▤" : "✧"}
                      </div>
                      <StatusPill status={isLow ? "Low Stock" : "In Stock"} />
                    </div>
                    <h4>{item.name}</h4>
                    <p>{item.category} · Minimum {item.minimum} {item.unit}</p>
                    <div className="mm-stock-quantity">{item.quantity} <span>{item.unit}</span></div>
                    <div className="mm-progress-line">
                      <div style={{
                        width: `${Math.min(100, (item.quantity / Math.max(item.minimum * 2, 1)) * 100)}%`,
                        background: isLow ? "linear-gradient(90deg, #b75f60, #e6b76c)" : undefined,
                      }} />
                    </div>
                    <div className="mm-stock-actions">
                      <button className="mm-btn small" onClick={() => updateStock(item.id, -5)}>− 5</button>
                      <button className="mm-btn small primary" onClick={() => updateStock(item.id, 5)}>+ 5</button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mm-note" style={{ marginTop: 17 }}>
              <span>✧</span>
              <div><b>Inventory controls:</b> the backend currently has no inventory API, so stock changes are disabled until one is added.</div>
            </div>
          </>
        )}

        {activeTab === "Reports" && (
          <>
            <div className="mm-section-head">
              <div>
                <h3>Reports & Insights</h3>
                <p>A summary based on the backend analytics endpoint where available.</p>
              </div>
              <span className="mm-tag">{overview ? "✧ Backend analytics" : "✧ Analytics unavailable"}</span>
            </div>

            <div className="mm-report-grid">
              <section className="mm-panel">
                <div className="mm-panel-title">
                  <div><h3>Prepared Portions vs Opt-ins</h3><p>Opted-in bookings compared with recorded portions</p></div>
                  <span className="mm-tag">♨</span>
                </div>
                <div className="mm-report-value">
                  {totalCapacity ? Math.round((totalBooked / totalCapacity) * 100) : 0}%
                </div>
                <div className="mm-report-copy">{totalBooked.toLocaleString("en-IN")} opted-in bookings compared with {totalCapacity.toLocaleString("en-IN")} recorded prepared portions.</div>
                <div className="mm-progress-line">
                  <div style={{ width: `${totalCapacity ? Math.min(100, (totalBooked / totalCapacity) * 100) : 0}%` }} />
                </div>
              </section>

              <section className="mm-panel">
                <div className="mm-panel-title">
                  <div><h3>Attendance Rate</h3><p>Checked-in attendees against expected attendees</p></div>
                  <span className="mm-tag">▤</span>
                </div>
                <div className="mm-report-value">
                  {overview?.attendanceRate != null ? Math.round(Number(overview.attendanceRate)) : 0}%
                </div>
                <div className="mm-report-copy">{checkedInAttendees} checked in out of {Number(overview?.expectedAttendees ?? 0)} expected attendees.</div>
                <div className="mm-progress-line">
                  <div style={{ width: `${overview?.attendanceRate != null ? Math.min(100, Number(overview.attendanceRate)) : 0}%` }} />
                </div>
              </section>

              <section className="mm-panel">
                <div className="mm-panel-title">
                  <div><h3>Staff Availability</h3><p>Active members in the staff directory</p></div>
                  <span className="mm-tag">♟</span>
                </div>
                <div className="mm-report-value">{staff.length ? Math.round((activeStaff / staff.length) * 100) : 0}%</div>
                <div className="mm-report-copy">{activeStaff} active staff member(s) out of {staff.length} recorded members.</div>
                <div className="mm-progress-line">
                  <div style={{ width: `${staff.length ? (activeStaff / staff.length) * 100 : 0}%` }} />
                </div>
              </section>

              <section className="mm-panel">
                <div className="mm-panel-title">
                  <div><h3>Resource Health</h3><p>Inventory items meeting minimum levels</p></div>
                  <span className="mm-tag">▧</span>
                </div>
                <div className="mm-report-value">{inventory.length - lowStock}/{inventory.length}</div>
                <div className="mm-report-copy">{lowStock} item(s) are currently below their minimum stock threshold.</div>
                <div className="mm-progress-line">
                  <div style={{ width: `${inventory.length ? ((inventory.length - lowStock) / inventory.length) * 100 : 0}%` }} />
                </div>
              </section>
            </div>

            <div className="mm-section-head">
              <div>
                <h3>Meal-by-Meal Breakdown</h3>
                <p>Current capacity and reservations for each session.</p>
              </div>
            </div>

            <section className="mm-panel">
              <div className="mm-table-wrap">
                <table className="mm-table">
                  <thead>
                    <tr><th>Meal</th><th>Time</th><th>Prepared</th><th>Opted In</th><th>Difference</th><th>Opt-ins / Prepared</th></tr>
                  </thead>
                  <tbody>
                    {meals.map((meal) => (
                      <tr key={meal.id}>
                        <td><span className="mm-table-name">{meal.name}</span></td>
                        <td>{meal.time}</td>
                        <td>{meal.capacity}</td>
                        <td>{meal.booked}</td>
                        <td>{meal.capacity ? meal.capacity - meal.booked : "—"}</td>
                        <td>{meal.capacity ? Math.round((meal.booked / meal.capacity) * 100) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="mm-note" style={{ marginTop: 17 }}>
              <span>✧</span>
              <div><b>Reporting note:</b> meal-slot analytics are fetched from the backend; staff and inventory reporting remains unavailable until listing APIs are added.</div>
            </div>
          </>
        )}

        <footer className="mm-footer">
          <div>MESSMATRIX <span>✧</span> THE ROYAL REFECTORY</div>
          <div>CRAFTED FOR ORDER · BUILT FOR CARE</div>
        </footer>
      </main>

      {toast && <div className="mm-toast" role="status">{toast}</div>}
    </div>
  );
}


function formatTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "Time unavailable";
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

function parseServingWindow(input) {
  const match = input.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*(?:–|-|to)\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
  if (!match) throw new Error("Use a time range like 7:30 PM – 9:00 PM.");

  const parseClock = (value) => {
    const parts = value.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (!parts) throw new Error("Use a time range like 7:30 PM – 9:00 PM.");
    let hour = Number(parts[1]) % 12;
    if (parts[3].toUpperCase() === "PM") hour += 12;
    return { hour, minute: Number(parts[2]) };
  };

  const startClock = parseClock(match[1]);
  const endClock = parseClock(match[2]);
  const now = new Date();
  const start = new Date();
  start.setHours(startClock.hour, startClock.minute, 0, 0);

  // Schedule the next occurrence with enough time for the 30-minute cutoff.
  if (start.getTime() <= now.getTime() + 45 * 60 * 1000) {
    start.setDate(start.getDate() + 1);
  }

  const end = new Date(start);
  end.setHours(endClock.hour, endClock.minute, 0, 0);
  if (end <= start) end.setDate(end.getDate() + 1);

  const cutoff = new Date(start.getTime() - 30 * 60 * 1000);
  return { start, end, cutoff };
}

function Stat({ icon, label, value, trend, foot }) {
  return (
    <article className="mm-stat">
      <div className="mm-stat-top">
        <div className="mm-stat-icon">{icon}</div>
        <span className="mm-stat-trend">{trend}</span>
      </div>
      <div className="mm-stat-label">{label}</div>
      <div className="mm-stat-value">{value}</div>
      <div className="mm-stat-foot">{foot}</div>
    </article>
  );
}

function StatusPill({ status }) {
  const normalized = status.toLowerCase();
  let type = "neutral";

  if (["confirmed", "active", "open", "in stock"].includes(normalized)) {
    type = "success";
  } else if (["pending", "low stock"].includes(normalized)) {
    type = "warning";
  } else if (["cancelled", "inactive", "closed"].includes(normalized)) {
    type = "danger";
  }

  return <span className={`mm-pill ${type}`}>{status}</span>;
}

function Field({ label, children, full = false }) {
  return (
    <div className={`mm-field ${full ? "full" : ""}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}
