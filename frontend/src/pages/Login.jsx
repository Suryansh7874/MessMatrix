
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
const particles = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 11) % 100}%`,
  delay: `${-((i * 7) % 16)}s`,
  duration: `${8 + (i % 9)}s`,
  size: `${2 + (i % 3)}px`,
}));

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap');

* {
  box-sizing: border-box;
}

.sanctum {
  min-height: 100vh;
  isolation: isolate;
  overflow: hidden;
  position: relative;
  color: #f4efe5;
  background:
    radial-gradient(ellipse at 20% 42%, #173b3c 0%, transparent 38%),
    radial-gradient(ellipse at 85% 75%, #342819 0%, transparent 36%),
    linear-gradient(135deg, #080d13, #11171c 55%, #090d12);
  font-family: 'Manrope', sans-serif;
}

.sanctum button,
.sanctum input {
  font: inherit;
}

.sanctum button {
  -webkit-tap-highlight-color: transparent;
}

.sanctum-header {
  min-height: 86px;
  padding: 20px 6%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #d9b87922;
  position: relative;
  z-index: 2;
}

.brand {
  display: flex;
  align-items: center;
  gap: 13px;
  color: inherit;
  text-decoration: none;
}

.brand-seal {
  width: 43px;
  height: 43px;
  display: grid;
  place-items: center;
  color: #f5dfaa;
  border: 1px solid #d9b87999;
  border-radius: 50%;
  font-size: 28px;
  box-shadow: 0 0 24px #d9b87918, inset 0 0 12px #d9b87915;
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  font: 600 16px 'Cinzel', serif;
  letter-spacing: 3px;
}

.brand small {
  margin-top: 5px;
  font-size: 9px;
  color: #d9b879;
  letter-spacing: 2px;
}

.header-status {
  color: #b7c6be;
  font-size: 10px;
  letter-spacing: 2px;
}

.header-status i {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 7px;
  background: #55d8ca;
  border-radius: 50%;
  box-shadow: 0 0 10px #55d8ca;
  animation: sanctum-pulse 2s infinite;
}

.particle-field {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.particle {
  position: absolute;
  bottom: -12px;
  border-radius: 50%;
  background: #f5dfaa;
  box-shadow: 0 0 9px #d9b879;
  opacity: 0;
  animation: sanctum-rise linear infinite;
}

@keyframes sanctum-rise {
  0% {
    transform: translateY(0) scale(.5);
    opacity: 0;
  }
  15% {
    opacity: .8;
  }
  75% {
    opacity: .45;
  }
  100% {
    transform: translateY(-105vh) scale(1.3);
    opacity: 0;
  }
}

@keyframes sanctum-pulse {
  50% {
    opacity: .45;
    box-shadow: 0 0 2px #55d8ca;
  }
}

@keyframes sanctum-rotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes sanctum-breathe {
  50% {
    filter: brightness(1.25);
    transform: scale(1.025);
  }
}

@keyframes sanctum-light {
  from {
    opacity: .55;
    transform: scale(.94);
  }
  to {
    opacity: 1;
    transform: scale(1.04);
  }
}

@keyframes sanctum-float {
  50% {
    transform: translateY(-12px) rotate(12deg);
    opacity: .9;
  }
}

.login-layout {
  width: min(1240px, 92%);
  min-height: calc(100vh - 145px);
  margin: 0 auto;
  padding: 32px 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: clamp(30px, 6vw, 100px);
}

.portal-side {
  min-height: 580px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.portal {
  position: relative;
  width: clamp(210px, 25vw, 325px);
  aspect-ratio: 1;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: radial-gradient(circle, #52d9cb12 20%, transparent 68%);
  box-shadow: 0 0 65px #35cabe0c;
  animation: sanctum-breathe 5s ease-in-out infinite;
}

.portal::before,
.portal::after {
  content: '';
  position: absolute;
  inset: 8%;
  border: 1px solid #d9b87988;
  border-radius: 50%;
}

.portal::before {
  border-style: dashed;
  animation: sanctum-rotate 65s linear infinite;
}

.portal::after {
  inset: -5%;
  border: 2px solid #55d8ca3d;
  box-shadow: 0 0 35px #55d8ca10;
}

.orbit {
  position: absolute;
  width: 80%;
  aspect-ratio: 1;
  border: 1px solid #d9b87928;
  border-radius: 50%;
  pointer-events: none;
}

.orbit-one {
  transform: scaleY(.34) rotate(-25deg);
}

.orbit-two {
  transform: scaleY(.34) rotate(25deg);
}

.orbit-three {
  transform: scale(.8) rotate(45deg);
  border-style: dotted;
}

.portal-core {
  position: absolute;
  inset: 14%;
  border-radius: 50%;
  overflow: hidden;
  background: radial-gradient(ellipse, #2b888064, #102e32 60%, #0b141b);
  border: 1px solid #55d8ca85;
  box-shadow: 0 0 32px #55d8ca27, inset 0 0 36px #55d8ca27;
}

.portal-arch {
  position: absolute;
  width: 61%;
  height: 82%;
  left: 19.5%;
  bottom: -2%;
  overflow: hidden;
  border: 3px solid #d9b879a8;
  border-bottom: 0;
  border-radius: 50% 50% 0 0;
}

.portal-light {
  position: absolute;
  inset: 12% 8% 0;
  border-radius: 50% 50% 0 0;
  background: linear-gradient(180deg, #5ee5d277, #183d40 65%, #0b171d);
  animation: sanctum-light 4s ease-in-out infinite alternate;
}

.portal-caption {
  position: relative;
  max-width: 390px;
  text-align: center;
  margin-top: 32px;
}

.eyebrow {
  color: #d9b879;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 3px;
}

.portal-caption h1 {
  font: 500 clamp(28px, 3vw, 42px)/1.35 'Cinzel', serif;
  margin: 12px 0;
}

.portal-caption p {
  max-width: 340px;
  margin: 0 auto;
  color: #a9b1b2;
  font-size: 12px;
  line-height: 1.9;
}

.rune {
  position: absolute;
  color: #d9b879;
  opacity: .55;
  font-size: 22px;
  animation: sanctum-float 5s ease-in-out infinite;
}

.rune-a {
  top: 15%;
  left: 17%;
}

.rune-b {
  top: 30%;
  right: 10%;
  animation-delay: -2s;
}

.rune-c {
  bottom: 28%;
  left: 12%;
  animation-delay: -3s;
}

.form-side {
  width: 100%;
  max-width: 470px;
  justify-self: center;
}

/* Compact login card */
.login-card {
  padding: 30px 30px 26px;
  border: 1px solid rgba(110, 205, 194, 0.25);
  border-radius: 28px;
  background: rgba(12, 22, 35, 0.76);
  backdrop-filter: blur(22px);
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.38),
    0 0 35px rgba(65, 190, 176, 0.08);
  transition:
    transform 0.35s ease,
    border-color 0.35s ease,
    box-shadow 0.35s ease;
  animation: softEntrance 0.8s ease-out both;
}

@keyframes softEntrance {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.login-card:hover {
  transform: translateY(-4px);
  border-color: rgba(110, 205, 194, 0.5);
  box-shadow:
    0 30px 90px rgba(0, 0, 0, 0.44),
    0 0 45px rgba(65, 190, 176, 0.13);
}

.login-card input {
  border: 1px solid rgba(164, 184, 201, 0.18);
  border-radius: 14px;
  background: rgba(5, 13, 24, 0.55);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.login-card input:focus {
  outline: none;
  border-color: #69cfc1;
  box-shadow: 0 0 0 4px rgba(105, 207, 193, 0.12);
}

.login-card button {
  border-radius: 14px;
  transition: transform 0.2s ease, filter 0.2s ease;
}

.login-card button:hover {
  filter: brightness(1.12);
}

.login-card button:active {
  transform: scale(0.98);
}

.card-emblem {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid #d9b8797a;
  border-radius: 50%;
  color: #f5dfaa;
  font-size: 20px;
  margin-bottom: 20px;
}

.login-card h2 {
  font: 500 clamp(23px, 2.4vw, 29px) 'Cinzel', serif;
  margin: 10px 0 6px;
}

.card-subtitle {
  color: #a2a7ac;
  font-size: 11px;
  margin: 0 0 24px;
}

.login-card form > label,
.password-heading label {
  display: block;
  color: #c8c7bf;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.7px;
  margin-bottom: 8px;
}

/* Smaller inner input boxes */
.input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #ffffff1a;
  background: #080d12a8;
  margin-bottom: 18px;
  transition: border-color .25s, box-shadow .25s;
}

.input-wrap:focus-within {
  border-color: #55d8ca;
  box-shadow: 0 0 0 3px #55d8ca12, 0 0 22px #55d8ca0c;
}

.input-icon {
  color: #d9b879;
  font-size: 16px;
  flex-shrink: 0;
}

.input-wrap input {
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  color: #e9e6dfff;
  background: transparent;
  border: 0;
  outline: 0;
  font-size: 11px;
}

.input-wrap input:focus {
  border: 0;
  box-shadow: none;
}

.input-wrap input::placeholder {
  color: #737b80;
  opacity: 0.7;
}

.password-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.password-heading label {
  margin-bottom: 8px;
}

.text-link {
  border: 0;
  background: transparent;
  color: #d9b879;
  font-size: 10px;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
}

.text-link:hover {
  color: #f5dfaa;
  text-decoration: underline;
}

.eye-button {
  border: 0;
  color: #9aa6a7;
  background: transparent;
  font-size: 9px;
  letter-spacing: 1px;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.remember-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #b0b5b5;
  font-size: 11px;
  cursor: pointer;
  position: relative;
  margin: 0 0 20px;
}

.remember-row input {
  position: absolute;
  width: 17px;
  height: 17px;
  opacity: 0;
}

.custom-check {
  width: 17px;
  height: 17px;
  border: 1px solid #6d7778;
  display: grid;
  place-items: center;
  font-size: 11px;
  color: #101713;
  flex-shrink: 0;
}

.remember-row input:checked + .custom-check {
  background: #d9b879;
  border-color: #d9b879;
}

.remember-row input:focus-visible + .custom-check {
  outline: 2px solid #55d8ca;
  outline-offset: 3px;
}

/* Button resized to match the compact inputs */
.enter-button {
  width: 100%;
  min-height: 46px;
  padding: 0 15px;
  border: 1px solid #f1d79d;
  background: linear-gradient(110deg, #b38a4c, #e0c38a 52%, #b38a4c);
  background-size: 200% 100%;
  color: #171710;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.2px;
  transition: background-position .4s, box-shadow .3s, transform .3s;
}

.enter-button > span:first-child {
  min-width: 0;
}

.enter-button:hover:not(:disabled) {
  background-position: 100% 0;
  box-shadow: 0 0 28px #d9b87936;
  transform: translateY(-2px);
}

.enter-button:active:not(:disabled) {
  transform: translateY(0);
}

.enter-button:disabled {
  opacity: .7;
  cursor: wait;
}

.button-arrow {
  font-size: 17px;
  flex-shrink: 0;
  transition: transform .25s;
}

.enter-button:hover .button-arrow {
  transform: translate(3px, -3px);
}

.login-message {
  min-height: 16px;
  margin: 10px 0 0;
  color: #55d8ca;
  font-size: 10px;
  line-height: 1.6;
}

.card-footer {
  border-top: 1px solid #ffffff12;
  margin-top: 18px;
  padding-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.card-footer > span {
  color: #828a8c;
  font-size: 9px;
  letter-spacing: 1px;
}

.invitation-link {
  font-size: 10px;
}

.bottom-note {
  text-align: center;
  color: #9c9b8c;
  font-size: 9px;
  letter-spacing: 2px;
  margin-top: 22px;
}

.sanctum-footer {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 6%;
  border-top: 1px solid #d9b87915;
  color: #727d7e;
  font-size: 9px;
  letter-spacing: 1.5px;
}

@media (max-width: 760px) {
  .sanctum-header {
    padding: 18px 5%;
  }

  .brand strong {
    font-size: 13px;
  }

  .brand small {
    font-size: 8px;
    letter-spacing: 1px;
  }

  .header-status {
    font-size: 8px;
    letter-spacing: 1px;
  }

  .login-layout {
    width: min(500px, 90%);
    grid-template-columns: 1fr;
    gap: 28px;
    padding: 24px 0 34px;
  }

  .portal-side {
    min-height: auto;
  }

  .portal {
    width: 180px;
  }

  .portal-caption {
    margin-top: 18px;
  }

  .portal-caption h1 {
    font-size: 26px;
  }

  .portal-caption p {
    max-width: 300px;
    font-size: 11px;
  }

  .rune-a {
    top: 10%;
    left: 10%;
  }

  .rune-b {
    top: 20%;
    right: 8%;
  }

  .rune-c {
    bottom: 25%;
    left: 7%;
  }

  .form-side {
    max-width: 460px;
  }

  .login-card {
    padding: 26px 22px 22px;
  }

  .sanctum-footer {
    font-size: 8px;
  }
}

@media (max-width: 380px) {
  .header-status {
    display: none;
  }

  .login-card {
    padding: 24px 18px 20px;
  }

  .card-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .text-link {
    white-space: normal;
  }

  .enter-button {
    letter-spacing: 1px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-card {
    animation: none;
    transition: none;
  }

  .sanctum *,
  .sanctum *::before,
  .sanctum *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: .01ms !important;
  }
}
`;

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setMessage("");
  }

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");

    if (!formData.email.trim() || !formData.password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email: formData.email.trim(),
        password: formData.password,
      });

      const { token, user } = response.data;
      if (!token) {
        throw new Error("The server did not return an authentication token.");
      }

      const storage = remember ? localStorage : sessionStorage;
      const otherStorage = remember ? sessionStorage : localStorage;
      storage.setItem("token", token);
      if (user) storage.setItem("user", JSON.stringify(user));
      else storage.removeItem("user");
      otherStorage.removeItem("token");
      otherStorage.removeItem("user");

      // App.jsx currently has no dashboard route, so return to the landing page.
      const dashboardPaths = {
  STUDENT: "/student",
  MESS_STAFF: "/staff",
  MESS_ADMIN: "/mess-admin",
};

