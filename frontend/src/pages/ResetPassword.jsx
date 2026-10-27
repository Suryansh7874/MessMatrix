import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  LockKeyhole,
  ArrowLeft,
  LoaderCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { resetPassword } from "../services/authService";
import "./ForgotPassword.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("This reset link is missing its token. Request a new reset link.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters long.");
      return;
    }

    if (newPassword.length > 72) {
      setError("Your password must be 72 characters or fewer.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match. Please check them and try again.");
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(token, newPassword);
      setMessage(response?.message || "Your password has been reset successfully.");
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reset your password. The link may have expired; request a new one and try again."
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
            <span className="mm-forgot-eyebrow">Secure Your Account</span>

            <h1>
              A stronger password for a <span>fresh start.</span>
            </h1>

            <p className="mm-forgot-brand-description">
              Choose a new password to get back to your Mess Matrix account.
              Make it unique, memorable, and difficult for others to guess.
            </p>

            <div className="mm-forgot-feature">
              <span className="mm-forgot-feature-dot" />
              Use at least 8 characters
            </div>

            <div className="mm-forgot-feature">
              <span className="mm-forgot-feature-dot" />
              Avoid reusing an old password
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
              <ShieldCheck size={29} />
            </div>

            <span className="mm-forgot-form-eyebrow">ACCOUNT SECURITY</span>
            <h2>Set new password</h2>

            <p className="mm-forgot-description">
              Enter your new password below and confirm it to finish securing
              your account.
            </p>

            {!token && (
              <p className="mm-forgot-message mm-forgot-error" role="alert">
                This reset link is missing its token. Please request a new link.
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <label className="mm-forgot-label" htmlFor="mm-new-password">
                New password
              </label>

              <div className="mm-forgot-input-wrap">
                <LockKeyhole size={18} aria-hidden="true" />
                <input
                  id="mm-new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                  disabled={loading || !token}
                />
                <button
                  type="button"
                  className="mm-reset-visibility"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <label className="mm-forgot-label mm-reset-confirm-label" htmlFor="mm-confirm-password">
                Confirm new password
              </label>

              <div className="mm-forgot-input-wrap">
                <LockKeyhole size={18} aria-hidden="true" />
                <input
                  id="mm-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Enter your password again"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                  disabled={loading || !token}
                />
                <button
                  type="button"
                  className="mm-reset-visibility"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {error && (
                <p className="mm-forgot-message mm-forgot-error" role="alert">
                  {error}
                </p>
              )}

              {message && (
                <p className="mm-forgot-message mm-forgot-success" role="status">
                  <CheckCircle2 size={17} className="mm-forgot-message-icon" aria-hidden="true" />
                  {message} Redirecting to login…
                </p>
              )}

              <button
                className="mm-forgot-submit"
                type="submit"
                disabled={loading || !token}
              >
                {loading ? (
                  <>
                    <LoaderCircle size={18} className="mm-forgot-spinner" />
                    UPDATING PASSWORD...
                  </>
                ) : (
                  <>
                    RESET PASSWORD
                    <ShieldCheck size={17} />
                  </>
                )}
              </button>
            </form>

            <Link to="/forgot-password" className="mm-forgot-back">
              <ArrowLeft size={17} />
              Request a new reset link
            </Link>

            <div className="mm-forgot-security">
              <LockKeyhole size={13} />
              Your reset link is private and time-limited
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ResetPassword;
