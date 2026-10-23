
import { useEffect, useState } from "react";

export default function StudentPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedMeal, setSelectedMeal] = useState("Lunch");
  const [bookings, setBookings] = useState([]);
  const [notice, setNotice] = useState("");
  const [clock, setClock] = useState(new Date());
  const [glow, setGlow] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const meals = [
    {
      name: "Breakfast",
      time: "7:30 AM – 9:00 AM",
      icon: "☀️",
      description: "A nourishing beginning to your day.",
      color: "#e6bd78",
      menu: "Morning Harvest",
    },
    {
      name: "Lunch",
      time: "12:30 PM – 2:00 PM",
      icon: "🍱",
      description: "Restore your energy for the day ahead.",
      color: "#d9b875",
      menu: "Midday Feast",
    },
    {
      name: "Snacks",
      time: "4:30 PM – 5:30 PM",
      icon: "🥪",
      description: "A little offering for the afternoon.",
      color: "#c9a6e8",
      menu: "Afternoon Bites",
    },
    {
      name: "Dinner",
      time: "7:30 PM – 9:00 PM",
      icon: "🍲",
      description: "Gather and unwind at day's end.",
      color: "#a5d1a2",
      menu: "Evening Supper",
    },
  ];

  const today = clock.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const navItems = [
    { name: "Overview", icon: "⌂" },
    { name: "My Bookings", icon: "▤" },
    { name: "Today's Menu", icon: "☷" },
    { name: "My Activity", icon: "✧" },
  ];

  const getMeal = (name) => meals.find((meal) => meal.name === name);

  function changeTab(name) {
    setActiveTab(name);
    setNotice("");
  }

  function bookMeal(name) {
    if (bookings.includes(name)) {
      setNotice(`${name} is already reserved.`);
      return;
    }

    setBookings((previous) => [...previous, name]);
    setSelectedMeal(name);
    setGlow(true);
    setNotice(`✧ ${name} has been reserved successfully!`);
    setTimeout(() => setGlow(false), 900);
  }

  function cancelMeal(name) {
    setBookings((previous) => previous.filter((meal) => meal !== name));
    setNotice(`${name} reservation cancelled.`);
  }

  return (
    <div className="mm-student">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=IM+Fell+English:ital@0;1&display=swap');

        .mm-student, .mm-student * { box-sizing: border-box; }

        .mm-student {
          --gold: #d9b875;
          --gold-light: #f0dba7;
          --text: #f0e6d0;
          --muted: #b7ad98;
          min-height: 100vh;
          display: flex;
          isolation: isolate;
          position: relative;
          overflow: hidden;
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          background:
            radial-gradient(ellipse at 75% 0%, rgba(171,126,55,.17), transparent 35%),
            radial-gradient(ellipse at 8% 70%, rgba(73,104,74,.13), transparent 35%),
            linear-gradient(135deg, #171914, #211e17 50%, #171a15);
        }

        .mm-student button { font-family: 'DM Sans', sans-serif; }
        .mm-student button:focus-visible {
          outline: 2px solid var(--gold-light);
          outline-offset: 3px;
        }

        /* Ambient magic */
        .mm-student .mm-atmosphere {
          position: fixed;
          inset: 0;
          overflow: hidden;
          z-index: -1;
          pointer-events: none;
        }

        .mm-student .mm-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(75px);
          animation: mmOrbFloat 13s ease-in-out infinite alternate;
        }

        .mm-student .mm-orb-one {
          width: 320px;
          height: 320px;
          right: -100px;
          top: -100px;
          background: rgba(207,161,80,.17);
        }

        .mm-student .mm-orb-two {
          width: 250px;
          height: 250px;
          left: 35%;
          bottom: -130px;
          background: rgba(96,131,82,.14);
          animation-delay: -5s;
        }

        .mm-student .mm-orb-three {
          width: 180px;
          height: 180px;
          left: 15%;
          top: 35%;
          background: rgba(180,132,64,.07);
          animation-delay: -8s;
        }

        .mm-student .mm-particle {
          position: absolute;
          bottom: -20px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #f0dba7;
          box-shadow: 0 0 12px 3px rgba(217,184,117,.35);
          animation: mmRise linear infinite;
          opacity: 0;
        }

        .mm-student .mm-particle:nth-child(4) { left: 8%; animation-duration: 13s; animation-delay: -4s; }
        .mm-student .mm-particle:nth-child(5) { left: 21%; animation-duration: 17s; animation-delay: -9s; }
        .mm-student .mm-particle:nth-child(6) { left: 36%; animation-duration: 12s; animation-delay: -2s; }
        .mm-student .mm-particle:nth-child(7) { left: 49%; animation-duration: 19s; animation-delay: -13s; }
        .mm-student .mm-particle:nth-child(8) { left: 63%; animation-duration: 14s; animation-delay: -7s; }
        .mm-student .mm-particle:nth-child(9) { left: 77%; animation-duration: 16s; animation-delay: -3s; }
        .mm-student .mm-particle:nth-child(10) { left: 91%; animation-duration: 12s; animation-delay: -10s; }

        @keyframes mmRise {
          0% { transform: translateY(0) scale(.5); opacity: 0; }
          12% { opacity: .8; }
          80% { opacity: .55; }
          100% { transform: translateY(-110vh) translateX(30px) scale(1.2); opacity: 0; }
        }

        @keyframes mmOrbFloat {
          from { transform: translate(0,0) scale(1); }
          to { transform: translate(-35px,28px) scale(1.14); }
        }

        @keyframes mmAppear {
          from { opacity: 0; transform: translateY(13px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes mmFloat {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }

        @keyframes mmSpin {
          to { transform: rotate(360deg); }
        }

        @keyframes mmShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes mmPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(217,184,117,.05); }
          50% { box-shadow: 0 0 30px 3px rgba(217,184,117,.15); }
        }

        @keyframes mmSuccess {
          0% { transform: scale(1); }
          40% { transform: scale(1.025); }
          100% { transform: scale(1); }
        }

        .mm-student .mm-sidebar {
          width: 248px;
          flex: 0 0 248px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 26px 17px 20px;
          background: linear-gradient(180deg, rgba(37,37,29,.97), rgba(27,30,24,.98));
          border-right: 1px solid rgba(217,184,117,.22);
          position: relative;
          z-index: 2;
          backdrop-filter: blur(16px);
        }

        .mm-student .mm-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 7px 28px;
        }

        .mm-student .mm-brand-mark {
          width: 43px;
          height: 43px;
          flex: 0 0 43px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          color: #2c261a;
          font-size: 25px;
          background: linear-gradient(145deg, #f1dda9, #b38a49);
          box-shadow: 0 0 22px rgba(217,184,117,.16);
          animation: mmPulse 4s ease-in-out infinite;
        }

        .mm-student .mm-brand h2 {
          margin: 0;
          font: 700 17px 'Cinzel', serif;
          color: var(--gold-light);
        }

        .mm-student .mm-brand p {
          margin: 5px 0 0;
          color: #a99a7c;
          font-size: 9px;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        .mm-student .mm-nav-label {
          padding: 0 12px;
          margin-bottom: 12px;
          color: #95876d;
          font-size: 10px;
          letter-spacing: 1.8px;
          font-weight: 700;
        }

        .mm-student .mm-nav { display: grid; gap: 7px; }

        .mm-student .mm-nav button {
          display: flex;
          align-items: center;
          gap: 13px;
          width: 100%;
          padding: 13px 12px;
          border: 1px solid transparent;
          border-radius: 12px;
          background: transparent;
          color: #bbb29f;
          font-size: 12px;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          transition: background .25s, color .25s, border-color .25s, transform .25s;
        }

        .mm-student .mm-nav button:hover {
          color: #f1dfb7;
          background: rgba(217,184,117,.08);
          border-color: rgba(217,184,117,.16);
          transform: translateX(3px);
        }

        .mm-student .mm-nav button.active {
          color: #f1dba5;
          background: linear-gradient(100deg, rgba(192,151,78,.2), rgba(192,151,78,.045));
          border-color: rgba(217,184,117,.25);
          box-shadow: inset 3px 0 var(--gold), 0 0 20px rgba(217,184,117,.04);
        }

        .mm-student .mm-nav-icon {
          width: 23px;
          text-align: center;
          color: var(--gold);
          font-size: 19px;
        }

        .mm-student .mm-sidebar-bottom {
          margin-top: auto;
          padding: 18px;
          border: 1px solid rgba(217,184,117,.22);
          border-radius: 15px;
          background: radial-gradient(circle at 100% 0, rgba(217,184,117,.12), transparent 65%), #25271f;
        }

        .mm-student .mm-sidebar-bottom span {
          color: var(--gold-light);
          font: 600 10px 'Cinzel', serif;
          letter-spacing: .8px;
        }

        .mm-student .mm-sidebar-bottom p {
          margin: 10px 0 0;
          color: #c0b59d;
          font: italic 14px/1.7 'IM Fell English', serif;
        }

        .mm-student .mm-main {
          flex: 1;
          min-width: 0;
          padding: 28px clamp(18px, 3.5vw, 44px) 32px;
          position: relative;
          z-index: 1;
        }

        .mm-student .mm-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 34px;
        }

        .mm-student .mm-breadcrumb { color: #a89d88; font-size: 12px; }
        .mm-student .mm-breadcrumb strong { color: #e7d4aa; font-weight: 600; }

        .mm-student .mm-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 13px 6px 6px;
          border: 1px solid rgba(217,184,117,.22);
          border-radius: 30px;
          background: rgba(41,40,30,.8);
          transition: border-color .25s, box-shadow .25s;
        }

        .mm-student .mm-profile:hover {
          border-color: rgba(217,184,117,.55);
          box-shadow: 0 0 20px rgba(217,184,117,.07);
        }

        .mm-student .mm-avatar {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: linear-gradient(145deg, #f0dba7, #b88c49);
          color: #302719;
          font: 700 16px 'Cinzel', serif;
        }

        .mm-student .mm-profile strong { display: block; color: #f1e4c9; font-size: 12px; }
        .mm-student .mm-profile small { display: block; margin-top: 3px; color: #a99d86; font-size: 10px; }

        .mm-student .mm-heading {
          margin-bottom: 25px;
          animation: mmAppear .5s ease both;
        }

        .mm-student .mm-eyebrow {
          color: var(--gold);
          font: 600 10px 'Cinzel', serif;
          letter-spacing: 2px;
        }

        .mm-student .mm-heading h1 {
          margin: 12px 0 8px;
          color: #f0e5ce;
          font: 600 clamp(27px, 3.3vw, 39px)/1.25 'Cinzel', serif;
          overflow-wrap: anywhere;
        }

        .mm-student .mm-heading h1 span { color: var(--gold); }

        .mm-student .mm-heading p {
          margin: 0;
          color: #b8ad98;
          font: 15px/1.8 'IM Fell English', serif;
        }

        .mm-student .mm-hero {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 23px;
          padding: clamp(22px, 3vw, 30px);
          border: 1px solid rgba(217,184,117,.3);
          border-radius: 19px;
          background: radial-gradient(ellipse at 90% 0%, rgba(190,146,67,.18), transparent 45%), linear-gradient(120deg, #333025, #24291f);
          box-shadow: 0 12px 32px rgba(0,0,0,.14);
          animation: mmAppear .55s .08s ease both;
          transition: border-color .3s, box-shadow .3s;
        }

        .mm-student .mm-hero:hover {
          border-color: rgba(217,184,117,.55);
          box-shadow: 0 15px 40px rgba(0,0,0,.2), 0 0 25px rgba(217,184,117,.04);
        }

        .mm-student .mm-hero::after {
          content: "✧";
          position: absolute;
          right: 145px;
          top: -65px;
          color: rgba(217,184,117,.09);
          font-size: 205px;
          pointer-events: none;
          animation: mmSpin 70s linear infinite;
        }

        .mm-student .mm-hero-copy { position: relative; z-index: 1; min-width: 0; }
        .mm-student .mm-date { margin-bottom: 12px; color: #d9bf86; font-size: 11px; letter-spacing: .7px; }

        .mm-student .mm-hero h2 {
          margin: 0 0 9px;
          color: #f0e1c1;
          font: 600 21px 'Cinzel', serif;
        }

        .mm-student .mm-hero p {
          max-width: 490px;
          margin: 0 0 19px;
          color: #c4b9a2;
          font: 15px/1.8 'IM Fell English', serif;
        }

        .mm-student .mm-hero-art {
          flex: 0 0 108px;
          width: 108px;
          height: 108px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(217,184,117,.4);
          outline: 1px solid rgba(217,184,117,.14);
          outline-offset: 6px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(217,184,117,.2), rgba(35,38,29,.65));
          font-size: 46px;
          animation: mmFloat 4s ease-in-out infinite;
          box-shadow: 0 0 35px rgba(217,184,117,.09);
        }

        .mm-student .mm-primary,
        .mm-student .mm-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 39px;
          padding: 10px 15px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: background .2s, transform .2s, border-color .2s, box-shadow .2s;
        }

        .mm-student .mm-primary {
          color: #2b2519;
          background: linear-gradient(110deg, #f0dca9, #c49b59, #f0dca9);
          background-size: 200% auto;
          border: 1px solid #e4c88d;
          box-shadow: 0 4px 16px rgba(190,146,67,.1);
        }

        .mm-student .mm-primary:hover {
          background-position: right center;
          transform: translateY(-2px);
          box-shadow: 0 7px 22px rgba(190,146,67,.2);
        }

        .mm-student .mm-secondary {
          color: #e7d09e;
          background: rgba(217,184,117,.055);
          border: 1px solid rgba(217,184,117,.29);
        }

        .mm-student .mm-secondary:hover {
          background: rgba(217,184,117,.13);
          border-color: rgba(217,184,117,.5);
          transform: translateY(-1px);
        }

        .mm-student .mm-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 28px 0 15px;
        }

        .mm-student .mm-section-head h2 {
          margin: 0;
          color: #eee1c5;
          font: 600 16px 'Cinzel', serif;
        }

        .mm-student .mm-section-head p {
          margin: 6px 0 0;
          color: #ac9f88;
          font: 14px/1.6 'IM Fell English', serif;
        }

        .mm-student .mm-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          animation: mmAppear .5s .14s ease both;
        }

        .mm-student .mm-stat,
        .mm-student .mm-panel,
        .mm-student .mm-meal {
          min-width: 0;
          border: 1px solid rgba(217,184,117,.19);
          border-radius: 16px;
          background: linear-gradient(145deg, rgba(48,46,35,.92), rgba(31,35,28,.95));
          box-shadow: 0 9px 25px rgba(0,0,0,.11);
          transition: border-color .25s, background .25s, transform .25s, box-shadow .25s;
          backdrop-filter: blur(8px);
        }

        .mm-student .mm-stat:hover,
        .mm-student .mm-panel:hover,
        .mm-student .mm-meal:hover {
          border-color: rgba(217,184,117,.45);
          transform: translateY(-3px);
          box-shadow: 0 14px 30px rgba(0,0,0,.17), 0 0 18px rgba(217,184,117,.035);
        }

        .mm-student .mm-stat { padding: 19px; }
        .mm-student .mm-stat-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .mm-student .mm-stat-label { color: #c1b59e; font-size: 11px; }

        .mm-student .mm-stat-icon {
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(217,184,117,.17);
          border-radius: 11px;
          background: rgba(217,184,117,.07);
          font-size: 17px;
          transition: transform .3s, background .3s;
        }

        .mm-student .mm-stat:hover .mm-stat-icon { transform: rotate(-8deg) scale(1.08); background: rgba(217,184,117,.14); }

        .mm-student .mm-stat h3 {
          margin: 14px 0 5px;
          color: #f0dca9;
          font: 600 27px 'Cinzel', serif;
          animation: mmAppear .45s ease both;
        }

        .mm-student .mm-stat p { margin: 0; color: #a99d87; font: 13px/1.6 'IM Fell English', serif; }

        .mm-student .mm-meals {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 13px;
        }

        .mm-student .mm-meal {
          position: relative;
          overflow: hidden;
          padding: 18px;
          animation: mmAppear .45s ease both;
        }

        .mm-student .mm-meal::before {
          content: "";
          position: absolute;
          width: 110px;
          height: 110px;
          top: -65px;
          right: -65px;
          border-radius: 50%;
          background: rgba(217,184,117,.07);
          transition: transform .4s, background .4s;
          pointer-events: none;
        }

        .mm-student .mm-meal:hover::before { transform: scale(1.8); background: rgba(217,184,117,.1); }

        .mm-student .mm-meal.selected {
          border-color: rgba(217,184,117,.48);
          background: linear-gradient(145deg, rgba(91,72,39,.35), rgba(31,35,28,.96));
        }

        .mm-student .mm-meal-icon {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          margin-bottom: 15px;
          border: 1px solid rgba(217,184,117,.2);
          border-radius: 12px;
          background: rgba(217,184,117,.065);
          font-size: 23px;
          transition: transform .3s, box-shadow .3s;
        }

        .mm-student .mm-meal:hover .mm-meal-icon {
          transform: translateY(-3px) rotate(-5deg);
          box-shadow: 0 5px 17px rgba(217,184,117,.1);
        }

        .mm-student .mm-meal h3 { margin: 0 0 7px; color: #eee1c4; font: 600 13px 'Cinzel', serif; }
        .mm-student .mm-meal p { min-height: 40px; margin: 0 0 12px; color: #b5a991; font: 13px/1.6 'IM Fell English', serif; }
        .mm-student .mm-meal time { display: block; margin-bottom: 14px; color: #d7bd84; font-size: 10px; }

        .mm-student .mm-meal button {
          width: 100%;
          min-height: 37px;
          padding: 9px 7px;
          border: 1px solid rgba(217,184,117,.3);
          border-radius: 9px;
          background: rgba(217,184,117,.06);
          color: #e8d19e;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: background .2s, transform .2s, border-color .2s;
        }

        .mm-student .mm-meal button:hover:not(:disabled) {
          background: rgba(217,184,117,.16);
          border-color: rgba(217,184,117,.65);
          transform: translateY(-1px);
        }

        .mm-student .mm-meal button:disabled {
          color: #b8c8a9;
          background: rgba(104,131,85,.1);
          border-color: rgba(149,179,130,.22);
        }

        .mm-student .mm-lower-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
          gap: 15px;
          margin-top: 24px;
          animation: mmAppear .45s ease both;
        }

        .mm-student .mm-panel { padding: 21px; }
        .mm-student .mm-panel h3 { margin: 0; color: #eee1c5; font: 600 15px 'Cinzel', serif; }
        .mm-student .mm-subtitle { margin: 7px 0 15px; color: #ad9f87; font: 14px/1.7 'IM Fell English', serif; }

        .mm-student .mm-booking-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(217,184,117,.12);
          animation: mmAppear .3s ease both;
        }

        .mm-student .mm-booking-row:last-child { border-bottom: 0; padding-bottom: 0; }
        .mm-student .mm-booking-left { display: flex; align-items: center; gap: 11px; min-width: 0; }

        .mm-student .mm-booking-emoji {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(217,184,117,.18);
          border-radius: 11px;
          background: rgba(217,184,117,.06);
          font-size: 19px;
        }

        .mm-student .mm-booking-left strong { display: block; color: #e9dec6; font-size: 12px; }
        .mm-student .mm-booking-left small { display: block; margin-top: 5px; color: #ab9f88; font-size: 10px; }
        .mm-student .mm-status { flex-shrink: 0; color: #d8bd83; font-size: 10px; }

        .mm-student .mm-cancel {
          flex-shrink: 0;
          padding: 8px 10px;
          border: 1px solid rgba(204,125,94,.3);
          border-radius: 8px;
          background: rgba(204,125,94,.06);
          color: #e4aa91;
          font-size: 10px;
          cursor: pointer;
          transition: background .2s;
        }

        .mm-student .mm-cancel:hover { background: rgba(204,125,94,.15); }
        .mm-student .mm-empty { padding: 23px 6px; color: #b5a991; text-align: center; font: 14px/1.8 'IM Fell English', serif; }

        .mm-student .mm-points-card {
          padding: 20px;
          border: 1px solid rgba(217,184,117,.28);
          border-radius: 13px;
          background: radial-gradient(circle at 100% 0, rgba(217,184,117,.13), transparent 55%), linear-gradient(135deg, #403927, #292d23);
          transition: border-color .3s, box-shadow .3s;
        }

        .mm-student .mm-points-card:hover {
          border-color: rgba(217,184,117,.5);
          box-shadow: 0 0 22px rgba(217,184,117,.06);
        }

        .mm-student .mm-points-card span { color: #dfc68e; font: 600 10px 'Cinzel', serif; letter-spacing: .7px; }
        .mm-student .mm-points-card h2 { margin: 12px 0 6px; color: #f0dba7; font: 600 32px 'Cinzel', serif; }
        .mm-student .mm-points-card p { margin: 0; color: #c7b99d; font: 14px/1.7 'IM Fell English', serif; }
        .mm-student .mm-note { margin: 13px 0 0; color: #a99d87; font: 12px/1.8 'IM Fell English', serif; }

        .mm-student .mm-footer {
          margin-top: 29px;
          color: #9d927b;
          font: italic 13px 'IM Fell English', serif;
          text-align: center;
        }

        .mm-student .mm-notice {
          position: fixed;
          z-index: 10;
          right: 22px;
          bottom: 22px;
          max-width: calc(100vw - 36px);
          padding: 14px 19px;
          border: 1px solid #e2c78d;
          border-radius: 12px;
          background: linear-gradient(110deg, #f0dfb7, #dfc58d);
          color: #302819;
          box-shadow: 0 8px 30px rgba(0,0,0,.35), 0 0 22px rgba(217,184,117,.13);
          font-size: 12px;
          font-weight: 700;
          animation: mmAppear .25s ease both;
        }

        .mm-student .mm-celebrate { animation: mmSuccess .45s ease; }

        @media (max-width: 1100px) {
          .mm-student .mm-sidebar { width: 220px; flex-basis: 220px; }
          .mm-student .mm-meals { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 760px) {
          .mm-student { display: block; }
          .mm-student .mm-sidebar {
            width: 100%;
            min-height: auto;
            padding: 16px 14px;
            border-right: 0;
            border-bottom: 1px solid rgba(217,184,117,.22);
          }
          .mm-student .mm-brand { padding-bottom: 16px; }
          .mm-student .mm-nav-label, .mm-student .mm-sidebar-bottom { display: none; }
          .mm-student .mm-nav { display: flex; overflow-x: auto; gap: 6px; padding-bottom: 3px; }
          .mm-student .mm-nav button { width: auto; flex-shrink: 0; white-space: nowrap; padding: 10px 12px; }
          .mm-student .mm-main { padding: 21px 16px 30px; }
          .mm-student .mm-topbar { margin-bottom: 27px; }
          .mm-student .mm-stats { grid-template-columns: 1fr; }
          .mm-student .mm-stat { padding: 15px 17px; }
          .mm-student .mm-stat h3 { margin: 9px 0 4px; }
          .mm-student .mm-lower-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 430px) {
          .mm-student .mm-profile { gap: 7px; padding-right: 8px; }
          .mm-student .mm-profile small { display: none; }
          .mm-student .mm-hero-art { display: none; }
          .mm-student .mm-meals { grid-template-columns: 1fr; }
          .mm-student .mm-meal { padding: 17px; }
          .mm-student .mm-panel { padding: 16px; }
          .mm-student .mm-section-head { align-items: flex-start; }
          .mm-student .mm-notice { right: 12px; bottom: 12px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .mm-student *, .mm-student *::before, .mm-student *::after {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <div className="mm-atmosphere" aria-hidden="true">
        <div className="mm-orb mm-orb-one" />
        <div className="mm-orb mm-orb-two" />
        <div className="mm-orb mm-orb-three" />
        {Array.from({ length: 7 }, (_, index) => (
          <div className="mm-particle" key={index} />
        ))}
      </div>

      <aside className="mm-sidebar">
        <div className="mm-brand">
          <div className="mm-brand-mark">✳</div>
          <div>
            <h2>MessMatrix</h2>
            <p>Refectory of Kamar-Taj</p>
          </div>
        </div>

        <div className="mm-nav-label">STUDENT PORTAL</div>

        <nav className="mm-nav">
          {navItems.map((item) => (
            <button
              key={item.name}
              className={activeTab === item.name ? "active" : ""}
              onClick={() => changeTab(item.name)}
            >
              <span className="mm-nav-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="mm-sidebar-bottom">
          <span>✧ THE WAY OF BALANCE</span>
          <p>
            Nourish the body, honour every harvest, and leave no
            offering wasted.
          </p>
        </div>
      </aside>

      <main className="mm-main">
        <header className="mm-topbar">
          <div className="mm-breadcrumb">
            MessMatrix / <strong>{activeTab}</strong>
          </div>

          <div className="mm-profile">
            <div className="mm-avatar">S</div>
            <div>
              <strong>Student</strong>
              <small>{clock.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}</small>
            </div>
          </div>
        </header>

        <section className="mm-heading" key={activeTab}>
          <div className="mm-eyebrow">✧ YOUR PLACE AT THE TABLE ✧</div>
          <h1>
            {activeTab === "Overview" ? (
              <>A feast for <span>the soul.</span></>
            ) : (
              <>{activeTab}<span>.</span></>
            )}
          </h1>
          <p>
            Within these ancient halls, every meal has a purpose.
            Plan your day and dine with intention.
          </p>
        </section>

        {activeTab === "Overview" && (
          <>
            <section className={`mm-hero ${glow ? "mm-celebrate" : ""}`}>
              <div className="mm-hero-copy">
                <div className="mm-date">✧ {today} ✧</div>
                <h2>Welcome to the Refectory.</h2>
                <p>
                  The day's offerings await. Reserve your meals in
                  advance and help the kitchen prepare thoughtfully.
                </p>
                <button
                  className="mm-primary"
                  onClick={() => changeTab("Today's Menu")}
                >
                  Explore today's menu <span>→</span>
                </button>
              </div>
              <div className="mm-hero-art">🍜</div>
            </section>

            <section className="mm-stats">
              <div className="mm-stat">
                <div className="mm-stat-top">
                  <span className="mm-stat-label">Today's reservations</span>
                  <span className="mm-stat-icon">▤</span>
                </div>
                <h3>{bookings.length}</h3>
                <p>Meals reserved for today</p>
              </div>

              <div className="mm-stat">
                <div className="mm-stat-top">
                  <span className="mm-stat-label">Available meal types</span>
                  <span className="mm-stat-icon">🍽️</span>
                </div>
                <h3>{meals.length - bookings.length}</h3>
                <p>Meal types not yet reserved</p>
              </div>

              <div className="mm-stat">
                <div className="mm-stat-top">
                  <span className="mm-stat-label">Refectory points</span>
                  <span className="mm-stat-icon">✧</span>
                </div>
                <h3>120</h3>
                <p>Illustrative demo balance</p>
              </div>
            </section>

            <div className="mm-section-head">
              <div>
                <h2>Today's offerings</h2>
                <p>Choose the meals you wish to reserve.</p>
              </div>
              <button
                className="mm-secondary"
                onClick={() => changeTab("Today's Menu")}
              >
                View all →
              </button>
            </div>

            <section className="mm-meals">
              {meals.map((meal, index) => (
                <article
                  key={meal.name}
                  style={{ animationDelay: `${index * 90}ms` }}
                  className={`mm-meal ${selectedMeal === meal.name ? "selected" : ""}`}
                >
                  <div className="mm-meal-icon" style={{ color: meal.color }}>
                    {meal.icon}
                  </div>
                  <h3>{meal.name}</h3>
                  <p>{meal.description}</p>
                  <time>{meal.time}</time>
                  <button
                    disabled={bookings.includes(meal.name)}
                    onClick={() => bookMeal(meal.name)}
                  >
                    {bookings.includes(meal.name) ? "✓ Reserved" : "Reserve meal"}
                  </button>
                </article>
              ))}
            </section>
          </>
        )}

        {activeTab === "Today's Menu" && (
          <>
            <div className="mm-section-head">
              <div>
                <h2>The daily menu</h2>
                <p>
                  Sample meal slots and timings. Actual dishes can be
                  connected to mess data later.
                </p>
              </div>
            </div>

            <section className="mm-meals">
              {meals.map((meal, index) => (
                <article
                  key={meal.name}
                  style={{ animationDelay: `${index * 90}ms` }}
                  className={`mm-meal ${selectedMeal === meal.name ? "selected" : ""}`}
                >
                  <div className="mm-meal-icon" style={{ color: meal.color }}>
                    {meal.icon}
                  </div>
                  <h3>{meal.name}</h3>
                  <p>{meal.description}</p>
                  <time>{meal.time}</time>
                  <button
                    disabled={bookings.includes(meal.name)}
                    onClick={() => bookMeal(meal.name)}
                  >
                    {bookings.includes(meal.name) ? "✓ Reserved" : "Reserve meal"}
                  </button>
                </article>
              ))}
            </section>
          </>
        )}

        {activeTab === "My Bookings" && (
          <section className="mm-panel">
            <h3>Your reservations</h3>
            <p className="mm-subtitle">
              Your place at the table, thoughtfully arranged.
            </p>

            {bookings.length === 0 ? (
              <div className="mm-empty">
                <div style={{ fontSize: 30 }}>🍽️</div>
                No reservations yet. Visit Today's Menu to reserve a meal.
              </div>
            ) : (
              bookings.map((name) => {
                const meal = getMeal(name);
                return (
                  <div className="mm-booking-row" key={name}>
                    <div className="mm-booking-left">
                      <div className="mm-booking-emoji">{meal.icon}</div>
                      <div>
                        <strong>{name}</strong>
                        <small>{meal.time}</small>
                      </div>
                    </div>
                    <button
                      className="mm-cancel"
                      onClick={() => cancelMeal(name)}
                    >
                      Cancel
                    </button>
                  </div>
                );
              })
            )}
          </section>
        )}

        {activeTab === "My Activity" && (
          <section className="mm-lower-grid">
            <div className="mm-panel">
              <h3>Dining chronicles</h3>
              <p className="mm-subtitle">
                Reservations recorded during this demo session.
              </p>

              {bookings.length === 0 ? (
                <div className="mm-empty">
                  Your chronicles begin when you reserve your first meal.
                </div>
              ) : (
                [...bookings].reverse().map((name) => {
                  const meal = getMeal(name);
                  return (
                    <div className="mm-booking-row" key={name}>
                      <div className="mm-booking-left">
                        <div className="mm-booking-emoji">{meal.icon}</div>
                        <div>
                          <strong>{name} reserved</strong>
                          <small>{meal.time}</small>
                        </div>
                      </div>
                      <span className="mm-status">Demo</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mm-panel">
              <h3>Your dining points</h3>
              <p className="mm-subtitle">
                A preview of the future Refectory reward system.
              </p>

              <div className="mm-points-card">
                <span>ILLUSTRATIVE POINT BALANCE</span>
                <h2>120 ✧</h2>
                <p>Sample balance, not connected to a real account.</p>
              </div>

              <p className="mm-note">
                Actual points and rebate rules must be calculated and
                verified by the backend.
              </p>
            </div>
          </section>
        )}

        {activeTab === "Overview" && (
          <section className="mm-lower-grid">
            <div className="mm-panel">
              <h3>Your upcoming meals</h3>
              <p className="mm-subtitle">
                The meals you have reserved for today.
              </p>

              {bookings.length === 0 ? (
                <div className="mm-empty">
                  Your table awaits. Reserve a meal to begin.
                </div>
              ) : (
                bookings.map((name) => {
                  const meal = getMeal(name);
                  return (
                    <div className="mm-booking-row" key={name}>
                      <div className="mm-booking-left">
                        <div className="mm-booking-emoji">{meal.icon}</div>
                        <div>
                          <strong>{name}</strong>
                          <small>{meal.time}</small>
                        </div>
                      </div>
                      <span className="mm-status">Reserved</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mm-panel">
              <h3>Honour the harvest.</h3>
              <p className="mm-subtitle">
                A mindful meal is a meaningful contribution.
              </p>

              <div className="mm-points-card">
                <span>YOUR DINING PRINCIPLE</span>
                <h2>🌿</h2>
                <p>
                  Reserve responsibly and cancel within the permitted
                  cutoff to help the kitchen prepare the right quantity.
                </p>
              </div>

              <p className="mm-note">
                Cutoff times and impact statistics are illustrative
                until connected to actual mess data.
              </p>
            </div>
          </section>
        )}

        <footer className="mm-footer">
          ✧ MessMatrix · The Kamar-Taj Refectory · Nourish with intention ✧
        </footer>
      </main>

      {notice && (
        <div className="mm-notice" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}
