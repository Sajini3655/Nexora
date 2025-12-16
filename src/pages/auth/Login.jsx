import React from "react";
import { Box, Typography, Alert } from "@mui/material";
import { useState } from "react";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import useAuth from "../../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await login(email, password);
      navigate("/admin");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Login failed");
    }
  }

  return (
    <Box sx={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      p: 2
    }}>
      <Card sx={{ width: 420 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
          Login
        </Typography>
        {err ? <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert> : null}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit">Sign In</Button>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            No account? <Link to="/register">Register</Link>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}
