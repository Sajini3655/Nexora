import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import useApi from "../hooks/useApi.jsx";
import { normalizeRole, normalizeRoles } from "../utils/permissions";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const api = useApi();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moduleAccess, setModuleAccess] = useState(null);
  const [accessLoading, setAccessLoading] = useState(false);

  // Load current user if token exists
  async function loadMe() {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setModuleAccess(null);
      setAccessLoading(false);
      return null;
    }

    try {
      setAccessLoading(true);
      const res = await api.get("/auth/me");
      const me = res.data;
      const mergedRoles = Array.from(
        new Set([
          normalizeRole(me.role),
          ...normalizeRoles(me.roles || []),
        ].filter(Boolean))
      );

      const normalizedUser = {
        ...me,
        role: normalizeRole(me.role),
        roles: mergedRoles,
      };
      setUser(normalizedUser);

      try {
        const accessRes = await api.get("/access/me");
        setModuleAccess(accessRes.data ?? {});
      } catch (accessErr) {
        console.warn("load access failed", accessErr);
        setModuleAccess({});
      } finally {
        setAccessLoading(false);
      }

      localStorage.setItem("user", JSON.stringify(normalizedUser));
      return normalizedUser;
    } catch (err) {
      console.warn("loadMe failed, clearing token", err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setModuleAccess(null);
      setAccessLoading(false);
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
    localStorage.removeItem("user");
    setUser(null);
    setModuleAccess(null);
    setAccessLoading(false);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadMe();
      setLoading(false);
    })();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      moduleAccess,
      accessLoading,
      login,
      logout,
      register,
      acceptInvite,
      refresh: loadMe,
    }),
    [user, loading, moduleAccess, accessLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
