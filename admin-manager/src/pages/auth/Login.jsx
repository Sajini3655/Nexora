// src/pages/auth/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login({ email, password });

      if (!user) throw new Error("Login failed");

      // Redirect based on role
      const role = user.role.toUpperCase();
      if (role === "ADMIN") navigate("/admin");
      else if (role === "MANAGER") navigate("/manager");
      else if (role === "DEVELOPER") navigate("/dev");
      else navigate("/login");
    } catch (err) {
      setError(err.message || "Login failed");
      console.error(err);
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
