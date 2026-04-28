import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import DownloadIcon from "@mui/icons-material/Download";

/**
 * AdminTimesheets - View all submitted timesheets
 * 
 * TODO: Connect to backend endpoints:
 * - GET /api/admin/timesheets
 * - GET /api/admin/timesheets?userId=X&projectId=Y&status=Z&dateFrom=X&dateTo=Y
 * 
 * Features to implement:
 * - Filter by user, project, task, status, date range
 * - Sort by date, user, project, hours
 * - Export timesheets to CSV/PDF (later)
 * - View timesheet details
 * - Bulk actions (later)
 */
export default function AdminTimesheets() {
  const [filters, setFilters] = useState({
    userId: "",
    projectId: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  });

  // TODO: Replace with actual backend data from GET /api/admin/timesheets
  const mockTimesheets = [];

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleExport = () => {
    // TODO: Implement CSV/PDF export
    alert("Export feature coming soon");
  };

  const getStatusColor = (status) => {
    const statusMap = {
      DRAFT: "default",
      SUBMITTED: "warning",
      APPROVED: "success",
      REJECTED: "error",
    };
    return statusMap[status] || "default";
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Timesheets
        </Typography>
        <Stack direction="row" gap={1}>
          <Button startIcon={<DownloadIcon />} variant="outlined" onClick={handleExport}>
            Export
          </Button>
        </Stack>
      </Stack>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 2, border: "1px solid rgba(148,163,184,0.16)" }}>
        <CardContent>
          <Stack direction="row" gap={2} flexWrap="wrap">
            <TextField
              label="Developer"
              size="small"
              value={filters.userId}
              onChange={(e) => handleFilterChange("userId", e.target.value)}
              placeholder="User name or ID"
            />
            <TextField
              label="Project"
              size="small"
              value={filters.projectId}
              onChange={(e) => handleFilterChange("projectId", e.target.value)}
              placeholder="Project name"
            />
            <TextField
              label="Status"
              select
              size="small"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              SelectProps={{ native: true }}
              sx={{ minWidth: 120 }}
            >
              <option value="">All</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </TextField>
            <TextField
              label="Date From"
              type="date"
              size="small"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Date To"
              type="date"
              size="small"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button startIcon={<FilterAltIcon />} variant="outlined" size="small">
              Apply
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Timesheets Table */}
      <Paper sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.16)", overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: "rgba(104,81,255,0.08)" }}>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }}>Developer</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }}>Project</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }}>Task</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }} align="right">
                Hours
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }}>Approved By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockTimesheets.map((timesheet) => (
              <TableRow
                key={timesheet.id}
                sx={{
                  "&:hover": { background: "rgba(104,81,255,0.04)" },
                  cursor: "pointer",
                  borderBottom: "1px solid rgba(148,163,184,0.16)",
                }}
              >
                <TableCell sx={{ color: "#cbd5e1" }}>{timesheet.workDate}</TableCell>
                <TableCell sx={{ color: "#cbd5e1" }}>{timesheet.userName}</TableCell>
                <TableCell sx={{ color: "#cbd5e1" }}>{timesheet.projectName}</TableCell>
                <TableCell sx={{ color: "#cbd5e1" }}>{timesheet.taskName}</TableCell>
                <TableCell sx={{ color: "#cbd5e1", fontWeight: 500 }} align="right">
                  {timesheet.hoursWorked}h
                </TableCell>
                <TableCell>
                  <Chip
                    label={timesheet.status}
                    size="small"
                    color={getStatusColor(timesheet.status)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell sx={{ color: "#cbd5e1" }}>{timesheet.approvedBy || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {mockTimesheets.length === 0 && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="h6" sx={{ color: "#cbd5e1", mb: 1 }}>
            No timesheet entries found.
          </Typography>
          <Typography sx={{ color: "#94a3b8" }}>
            Adjust filters or check back later for submitted timesheets.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
