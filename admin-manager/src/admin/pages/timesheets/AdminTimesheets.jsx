import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Card from "../../../components/ui/Card.jsx";
import Input from "../../../components/ui/Input.jsx";
import { formatDate } from "../../../utils/formatDate.js";
import {
  fetchAdminTimesheetSummary,
  fetchAdminTimesheets,
} from "../../../services/timesheetService.js";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Pending", value: "SUBMITTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const emptyFilters = {
  status: "",
  developerId: "",
  projectId: "",
  fromDate: "",
  toDate: "",
};

export default function AdminTimesheets() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async (overrideFilters = filters) => {
    try {
      setLoading(true);
      setError("");

      const normalized = {
        status: overrideFilters.status || undefined,
        developerId: asNumber(overrideFilters.developerId),
        projectId: asNumber(overrideFilters.projectId),
        fromDate: overrideFilters.fromDate || undefined,
        toDate: overrideFilters.toDate || undefined,
      };

      const [timesheets, timesheetSummary] = await Promise.all([
        fetchAdminTimesheets(normalized),
        fetchAdminTimesheetSummary(normalized),
      ]);

      setItems(Array.isArray(timesheets) ? timesheets : []);
      setSummary(timesheetSummary ?? null);
    } catch (err) {
      setError(err?.message || "Failed to load timesheets.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summaryCards = useMemo(() => ([
    { label: "Total Entries", value: summary?.totalEntries ?? 0 },
    { label: "Total Hours", value: formatHours(summary?.totalHours) },
    { label: "Submitted", value: summary?.submittedCount ?? 0 },
    { label: "Approved", value: summary?.approvedCount ?? 0 },
    { label: "Rejected", value: summary?.rejectedCount ?? 0 },
  ]), [summary]);

  const handleSearch = async () => {
    await loadData(filters);
  };

  const handleClear = async () => {
    setFilters(emptyFilters);
    await loadData(emptyFilters);
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
            All Timesheets
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.75 }}>
            View all recorded work hours.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ alignSelf: { xs: "stretch", md: "auto" } }} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
          <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => loadData(filters)}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={2}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} md={2.4} key={card.label}>
            <SummaryCard label={card.label} value={card.value} />
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, background: "#0b1628", border: "1px solid rgba(255,255,255,0.10)" }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Input
              select
              label="Status"
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.label} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Input>
            <Input
              label="Developer ID"
              value={filters.developerId}
              onChange={(event) => setFilters((current) => ({ ...current, developerId: event.target.value }))}
            />
            <Input
              label="Project ID"
              value={filters.projectId}
              onChange={(event) => setFilters((current) => ({ ...current, projectId: event.target.value }))}
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Input
              type="date"
              label="From date"
              value={filters.fromDate}
              onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <Input
              type="date"
              label="To date"
              value={filters.toDate}
              onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="flex-end">
            <Button variant="contained" onClick={handleSearch}>
              Search
            </Button>
            <Button variant="outlined" onClick={handleClear}>
              Clear
            </Button>
            <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => loadData(filters)}>
              Refresh
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Card sx={{ p: 0, overflow: "hidden" }}>
        <Box sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headCell}>Developer</TableCell>
                <TableCell sx={headCell}>Project</TableCell>
                <TableCell sx={headCell}>Task</TableCell>
                <TableCell sx={headCell}>Date</TableCell>
                <TableCell sx={headCell}>Hours</TableCell>
                <TableCell sx={headCell}>Location</TableCell>
                <TableCell sx={headCell}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={tableCellEmpty}>Loading timesheets...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={tableCellEmpty}>No timesheets found.</TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={tableCell}>{item.developerName || "-"}</TableCell>
                    <TableCell sx={tableCell}>{item.projectName || "-"}</TableCell>
                    <TableCell sx={tableCell}>{item.taskTitle || "-"}</TableCell>
                    <TableCell sx={tableCell}>{formatDate(item.workDate)}</TableCell>
                    <TableCell sx={tableCell}>{item.hours}</TableCell>
                    <TableCell sx={tableCell}>{item.workLocation || "-"}</TableCell>
                    <TableCell sx={tableCell}>
                      <Chip label={item.status} color={chipColor(item.status)} size="small" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>
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

function asNumber(value) {
  if (value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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

const headCell = {
  color: "#cbd5e1",
  fontWeight: 800,
  borderBottomColor: "rgba(148,163,184,0.14)",
};

const tableCell = {
  color: "#e5e7eb",
  borderBottomColor: "rgba(148,163,184,0.10)",
};

const tableCellEmpty = {
  color: "#94a3b8",
  textAlign: "center",
  py: 4,
  borderBottomColor: "rgba(148,163,184,0.10)",
};
