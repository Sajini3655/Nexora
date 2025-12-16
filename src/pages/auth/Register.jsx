import React from "react";
import { Box, Typography, Alert, MenuItem } from "@mui/material";
import { useState } from "react";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import useAuth from "../../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await register({ name, email, password, role });
      setMsg("Registered successfully. Now login.");
      setTimeout(() => navigate("/login"), 700);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Register failed");
    }
  }

  return (
    <Box sx={{ width: 480, borderRadius: 4, boxShadow: "0 30px 80px rgba(0,0,0,0.55)" }}>
      <Card sx={{ width: 460 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
          Register
        </Typography>
        {err ? <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert> : null}
        {msg ? <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert> : null}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input
            select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <MenuItem value="ADMIN">ADMIN</MenuItem>
            <MenuItem value="MANAGER">MANAGER</MenuItem>
            <MenuItem value="DEVELOPER">DEVELOPER</MenuItem>
            <MenuItem value="CLIENT">CLIENT</MenuItem>
          </Input>

          <Button type="submit">Create Account</Button>

          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Have account? <Link to="/login">Login</Link>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}
