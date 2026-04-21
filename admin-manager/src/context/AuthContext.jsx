import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import useApi from "../hooks/useApi.jsx";
import { normalizeRole } from "../utils/permissions";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const api = useApi();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load current user if token exists
  async function loadMe() {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const res = await api.get("/auth/me");
      const me = res.data;
      const normalizedUser = { ...me, role: normalizeRole(me.role) };
      setUser(normalizedUser);
      return normalizedUser;
    } catch (err) {
      console.warn("loadMe failed, clearing token", err);
      localStorage.removeItem("token");
      setUser(null);
      return null;
    }
  }

  async function login({ email, password }) {
    const res = await api.post("/auth/login", { email, password });
    const { token } = res.data;
    if (!token) throw new Error("No token received");
    localStorage.setItem("token", token);
    return await loadMe();
  }

  // Register function for normal registration (if needed)
  async function register({ name, email, password, role }) {
    const res = await api.post("/auth/register", { name, email, password, role });
    const { token } = res.data;
    if (!token) throw new Error("No token received on registration");
    localStorage.setItem("token", token);
    return await loadMe();
  }

  // ✅ Accept invite function for token-based registration
  async function acceptInvite(token, password) {
    const res = await api.post("/auth/accept-invite", null, {
      params: { token, password },
    });
    // Optionally, login automatically if your backend returns a token
    // localStorage.setItem("token", res.data.token);
    return res.data;
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadMe();
      setLoading(false);
    })();
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, register, acceptInvite, refresh: loadMe }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