const destination = dashboardPaths[user?.role] || "/";

navigate(destination, { replace: true });
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="sanctum">
      <style>{styles}</style>

      <div className="particle-field" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              width: p.size,
              height: p.size,
            }}
          />
        ))}
      </div>

      <header className="sanctum-header">
        <a
          className="brand"
          href="/"
          aria-label="Kamar-Taj Refectory home"
        >
          <span className="brand-seal">✧</span>
          <span>
            <strong>MessMatrix</strong>
            <small>REFECTORY · THE SANCTUM TABLE</small>
          </span>
        </a>

        <span className="header-status">
          <i /> SANCTUM ONLINE
        </span>
      </header>

      <section className="login-layout">
        <div className="portal-side">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />

          <div className="portal" aria-hidden="true">
            <div className="portal-core">
              <div className="portal-arch">
                <div className="portal-light" />
              </div>
            </div>
          </div>

          <div className="portal-caption">
            <span className="eyebrow">
              BEYOND THE ORDINARY
            </span>
            <h1>
              Every table
              <br />
              has a story.
            </h1>
            <p>
              Step through the sanctum. Your next chapter begins
              where good food meets a little magic.
            </p>
          </div>

          <span className="rune rune-a" aria-hidden="true">
            ᛟ
          </span>
          <span className="rune rune-b" aria-hidden="true">
            ✳
          </span>
          <span className="rune rune-c" aria-hidden="true">
            ⌘
          </span>
        </div>

        <div className="form-side">
          <div className="login-card">
            <div className="card-emblem">✧</div>

            <div className="eyebrow">
              YOUR INVITATION AWAITS
            </div>

            <h2>Welcome back.</h2>

            <p className="card-subtitle">
              Your next meal starts here.
            </p>

            <form onSubmit={handleLogin}>
              <label htmlFor="sanctum-id">
                SANCTUM ID
              </label>

              <div className="input-wrap">
                <span className="input-icon" aria-hidden="true">
                  ✧
                </span>

                <input
                  id="sanctum-id"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="username"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="password-heading">
                <label htmlFor="passcode">
                  PASSCODE
                </label>

                <button
                  className="text-link"
                  type="button"
                  onClick={() =>
                    setMessage(
                      "Password recovery will be added later."
                    )
                  }
                >
                  Forgot passcode?
                </button>
              </div>

              <div className="input-wrap">
                <span className="input-icon" aria-hidden="true">
                  ⌑
                </span>

                <input
                  id="passcode"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your passcode"
                  autoComplete="current-password"
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <button
                  className="eye-button"
                  type="button"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>

              <label className="remember-row">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) =>
                    setRemember(event.target.checked)
                  }
                />

                <span className="custom-check">✓</span>
                Remember this device
              </label>

              <button
                className="enter-button"
                type="submit"
                disabled={loading}
              >
                <span>
                  {loading
                    ? "OPENING THE PORTAL..."
                    : "ENTER THE REFECTORY"}
                </span>

                <span className="button-arrow">↗</span>
              </button>

              <p
                className="login-message"
                aria-live="polite"
              >
                {message}
              </p>
            </form>

            <div className="card-footer">
              <span>NEW TO THE SANCTUM?</span>

              <Link className="text-link invitation-link" to="/register">
                Request an invitation ↗
              </Link>
            </div>
          </div>

          <p className="bottom-note">
            ✧ &nbsp; YOUR SEAT IS WAITING &nbsp; ✧
          </p>
        </div>
      </section>

      <footer className="sanctum-footer">
        <span>AN EXTRAORDINARY PLACE TO GATHER</span>
        <span>✦ &nbsp; EST. IN MYSTERY &nbsp; ✦</span>
      </footer>
    </main>
  );
}
