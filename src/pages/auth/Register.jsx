import React, { useEffect, useState } from "react";
import { Box, Typography, Alert } from "@mui/material";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/apiBase.js";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(""); // read-only
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setErr("Invalid registration link");
      setLoading(false);
      return;
    }
    setToken(tokenParam);

    // ✅ fetch email from backend using token
    axios
      .get(`${API_BASE_URL}/api/auth/accept-invite`, {
        params: { token: tokenParam },
      })
      .then((res) => {
        setEmail(res.data.email); // backend returns { email: "...", name: "..." }
      })
      .catch(() => {
        setErr("Invalid or expired token");
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!token) {
      setErr("Token missing. Cannot register.");
      return;
    }

    try {
      // ✅ Correct POST to backend with token & password as params
      await axios.post(
        `${API_BASE_URL}/api/auth/accept-invite`,
        null, // body is empty
        {
          params: {
            token: token,
            password: password,
          },
        }
      );

      setMsg("Registered successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (e2) {
      setErr(e2.response?.data?.message || "Registration failed");
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}>
      <Card sx={{ width: 460 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
          Complete Registration
        </Typography>

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
        >
          <Input label="Email" value={email} disabled />
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit">Set Password & Register</Button>
        </Box>
      </Card>
    </Box>
  );
}
