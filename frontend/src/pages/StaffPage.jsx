
import { useState } from "react";

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedMeal, setSelectedMeal] = useState("Lunch");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  const [checkIns, setCheckIns] = useState([
    { id: "MM2401", name: "Aarav Sharma", meal: "Lunch", time: "12:15 PM", status: "Checked In" },
    { id: "MM2402", name: "Priya Verma", meal: "Lunch", time: "12:18 PM", status: "Checked In" },
    { id: "MM2403", name: "Rohan Gupta", meal: "Lunch", time: "12:22 PM", status: "Checked In" },
    { id: "MM2404", name: "Ananya Singh", meal: "Breakfast", time: "8:02 AM", status: "Checked In" },
  ]);

  const meals = [
    { name: "Breakfast", time: "7:30 AM – 9:00 AM", expected: 180, icon: "☼" },
    { name: "Lunch", time: "12:00 PM – 2:00 PM", expected: 320, icon: "✺" },
    { name: "Dinner", time: "7:00 PM – 9:00 PM", expected: 250, icon: "☾" },
  ];

  const currentMeal = meals.find((meal) => meal.name === selectedMeal);
  const mealCheckIns = checkIns.filter((item) => item.meal === selectedMeal);
  const remaining = Math.max(0, currentMeal.expected - mealCheckIns.length);

  const filteredCheckIns = checkIns.filter((item) =>
    `${item.name} ${item.id} ${item.meal}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function simulateCheckIn() {
    const newId = `MM${2401 + checkIns.length}`;

    setCheckIns((previous) => [
      {
        id: newId,
        name: "Demo Student",
        meal: selectedMeal,
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "Checked In",
      },
      ...previous,
    ]);

    setNotice(`Demo check-in recorded for ${selectedMeal}.`);
    setActiveTab("Meal Check-in");
  }

  return (
    <div className="refectory">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');

        .refectory {
          --gold: #d6b777;
          --gold-light: #f1dba8;
          --jade: #86c6a7;
          --muted: #a4b1bf;
          --line: rgba(214,183,119,.20);
          min-height: 100vh;
          position: relative;
          isolation: isolate;
          color: #f4f0e7;
          font-family: 'DM Sans', sans-serif;
          background: #08111c;
        }

        .refectory *,
        .refectory *::before,
        .refectory *::after {
          box-sizing: border-box;
        }

        /* ANCIENT SANCTUM BACKGROUND */

        .refectory::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: -2;
          background:
            linear-gradient(110deg, rgba(5,12,21,.91), rgba(7,17,28,.74)),
            url("/kamar-taj-refectory.jpg") center / cover no-repeat;
          pointer-events: none;
        }

        .refectory::after {
          content: "";
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          opacity: .7;
          background:
            radial-gradient(circle at 20% 30%, rgba(222,178,91,.13), transparent 23%),
            radial-gradient(circle at 78% 24%, rgba(92,181,151,.12), transparent 27%),
            radial-gradient(circle at 55% 85%, rgba(211,169,92,.10), transparent 30%);
          background-size: 150% 150%;
          animation: sanctumAura 12s ease-in-out infinite alternate;
        }

        @keyframes sanctumAura {
          0% {
            background-position: 0% 0%;
            opacity: .4;
          }
          100% {
            background-position: 100% 100%;
            opacity: .85;
          }
        }

        /* FLOATING RUNES */

        .rf-magic-particles {
          position: fixed;
          inset: 0;
          z-index: -1;
          overflow: hidden;
          pointer-events: none;
        }

        .rf-magic-particles span {
          position: absolute;
          bottom: -30px;
          color: #e5c783;
          opacity: 0;
          text-shadow: 0 0 12px rgba(214,183,119,.8);
          animation: floatingRunes 12s linear infinite;
        }

        @keyframes floatingRunes {
          0% {
            transform: translate3d(0,0,0) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: .45;
          }
          70% {
            opacity: .25;
          }
          100% {
            transform: translate3d(35px,-110vh,0) rotate(180deg);
            opacity: 0;
          }
        }

        .rf-layout {
          display: flex;
          min-height: 100vh;
        }

        /* SIDEBAR */

        .rf-sidebar {
          width: 258px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          padding: 27px 19px 20px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(180deg, rgba(7,16,26,.96), rgba(9,23,32,.94));
          border-right: 1px solid var(--line);
        }

        .rf-sidebar::before {
          content: "";
          position: absolute;
          top: -76px;
          left: 27px;
          right: 27px;
          height: 240px;
          border: 1px solid rgba(214,183,119,.13);
          border-radius: 150px 150px 18px 18px;
          pointer-events: none;
        }

        .rf-brand,
        .rf-navigation,
        .rf-profile,
        .rf-sidebar-caption,
        .rf-divider {
          position: relative;
        }

        .rf-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .rf-seal {
          width: 47px;
          height: 47px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border: 1px solid rgba(214,183,119,.65);
          border-radius: 50% 50% 46% 46%;
          color: var(--gold-light);
          font-family: 'Cinzel', serif;
          font-size: 26px;
          background:
            radial-gradient(circle, rgba(214,183,119,.18), transparent 70%),
            #12252a;
          box-shadow: 0 0 25px rgba(214,183,119,.08);
        }

        .rf-brand-name {
          font-family: 'Manrope', sans-serif;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -1px;
          white-space: nowrap;
        }

        .rf-brand-name span {
          color: var(--gold);
        }

        .rf-brand-caption {
          margin-top: 4px;
          color: #9da99f;
          font-size: 8px;
          letter-spacing: 1.45px;
          white-space: nowrap;
        }

        .rf-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 26px 2px 27px;
          color: var(--gold);
          font-size: 10px;
        }

        .rf-divider::before,
        .rf-divider::after {
          content: "";
          height: 1px;
          flex: 1;
          background: linear-gradient(90deg, transparent, rgba(214,183,119,.55));
        }

        .rf-divider::after {
          background: linear-gradient(90deg, rgba(214,183,119,.55), transparent);
        }

        .rf-sidebar-caption {
          margin: 0 0 12px 10px;
          color: #75899a;
          font-size: 9px;
          letter-spacing: 2px;
          font-weight: 700;
        }

        .rf-navigation {
          display: grid;
          gap: 8px;
        }

        .rf-navigation button {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 13px 12px;
          border: 1px solid transparent;
          border-radius: 12px;
          color: #aab7c4;
          background: transparent;
          text-align: left;
          font-family: inherit;
          font-size: 12px;
          cursor: pointer;
          transition: .2s ease;
        }

        .rf-navigation button:hover {
          background: rgba(255,255,255,.045);
          color: #fff5df;
        }

        .rf-navigation button.active {
          color: var(--gold-light);
          border-color: rgba(214,183,119,.26);
          background: linear-gradient(100deg, rgba(177,139,68,.17), rgba(62,122,105,.08));
          box-shadow: inset 3px 0 var(--gold);
        }

        .rf-nav-icon {
          width: 27px;
          height: 27px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border: 1px solid rgba(214,183,119,.12);
          border-radius: 9px;
          background: rgba(255,255,255,.025);
          color: #b9c9d0;
          font-size: 16px;
        }

        .rf-navigation button.active .rf-nav-icon {
          color: var(--gold);
          background: rgba(214,183,119,.09);
        }

        .rf-profile {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: auto;
          padding: 14px 10px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: rgba(255,255,255,.035);
        }

        .rf-avatar {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(214,183,119,.4);
          border-radius: 50%;
          background: #1c302f;
          color: var(--gold-light);
          font-family: 'Cinzel', serif;
        }

        .rf-profile strong {
          font-size: 12px;
        }

        .rf-profile small {
          display: block;
          margin-top: 4px;
          color: var(--muted);
          font-size: 10px;
        }

        /* MAIN CONTENT */

        .rf-main {
          flex: 1;
          min-width: 0;
          padding: 31px clamp(17px,3vw,42px);
        }

        .rf-topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .rf-breadcrumb {
          margin-bottom: 16px;
          color: #8295a5;
          font-size: 10px;
        }

        .rf-breadcrumb span {
          color: var(--gold);
        }

        .rf-eyebrow {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 10px;
          color: var(--gold);
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 2px;
        }

        .rf-eyebrow::before {
          content: "✧";
          font-size: 16px;
        }

        .rf-title {
          margin: 0 0 9px;
          color: #f6f0e4;
          font-family: 'Cinzel', serif;
          font-size: clamp(25px,3vw,35px);
          font-weight: 600;
          line-height: 1.35;
          letter-spacing: .2px;
        }

        .rf-subtitle {
          max-width: 620px;
          color: #a6b2bf;
          font-size: 12px;
          line-height: 1.9;
        }

        .rf-date {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 15px;
          border: 1px solid var(--line);
          border-radius: 13px;
          background: rgba(12,24,36,.82);
          color: #e0d4ba;
          font-size: 11px;
          white-space: nowrap;
        }

        .rf-date span {
          color: var(--gold);
          font-size: 17px;
        }

        /* GLASS PANELS */

        .rf-panel {
          min-width: 0;
          padding: 21px;
          border: 1px solid rgba(214,183,119,.17);
          border-radius: 19px;
          background: linear-gradient(145deg, rgba(22,37,48,.89), rgba(9,21,33,.92));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.035),
            0 15px 40px rgba(0,0,0,.12);
          backdrop-filter: blur(13px);
        }

        .rf-stats {
          display: grid;
          grid-template-columns: repeat(4,minmax(0,1fr));
          gap: 14px;
          margin-bottom: 19px;
        }

        .rf-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .rf-stat-label {
          color: #b0bdc6;
          font-size: 11px;
          line-height: 1.6;
        }

        .rf-stat-icon {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border: 1px solid rgba(214,183,119,.19);
          border-radius: 12px;
          background: rgba(214,183,119,.08);
          color: var(--gold);
          font-size: 17px;
        }

        .rf-stat-icon.jade {
          color: var(--jade);
          border-color: rgba(134,198,167,.17);
          background: rgba(134,198,167,.07);
        }

        .rf-stat-value {
          margin: 16px 0 5px;
          color: #f4e8cc;
          font-family: 'Manrope', sans-serif;
          font-size: clamp(23px,2.5vw,30px);
          font-weight: 800;
          letter-spacing: -1px;
        }

        .rf-stat-note {
          color: #8295a4;
          font-size: 10px;
          line-height: 1.7;
        }

        .rf-columns {
          display: grid;
          grid-template-columns: minmax(0,1.15fr) minmax(280px,.85fr);
          gap: 17px;
          align-items: start;
        }

        .rf-section-title {
          margin: 0 0 8px;
          color: #f0e8d7;
          font-family: 'Cinzel', serif;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.6;
        }

        .rf-section-subtitle {
          margin: 0 0 20px;
          color: #91a4b1;
          font-size: 11px;
          line-height: 1.8;
        }

        .rf-section-ornament {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 0 0 18px;
          color: var(--gold);
          font-size: 9px;
          letter-spacing: 1.2px;
        }

        .rf-section-ornament::after {
          content: "";
          height: 1px;
          flex: 1;
          background: linear-gradient(90deg, rgba(214,183,119,.3), transparent);
        }

        /* MEAL SESSIONS */

        .rf-meal-list {
          display: grid;
          gap: 11px;
        }

        .rf-meal {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 13px;
          width: 100%;
          padding: 15px;
          border: 1px solid rgba(160,180,195,.12);
          border-radius: 15px;
          background: rgba(5,14,24,.42);
          color: #f4f0e7;
          text-align: left;
          cursor: pointer;
          transition: .2s ease;
        }

        .rf-meal:hover {
          transform: translateY(-2px);
          border-color: rgba(214,183,119,.34);
          background: rgba(30,49,57,.68);
        }

        .rf-meal.selected {
          border-color: rgba(214,183,119,.43);
          background: linear-gradient(110deg, rgba(177,139,68,.12), rgba(58,119,98,.09));
          box-shadow: inset 3px 0 var(--gold);
        }

        .rf-meal-name {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 700;
        }

        .rf-meal-symbol {
          color: var(--gold);
          font-size: 17px;
        }

        .rf-meal small {
          color: #91a5b2;
          font-size: 10px;
        }

        .rf-meal-count {
          color: var(--gold-light);
          font-family: 'Manrope', sans-serif;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .rf-progress {
          height: 5px;
          overflow: hidden;
          margin-top: 12px;
          border-radius: 10px;
          background: rgba(160,180,195,.12);
        }

        .rf-progress div {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg,#a98445,#e5cc8e,#86c6a7);
          transition: width .3s ease;
        }

        /* MAGICAL VERIFICATION PORTAL */

        .rf-station {
          position: relative;
          overflow: hidden;
          margin-bottom: 15px;
          padding: 25px 17px;
          border: 1px solid rgba(214,183,119,.22);
          border-radius: 16px;
          background:
            radial-gradient(ellipse at 50% 20%, rgba(180,139,65,.17), transparent 58%),
            linear-gradient(160deg, rgba(19,42,43,.85), rgba(8,19,31,.94));
          text-align: center;
        }

        .rf-station::before,
        .rf-station::after {
          content: "✧";
          position: absolute;
          color: rgba(214,183,119,.34);
          font-family: 'Cinzel', serif;
          font-size: 22px;
        }

        .rf-station::before {
          top: 10px;
          right: 13px;
        }

        .rf-station::after {
          bottom: 8px;
          left: 13px;
        }

        .rf-arch {
          position: relative;
          width: 92px;
          height: 112px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0 auto 19px;
          border: 1px solid rgba(214,183,119,.55);
          border-bottom: 0;
          border-radius: 48px 48px 5px 5px;
          color: var(--gold-light);
          background: linear-gradient(180deg, rgba(214,183,119,.10), rgba(134,198,167,.04));
          animation: portalPulse 4s ease-in-out infinite;
        }

        .rf-arch::before {
          content: "";
          position: absolute;
          inset: 7px 7px 0;
          border: 1px solid rgba(214,183,119,.23);
          border-bottom: 0;
          border-radius: 40px 40px 0 0;
          animation: innerPortal 5s ease-in-out infinite alternate;
        }

        .rf-arch-symbol {
          font-size: 36px;
          text-shadow: 0 0 12px rgba(214,183,119,.3);
          animation: runeGlow 3s ease-in-out infinite alternate;
        }

        @keyframes portalPulse {
          0%,100% {
            box-shadow: 0 0 12px rgba(214,183,119,.08);
            border-color: rgba(214,183,119,.4);
          }
          50% {
            box-shadow: 0 0 25px rgba(214,183,119,.24), 0 0 55px rgba(134,198,167,.10);
            border-color: rgba(241,219,168,.9);
          }
        }

        @keyframes innerPortal {
          from { opacity: .35; }
          to { opacity: .9; }
        }

        @keyframes runeGlow {
          from {
            text-shadow: 0 0 5px rgba(214,183,119,.2);
            transform: scale(.96);
          }
          to {
            text-shadow: 0 0 12px rgba(241,219,168,.75), 0 0 28px rgba(214,183,119,.3);
            transform: scale(1.05);
          }
        }

        .rf-station strong {
          display: block;
          margin-bottom: 9px;
          color: #f0dfb9;
          font-family: 'Cinzel', serif;
          font-size: 12px;
          line-height: 1.7;
        }

        .rf-station p {
          margin: 0;
          color: #9aabb8;
          font-size: 10px;
          line-height: 1.9;
        }

        .rf-primary {
          width: 100%;
          padding: 13px 15px;
          border: 1px solid rgba(243,219,163,.48);
          border-radius: 12px;
          background: linear-gradient(110deg,#b18b4d,#e5cb8d);
          color: #17231f;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: .2s ease;
        }

        .rf-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(214,183,119,.17);
          background: linear-gradient(110deg,#c5a361,#f0dda9);
        }

        .rf-demo-note {
          margin: 12px 0 0;
          color: #8297a6;
          font-size: 10px;
          line-height: 1.8;
        }

        /* STUDENT RECORDS */

        .rf-records {
          margin-top: 18px;
        }

        .rf-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .rf-search {
          width: 245px;
          max-width: 100%;
          padding: 12px 14px;
          border: 1px solid rgba(164,185,198,.18);
          border-radius: 12px;
          outline: none;
          background: rgba(4,13,23,.68);
          color: #f5f0e5;
          font-family: inherit;
          font-size: 11px;
          transition: .2s ease;
        }

        .rf-search::placeholder {
          color: #7f93a3;
        }

        .rf-search:focus {
          border-color: rgba(214,183,119,.55);
          box-shadow: 0 0 0 3px rgba(214,183,119,.07);
        }

        .rf-table-wrap {
          overflow-x: auto;
          border: 1px solid rgba(164,185,198,.13);
          border-radius: 13px;
        }

        .rf-table {
          width: 100%;
          min-width: 480px;
          border-collapse: collapse;
          font-size: 11px;
        }

        .rf-table th {
          padding: 14px 13px;
          background: rgba(4,13,23,.7);
          color: var(--gold);
          text-align: left;
          font-size: 9px;
          letter-spacing: 1.2px;
          font-weight: 700;
          white-space: nowrap;
        }

        .rf-table td {
          padding: 14px 13px;
          border-top: 1px solid rgba(164,185,198,.09);
          color: #c5d0d8;
          background: rgba(255,255,255,.008);
        }

        .rf-table tbody tr:hover td {
          background: rgba(214,183,119,.035);
        }

        .rf-person {
          color: #f0eee6;
          font-size: 11px;
          font-weight: 700;
        }

        .rf-id {
          margin-top: 5px;
          color: #8498a8;
          font-size: 10px;
        }

        .rf-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 9px;
          border: 1px solid rgba(134,198,167,.20);
          border-radius: 20px;
          background: rgba(134,198,167,.08);
          color: #a4dfbf;
          font-size: 10px;
          white-space: nowrap;
        }

        .rf-status::before {
          content: "";
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #86c6a7;
          box-shadow: 0 0 7px rgba(134,198,167,.4);
        }

        .rf-empty {
          padding: 27px 12px;
          color: #91a5b2;
          text-align: center;
        }

        .rf-notice {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          padding: 14px 16px;
          border: 1px solid rgba(134,198,167,.25);
          border-radius: 13px;
          background: rgba(56,127,94,.12);
          color: #a7e0bf;
          font-size: 11px;
        }

        .rf-footer {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding: 20px 2px 4px;
          color: #8393a0;
          font-size: 10px;
        }

        .rf-footer span {
          color: var(--gold);
        }

        /* RESPONSIVE DESIGN */

        @media (max-width: 1150px) {
          .rf-sidebar {
            width: 230px;
          }

          .rf-stats {
            grid-template-columns: repeat(2,minmax(0,1fr));
          }

          .rf-columns {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .rf-layout {
            display: block;
          }

          .rf-sidebar {
            width: 100%;
            padding: 17px 15px;
            gap: 15px;
            border-right: 0;
            border-bottom: 1px solid var(--line);
          }

          .rf-sidebar::before {
            height: 110px;
          }

          .rf-divider,
          .rf-sidebar-caption,
          .rf-profile {
            display: none;
          }

          .rf-navigation {
            display: flex;
            gap: 6px;
            overflow-x: auto;
            padding-bottom: 2px;
          }

          .rf-navigation button {
            width: auto;
            flex-shrink: 0;
            padding: 9px 11px;
            font-size: 11px;
            white-space: nowrap;
          }

          .rf-nav-icon {
            width: 23px;
            height: 23px;
          }

          .rf-main {
            padding: 22px 15px;
          }

          .rf-topbar {
            margin-bottom: 22px;
          }

          .rf-title {
            font-size: 25px;
          }

          .rf-date {
            display: none;
          }

          .rf-panel {
            padding: 16px;
            border-radius: 16px;
          }

          .rf-toolbar {
            align-items: stretch;
          }

          .rf-search {
            width: 100%;
          }
        }

        @media (max-width: 420px) {
          .rf-main {
            padding: 18px 11px;
          }

          .rf-stats {
            gap: 9px;
          }

          .rf-panel {
            padding: 13px;
          }

          .rf-stat-value {
            font-size: 22px;
          }

          .rf-stat-label {
            font-size: 10px;
          }

          .rf-stat-icon {
            width: 29px;
            height: 29px;
          }

          .rf-brand-name {
            font-size: 18px;
          }

          .rf-brand-caption {
            font-size: 7px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .rf-magic-particles span,
          .rf-arch,
          .rf-arch::before,
          .rf-arch-symbol,
          .refectory::after {
            animation: none !important;
          }

          .refectory *,
          .refectory *::before,
          .refectory *::after {
            scroll-behavior: auto !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="rf-magic-particles" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => (
          <span
            key={i}
            style={{
              left: `${(i * 37 + 11) % 100}%`,
              animationDelay: `${(i % 7) * -1.7}s`,
              animationDuration: `${9 + (i % 6) * 2}s`,
              fontSize: `${8 + (i % 4) * 3}px`,
            }}
          >
            {i % 3 === 0 ? "✧" : i % 3 === 1 ? "·" : "✦"}
          </span>
        ))}
      </div>

      <div className="rf-layout">
        <aside className="rf-sidebar">
          <div className="rf-brand">
            <div className="rf-seal">✧</div>
            <div>
              <div className="rf-brand-name">
                Mess<span>Matrix</span>
              </div>
              <div className="rf-brand-caption">
                THE REFECTORY · CAMPUS DINING
              </div>
            </div>
          </div>

          <div className="rf-divider">✦</div>

          <div className="rf-sidebar-caption">STAFF WORKSPACE</div>

          <nav className="rf-navigation">
            {[
              { label: "Overview", icon: "⌂" },
              { label: "Meal Check-in", icon: "▦" },
              { label: "Student Records", icon: "♙" },
            ].map((item) => (
              <button
                key={item.label}
                className={activeTab === item.label ? "active" : ""}
                onClick={() => {
                  setActiveTab(item.label);
                  setNotice("");
                }}
              >
                <span className="rf-nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="rf-profile">
            <div className="rf-avatar">ST</div>
            <div>
              <strong>Mess Staff</strong>
              <small>Dining Hall Team</small>
            </div>
          </div>
        </aside>

        <main className="rf-main">
          <header className="rf-topbar">
            <div>
              <div className="rf-breadcrumb">
                MessMatrix &nbsp; / &nbsp; <span>Refectory Portal</span>
              </div>

              <div className="rf-eyebrow">THE KAMAR-TAJ REFECTORY</div>

              <h1 className="rf-title">
                {activeTab === "Overview"
                  ? "Welcome, Steward"
                  : activeTab === "Meal Check-in"
                  ? "Meal Check-in"
                  : "Student Records"}
              </h1>

              <div className="rf-subtitle">
                Steward the dining hall, verify attendance, and keep
                every meal session in harmony.
              </div>
            </div>

            <div className="rf-date">
              <span>◷</span>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </header>

          {notice && (
            <div className="rf-notice">
              <span>✧</span> {notice}
            </div>
          )}

          <section className="rf-stats">
            <div className="rf-panel">
              <div className="rf-stat-top">
                <div className="rf-stat-label">Today's check-ins</div>
                <div className="rf-stat-icon jade">↗</div>
              </div>
              <div className="rf-stat-value">{checkIns.length}</div>
              <div className="rf-stat-note">Sample dashboard records</div>
            </div>

            <div className="rf-panel">
              <div className="rf-stat-top">
                <div className="rf-stat-label">Selected meal</div>
                <div className="rf-stat-icon">✺</div>
              </div>
              <div className="rf-stat-value">{mealCheckIns.length}</div>
              <div className="rf-stat-note">
                {selectedMeal} check-ins recorded
              </div>
            </div>

            <div className="rf-panel">
              <div className="rf-stat-top">
                <div className="rf-stat-label">Expected attendance</div>
                <div className="rf-stat-icon">♧</div>
              </div>
              <div className="rf-stat-value">{currentMeal.expected}</div>
              <div className="rf-stat-note">
                For {selectedMeal.toLowerCase()}
              </div>
            </div>

            <div className="rf-panel">
              <div className="rf-stat-top">
                <div className="rf-stat-label">Attendance remaining</div>
                <div className="rf-stat-icon jade">✧</div>
              </div>
              <div className="rf-stat-value">{remaining}</div>
              <div className="rf-stat-note">
                Estimated, not live inventory
              </div>
            </div>
          </section>

          {activeTab !== "Student Records" && (
            <section className="rf-columns">
              <div className="rf-panel">
                <h2 className="rf-section-title">
                  Today's meal sessions
                </h2>
                <p className="rf-section-subtitle">
                  Choose a session to view its attendance and check-in activity.
                </p>
                <div className="rf-section-ornament">✧ SESSION SCHEDULE</div>

                <div className="rf-meal-list">
                  {meals.map((meal) => {
                    const count = checkIns.filter(
                      (item) => item.meal === meal.name
                    ).length;

                    return (
                      <button
                        key={meal.name}
                        className={`rf-meal ${
                          selectedMeal === meal.name ? "selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedMeal(meal.name);
                          setNotice("");
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div className="rf-meal-name">
                            <span className="rf-meal-symbol">
                              {meal.icon}
                            </span>
                            {meal.name}
                          </div>
                          <small>{meal.time}</small>

                          <div className="rf-progress">
                            <div
                              style={{
                                width: `${Math.min(
                                  100,
                                  (count / meal.expected) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="rf-meal-count">
                          {count} / {meal.expected}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rf-panel">
                <h2 className="rf-section-title">
                  The verification chamber
                </h2>
                <p className="rf-section-subtitle">
                  Attendance station · {selectedMeal}
                </p>
                <div className="rf-section-ornament">✧ CHECK-IN STATION</div>

                <div className="rf-station">
                  <div className="rf-arch">
                    <span className="rf-arch-symbol">▦</span>
                  </div>
                  <strong>Sanctum Verification Station</strong>
                  <p>
                    The designated dining-hall check-in point.
                    QR scanning can be connected to the check-in API
                    in a later step.
                  </p>
                </div>

                <button className="rf-primary" onClick={simulateCheckIn}>
                  ✧ &nbsp; Record demo check-in
                </button>

                <p className="rf-demo-note">
                  Demo only: adds a sample student record. This does not
                  scan or verify a real QR code.
                </p>
              </div>
            </section>
          )}

          <section className="rf-panel rf-records">
            <div className="rf-toolbar">
              <div>
                <h2 className="rf-section-title">
                  {activeTab === "Student Records"
                    ? "Student records"
                    : "Recent check-ins"}
                </h2>
                <p className="rf-section-subtitle" style={{ margin: "4px 0 0" }}>
                  Search sample records by name, student ID, or meal.
                </p>
              </div>

              <input
                className="rf-search"
                placeholder="⌕  Search student or ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="rf-table-wrap">
              <table className="rf-table">
                <thead>
                  <tr>
                    <th>STUDENT</th>
                    <th>MEAL SESSION</th>
                    <th>CHECK-IN TIME</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCheckIns.length > 0 ? (
                    filteredCheckIns.map((item, index) => (
                      <tr key={`${item.id}-${index}`}>
                        <td>
                          <div className="rf-person">{item.name}</div>
                          <div className="rf-id">{item.id}</div>
                        </td>
                        <td>{item.meal}</td>
                        <td>{item.time}</td>
                        <td>
                          <span className="rf-status">{item.status}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">
                        <div className="rf-empty">
                          No matching records found.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="rf-footer">
            <div>MessMatrix · Campus Dining Management</div>
            <div>
              <span>✧</span> &nbsp; A sanctuary of thoughtful dining
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
