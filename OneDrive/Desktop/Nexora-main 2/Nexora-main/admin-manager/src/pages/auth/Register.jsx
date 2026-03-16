import React, { useEffect, useState } from "react";
import { Box, Typography, Alert } from "@mui/material";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get("token");

    if (!tokenParam) {
      setErr("Invalid registration link");
      setLoading(false);
      return;
    }

    setToken(tokenParam);

    axios
      .get("http://localhost:8081/api/auth/accept-invite", {
        params: { token: tokenParam },
      })
      .then((res) => {
        setEmail(res.data.email || "");
        setName(res.data.name || "");
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

    if (!password || password.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setErr("Passwords do not match");
      return;
    }

    try {
      setSubmitting(true);

      await axios.post(
        "http://localhost:8081/api/auth/accept-invite",
        null,
        {
          params: {
            token,
            password,
          },
        }
      );

      setMsg("Registered successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (e2) {
      setErr(e2.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}>
      <Card sx={{ width: 460, maxWidth: "100%" }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
          Complete Registration
        </Typography>

        {name ? (
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
            Welcome {name}
          </Typography>
        ) : null}

        {err && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {err}
          </Alert>
        )}

        {msg && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {msg}
          </Alert>
        )}

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

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" disabled={submitting}>
            {submitting ? "Registering..." : "Set Password & Register"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}