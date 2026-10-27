import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  LockKeyhole,
  ArrowLeft,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";
import { forgotPassword } from "../services/authService";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await forgotPassword(email.trim().toLowerCase());
      setMessage(
        response?.message ||
          "If an active account exists for this email, a reset link will be sent."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to process your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mm-forgot-page">
      <div className="mm-forgot-layout">
        <section className="mm-forgot-brand">
          <div className="mm-forgot-logo">
            <div className="mm-forgot-logo-icon">
              <LockKeyhole size={23} />
            </div>
            <span>Mess Matrix</span>
          </div>

          <div className="mm-forgot-brand-content">
            <span className="mm-forgot-eyebrow">Account Recovery</span>

            <h1>
              A fresh start begins with a <span>secure account.</span>
            </h1>

            <p className="mm-forgot-brand-description">
              Forgot your password? No worries. Recover access to your
              Mess Matrix account with a secure link sent to your
              registered email address.
            </p>

            <div className="mm-forgot-feature">
              <span className="mm-forgot-feature-dot" />
              Secure, single-use reset links
            </div>

            <div className="mm-forgot-feature">
              <span className="mm-forgot-feature-dot" />
              Reset links expire after 10 minutes
            </div>
          </div>

          <div className="mm-forgot-brand-footer">
            © {new Date().getFullYear()} Mess Matrix · Built for better campus dining.
          </div>
        </section>

        <section className="mm-forgot-form-panel">
          <div className="mm-forgot-form">
            <div className="mm-forgot-mobile-logo">
              <div className="mm-forgot-logo-icon">
                <LockKeyhole size={20} />
              </div>
              <span>Mess Matrix</span>
            </div>

            <div className="mm-forgot-icon">
              <Mail size={29} />
            </div>

            <span className="mm-forgot-form-eyebrow">PASSWORD ASSISTANCE</span>
            <h2>Forgot password?</h2>

            <p className="mm-forgot-description">
              Enter the email linked to your account. If it matches an
              active account, we’ll send you a password reset link.
            </p>

            <form onSubmit={handleSubmit}>
              <label className="mm-forgot-label" htmlFor="mm-reset-email">
                Registered email address
              </label>

              <div className="mm-forgot-input-wrap">
                <Mail size={19} aria-hidden="true" />
                <input
                  id="mm-reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  maxLength={254}
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="mm-forgot-message mm-forgot-error" role="alert">
                  {error}
                </p>
              )}

              {message && (
                <p className="mm-forgot-message mm-forgot-success" role="status">
                  <CheckCircle2
                    size={17}
                    aria-hidden="true"
                    className="mm-forgot-message-icon"
                  />
                  {message}
                </p>
              )}

              <button
                className="mm-forgot-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoaderCircle size={18} className="mm-forgot-spinner" />
                    SENDING RESET LINK...
                  </>
                ) : (
                  <>
                    SEND RESET LINK
                    <Mail size={17} />
                  </>
                )}
              </button>
            </form>

            <Link to="/login" className="mm-forgot-back">
              <ArrowLeft size={17} />
              Back to Login
            </Link>

            <div className="mm-forgot-security">
              <LockKeyhole size={13} />
              Secure password recovery
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ForgotPassword;
