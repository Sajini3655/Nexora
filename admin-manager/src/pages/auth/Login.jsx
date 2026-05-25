// src/pages/auth/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import { useAuth } from "../../context/AuthContext.jsx";
import { useThemeMode } from "../../context/ThemeContext.jsx";
import {
  getDefaultPath,
  getDefaultRole,
  getUserRoles,
  setActiveRole,
  shouldChooseWorkspace,
} from "../../utils/roleRouting";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { mode, toggleColorScheme } = useThemeMode();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [debug, setDebug] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setDebug("");
    setLoading(true);

    try {
      const user = await login({ email, password });

      if (!user) {
        throw new Error("Login failed. Backend did not return current user.");
      }

      const roles = getUserRoles(user);

      if (!roles.length) {
        throw new Error("Login succeeded, but this user has no role.");
      }

      if (shouldChooseWorkspace(user)) {
        localStorage.removeItem("activeRole");
        setDebug("Login successful. Opening workspace selector...");
        navigate("/choose-workspace", { replace: true });
        return;
      }

      const role = getDefaultRole(user);
      const path = getDefaultPath(user);

      setActiveRole(role);
      setDebug(`Login successful. Opening ${role} workspace...`);
      navigate(path, { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nx-app-shell min-h-screen grid place-items-center p-4">
      <div className="nx-card p-6 w-full" style={{ maxWidth: 420 }}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="nx-muted text-sm font-semibold">Nexora</p>
            <h2 className="text-2xl font-extrabold">Login</h2>
          </div>

          <IconButton
            onClick={() => toggleColorScheme(mode === "dark" ? "light" : "dark")}
            aria-label="Toggle color scheme"
            title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            sx={{
              width: 42,
              height: 42,
              color: "var(--nx-text)",
              border: "1px solid var(--nx-border)",
              background: "var(--nx-panel-2)",
              "&:hover": {
                background: "var(--nx-card)",
                borderColor: "var(--nx-border-strong)",
              },
            }}
          >
            {mode === "dark" ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
          </IconButton>
        </div>

        {error && (
          <div className="nx-inner-panel mt-4 px-4 py-3 text-sm" style={{ color: "var(--nx-red)" }}>
            {error}
          </div>
        )}

        {debug && (
          <div className="nx-inner-panel mt-4 px-4 py-3 text-sm" style={{ color: "var(--nx-green)" }}>
            {debug}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm" style={{ color: "var(--nx-text-soft)" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input mt-1"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm" style={{ color: "var(--nx-text-soft)" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input mt-1"
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

      </div>
    </div>
  );
}

