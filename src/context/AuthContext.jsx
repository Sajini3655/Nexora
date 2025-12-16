import React from "react";
import { createContext, useEffect, useMemo, useState } from "react";
import useApi from "../hooks/useApi.jsx";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const api = useApi();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        return;
      }
      const res = await api.get("/api/auth/me");
      const me = res.data;
    const role = me.role?.startsWith("ROLE_") ? me.role.replace("ROLE_", "") : me.role;
    setUser({ ...me, role });

    } catch {
      localStorage.removeItem("token");
      setUser(null);
    }
  }

  async function login(email, password) {
    const res = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    // backend login response includes user object, but /me is safer
    await loadMe();
    return res.data;
  }

  async function register(payload) {
    // payload: {name,email,password,role}
    const res = await api.post("/api/auth/register", payload);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh: loadMe }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
