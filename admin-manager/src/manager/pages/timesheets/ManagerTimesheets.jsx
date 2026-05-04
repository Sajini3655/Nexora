import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Card from "../../../components/ui/Card.jsx";
import ErrorNotice from "/src/components/ui/ErrorNotice.jsx";
import { formatDate } from "../../../utils/formatDate.js";
import {
  approveTimesheet,
  rejectTimesheet,
} from "../../../services/timesheetService.js";
import { useTeamTimesheets, useTeamTimesheetsSummary } from "../../data/useTimesheets";

const FILTERS = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

export default function ManagerTimesheets() {
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actionKey, setActionKey] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const itemsQuery = useTeamTimesheets(filter);
  const summaryQuery = useTeamTimesheetsSummary();
  const items = Array.isArray(itemsQuery.data) ? itemsQuery.data : [];
  const summary = summaryQuery.data || null;
  const loading = itemsQuery.isLoading || summaryQuery.isLoading;
  const refreshing = (itemsQuery.isFetching || summaryQuery.isFetching) && !loading && (items.length > 0 || summary !== null);
  const fetchError = itemsQuery.error?.message || summaryQuery.error?.message || "";

  const summaryCards = useMemo(() => ([
    { label: "Pending Review", value: summary?.submittedCount ?? 0 },
    { label: "Approved", value: summary?.approvedCount ?? 0 },
    { label: "Rejected", value: summary?.rejectedCount ?? 0 },
    { label: "Total Hours", value: formatHours(summary?.totalHours) },
  ]), [summary]);

  const handleApprove = async (item) => {
    try {
      setActionKey(`approve-${item.id}`);
      setError("");
      setMessage("");
      await approveTimesheet(item.id);
      setMessage("Timesheet approved.");
      await Promise.all([itemsQuery.refetch(), summaryQuery.refetch()]);
    } catch (err) {
      setError(err?.message || "Unable to approve timesheet.");
    } finally {
      setActionKey("");
    }
  };

  const openReject = (item) => {
    setRejectTarget(item);
    setRejectReason("");
  };

  const closeReject = () => {
    setRejectTarget(null);
    setRejectReason("");
  };

  const handleReject = async () => {
    if (!rejectTarget) return;

    try {
      setActionKey(`reject-${rejectTarget.id}`);
      setError("");
      setMessage("");
      await rejectTimesheet(rejectTarget.id, rejectReason);
      setMessage("Timesheet rejected.");
      closeReject();
      await Promise.all([itemsQuery.refetch(), summaryQuery.refetch()]);
    } catch (err) {
      setError(err?.message || "Unable to reject timesheet.");
    } finally {
      setActionKey("");
    }
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.15 }}>
            Team Timesheets
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.75 }}>
            Review submitted developer work hours.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ alignSelf: { xs: "stretch", md: "auto" } }} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
          <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => Promise.all([itemsQuery.refetch(), summaryQuery.refetch()])}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      {error || fetchError ? <ErrorNotice message={error || fetchError} severity="error" dedupeKey="manager-timesheets-error" /> : null}
      {message ? <ErrorNotice message={message} severity="success" dedupeKey="manager-timesheets-success" /> : null}

      <Grid container spacing={2}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <SummaryCard label={card.label} value={card.value} />
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="flex-end">
        {FILTERS.map((item) => (
          <Button
            key={item.value}
            variant={filter === item.value ? "contained" : "outlined"}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </Stack>

      {refreshing ? (
        <Typography variant="body2" sx={{ color: "#94a3b8", textAlign: "right", mt: -1 }}>
          Refreshing timesheets...
        </Typography>
      ) : null}

      {loading ? (
        <Card sx={{ p: 3 }}>
          <Typography sx={{ color: "#cbd5e1" }}>Loading team timesheets...</Typography>
        </Card>
      ) : items.length === 0 ? (
        <Card sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            No timesheets to review.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {items.map((item) => {
            const isSubmitted = item.status === "SUBMITTED";

            return (
              <Card key={item.id} sx={{ p: 2.5 }}>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        {item.developerName || "Developer"}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                        {item.projectName || "Project"} • {item.taskTitle || "No task"} • {formatDate(item.workDate)}
                      </Typography>
                    </Box>
                    <Chip label={item.status} color={chipColor(item.status)} size="small" />
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label={`${item.hours} hrs`} variant="outlined" />
                    <Chip label={item.workLocation} variant="outlined" />
                    {item.description ? <Chip label={item.description} variant="outlined" /> : null}
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }}>
                    <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                      Reviewed status updates stay in the record.
                    </Typography>

                    {isSubmitted ? (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<CheckCircleOutlineRoundedIcon />}
                          onClick={() => handleApprove(item)}
                          disabled={actionKey === `approve-${item.id}`}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<CancelOutlinedIcon />}
                          onClick={() => openReject(item)}
                          disabled={actionKey === `reject-${item.id}`}
                        >
                          Reject
                        </Button>
                      </Stack>
                    ) : (
                      <Chip label="Read only" variant="outlined" />
                    )}
                  </Stack>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      )}

      <Dialog open={Boolean(rejectTarget)} onClose={closeReject} fullWidth maxWidth="sm">
        <DialogTitle>Reject Timesheet</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              Add a short reason for the rejection.
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Reason"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.2,
                  backgroundColor: "rgba(255,255,255,0.05)",
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeReject}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={!rejectReason.trim() || actionKey === `reject-${rejectTarget?.id}`}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function SummaryCard({ label, value }) {
  return (
    <Card sx={{ p: 2.5, height: "100%" }}>
      <Typography variant="caption" sx={{ color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>
        {value}
      </Typography>
    </Card>
  );
}

function formatHours(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) {
    return "0.00";
  }
  return number.toFixed(2);
}

function chipColor(status) {
  switch (status) {
    case "SUBMITTED":
      return "warning";
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "error";
    default:
      return "default";
  }
}
