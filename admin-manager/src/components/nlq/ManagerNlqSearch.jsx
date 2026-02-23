import React, { useMemo, useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import api from "../../api/axios";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Manager NLQ navigation search bar.
 *
 * Backend endpoint: POST /api/manager/nlq/resolve
 */
export default function ManagerNlqSearch() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const placeholder = useMemo(
    () => 'Navigate to... (e.g. "Show me all projects", "Go to project Alpha", "Where is my profile?")',
    []
  );

  async function submit() {
    const query = q.trim();
    if (!query || loading) return;

    setLoading(true);
    setMsg("");

    try {
      const res = await api.post("/manager/nlq/resolve", {
        query,
        currentPath: location.pathname,
      });

      const data = res.data;

      if (data.status !== "OK") {
        setMsg(data.message || "Could not navigate.");
        return;
      }

      if (data.type === "ROUTE") {
        navigate(data.path);
        setQ("");
        return;
      }

      if (data.type === "SCROLL") {
        // If we are already on the page, scroll now.
        if (location.pathname === data.path) {
          const el = document.getElementById(data.targetId);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          setQ("");
          return;
        }

        // Otherwise, navigate to the page and ask it to scroll via location state.
        navigate(data.path, { state: { scrollTo: data.targetId } });
        setQ("");
      }
    } catch (e) {
      setMsg("NLQ service error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: { xs: 180, sm: 360, md: 520 } }}>
      <TextField
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        size="small"
        fullWidth
        sx={{
          "& .MuiInputBase-root": {
            borderRadius: 3,
            backgroundColor: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "white",
          },
          "& .MuiInputBase-input::placeholder": {
            color: "rgba(255,255,255,0.55)",
            opacity: 1,
          },
        }}
        InputProps={{
          endAdornment: (
            <Tooltip title="Navigate">
              <IconButton onClick={submit} disabled={loading} size="small" sx={{ color: "white" }}>
                {loading ? <CircularProgress size={18} /> : <SearchIcon />}
              </IconButton>
            </Tooltip>
          ),
        }}
      />

      {msg && (
        <Typography variant="caption" sx={{ opacity: 0.8, maxWidth: 260 }}>
          {msg}
        </Typography>
      )}
    </Box>
  );
}