import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Tooltip from '@mui/material/Tooltip';
import api from "../../services/api";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { suggestManagerTaskAssignment } from "../../services/managerService";
import { getAdminUsers } from "../../services/api";
import { useRecentEmailTickets } from "../data/useManagerTickets";
import { useManagerProjects, useManagerDevelopers } from "../data/useManager";

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

function cleanTicketTitle(ticket) {
  const rawTitle = String(ticket?.title || "").trim();

  if (!rawTitle) {
    return "Untitled ticket";
  }

  return rawTitle
    .replace(/^Chat Blocker Detected\s*-\s*/i, "Chat blocker: ")
    .replace(/^Chat blocker:\s*Chat blocker:\s*/i, "Chat blocker: ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTicketSourceLabel(ticket) {
  const source = String(ticket?.sourceChannel || "").trim().toUpperCase();

  if (source === "EMAIL") {
    return "Email ticket";
  }

  if (source === "CHAT" || source === "CHAT_SUMMARY") {
    return "Chatbox ticket";
  }

  if (source === "CLIENT") {
    return "Client portal ticket";
  }

  return source ? `${source} ticket` : "Inbound ticket";
}

function getTicketSenderLabel(ticket) {
  const source = String(ticket?.sourceChannel || "").trim().toUpperCase();
  const email = String(ticket?.sourceEmail || "").trim();

  if (source === "EMAIL") {
    return email ? `From ${email}` : "From unknown email sender";
  }

  if (source === "CHAT" || source === "CHAT_SUMMARY") {
    return "From project chat summary";
  }

  return email ? `From ${email}` : "Sender not available";
}

function getTicketProjectLabel(ticket) {
  return String(ticket?.projectName || "").trim() || "No project linked";
}

export default function RecentEmailTickets() {
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

  const openCount = useMemo(() => tickets.filter(isOpenTicket).length, [tickets]);

  const openConvertModal = (ticket) => {
    document.activeElement instanceof HTMLElement && document.activeElement.blur();
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
    closeWithBlur(() => {
      setConvertOpen(false);
      setSelectedTicket(null);
      setSelectedProjectId("");
      setSelectedDeveloperId("");
      setStoryPoints(buildDefaultStoryPoints({}));
      setSuggestion(null);
      setActionError("");
    });
  };

  const handleSuggestDeveloper = async () => {
    if (!selectedTicket) return;

    setSuggestingDeveloper(true);
    setActionError("");

    try {
      const estimatedPoints = storyPoints.reduce((sum, row) => sum + Number(row?.pointValue || 0), 0);
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
    setStoryPoints((prev) => (prev.length <= 1 ? prev : prev.filter((_, index) => index !== rowIndex)));
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

    if (normalizedStoryPoints.some((row) => !row.title || !Number.isFinite(row.pointValue) || row.pointValue < 1)) {
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
    <Paper
      sx={{
        mb: 2,
        p: 1.8,
        borderRadius: 2.5,
        bgcolor: "var(--nx-card)",
        border: "1px solid var(--nx-border)",
        boxShadow: "var(--nx-shadow)",
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
          <Typography sx={{ fontWeight: 900, color: "var(--nx-text)" }}>
            Recent Inbound Tickets
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
            OPEN tickets only. Convert them into tasks from a modal.
          </Typography>
        </Box>

        <Chip
          label={`OPEN: ${openCount}`}
          size="small"
          sx={{
            bgcolor: "var(--nx-panel-2)",
            color: "var(--nx-blue)",
            fontWeight: 800,
          }}
        />
      </Stack>

      {loading && (
        <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
          Loading email tickets...
        </Typography>
      )}

      {!loading && (actionError || fetchError) && (
        <Typography variant="body2" sx={{ color: "var(--nx-red)" }}>
          {actionError || fetchError}
        </Typography>
      )}

      {!loading && !fetchError && !actionError && tickets.length === 0 && (
        <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
          No open inbound tickets.
        </Typography>
      )}

      {!loading && !fetchError && !actionError && tickets.length > 0 && (
        <Stack spacing={1.2}>
          {tickets.map((ticket) => (
            <Box
              key={ticket.id}
              sx={{
                p: 1.2,
                borderRadius: 2,
                bgcolor: "var(--nx-panel-2)",
                border: "1px solid var(--nx-border)",
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                spacing={1.2}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
  <Typography
    sx={{
      fontWeight: 900,
      color: "var(--nx-text)",
      fontSize: 16,
      lineHeight: 1.25,
      mb: 0.7,
    }}
    noWrap
  >
    {cleanTicketTitle(ticket)}
  </Typography>

  <Stack
    direction="row"
    spacing={1}
    alignItems="center"
    flexWrap="wrap"
    useFlexGap
  >
    <Chip
      label={getTicketSourceLabel(ticket)}
      size="small"
      sx={{
        bgcolor: "var(--nx-panel-2)",
        color: "var(--nx-purple)",
        border: "1px solid var(--nx-border)",
        fontWeight: 900,
      }}
    />

    <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
      {getTicketProjectLabel(ticket)}
    </Typography>

    <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
      •
    </Typography>

    <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
      {getTicketSenderLabel(ticket)}
    </Typography>
  </Stack>
</Box>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                  <StatusBadge label={ticket.priority || "MEDIUM"} />
                  <StatusBadge label={ticket.status || "OPEN"} />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={(event) => {
                      event.currentTarget.blur();
                      openConvertModal(ticket);
                    }}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      bgcolor: "var(--nx-blue)",
                      color: "var(--nx-text)",
                      "&:hover": { bgcolor: "var(--nx-purple)" },
                    }}
                  >
                    Convert to Task
                  </Button>
                </Stack>
              </Stack>
            </Box>
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
              <Typography variant="body2" sx={{ color: "var(--nx-muted)", mt: 0.4, whiteSpace: "pre-wrap" }}>
                {selectedTicket?.description || "No description provided."}
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--nx-muted)", mt: 0.7, display: "block" }}>
                Source: {selectedTicket?.sourceChannel || "EMAIL"} • Priority: {selectedTicket?.priority || "MEDIUM"}
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

              <Tooltip title={suggestingDeveloper ? "Suggesting best developer..." : "Use AI to suggest the best developer"} arrow>
                <span>
                  <Button
                    variant="contained"
                    onClick={handleSuggestDeveloper}
                    disabled={suggestingDeveloper || submitting}
                    startIcon={<AutoAwesomeIcon sx={{ transform: 'scale(1.05)' }} />}
                    sx={{
                      textTransform: "none",
                      whiteSpace: "nowrap",
                      borderRadius: 6,
                      bgcolor: "var(--nx-purple)",
                      color: "var(--nx-text)",
                      fontWeight: 800,
                      px: 2,
                      '&:hover': { bgcolor: "var(--nx-blue)" },
                    }}
                  >
                    {suggestingDeveloper ? 'Suggesting...' : 'Suggest developer'}
                  </Button>
                </span>
              </Tooltip>
            </Stack>

            {suggestion?.recommendedDeveloper ? (
              <Box sx={{ p: 1, borderRadius: 1.5, border: "1px solid var(--nx-border)", background: "var(--nx-panel-2)" }}>
                <Typography sx={{ fontWeight: 800, color: "var(--nx-text)" }}>
                  Suggested: {suggestion.recommendedDeveloper.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "var(--nx-muted)" }}>
                  Confidence: {suggestion.confidence ?? "-"}% {suggestion.explanation ? `• ${suggestion.explanation}` : ""}
                </Typography>
              </Box>
            ) : null}

            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "var(--nx-card)", border: "1px solid var(--nx-border)" }}>
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
                    sx={{ p: 1.2, borderRadius: 2, bgcolor: "var(--nx-panel-2)", border: "1px solid var(--nx-border)" }}
                  >
                    <Stack spacing={1}>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Title"
                          value={row.title}
                          onChange={(event) => updateStoryPoint(rowIndex, "title", event.target.value)}
                        />
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          label="Point value"
                          value={row.pointValue}
                          onChange={(event) => updateStoryPoint(rowIndex, "pointValue", event.target.value)}
                        />
                      </Stack>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        minRows={2}
                        label="Description"
                        value={row.description}
                        onChange={(event) => updateStoryPoint(rowIndex, "description", event.target.value)}
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
            sx={{ textTransform: "none", fontWeight: 800, bgcolor: "var(--nx-blue)", color: "var(--nx-text)", "&:hover": { bgcolor: "var(--nx-purple)" } }}
          >
            {submitting ? "Converting..." : "Convert and Assign"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}





