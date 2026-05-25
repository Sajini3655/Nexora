import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";

import api from "../../../services/api";
import ErrorNotice from "../../../components/ui/ErrorNotice.jsx";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import {
  suggestManagerTaskAssignment,
} from "../../../services/managerService";
import { getAdminUsers } from "../../../services/api";
import { useRecentEmailTickets } from "../../data/useManagerTickets";
import { useManagerProjects, useManagerDevelopers } from "../../data/useManager";

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

function normalizeProjectList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function buildDefaultStoryPoints(ticket) {
  return [
    {
      title: ticket?.title ? `${ticket.title} task` : "Follow-up task",
      description: ticket?.description || "",
      pointValue: 1,
    },
  ];
}

function isOpenTicket(ticket) {
  return String(ticket?.status || "OPEN").toUpperCase() === "OPEN";
}

function getSource(ticket) {
  return String(ticket?.sourceChannel || ticket?.source_channel || "").trim().toUpperCase();
}

function getTicketGroup(ticket) {
  const source = getSource(ticket);

  if (source === "EMAIL") return "email";
  if (source === "CHAT_SUMMARY" || source === "CHAT" || source === "CHATBOX") return "chat";
  if (source === "CLIENT") return "client";

  return "client";
}

const groups = [
  {
    key: "email",
    title: "Email to Ticket",
    subtitle: "",
    icon: <EmailRoundedIcon />,
  },
  {
    key: "chat",
    title: "Chatbox Tickets",
    subtitle: "",
    icon: <ChatRoundedIcon />,
  },
  {
    key: "client",
    title: "Client Complaint Tickets",
    subtitle: "",
    icon: <SupportAgentRoundedIcon />,
  },
];

