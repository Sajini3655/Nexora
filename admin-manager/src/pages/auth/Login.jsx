// src/pages/auth/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
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

      console.log("LOGIN USER:", user);
      console.log("LOGIN TOKEN:", localStorage.getItem("token"));

      if (!user) {
        throw new Error("Login failed. Backend did not return current user.");
      }

      const roles = getUserRoles(user);

      console.log("LOGIN ROLES:", roles);

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
      console.error("LOGIN ERROR:", err);

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
    <div className="min-h-screen grid place-items-center p-4">
      <div className="glass-card p-6 w-full" style={{ maxWidth: 420 }}>
        <h2 className="text-center text-2xl font-extrabold">Login</h2>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {debug && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {debug}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm text-slate-200">Email</label>
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
            <label className="text-sm text-slate-200">Password</label>
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

        <p className="mt-5 text-center text-sm text-slate-300">
          Don't have an account?{" "}
          <a href="/register" className="text-slate-100 underline hover:opacity-90">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
