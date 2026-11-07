
import React, { useState } from "react";

const API = "http://localhost:3000/api";

// IMPORTANT:
// Is path ko App.jsx ke actual admin dashboard route
// ke mutabiq confirm karna hai.
const ADMIN_DASHBOARD_PATH = "/admin";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

async function handleLogin(e) {
  e.preventDefault();

  if (loading) return;

  setError("");

  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    setError("Email aur password enter karein.");
    return;
  }

  if (!/^\d{6}$/.test(password)) {
    setError("Password exactly 6 digits ka hona chahiye.");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API}/admin/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: cleanEmail,
        password
      })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Admin login failed."
      );
    }

    // No localStorage token.
    // Browser securely receives the HttpOnly cookie.

    window.location.replace(ADMIN_DASHBOARD_PATH);

  } catch (err) {
    setError(
      err.message || "Unable to connect to backend."
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#07111f",
      padding: "20px",
      color: "white"
    }}>
      <form
        onSubmit={handleLogin}
        style={{
          width: "100%",
          maxWidth: "390px",
          background: "#111f32",
          border: "1px solid #263b55",
          borderRadius: "16px",
          padding: "30px",
          boxSizing: "border-box"
        }}
      >
        <h2 style={{ textAlign: "center" }}>
          TradeX Main Admin
        </h2>

        <p style={{
          textAlign: "center",
          color: "#9aacc3",
          marginBottom: "28px"
        }}>
          Secure Administrator Login
        </p>

        <label>Email Address</label>

        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter admin email"
          autoComplete="username"
          required
          style={inputStyle}
        />

        <label>6-Digit Password</label>

        <input
          type="password"
          value={password}
          onChange={e => {
            setPassword(
              e.target.value.replace(/\D/g, "").slice(0, 6)
            );
          }}
          placeholder="Enter 6-digit password"
          inputMode="numeric"
          maxLength={6}
          autoComplete="current-password"
          required
          style={inputStyle}
        />

        {error && (
          <p style={{
            color: "#ff647c",
            fontSize: "13px",
            lineHeight: 1.5
          }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            marginTop: "18px",
            background: loading ? "#34516f" : "#0874ff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Verifying..." : "Login to Admin Panel"}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "13px",
  margin: "9px 0 20px",
  background: "#091727",
  color: "white",
  border: "1px solid #344963",
  borderRadius: "8px",
  outline: "none"
};
