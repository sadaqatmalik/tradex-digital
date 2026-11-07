
import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
// PASSWORD FIELD - KEEP OUTSIDE TwoFactorSettings
function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  visible,
  toggle,
  autoComplete,
  inputStyle
}) {
  return (
    <div className="cd-field" style={{ marginBottom: 14 }}>
      <label>{label}</label>

      <div style={{ position: "relative" }}>
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            ...inputStyle,
            paddingRight: 65
          }}
        />

        <button
          type="button"
          onClick={toggle}
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            color: "#65b7ff",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600
          }}
        >
          {visible ? "HIDE" : "SHOW"}
        </button>
      </div>
    </div>
  );
}
export default function TwoFactorSettings() {
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [enabled, setEnabled] = useState(false);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [activeSetting, setActiveSetting] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [confirmWithdrawPassword, setConfirmWithdrawPassword] = useState("");

  const [newEmail, setNewEmail] = useState("");

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showConfirmLogin, setShowConfirmLogin] = useState(false);
  const [showWithdrawPassword, setShowWithdrawPassword] = useState(false);
  const [showConfirmWithdraw, setShowConfirmWithdraw] = useState(false);

  // LOAD 2FA STATUS
  async function loadStatus() {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) throw error;

      const verified = data?.totp?.find(
        factor => factor.status === "verified"
      );

      setEnabled(Boolean(verified));
      setFactorId(verified?.id || "");
    } catch (err) {
      setError(err.message || "Unable to load security status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  // START 2FA
  async function startSetup() {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "TradeX Authenticator"
      });

      if (error) throw error;

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);

      setMessage("Scan the QR code using your authenticator app.");
    } catch (err) {
      setError(err.message || "Unable to start 2FA setup.");
    } finally {
      setBusy(false);
    }
  }

  // VERIFY 2FA
  async function verifySetup() {
    if (!/^\d{6}$/.test(verifyCode)) {
      setError("Enter a valid 6-digit verification code.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) throw challengeError;

      const { error: verifyError } =
        await supabase.auth.mfa.verify({
          factorId,
          challengeId: challenge.id,
          code: verifyCode
        });

      if (verifyError) throw verifyError;

      setQrCode("");
      setVerifyCode("");
      setMessage("Two-Step Verification enabled successfully.");

      await loadStatus();
    } catch (err) {
      setError(err.message || "Authenticator verification failed.");
    } finally {
      setBusy(false);
    }
  }

  // DISABLE 2FA
  async function disableTwoFactor() {
    if (!factorId) return;

    const code = window.prompt(
      "Enter your current 6-digit authenticator code:"
    );

    if (!code || !/^\d{6}$/.test(code)) {
      setError("A valid 6-digit code is required.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) throw challengeError;

      const { error: verifyError } =
        await supabase.auth.mfa.verify({
          factorId,
          challengeId: challenge.id,
          code
        });

      if (verifyError) throw verifyError;

      const { error: removeError } =
        await supabase.auth.mfa.unenroll({ factorId });

      if (removeError) throw removeError;

      setMessage("Two-Step Verification disabled successfully.");
      await loadStatus();
    } catch (err) {
      setError(err.message || "Unable to disable 2FA.");
    } finally {
      setBusy(false);
    }
  }

  // UPDATE LOGIN PASSWORD
  async function updateLoginPassword() {
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("Login password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Login passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      setActiveSetting("");

      setMessage("Login password updated successfully.");
    } catch (err) {
      setError(err.message || "Password update failed.");
    } finally {
      setBusy(false);
    }
  }

  // UPDATE WITHDRAWAL PASSWORD
  async function updateWithdrawPassword() {
    setError("");
    setMessage("");

    if (!/^[A-Za-z0-9]{6,32}$/.test(withdrawPassword)) {
      setError("Use 6 to 32 letters and numbers for withdrawal password.");
      return;
    }

    if (withdrawPassword !== confirmWithdrawPassword) {
      setError("Withdrawal passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const { data, error } = await supabase.rpc(
        "set_withdrawal_password",
        { p_password: withdrawPassword }
      );

      if (error) throw error;

      if (data !== true) {
        throw new Error("Withdrawal password could not be saved.");
      }

      setWithdrawPassword("");
      setConfirmWithdrawPassword("");
      setActiveSetting("");

      setShowWithdrawPassword(false);
      setShowConfirmWithdraw(false);

      setMessage("Withdrawal password saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save withdrawal password.");
    } finally {
      setBusy(false);
    }
  }

  // UPDATE EMAIL
  async function updateEmailAddress() {
    setError("");
    setMessage("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.updateUser(
        { email: newEmail.trim() },
        { emailRedirectTo: window.location.origin }
      );

      if (error) throw error;

      setNewEmail("");
      setActiveSetting("");

      setMessage(
        "Email change requested. Check your email for confirmation."
      );
    } catch (err) {
      setError(err.message || "Email update failed.");
    } finally {
      setBusy(false);
    }
  }

  // SETTINGS LINK
  function SettingsLink({ icon, title, desc, open, onClick }) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          padding: "15px 13px",
          marginTop: 10,
          textAlign: "left",
          color: "#ffffff",
          background: open ? "#142d49" : "#0b1b30",
          border: "1px solid #263c55",
          borderRadius: 11,
          cursor: "pointer"
        }}
      >
        <span style={{ fontSize: 23, marginRight: 12 }}>
          {icon}
        </span>

        <span style={{ flex: 1 }}>
          <strong style={{ display: "block", fontSize: 14 }}>
            {title}
          </strong>

          <small style={{ color: "#a1b2c6", display: "block", marginTop: 4 }}>
            {desc}
          </small>
        </span>

        <span style={{ color: "#a1b2c6", fontSize: 20 }}>
          {open ? "−" : "+"}
        </span>
      </button>
    );
  }

  // INPUT STYLE
  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    borderRadius: 9,
    border: "1px solid #344b65",
    background: "#071426",
    color: "#ffffff",
    outline: "none",
    fontSize: 14
  };


  return (
    <div style={{ width: "100%", color: "#ffffff" }}>

      {/* SECURITY HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10
        }}
      >
        <div>
          <strong style={{ fontSize: 16 }}>
            🛡️ Two-Step Verification
          </strong>

          <div className="cd-muted" style={{ marginTop: 5 }}>
            Secure your account with an authenticator app.
          </div>
        </div>

        <span
          style={{
            padding: "6px 11px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            background: enabled ? "#103b2c" : "#40321a",
            color: enabled ? "#19c784" : "#f0b90b"
          }}
        >
          {loading ? "LOADING" : enabled ? "ENABLED" : "DISABLED"}
        </span>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div
          role="alert"
          style={{
            color: "#ff8993",
            background: "#351b29",
            border: "1px solid #713444",
            padding: 12,
            borderRadius: 9,
            marginTop: 15,
            fontSize: 13
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {message && (
        <div
          role="status"
          style={{
            color: "#72e3b4",
            background: "#102d29",
            border: "1px solid #245044",
            padding: 12,
            borderRadius: 9,
            marginTop: 15,
            fontSize: 13
          }}
        >
          ✓ {message}
        </div>
      )}

      {/* 2FA SETUP BUTTON */}
      {!loading && !enabled && !qrCode && (
        <button
          type="button"
          className="cd-btn"
          onClick={startSetup}
          disabled={busy}
          style={{ width: "100%", marginTop: 16 }}
        >
          {busy ? "Please wait..." : "＋ Set Up Authenticator"}
        </button>
      )}

      {/* QR CODE */}
      {qrCode && (
        <div
          style={{
            marginTop: 18,
            padding: 16,
            background: "#0b1b30",
            border: "1px solid #263c55",
            borderRadius: 12,
            textAlign: "center"
          }}
        >
          <strong>Scan QR Code</strong>

          <p className="cd-muted" style={{ marginTop: 8, fontSize: 13 }}>
            Open Google Authenticator or Microsoft Authenticator and scan this code.
          </p>

          <img
            src={qrCode}
            alt="Authenticator QR Code"
            style={{
              width: 190,
              maxWidth: "100%",
              background: "#ffffff",
              padding: 10,
              borderRadius: 10,
              marginTop: 10
            }}
          />

          <div className="cd-field" style={{ marginTop: 15 }}>
            <label>6-Digit Verification Code</label>

            <input
              type="text"
              value={verifyCode}
              onChange={e =>
                setVerifyCode(
                  e.target.value.replace(/\D/g, "").slice(0, 6)
                )
              }
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              style={inputStyle}
            />
          </div>

          <button
            type="button"
            className="cd-btn"
            onClick={verifySetup}
            disabled={busy || verifyCode.length !== 6}
            style={{ width: "100%" }}
          >
            {busy ? "Verifying..." : "Verify & Enable 2FA"}
          </button>
        </div>
      )}

      {/* DISABLE 2FA */}
      {!loading && enabled && (
        <button
          type="button"
          className="cd-btn"
          onClick={disableTwoFactor}
          disabled={busy}
          style={{
            width: "100%",
            marginTop: 15,
            background: "#8f2938"
          }}
        >
          {busy ? "Please wait..." : "Disable Two-Step Verification"}
        </button>
      )}

      {/* OTHER SETTINGS */}
      <div
        style={{
          borderTop: "1px solid #263c55",
          marginTop: 24,
          paddingTop: 18
        }}
      >
        <strong style={{ fontSize: 16 }}>
          ⚙️ Other Security Settings
        </strong>

        <p className="cd-muted" style={{ fontSize: 12, marginTop: 5 }}>
          Manage your login, withdrawal and email security.
        </p>

        {/* LOGIN PASSWORD */}
        <SettingsLink
          icon="🔑"
          title="Change Login Password"
          desc="Update your account login password"
          open={activeSetting === "password"}
          onClick={() => {
            setError("");
            setMessage("");
            setActiveSetting(activeSetting === "password" ? "" : "password");
          }}
        />

        {activeSetting === "password" && (
          <div
            style={{
              marginTop: 12,
              padding: 15,
              background: "#0b1b30",
              border: "1px solid #263c55",
              borderRadius: 11
            }}
          >
            <PasswordField
              label="New Login Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              visible={showLoginPassword}
              toggle={() => setShowLoginPassword(!showLoginPassword)}
              autoComplete="new-password"
            />

            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              visible={showConfirmLogin}
              toggle={() => setShowConfirmLogin(!showConfirmLogin)}
              autoComplete="new-password"
            />

            <p className="cd-muted" style={{ fontSize: 12, marginBottom: 12 }}>
              Login password must contain at least 8 characters.
            </p>

            <button
              type="button"
              className="cd-btn"
              disabled={busy}
              onClick={updateLoginPassword}
              style={{ width: "100%" }}
            >
              {busy ? "Updating..." : "Update Login Password"}
            </button>
          </div>
        )}

        {/* WITHDRAWAL PASSWORD */}
        <SettingsLink
          icon="🔒"
          title="Change Withdrawal Password"
          desc="Protect withdrawals with a separate password"
          open={activeSetting === "withdraw"}
          onClick={() => {
            setError("");
            setMessage("");
            setActiveSetting(activeSetting === "withdraw" ? "" : "withdraw");
          }}
        />

        {activeSetting === "withdraw" && (
          <div
            style={{
              marginTop: 12,
              padding: 15,
              background: "#0b1b30",
              border: "1px solid #263c55",
              borderRadius: 11
            }}
          >
            <PasswordField
              label="New Withdrawal Password"
              value={withdrawPassword}
              onChange={e => setWithdrawPassword(e.target.value)}
              placeholder="Example: TRX789"
              visible={showWithdrawPassword}
              toggle={() => setShowWithdrawPassword(!showWithdrawPassword)}
              autoComplete="new-password"
            />

            <PasswordField
              label="Confirm Withdrawal Password"
              value={confirmWithdrawPassword}
              onChange={e => setConfirmWithdrawPassword(e.target.value)}
              placeholder="Confirm withdrawal password"
              visible={showConfirmWithdraw}
              toggle={() => setShowConfirmWithdraw(!showConfirmWithdraw)}
              autoComplete="new-password"
            />

            <p className="cd-muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
              Use 6 to 32 letters and numbers. Examples: 123456, TRX789 or ABC12345.
            </p>

            <button
              type="button"
              className="cd-btn"
              disabled={busy}
              onClick={updateWithdrawPassword}
              style={{ width: "100%", marginTop: 10 }}
            >
              {busy ? "Saving..." : "Save Withdrawal Password"}
            </button>
          </div>
        )}

        {/* EMAIL ADDRESS */}
        <SettingsLink
          icon="✉️"
          title="Update Email Address"
          desc="Change your registered email address"
          open={activeSetting === "email"}
          onClick={() => {
            setError("");
            setMessage("");
            setActiveSetting(activeSetting === "email" ? "" : "email");
          }}
        />

        {activeSetting === "email" && (
          <div
            style={{
              marginTop: 12,
              padding: 15,
              background: "#0b1b30",
              border: "1px solid #263c55",
              borderRadius: 11
            }}
          >
            <div className="cd-field">
              <label>New Email Address</label>

              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
                autoComplete="email"
                style={inputStyle}
              />
            </div>

            <button
              type="button"
              className="cd-btn"
              disabled={busy}
              onClick={updateEmailAddress}
              style={{ width: "100%", marginTop: 10 }}
            >
              {busy ? "Updating..." : "Update Email Address"}
            </button>

            <p className="cd-muted" style={{ marginTop: 10, fontSize: 12 }}>
              You may need to confirm the new email through your inbox.
            </p>
          </div>
        )}
      </div>

    
    </div>
  );
}
