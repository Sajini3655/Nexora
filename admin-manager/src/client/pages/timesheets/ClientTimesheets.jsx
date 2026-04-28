import React, { useState } from "react";
import {
  Box,
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
import Button from "@mui/material/Button";

/**
 * ClientTimesheets - Read-only view of approved hours for client projects
 * 
 * TODO: Connect to backend endpoint:
 * - GET /api/client/timesheets (only APPROVED entries)
 * - GET /api/client/timesheets?projectId=X&dateFrom=Y&dateTo=Z (filtered)
 * 
 * Features:
 * - Read-only view of approved hours
 * - Filter by project, date range
 * - View developer names and hours worked
 * - See project totals
 * - Cannot create, edit, or approve timesheets
 */
export default function ClientTimesheets() {
  const [filters, setFilters] = useState({
    projectId: "",
    dateFrom: "",
    dateTo: "",
  });

  // TODO: Replace with actual backend data from GET /api/client/timesheets (only APPROVED)
  const mockTimesheets = [];

  // TODO: Fetch projects from backend
  const mockProjects = [];

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const filteredTimesheets = mockTimesheets.filter((ts) => {
    if (filters.projectId && ts.projectId !== filters.projectId) return false;
    if (filters.dateFrom && ts.workDate < filters.dateFrom) return false;
    if (filters.dateTo && ts.workDate > filters.dateTo) return false;
    return true;
  });

  // Calculate totals by project
  const projectTotals = filteredTimesheets.reduce((acc, ts) => {
    const existing = acc.find((p) => p.projectId === ts.projectId);
    if (existing) {
      existing.hours += ts.hoursWorked;
    } else {
      acc.push({
        projectId: ts.projectId,
        projectName: ts.projectName,
        hours: ts.hoursWorked,
      });
    }
    return acc;
  }, []);

  const totalHours = filteredTimesheets.reduce((sum, ts) => sum + ts.hoursWorked, 0);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Project Timesheets
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
          Approved Hours: {totalHours}h
        </Typography>
      </Stack>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 2, border: "1px solid rgba(148,163,184,0.16)" }}>
        <CardContent>
          <Stack direction="row" gap={2} flexWrap="wrap">
            <TextField
              label="Project"
              select
              size="small"
              value={filters.projectId}
              onChange={(e) => handleFilterChange("projectId", e.target.value)}
              SelectProps={{ native: true }}
              sx={{ minWidth: 200 }}
            >
              <option value="">All Projects</option>
              {mockProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
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

      {/* Project Totals Summary */}
      {projectTotals.length > 0 && (
        <Stack direction="row" gap={2} mb={3} flexWrap="wrap">
          {projectTotals.map((proj) => (
            <Card
              key={proj.projectId}
              sx={{
                flex: "1 1 auto",
                minWidth: 160,
                borderRadius: 2,
                border: "1px solid rgba(148,163,184,0.16)",
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ color: "#94a3b8", mb: 1 }}>
                  {proj.projectName}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "#00ffaa" }}>
                  {proj.hours}h
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Timesheets Table */}
      <Paper sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.16)", overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: "rgba(104,81,255,0.08)" }}>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }}>Project</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }}>Developer</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }}>Task</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }} align="right">
                Hours
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }}>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTimesheets.map((timesheet) => (
              <TableRow
                key={timesheet.id}
                sx={{
                  "&:hover": { background: "rgba(104,81,255,0.04)" },
                  borderBottom: "1px solid rgba(148,163,184,0.16)",
                }}
              >
                <TableCell sx={{ color: "#cbd5e1" }}>{timesheet.workDate}</TableCell>
                <TableCell sx={{ color: "#cbd5e1" }}>{timesheet.projectName}</TableCell>
                <TableCell sx={{ color: "#cbd5e1" }}>{timesheet.developerName}</TableCell>
                <TableCell sx={{ color: "#cbd5e1" }}>{timesheet.taskName}</TableCell>
                <TableCell sx={{ color: "#cbd5e1", fontWeight: 500 }} align="right">
                  {timesheet.hoursWorked}h
                </TableCell>
                <TableCell sx={{ color: "#cbd5e1", maxWidth: 250, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {timesheet.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {filteredTimesheets.length === 0 && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="h6" sx={{ color: "#cbd5e1", mb: 1 }}>
            No approved timesheets found.
          </Typography>
          <Typography sx={{ color: "#94a3b8" }}>
            Approved hours for your projects will appear here.
          </Typography>
        </Box>
      )}

      {/* Info Box */}
      <Card sx={{ mt: 3, borderRadius: 2, border: "1px solid rgba(0,255,170,0.16)", background: "rgba(0,255,170,0.04)" }}>
        <CardContent>
          <Typography variant="body2" sx={{ color: "#00ffaa", fontWeight: 500 }}>
            ℹ️ You can view approved timesheets for your projects. This shows billable hours tracked by the development team.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
