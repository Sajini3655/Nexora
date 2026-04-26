import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import api from "../../services/api";
import { fetchManagerDevelopers } from "../../services/managerService";
import { getAdminUsers } from "../../services/api";

function normalizeTicketList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.tickets)) return data.tickets;
  return [];
}

function normalizeDeveloperList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export default function RecentEmailTickets() {
  const [tickets, setTickets] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [selectedDeveloperByTicket, setSelectedDeveloperByTicket] = useState({});
  const [assigningTicketId, setAssigningTicketId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAssignableDevelopers() {
    try {
      const managerDevelopers = await fetchManagerDevelopers();
      return normalizeDeveloperList(managerDevelopers);
    } catch (err) {
      const status = err?.response?.status;
      if (status !== 403) {
        throw err;
      }

      const adminDevelopers = await getAdminUsers({ role: "DEVELOPER", page: 0, size: 100 });
      return normalizeDeveloperList(adminDevelopers);
    }
  }

  useEffect(() => {
    async function loadEmailTickets() {
      try {
        setLoading(true);
        setError("");

        const [ticketsResponse, developersResponse] = await Promise.all([
          api.get("/tickets/email/recent"),
          loadAssignableDevelopers(),
        ]);

        const list = normalizeTicketList(ticketsResponse.data);
        const developerList = normalizeDeveloperList(developersResponse);

        const defaults = list.reduce((acc, ticket) => {
          if (ticket?.id != null && ticket?.assignedToId != null) {
            acc[ticket.id] = String(ticket.assignedToId);
          }
          return acc;
        }, {});

        setTickets(list);
        setDevelopers(developerList);
        setSelectedDeveloperByTicket(defaults);
      } catch (err) {
        console.error("Recent email tickets error:", err);

        const status = err?.response?.status;
        const message =
          err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "Unknown error";

        setError(`Could not load email tickets${status ? ` (${status})` : ""}: ${message}`);
      } finally {
        setLoading(false);
      }
    }

    loadEmailTickets();
  }, []);

  async function handleAssignDeveloper(ticketId) {
    const selectedDeveloperId = selectedDeveloperByTicket[ticketId];
    if (!selectedDeveloperId) {
      setError("Please select a developer before assigning.");
      return;
    }

    try {
      setAssigningTicketId(ticketId);
      setError("");

      await api.patch(`/tickets/${ticketId}/assign`, {
        assignedToId: Number(selectedDeveloperId),
      });

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                assignedToId: Number(selectedDeveloperId),
              }
            : ticket
        )
      );
    } catch (err) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Unknown error";

      setError(`Could not assign developer${status ? ` (${status})` : ""}: ${message}`);
    } finally {
      setAssigningTicketId(null);
    }
  }

  return (
    <Paper
      sx={{
        mb: 4,
        p: 2.8,
        borderRadius: 3,
        bgcolor: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.11)",
        boxShadow: "0 16px 45px rgba(0,0,0,0.22)",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 850, color: "#f8fafc" }}>
            Recent Inbound Tickets
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.72, color: "#cbd5e1" }}>
            Tickets created from inbound emails and project chat summaries
          </Typography>
        </Box>

        <Chip
          label="EMAIL + CHAT"
          size="small"
          sx={{
            bgcolor: "rgba(59,130,246,0.25)",
            color: "#93c5fd",
            fontWeight: 800,
          }}
        />
      </Stack>

      {loading && (
        <Typography variant="body2" sx={{ opacity: 0.72, color: "#cbd5e1" }}>
          Loading email tickets...
        </Typography>
      )}

      {!loading && error && (
        <Typography variant="body2" sx={{ color: "#ef5350" }}>
          {error}
        </Typography>
      )}

      {!loading && !error && tickets.length === 0 && (
        <Typography variant="body2" sx={{ opacity: 0.72, color: "#cbd5e1" }}>
          No email tickets yet
        </Typography>
      )}

      {!loading && !error && tickets.length > 0 && (
        <Stack spacing={1.5}>
          {tickets.map((ticket) => (
            <Box
              key={ticket.id || ticket.ticketId}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.045)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={1.2}
              >
                <Box>
                  <Typography sx={{ fontWeight: 800, color: "#f8fafc" }}>
                    {ticket.title || "Untitled ticket"}
                  </Typography>

                  <Typography variant="body2" sx={{ opacity: 0.72, color: "#cbd5e1" }}>
                    Project: {ticket.projectName || "Not assigned"}
                  </Typography>

                  <Typography variant="body2" sx={{ opacity: 0.72, color: "#cbd5e1" }}>
                    From: {ticket.sourceEmail || "Unknown"}
                  </Typography>

                  <Typography variant="body2" sx={{ opacity: 0.72, color: "#cbd5e1" }}>
                    Source: {ticket.sourceChannel || "EMAIL"}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Chip
                    label={ticket.priority || "MEDIUM"}
                    size="small"
                    sx={{
                      bgcolor: "rgba(239,83,80,0.18)",
                      color: "#ef9a9a",
                      fontWeight: 800,
                    }}
                  />

                  <Chip
                    label={ticket.status || "OPEN"}
                    size="small"
                    sx={{
                      bgcolor: "rgba(76,175,80,0.18)",
                      color: "#a5d6a7",
                      fontWeight: 800,
                    }}
                  />
                </Stack>
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ mt: 1.5 }}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <FormControl size="small" sx={{ minWidth: 210 }}>
                  <Select
                    displayEmpty
                    value={selectedDeveloperByTicket[ticket.id] || ""}
                    onChange={(event) =>
                      setSelectedDeveloperByTicket((prev) => ({
                        ...prev,
                        [ticket.id]: event.target.value,
                      }))
                    }
                    sx={{
                      color: "#f8fafc",
                      bgcolor: "rgba(15, 23, 42, 0.88)",
                      borderRadius: 2,
                      minHeight: 40,
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(148, 163, 184, 0.45)",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(59, 130, 246, 0.8)",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#60a5fa",
                      },
                      "& .MuiSvgIcon-root": {
                        color: "#cbd5e1",
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: "#0f172a",
                          color: "#f8fafc",
                          border: "1px solid rgba(148, 163, 184, 0.2)",
                        },
                      },
                    }}
                  >
                    <MenuItem value="">
                      <span style={{ color: "#cbd5e1" }}>Select developer</span>
                    </MenuItem>
                    {developers.map((developer) => (
                      <MenuItem
                        key={developer.id}
                        value={String(developer.id)}
                        sx={{ color: "#f8fafc" }}
                      >
                        {developer.name || developer.email || `Developer ${developer.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  size="small"
                  disabled={assigningTicketId === ticket.id || developers.length === 0}
                  onClick={() => handleAssignDeveloper(ticket.id)}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: "#2563eb",
                    "&:hover": { bgcolor: "#1d4ed8" },
                  }}
                >
                  {assigningTicketId === ticket.id ? "Assigning..." : "Assign to Developer"}
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
