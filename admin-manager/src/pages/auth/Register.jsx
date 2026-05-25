import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/constants";

const API_BASE = API_BASE_URL;

export default function Register() {
  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get("token") || "").trim();
  }, []);

  const [loadingInvite, setLoadingInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInvite = async () => {
      try {
        setError("");
        setLoadingInvite(true);

        if (!token) {
          throw new Error("Missing invite token");
        }

        const response = await axios.get(`${API_BASE}/api/auth/accept-invite`, {
          params: { token }
        });

        setEmail(response.data.email || "");
        setName(response.data.name || "");
        setRole(response.data.role || "");
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Invalid or expired token";
        setError(message);
      } finally {
        setLoadingInvite(false);
      }
    };

    loadInvite();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setSuccess("");

      if (!token) {
        throw new Error("Missing invite token");
      }

      if (!password || password.trim().length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      setSubmitting(true);

      const response = await axios.post(
        `${API_BASE}/api/auth/accept-invite`,
        {
          token,
          password: password.trim()
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      setSuccess(response.data?.message || "Account activated successfully.");

      setTimeout(() => {
        window.location.href = "/login";
      }, 1200);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--nx-bg)",
        padding: 24
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          borderRadius: 28,
          background: "var(--nx-card)",
          border: "1px solid var(--nx-border)",
          boxShadow: "var(--nx-shadow)",
          padding: 32,
          color: "var(--nx-text)"
        }}
      >
        <h1 style={{ margin: 0, marginBottom: 8, fontSize: 42, fontWeight: 800 }}>
          Complete Registration
        </h1>

        {error && (
          <div
            style={{
              marginTop: 18,
              marginBottom: 18,
              padding: "16px 18px",
              borderRadius: 18,
              background: "color-mix(in srgb, var(--nx-red) 20%, transparent)",
              border: "1px solid color-mix(in srgb, var(--nx-red) 30%, transparent)",
              color: "var(--nx-text)"
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              marginTop: 18,
              marginBottom: 18,
              padding: "16px 18px",
              borderRadius: 18,
              background: "color-mix(in srgb, var(--nx-green) 20%, transparent)",
              border: "1px solid color-mix(in srgb, var(--nx-green) 30%, transparent)",
              color: "var(--nx-text)"
            }}
          >
            {success}
          </div>
        )}

        {loadingInvite ? (
          <div style={{ padding: "24px 0", opacity: 0.85 }}>Loading invite...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, opacity: 0.85 }}>
                Full Name
              </label>
              <input value={name} disabled style={inputStyle(true)} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, opacity: 0.85 }}>
                Email
              </label>
              <input value={email} disabled style={inputStyle(true)} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, opacity: 0.85 }}>
                Role
              </label>
              <input value={role} disabled style={inputStyle(true)} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, opacity: 0.85 }}>
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle(false)}
                placeholder="Enter new password"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 8, opacity: 0.85 }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputStyle(false)}
                placeholder="Confirm password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !!error}
              style={{
                width: "100%",
                border: 0,
                borderRadius: 18,
                padding: "16px 20px",
                fontSize: 22,
                fontWeight: 800,
                color: "#fff",
                cursor: submitting ? "not-allowed" : "pointer",
                background: "linear-gradient(90deg, #7c5cff 0%, #8f6bff 100%)",
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? "Registering..." : "Set Password & Register"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function inputStyle(disabled) {
  return {
    width: "100%",
    boxSizing: "border-box",
    padding: "18px 20px",
    borderRadius: 999,
    border: "1px solid var(--nx-border)",
    background: disabled ? "var(--nx-panel)" : "var(--nx-input)",
    color: "var(--nx-text)",
    fontSize: 18,
    outline: "none"
  };
}
