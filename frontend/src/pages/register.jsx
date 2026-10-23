
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in every field.");
      return;
    }

    if (formData.name.trim().length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (formData.password.length < 8 || formData.password.length > 72) {
      setError("Password must contain between 8 and 72 characters.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/register", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      const data = response.data;
      setSuccess(
        data.message || "Registration successful! You can now sign in."
      );
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error?.message ||
          err.message ||
          "Unable to register. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const filledFields = [
    formData.name,
    formData.email,
    formData.password,
    formData.confirmPassword,
  ].filter((value) => value.trim()).length;

  const progress = (filledFields / 4) * 100;

  return (
    <main className="invitation-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');

        .invitation-page,
        .invitation-page * {
          box-sizing: border-box;
        }

        .invitation-page {
          min-height: 100vh;
          width: 100%;
          position: relative;
          isolation: isolate;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 42px 20px;
          color: #f5f0e4;
          font-family: 'DM Sans', sans-serif;
          background:
            radial-gradient(
              ellipse at 12% 20%,
              rgba(65, 113, 174, 0.18),
              transparent 38%
            ),
            radial-gradient(
              ellipse at 88% 75%,
              rgba(54, 126, 157, 0.15),
              transparent 35%
            ),
            radial-gradient(
              ellipse at 50% 50%,
              rgba(201, 164, 92, 0.06),
              transparent 55%
            ),
            linear-gradient(
              135deg,
              #11120d 0%,
              #17180f 52%,
              #0d0e0a 100%
            );
        }

        .invitation-page::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          opacity: 0.17;
          background-image:
            linear-gradient(
              rgba(133, 164, 191, 0.07) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(133, 164, 191, 0.07) 1px,
              transparent 1px
            );
          background-size: 58px 58px;
          mask-image: linear-gradient(
            to bottom,
            black,
            transparent 88%
          );
        }

        .invitation-page::after {
          content: "";
          position: absolute;
          width: 520px;
          height: 520px;
          border: 1px solid rgba(105, 151, 193, 0.09);
          border-radius: 50%;
          top: -290px;
          right: -160px;
          z-index: -1;
          box-shadow:
            0 0 0 35px rgba(105, 151, 193, 0.025),
            0 0 0 75px rgba(105, 151, 193, 0.02);
          pointer-events: none;
        }

        .invitation-particles {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: -1;
          pointer-events: none;
        }

        .invitation-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #93c8ee;
          box-shadow: 0 0 12px rgba(110, 180, 235, 0.9);
          opacity: 0;
          animation: invitationFloat linear infinite;
        }

        .invitation-particle:nth-child(1) {
          left: 9%;
          bottom: 12%;
          animation-duration: 12s;
          animation-delay: -2s;
        }

        .invitation-particle:nth-child(2) {
          left: 18%;
          bottom: 28%;
          animation-duration: 16s;
          animation-delay: -8s;
        }

        .invitation-particle:nth-child(3) {
          left: 78%;
          bottom: 10%;
          animation-duration: 13s;
          animation-delay: -4s;
        }

        .invitation-particle:nth-child(4) {
          left: 88%;
          bottom: 25%;
          animation-duration: 15s;
          animation-delay: -10s;
        }

        .invitation-particle:nth-child(5) {
          left: 68%;
          bottom: 4%;
          animation-duration: 11s;
          animation-delay: -6s;
        }

        .invitation-particle:nth-child(6) {
          left: 35%;
          bottom: 5%;
          animation-duration: 14s;
          animation-delay: -3s;
        }

        .invitation-particle:nth-child(7) {
          left: 55%;
          bottom: 15%;
          animation-duration: 17s;
          animation-delay: -11s;
        }

        .invitation-particle:nth-child(8) {
          left: 95%;
          bottom: 8%;
          animation-duration: 12s;
          animation-delay: -7s;
        }

        @keyframes invitationFloat {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 0;
          }
          15% {
            opacity: 0.8;
          }
          75% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(-85vh) scale(1.25);
            opacity: 0;
          }
        }

        .invitation-layout {
          width: 100%;
          max-width: 1050px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(340px, 430px);
          align-items: center;
          gap: clamp(35px, 7vw, 90px);
          position: relative;
          z-index: 1;
        }

        .invitation-intro {
          padding: 15px 0;
          animation: invitationReveal 0.8s ease both;
        }

        .invitation-brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 54px;
        }

        .invitation-brand-mark {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          border: 1px solid rgba(122, 169, 211, 0.35);
          color: #b7d8f3;
          font-size: 22px;
          background: linear-gradient(
            145deg,
            rgba(79, 132, 182, 0.2),
            rgba(201, 164, 92, 0.08)
          );
          box-shadow: 0 0 25px rgba(76, 139, 195, 0.09);
        }

        .invitation-brand-name {
          font-size: 15px;
          letter-spacing: 0.22em;
          font-weight: 700;
          color: #f3e8cd;
        }

        .invitation-brand-subtitle {
          margin-top: 4px;
          font-size: 9px;
          letter-spacing: 0.22em;
          color: #8e9a9f;
          text-transform: uppercase;
        }

        .invitation-eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #9ec5e6;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.24em;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .invitation-eyebrow::before {
          content: "";
          width: 28px;
          height: 1px;
          background: #88b8df;
          box-shadow: 0 0 9px rgba(91, 153, 211, 0.6);
        }

        .invitation-heading {
          margin: 0;
          max-width: 520px;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(42px, 5.3vw, 66px);
          line-height: 1.1;
          font-weight: 500;
          letter-spacing: -0.045em;
          color: #f1ecdf;
        }

        .invitation-heading span {
          display: block;
          color: #a9cce9;
          font-style: italic;
          text-shadow: 0 0 35px rgba(91, 153, 211, 0.13);
        }

        .invitation-description {
          margin: 22px 0 0;
          max-width: 400px;
          font-size: 13px;
          line-height: 1.9;
          color: #9a9e97;
        }

        .invitation-features {
          display: grid;
          gap: 17px;
          margin-top: 37px;
        }

        .invitation-feature {
          display: flex;
          align-items: center;
          gap: 13px;
          color: #c4c6bd;
          font-size: 12px;
        }

        .invitation-feature-icon {
          display: grid;
          place-items: center;
          width: 31px;
          height: 31px;
          flex-shrink: 0;
          border: 1px solid rgba(118, 163, 203, 0.2);
          border-radius: 11px;
          background: rgba(77, 130, 179, 0.08);
          color: #a6c9e9;
        }

        .invitation-feature strong {
          color: #e9e4d7;
          font-weight: 500;
        }

        .invitation-form-area {
          position: relative;
          animation: invitationReveal 0.9s 0.1s ease both;
        }

        @keyframes invitationReveal {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .invitation-seal {
          height: 105px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin-bottom: -17px;
          z-index: 2;
        }

        .invitation-seal-halo {
          position: absolute;
          width: 65%;
          height: 65%;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(77, 142, 210, 0.24),
            rgba(54, 111, 164, 0.09) 45%,
            transparent 72%
          );
          filter: blur(38px);
          animation: invitationHalo 5s ease-in-out infinite alternate;
        }

        @keyframes invitationHalo {
          from {
            transform: scale(0.85);
            opacity: 0.6;
          }
          to {
            transform: scale(1.15);
            opacity: 1;
          }
        }

        .invitation-seal-ring {
          position: absolute;
          width: 79px;
          height: 79px;
          border: 1px solid rgba(201, 164, 92, 0.48);
          border-radius: 50%;
          display: grid;
          place-items: center;
          animation: invitationRotate 24s linear infinite;
        }

        .invitation-seal-ring::before,
        .invitation-seal-ring::after {
          content: "";
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #9ec5e6;
          box-shadow: 0 0 12px rgba(91, 153, 211, 0.75);
        }

        .invitation-seal-ring::before {
          top: 8px;
          left: 14px;
        }

        .invitation-seal-ring::after {
          bottom: 8px;
          right: 14px;
        }

        .invitation-seal-ring.inner {
          width: 61px;
          height: 61px;
          border-color: rgba(116, 165, 207, 0.55);
          animation-direction: reverse;
          animation-duration: 18s;
          box-shadow:
            0 0 25px rgba(201, 164, 92, 0.07),
            0 0 35px rgba(76, 139, 195, 0.10),
            inset 0 0 25px rgba(91, 153, 211, 0.05);
        }

        @keyframes invitationRotate {
          to {
            transform: rotate(360deg);
          }
        }

        .invitation-seal-symbol {
          font-family: Georgia, serif;
          font-size: 25px;
          color: #e4c98e;
          text-shadow:
            0 0 20px rgba(232, 203, 136, 0.25),
            0 0 45px rgba(91, 153, 211, 0.25);
        }

        .invitation-card {
          position: relative;
          overflow: hidden;
          padding: 34px 32px 29px;
          border: 1px solid rgba(151, 169, 169, 0.19);
          border-radius: 27px;
          background:
            radial-gradient(
              ellipse at 50% 0%,
              rgba(77, 133, 180, 0.10),
              transparent 50%
            ),
            linear-gradient(
              150deg,
              rgba(35, 37, 29, 0.97),
              rgba(22, 24, 19, 0.98) 70%
            );
          backdrop-filter: blur(20px);
          box-shadow:
            0 28px 75px rgba(0, 0, 0, 0.3),
            0 0 35px rgba(65, 113, 174, 0.08),
            inset 0 1px 0 rgba(255, 235, 185, 0.035);
          transition:
            transform 0.35s ease,
            border-color 0.35s ease,
            box-shadow 0.35s ease;
        }

        .invitation-page .invitation-card:hover {
          transform: translateY(-3px);
          border-color: rgba(117, 157, 190, 0.42);
          box-shadow:
            0 30px 80px rgba(0, 0, 0, 0.34),
            0 0 32px rgba(65, 113, 174, 0.12);
        }

        .invitation-card::before {
          content: "";
          position: absolute;
          left: 18%;
          right: 18%;
          top: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(135, 184, 224, 0.65),
            rgba(201, 164, 92, 0.55),
            transparent
          );
        }

        .invitation-card-heading {
          text-align: center;
          margin-bottom: 25px;
        }

        .invitation-card-kicker {
          margin: 0 0 9px;
          color: #a9cbe8;
          font-size: 9px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
        }

        .invitation-card-title {
          margin: 0;
          color: #f1eadb;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 30px;
          font-weight: 500;
          letter-spacing: -0.025em;
        }

        .invitation-card-description {
          margin: 9px 0 0;
          color: #969b92;
          font-size: 11px;
          line-height: 1.7;
        }

        .invitation-progress {
          margin: 0 0 23px;
        }

        .invitation-progress-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: #8e958f;
          font-size: 9px;
          margin-bottom: 8px;
          letter-spacing: 0.04em;
        }

        .invitation-progress-top span:last-child {
          color: #a9cbe8;
        }

        .invitation-progress-track {
          height: 3px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.07);
        }

        .invitation-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #527fa6, #a7cce9, #c5a66a);
          box-shadow: 0 0 12px rgba(91, 153, 211, 0.35);
          transition: width 0.35s ease;
        }

        .invitation-form {
          display: grid;
          gap: 15px;
        }

        .invitation-field {
          display: grid;
          gap: 7px;
        }

        .invitation-field label {
          color: #d2d1c6;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.045em;
        }

        .invitation-field input {
          width: 100%;
          height: 46px;
          border: 1px solid rgba(160, 171, 160, 0.17);
          border-radius: 12px;
          outline: none;
          padding: 0 14px;
          background: rgba(9, 12, 11, 0.46);
          color: #f0eee5;
          font-family: inherit;
          font-size: 12px;
          transition:
            border-color 0.25s ease,
            background 0.25s ease,
            box-shadow 0.25s ease;
        }

        .invitation-field input::placeholder {
          color: #656e6c;
        }

        .invitation-field input:hover {
          border-color: rgba(125, 161, 189, 0.35);
        }

        .invitation-field input:focus {
          border-color: rgba(117, 169, 212, 0.72);
          background: rgba(20, 31, 39, 0.55);
          box-shadow:
            0 0 0 3px rgba(91, 153, 211, 0.12),
            0 0 18px rgba(91, 153, 211, 0.07);
        }

        .invitation-message {
          border-radius: 11px;
          padding: 11px 13px;
          font-size: 11px;
          line-height: 1.6;
        }

        .invitation-error {
          color: #ffc4b9;
          background: rgba(153, 57, 43, 0.12);
          border: 1px solid rgba(224, 108, 89, 0.22);
        }

        .invitation-success {
          color: #c4e7ce;
          background: rgba(59, 131, 86, 0.12);
          border: 1px solid rgba(103, 185, 132, 0.22);
        }

        .invitation-submit {
          position: relative;
          overflow: hidden;
          width: 100%;
          height: 48px;
          margin-top: 4px;
          border: 1px solid rgba(185, 207, 221, 0.35);
          border-radius: 13px;
          color: #101712;
          background: linear-gradient(
            105deg,
            #b5cde0 0%,
            #d6c18d 52%,
            #e3d2a9 100%
          );
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          cursor: pointer;
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            filter 0.25s ease;
        }

        .invitation-submit::before {
          content: "";
          position: absolute;
          top: 0;
          left: -110%;
          width: 70%;
          height: 100%;
          transform: skewX(-22deg);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.42),
            transparent
          );
          transition: left 0.65s ease;
        }

        .invitation-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.05);
          box-shadow:
            0 8px 25px rgba(91, 153, 211, 0.16),
            0 8px 24px rgba(201, 164, 92, 0.12);
        }

        .invitation-submit:hover:not(:disabled)::before {
          left: 140%;
        }

        .invitation-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .invitation-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .invitation-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0 17px;
          color: #70776f;
          font-size: 9px;
          letter-spacing: 0.08em;
        }

        .invitation-divider::before,
        .invitation-divider::after {
          content: "";
          height: 1px;
          flex: 1;
          background: rgba(255, 255, 255, 0.08);
        }

        .invitation-login {
          margin: 0;
          text-align: center;
          color: #92978e;
          font-size: 11px;
        }

        .invitation-login a {
          margin-left: 4px;
          color: #b4d4ef;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .invitation-login a:hover {
          color: #e2c88f;
        }

        .invitation-footer {
          margin-top: 20px;
          text-align: center;
          color: #626a64;
          font-size: 9px;
          letter-spacing: 0.06em;
        }

        .invitation-footer span {
          color: #9f9d83;
        }

        @media (max-width: 800px) {
          .invitation-layout {
            max-width: 470px;
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .invitation-intro {
            text-align: center;
            padding: 0;
          }

          .invitation-brand {
            margin-bottom: 27px;
          }

          .invitation-eyebrow {
            justify-content: center;
          }

          .invitation-heading {
            max-width: 100%;
            font-size: clamp(39px, 8vw, 56px);
          }

          .invitation-description {
            margin-left: auto;
            margin-right: auto;
          }

          .invitation-features {
            display: none;
          }

          .invitation-form-area {
            margin-top: 3px;
          }

          .invitation-seal {
            height: 85px;
          }
        }

        @media (max-width: 480px) {
          .invitation-page {
            padding: 28px 14px;
          }

          .invitation-card {
            padding: 29px 21px 24px;
            border-radius: 23px;
          }

          .invitation-card-title {
            font-size: 27px;
          }

          .invitation-heading {
            font-size: 40px;
          }

          .invitation-brand {
            margin-bottom: 23px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .invitation-page *,
          .invitation-page *::before,
          .invitation-page *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="invitation-particles" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <span className="invitation-particle" key={index} />
        ))}
      </div>

      <div className="invitation-layout">
        <section className="invitation-intro">
          <div className="invitation-brand">
            <div className="invitation-brand-mark">✧</div>
            <div>
              <div className="invitation-brand-name">MESSMATRIX</div>
              <div className="invitation-brand-subtitle">
                Campus Dining, Reimagined
              </div>
            </div>
          </div>

          <div className="invitation-eyebrow">
            A smarter campus experience
          </div>

          <h1 className="invitation-heading">
            Make room for
            <span>better routines.</span>
          </h1>

          <p className="invitation-description">
            A simpler way to manage your campus meals. Join a more connected
            dining experience built around your schedule, your choices, and
            your campus community.
          </p>

          <div className="invitation-features">
            <div className="invitation-feature">
              <span className="invitation-feature-icon">✧</span>
              <span>
                <strong>Plan with ease</strong> — keep your meals organised
              </span>
            </div>

            <div className="invitation-feature">
              <span className="invitation-feature-icon">◷</span>
              <span>
                <strong>Save time</strong> — spend less time on mess routines
              </span>
            </div>

            <div className="invitation-feature">
              <span className="invitation-feature-icon">⌁</span>
              <span>
                <strong>Stay connected</strong> — dining made more convenient
              </span>
            </div>
          </div>
        </section>

        <section className="invitation-form-area">
          <div className="invitation-seal" aria-hidden="true">
            <div className="invitation-seal-halo" />
            <div className="invitation-seal-ring" />
            <div className="invitation-seal-ring inner" />
            <div className="invitation-seal-symbol">✧</div>
          </div>

          <div className="invitation-card">
            <div className="invitation-card-heading">
              <p className="invitation-card-kicker">Your campus journey</p>
              <h2 className="invitation-card-title">Create your account</h2>
              <p className="invitation-card-description">
                Set up your account and get started with MessMatrix.
              </p>
            </div>

            <div className="invitation-progress">
              <div className="invitation-progress-top">
                <span>ACCOUNT DETAILS</span>
                <span>{filledFields} OF 4 COMPLETED</span>
              </div>

              <div
                className="invitation-progress-track"
                role="progressbar"
                aria-label="Registration form completion"
                aria-valuemin={0}
                aria-valuemax={4}
                aria-valuenow={filledFields}
              >
                <div
                  className="invitation-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <form className="invitation-form" onSubmit={handleSubmit}>
              <div className="invitation-field">
                <label htmlFor="register-name">Name</label>
                <input
                  id="register-name"
                  type="text"
                  name="name"
                  placeholder="Enter your Full name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="invitation-field">
                <label htmlFor="register-email">Email address</label>
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="invitation-field">
                <label htmlFor="register-password">Password</label>
                <input
                  id="register-password"
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div className="invitation-field">
                <label htmlFor="register-confirmPassword">
                  Confirm password
                </label>
                <input
                  id="register-confirmPassword"
                  type="password"
                  name="confirmPassword"
                  placeholder="Enter your password again"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              {error && (
                <div className="invitation-message invitation-error" role="alert">
                  {error}
                </div>
              )}

              {success && (
                <div
                  className="invitation-message invitation-success"
                  role="status"
                >
                  {success}
                </div>
              )}

              <button
                className="invitation-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? "Creating your account..." : "Create account  →"}
              </button>
            </form>

            <div className="invitation-divider">ALREADY A MEMBER?</div>

            <p className="invitation-login">
              Welcome back!
              <Link to="/login">Sign in</Link>
            </p>
          </div>

          <div className="invitation-footer">
            Thoughtfully made for <span>campus life</span> ✦
          </div>
        </section>
      </div>
    </main>
  );
}
