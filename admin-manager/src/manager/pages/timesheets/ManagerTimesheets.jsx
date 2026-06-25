import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Popover,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Card from "../../../components/ui/Card.jsx";
import ErrorNotice from "/src/components/ui/ErrorNotice.jsx";
import { formatDate as formatLocalDate } from "../../../utils/formatDate.js";
import {
  approveTimesheet,
  rejectTimesheet,
} from "../../../services/timesheetService.js";
import { useTeamTimesheets } from "../../data/useTimesheets";

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
  const [dateFilterMode, setDateFilterMode] = useState("ALL_DATES");
  const [selectedDate, setSelectedDate] = useState(null);
  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [dateFilterAnchor, setDateFilterAnchor] = useState(null);
  const openDateFilter = Boolean(dateFilterAnchor);

  const itemsQuery = useTeamTimesheets(filter);
  const items = Array.isArray(itemsQuery.data) ? itemsQuery.data : [];
  const filteredByStatusItems = useMemo(() => filterTimesheetsByStatus(items, filter), [items, filter]);
  const dateFilteredItems = useMemo(
    () => filterTimesheetsByDateMode(filteredByStatusItems, dateFilterMode, selectedDate, weekStart),
    [filteredByStatusItems, dateFilterMode, selectedDate, weekStart]
  );
  const displayedItems = dateFilteredItems;
  const summary = useMemo(() => calculateSummaryStats(displayedItems), [displayedItems]);
  const loading = itemsQuery.isLoading;
  const refreshing = itemsQuery.isFetching && !loading && items.length > 0;
  const fetchError = itemsQuery.error?.message || "";

  const neutralChipSx = {
    bgcolor: "var(--nx-panel-2)",
    color: "var(--nx-text-soft)",
    borderColor: "var(--nx-border)",
    fontWeight: 700,
  };

  const disabledChipSx = {
    bgcolor: "var(--nx-panel-2)",
    color: "var(--nx-muted)",
    borderColor: "var(--nx-border)",
    opacity: 0.85,
    fontWeight: 700,
  };

  const disabledButtonSx = {
    "&.Mui-disabled": {
      color: "var(--nx-muted)",
      borderColor: "var(--nx-border)",
      backgroundColor: "var(--nx-panel-2)",
      opacity: 0.85,
    },
  };

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
      await itemsQuery.refetch();
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
      await itemsQuery.refetch();
    } catch (err) {
      setError(err?.message || "Unable to reject timesheet.");
    } finally {
      setActionKey("");
    }
  };

  const changeWeek = (direction) => {
    setWeekStart((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + direction * 7);
      return getStartOfWeek(next);
    });
    setSelectedDate(null);
  };

  const showThisWeek = () => {
    const now = new Date();
    setWeekStart(getStartOfWeek(now));
    setSelectedDate(null);
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
        </Box>
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

      <Stack direction={{ xs: "column", md: "row" }} spacing={1} flexWrap="wrap" useFlexGap justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => itemsQuery.refetch()}>
            Refresh
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={(event) => setDateFilterAnchor(event.currentTarget)}
            endIcon={<CalendarTodayOutlinedIcon />}
            sx={{ textTransform: "none", minWidth: 220 }}
          >
            {formatDateLabel(dateFilterMode, selectedDate, weekStart, getEndOfWeek(weekStart))}
          </Button>
        </Stack>

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
      </Stack>

      <Popover
        open={openDateFilter}
        anchorEl={dateFilterAnchor}
        onClose={() => setDateFilterAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{ sx: { backgroundColor: "var(--nx-panel)", color: "var(--nx-text)", borderRadius: 3, border: "1px solid var(--nx-border)", minWidth: 220 } }}
      >
        <Stack spacing={0} sx={{ p: 1 }}>
          <MenuItem
            selected={dateFilterMode === "ALL_DATES"}
            onClick={() => {
              setDateFilterMode("ALL_DATES");
              setSelectedDate(null);
              setDateFilterAnchor(null);
            }}
          >
            All Dates
          </MenuItem>
          <MenuItem
            selected={dateFilterMode === "TODAY"}
            onClick={() => {
              const today = normalizeDate(new Date());
              setDateFilterMode("TODAY");
              setSelectedDate(today);
              setWeekStart(getStartOfWeek(today));
              setDateFilterAnchor(null);
            }}
          >
            Today
          </MenuItem>
          <MenuItem
            selected={dateFilterMode === "WEEK" && isSameDate(weekStart, getStartOfWeek(new Date()))}
            onClick={() => {
              const today = normalizeDate(new Date());
              setDateFilterMode("WEEK");
              setWeekStart(getStartOfWeek(today));
              setSelectedDate(null);
              setDateFilterAnchor(null);
            }}
          >
            This Week
          </MenuItem>
          <MenuItem
            selected={dateFilterMode === "WEEK" && weekStart < getStartOfWeek(new Date())}
            onClick={() => {
              setDateFilterMode("WEEK");
              setWeekStart((current) => getStartOfWeek(new Date(current.setDate(current.getDate() - 7))));
              setSelectedDate(null);
              setDateFilterAnchor(null);
            }}
          >
            Previous Week
          </MenuItem>
          <MenuItem
            selected={dateFilterMode === "WEEK" && weekStart > getStartOfWeek(new Date())}
            onClick={() => {
              setDateFilterMode("WEEK");
              setWeekStart((current) => getStartOfWeek(new Date(current.setDate(current.getDate() + 7))));
              setSelectedDate(null);
              setDateFilterAnchor(null);
            }}
          >
            Next Week
          </MenuItem>
          <Divider sx={{ borderColor: "var(--nx-border)", my: 0.5 }} />
          <Box sx={{ px: 1, pt: 1 }}>
            <Typography variant="subtitle2" sx={{ color: "var(--nx-text-soft)", mb: 1 }}>
              Select specific date
            </Typography>
            <TextField
              type="date"
              fullWidth
              size="small"
              value={formatDateInputValue(selectedDate ?? new Date())}
              onChange={(event) => {
                const date = normalizeDate(event.target.value);
                if (date) {
                  setDateFilterMode("SPECIFIC_DATE");
                  setSelectedDate(date);
                  setWeekStart(getStartOfWeek(date));
                }
                setDateFilterAnchor(null);
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.2,
                  backgroundColor: "var(--nx-panel-2)",
                },
                input: {
                  color: "var(--nx-text)",
                },
              }}
            />
          </Box>
        </Stack>
      </Popover>

      {refreshing ? (
        <Typography variant="body2" sx={{ color: "var(--nx-muted)", textAlign: "right", mt: -1 }}>
          Refreshing timesheets...
        </Typography>
      ) : null}

      {loading ? (
        <Card sx={{ p: 3 }}>
          <Typography sx={{ color: "var(--nx-text-soft)" }}>Loading team timesheets...</Typography>
        </Card>
      ) : displayedItems.length === 0 ? (
        <Card sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            No timesheets to review.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {displayedItems.map((item) => {
            const isSubmitted = item.status === "SUBMITTED";

            return (
              <Card key={item.id} sx={{ p: 2.5 }}>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        {item.developerName || "Developer"}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
                        {item.projectName || "Project"} • {item.taskTitle || "No task"} • {formatLocalDate(item.workDate)}
                      </Typography>
                    </Box>
                    <Chip label={item.status} color={chipColor(item.status)} size="small" />
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label={`${item.hours} hrs`} variant="outlined" sx={neutralChipSx} />
                    <Chip label={item.workLocation} variant="outlined" sx={neutralChipSx} />
                    {item.description ? <Chip label={item.description} variant="outlined" sx={neutralChipSx} /> : null}
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }}>
                    <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
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
                          sx={disabledButtonSx}
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
                          sx={disabledButtonSx}
                        >
                          Reject
                        </Button>
                      </Stack>
                    ) : (
                      <Chip label="Read only" variant="outlined" sx={disabledChipSx} />
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
            <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
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
                  backgroundColor: "var(--nx-input)",
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
      <Typography variant="caption" sx={{ color: "var(--nx-muted)", textTransform: "uppercase", letterSpacing: 1 }}>
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

function getStartOfWeek(date) {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  current.setDate(diff);
  current.setHours(0, 0, 0, 0);
  return current;
}

function getEndOfWeek(date) {
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startFmt = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endFmt = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${startFmt} - ${endFmt}`;
}

function formatCompactDate(date) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateInputValue(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDate(value) {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function isSameDate(a, b) {
  const left = normalizeDate(a);
  const right = normalizeDate(b);
  if (!left || !right) return false;
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function formatDateLabel(mode, selectedDate, weekStart, weekEnd) {
  if (mode === "ALL_DATES") {
    return "All Dates";
  }

  if (mode === "TODAY") {
    return `Today: ${formatCompactDate(selectedDate ?? new Date())}`;
  }

  if (mode === "SPECIFIC_DATE") {
    return `Date: ${formatCompactDate(selectedDate ?? new Date())}`;
  }

  if (mode === "WEEK") {
    return `Week: ${formatDateRange(weekStart, weekEnd)}`;
  }

  return "All Dates";
}

function filterTimesheetsByStatus(items, status) {
  if (!Array.isArray(items)) return [];
  if (!status || status === "ALL") return items;
  return items.filter((item) => {
    if (status === "PENDING") {
      return item.status === "SUBMITTED";
    }
    return item.status === status;
  });
}

function filterTimesheetsByDateMode(items, mode, selectedDate, weekStart) {
  if (!Array.isArray(items)) return [];

  if (mode === "ALL_DATES") {
    return items;
  }

  if (mode === "TODAY") {
    const today = normalizeDate(new Date());
    return items.filter((item) => isSameDate(item.workDate, today));
  }

  if (mode === "SPECIFIC_DATE") {
    const selected = normalizeDate(selectedDate);
    if (!selected) return items;
    return items.filter((item) => isSameDate(item.workDate, selected));
  }

  if (mode === "WEEK") {
    const start = normalizeDate(weekStart);
    if (!start) return items;
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return items.filter((item) => {
      const workDate = new Date(item.workDate);
      return workDate >= start && workDate <= end;
    });
  }

  return items;
}

function filterTimesheetsByWeek(items, weekStart) {
  if (!Array.isArray(items)) return [];
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return items.filter((item) => {
    const workDate = new Date(item.workDate);
    return workDate >= start && workDate <= end;
  });
}

function filterTimesheetsByDate(items, selectedDate) {
  if (!Array.isArray(items) || !selectedDate) return items;
  return items.filter((item) => isSameDate(item.workDate, selectedDate));
}

function calculateSummaryStats(items) {
  const summary = {
    submittedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalHours: 0,
  };

  if (!Array.isArray(items)) return summary;

  items.forEach((item) => {
    if (item.status === "SUBMITTED") {
      summary.submittedCount += 1;
    } else if (item.status === "APPROVED") {
      summary.approvedCount += 1;
    } else if (item.status === "REJECTED") {
      summary.rejectedCount += 1;
    }
    summary.totalHours += Number(item.hours || 0);
  });

  return summary;
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