export default function ManagerTickets() {
  const ticketsQuery = useRecentEmailTickets();
  const projectsQuery = useManagerProjects();
  const developersQuery = useManagerDevelopers();

  const tickets = normalizeTicketList(ticketsQuery.data).filter(isOpenTicket);
  const projects = normalizeProjectList(projectsQuery.data);
  const developers = normalizeDeveloperList(developersQuery.data);
  const loading =
    ticketsQuery.isLoading ||
    ticketsQuery.isFetching ||
    projectsQuery.isLoading ||
    projectsQuery.isFetching ||
    developersQuery.isLoading ||
    developersQuery.isFetching;
  const fetchError =
    ticketsQuery.error?.message ||
    projectsQuery.error?.message ||
    developersQuery.error?.message ||
    "";

  const [actionError, setActionError] = useState("");
  const [convertOpen, setConvertOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedDeveloperId, setSelectedDeveloperId] = useState("");
  const [storyPoints, setStoryPoints] = useState(buildDefaultStoryPoints({}));
  const [suggestion, setSuggestion] = useState(null);
  const [suggestingDeveloper, setSuggestingDeveloper] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const groupedTickets = useMemo(() => {
    const result = {
      email: [],
      chat: [],
      client: [],
    };

    tickets.forEach((ticket) => {
      result[getTicketGroup(ticket)].push(ticket);
    });

    return result;
  }, [tickets]);

  const openConvertModal = (ticket) => {
    window.requestAnimationFrame(() => {
      document.activeElement instanceof HTMLElement && document.activeElement.blur();
    });
    setSelectedTicket(ticket);
    setSelectedProjectId(String(ticket?.projectId || ""));
    setSelectedDeveloperId(String(ticket?.assignedToId || ""));
    setStoryPoints(buildDefaultStoryPoints(ticket));
    setSuggestion(null);
    setActionError("");
    setConvertOpen(true);
  };

  const closeConvertModal = () => {
    if (submitting) return;
    setConvertOpen(false);
    setSelectedTicket(null);
    setSelectedProjectId("");
    setSelectedDeveloperId("");
    setStoryPoints(buildDefaultStoryPoints({}));
    setSuggestion(null);
    setActionError("");
  };

  const handleSuggestDeveloper = async () => {
    if (!selectedTicket) return;

    setSuggestingDeveloper(true);
    setActionError("");

    try {
      const estimatedPoints = storyPoints.reduce(
        (sum, row) => sum + Number(row?.pointValue || 0),
        0
      );

      const result = await suggestManagerTaskAssignment({
        title: selectedTicket?.title || "",
        description: selectedTicket?.description || "",
        estimatedPoints,
      });

      setSuggestion(result || null);

      const recommendedId = result?.recommendedDeveloper?.id;
      if (recommendedId) {
        setSelectedDeveloperId(String(recommendedId));
      }
    } catch (err) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Unknown error";

      setActionError(`Could not get AI suggestion${status ? ` (${status})` : ""}: ${message}`);
    } finally {
      setSuggestingDeveloper(false);
    }
  };

  const updateStoryPoint = (rowIndex, field, value) => {
    setStoryPoints((prev) =>
      prev.map((row, index) => (index === rowIndex ? { ...row, [field]: value } : row))
    );
  };

  const addStoryPoint = () => {
    setStoryPoints((prev) => [...prev, { title: "", description: "", pointValue: 1 }]);
  };

  const removeStoryPoint = (rowIndex) => {
    setStoryPoints((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, index) => index !== rowIndex)
    );
  };

  const handleConvert = async () => {
    if (!selectedTicket) return;

    const normalizedStoryPoints = storyPoints
      .map((row) => ({
        title: String(row.title || "").trim(),
        description: String(row.description || "").trim(),
        pointValue: Number(row.pointValue),
      }))
      .filter((row) => row.title || row.description || Number.isFinite(row.pointValue));

    if (!selectedProjectId) {
      setActionError("Please select a project before converting this ticket.");
      return;
    }

    if (!selectedDeveloperId) {
      setActionError("Please select a developer before converting this ticket.");
      return;
    }

    if (normalizedStoryPoints.length === 0) {
      setActionError("Add at least one story point before converting this ticket.");
      return;
    }

    if (
      normalizedStoryPoints.some(
        (row) => !row.title || !Number.isFinite(row.pointValue) || row.pointValue < 1
      )
    ) {
      setActionError("Each story point needs a title and a point value greater than 0.");
      return;
    }

    try {
      setSubmitting(true);
      setActionError("");

      try {
        await api.patch(`/tickets/${selectedTicket.id}/assign`, {
          projectId: Number(selectedProjectId),
          developerId: Number(selectedDeveloperId),
          storyPoints: normalizedStoryPoints,
        });
      } catch (patchErr) {
        if (patchErr?.response?.status === 404 || patchErr?.response?.status === 405) {
          await api.post(`/tickets/${selectedTicket.id}/assign`, {
            projectId: Number(selectedProjectId),
            developerId: Number(selectedDeveloperId),
            storyPoints: normalizedStoryPoints,
          });
        } else {
          throw patchErr;
        }
      }

      await Promise.all([
        ticketsQuery.refetch(),
        projectsQuery.refetch(),
        developersQuery.refetch(),
      ]);
      closeConvertModal();
    } catch (err) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Unknown error";

      setActionError(`Could not convert ticket${status ? ` (${status})` : ""}: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ pb: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={1.5}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5, color: "var(--nx-text)" }}>
            Manager Tickets
          </Typography>
        </Box>

        <Chip
          label={`OPEN: ${tickets.length}`}
          sx={{
            bgcolor: "var(--nx-panel-2)",
            color: "var(--nx-blue)",
            fontWeight: 900,
            border: "1px solid var(--nx-border)",
          }}
        />
      </Stack>

      {actionError || fetchError ? (
        <ErrorNotice message={actionError || fetchError} severity="error" sx={{ mb: 2 }} dedupeKey="manager-tickets-error" />
      ) : null}

      {loading ? (
        <Box sx={{ minHeight: 260, display: "grid", placeItems: "center" }}>
          <Stack direction="row" spacing={1.4} alignItems="center">
            <CircularProgress size={24} />
            <Typography sx={{ color: "var(--nx-muted)" }}>Loading manager tickets...</Typography>
          </Stack>
        </Box>
      ) : (
        <Stack spacing={2}>
          {groups.map((group) => (
            <TicketGroup
              key={group.key}
              group={group}
              tickets={groupedTickets[group.key]}
              onConvert={openConvertModal}
            />
          ))}
        </Stack>
      )}

      <Dialog open={convertOpen} onClose={closeConvertModal} fullWidth maxWidth="md">
        <DialogTitle sx={{ pr: 7 }}>
          Convert Ticket to Task
          <IconButton
            onClick={closeConvertModal}
            disabled={submitting}
            sx={{ position: "absolute", right: 12, top: 10, color: "var(--nx-muted)" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: "var(--nx-card)" }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" sx={{ color: "var(--nx-muted)" }}>
                Ticket
              </Typography>
              <Typography sx={{ fontWeight: 900, color: "var(--nx-text)" }}>
                {selectedTicket?.title || "Untitled ticket"}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "var(--nx-muted)", mt: 0.4, whiteSpace: "pre-wrap" }}
              >
                {selectedTicket?.description || "No description provided."}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "var(--nx-muted)", mt: 0.7, display: "block" }}
              >
                Source: {selectedTicket?.sourceChannel || "CLIENT"} • Priority:{" "}
                {selectedTicket?.priority || "MEDIUM"}
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                  displayEmpty
                  sx={{ color: "var(--nx-text)", bgcolor: "var(--nx-panel-2)", borderRadius: 2 }}
                >
                  <MenuItem value="">
                    <span style={{ color: "var(--nx-muted)" }}>Select project</span>
                  </MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={String(project.id)}>
                      {project.name || project.projectName || `Project ${project.id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <Select
                  value={selectedDeveloperId}
                  onChange={(event) => setSelectedDeveloperId(event.target.value)}
                  displayEmpty
                  sx={{ color: "var(--nx-text)", bgcolor: "var(--nx-panel-2)", borderRadius: 2 }}
                >
                  <MenuItem value="">
                    <span style={{ color: "var(--nx-muted)" }}>Select developer</span>
                  </MenuItem>
                  {developers.map((developer) => (
                    <MenuItem key={developer.id} value={String(developer.id)}>
                      {developer.name || developer.email || `Developer ${developer.id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Tooltip
                title={
                  suggestingDeveloper
                    ? "Suggesting best developer..."
                    : "Use AI to suggest the best developer"
                }
                arrow
              >
                <span>
                  <Button
                    variant="contained"
                    onClick={handleSuggestDeveloper}
                    type="button"
                    disabled={suggestingDeveloper || submitting}
                    startIcon={<AutoAwesomeIcon />}
                    sx={{
                      textTransform: "none",
                      whiteSpace: "nowrap",
                      borderRadius: 6,
                      background: "var(--nx-purple)",
                      color: "var(--nx-text)",
                      fontWeight: 800,
                      px: 2,
                      "&:hover": { background: "var(--nx-blue)" },
                    }}
                  >
                    {suggestingDeveloper ? "Suggesting..." : "Suggest developer"}
                  </Button>
                </span>
              </Tooltip>
            </Stack>

            {suggestion?.recommendedDeveloper ? (
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  border: "1px solid var(--nx-border)",
                  background: "var(--nx-panel-2)",
                }}
              >
                <Typography sx={{ fontWeight: 800, color: "var(--nx-text)" }}>
                  Suggested: {suggestion.recommendedDeveloper.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "var(--nx-muted)" }}>
                  Confidence: {suggestion.confidence ?? "-"}%
                  {suggestion.explanation ? ` • ${suggestion.explanation}` : ""}
                </Typography>
              </Box>
            ) : null}

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: "var(--nx-card)",
                border: "1px solid var(--nx-border)",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography sx={{ color: "var(--nx-text)", fontWeight: 800 }}>
                  Story points
                </Typography>
                <Button size="small" onClick={addStoryPoint} sx={{ textTransform: "none" }}>
                  Add story point
                </Button>
              </Stack>

              <Stack spacing={1}>
                {storyPoints.map((row, rowIndex) => (
                  <Box
                    key={`${selectedTicket?.id || "ticket"}-sp-${rowIndex}`}
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      bgcolor: "var(--nx-panel-2)",
                      border: "1px solid var(--nx-border)",
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Title"
                          value={row.title}
                          onChange={(event) =>
                            updateStoryPoint(rowIndex, "title", event.target.value)
                          }
                        />
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          label="Point value"
                          value={row.pointValue}
                          onChange={(event) =>
                            updateStoryPoint(rowIndex, "pointValue", event.target.value)
                          }
                        />
                      </Stack>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        minRows={2}
                        label="Description"
                        value={row.description}
                        onChange={(event) =>
                          updateStoryPoint(rowIndex, "description", event.target.value)
                        }
                      />
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" sx={{ color: "var(--nx-muted)" }}>
                          Row {rowIndex + 1}
                        </Typography>
                        <Button
                          size="small"
                          color="inherit"
                          disabled={storyPoints.length <= 1}
                          onClick={() => removeStoryPoint(rowIndex)}
                          sx={{ textTransform: "none" }}
                        >
                          Remove
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: "var(--nx-card)" }}>
          <Button onClick={closeConvertModal} disabled={submitting} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConvert}
            disabled={submitting}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              bgcolor: "var(--nx-blue)",
              color: "var(--nx-text)",
              "&:hover": { bgcolor: "var(--nx-purple)" },
            }}
          >
            {submitting ? "Converting..." : "Convert and Assign"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function TicketGroup({ group, tickets, onConvert }) {
  return (
    <Paper
      sx={{
        p: 1.8,
        borderRadius: 2.5,
        border: "1px solid var(--nx-border)",
        background: "var(--nx-card)",
        boxShadow: "var(--nx-shadow)",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
        sx={{ mb: 1.5 }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              color: "var(--nx-blue)",
              bgcolor: "var(--nx-panel-2)",
              border: "1px solid var(--nx-border)",
            }}
          >
            {group.icon}
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 900, color: "var(--nx-text)" }}>
              {group.title}
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
              {group.subtitle}
            </Typography>
          </Box>
        </Stack>

        <Chip
          label={`OPEN: ${tickets.length}`}
          size="small"
          sx={{
            bgcolor: "var(--nx-panel-2)",
            color: "var(--nx-blue)",
            fontWeight: 900,
          }}
        />
      </Stack>

      <Divider sx={{ mb: 1.4, borderColor: "var(--nx-border)" }} />

      {tickets.length === 0 ? (
        <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
          No open tickets in this category.
        </Typography>
      ) : (
        <Stack spacing={1.2}>
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} onConvert={onConvert} />
          ))}
        </Stack>
      )}
    </Paper>
  );
}

function TicketRow({ ticket, onConvert }) {
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 2,
        bgcolor: "var(--nx-panel-2)",
        border: "1px solid var(--nx-border)",
      }}
    >
      <Grid container spacing={1.2} alignItems="center">
        <Grid item xs={12} md={7}>
          <Typography sx={{ fontWeight: 850, color: "var(--nx-text)" }} noWrap>
            {ticket.title || "Untitled ticket"}
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--nx-muted)", mt: 0.35 }}>
            {ticket.projectName || "No project"} • {ticket.sourceChannel || "CLIENT"}
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
            {ticket.sourceEmail || ticket.createdByEmail || "Unknown sender"}
          </Typography>
        </Grid>

        <Grid item xs={12} md={5}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent={{ xs: "flex-start", md: "flex-end" }}
            flexWrap="wrap"
          >
            <StatusBadge label={ticket.priority || "MEDIUM"} />
            <StatusBadge label={ticket.status || "OPEN"} />
            <Button
              variant="contained"
              size="small"
              onClick={(event) => {
                event.currentTarget.blur();
                onConvert(ticket);
              }}
              sx={{
                minWidth: 150,
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 2,
                background: "var(--nx-purple)",
                color: "var(--nx-text)",
                "&:hover": {
                  background: "var(--nx-blue)",
                },
              }}
            >
              Convert to Task
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}