import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

/**
 * ManagerTimesheets - Review team timesheets
 * 
 * TODO: Connect to backend endpoints:
 * - GET /api/manager/timesheets
 * - GET /api/manager/timesheets?developerId=X&projectId=Y&status=Z&dateFrom=X&dateTo=Y
 * - PATCH /api/manager/timesheets/{id}/approve
 * - PATCH /api/manager/timesheets/{id}/reject
 * 
 * Features to implement:
 * - View timesheets for team members
 * - Filter by developer, project, task, status, date range
 * - View total hours per developer/project
 * - Approve/reject submitted entries
 * - Add rejection reason
 */
export default function ManagerTimesheets() {
  const [filters, setFilters] = useState({
    developerId: "",
    projectId: "",
    status: "SUBMITTED", // Default to submitted for managers
    dateFrom: "",
    dateTo: "",
  });

  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [actionDialog, setActionDialog] = useState(null); // 'approve' | 'reject' | null
  const [rejectionReason, setRejectionReason] = useState("");

  // TODO: Replace with actual backend data from GET /api/manager/timesheets
  const mockTimesheets = [];

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApprove = async () => {
    // TODO: Call PATCH /api/manager/timesheets/{id}/approve
    alert(`Approved timesheet ${selectedTimesheet.id}`);
    setActionDialog(null);
    setSelectedTimesheet(null);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    // TODO: Call PATCH /api/manager/timesheets/{id}/reject with rejectionReason
    alert(`Rejected timesheet ${selectedTimesheet.id}`);
    setActionDialog(null);
    setSelectedTimesheet(null);
    setRejectionReason("");
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

  const totalHours = mockTimesheets.reduce((sum, ts) => sum + ts.hoursWorked, 0);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Team Timesheets
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
          Total: {totalHours} hours
        </Typography>
      </Stack>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 2, border: "1px solid rgba(148,163,184,0.16)" }}>
        <CardContent>
          <Stack direction="row" gap={2} flexWrap="wrap">
            <TextField
              label="Developer"
              size="small"
              value={filters.developerId}
              onChange={(e) => handleFilterChange("developerId", e.target.value)}
              placeholder="Developer name"
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
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockTimesheets.map((timesheet) => (
              <TableRow
                key={timesheet.id}
                sx={{
                  "&:hover": { background: "rgba(104,81,255,0.04)" },
                  borderBottom: "1px solid rgba(148,163,184,0.16)",
                }}
              >
                <TableCell sx={{ color: "#cbd5e1" }}>{timesheet.workDate}</TableCell>
                <TableCell sx={{ color: "#cbd5e1" }}>{timesheet.developerName}</TableCell>
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
                <TableCell>
                  <Stack direction="row" gap={1}>
                    {timesheet.status === "SUBMITTED" && (
                      <>
                        <Button
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => {
                            setSelectedTimesheet(timesheet);
                            setActionDialog("approve");
                          }}
                          sx={{ color: "#10b981" }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          startIcon={<CancelIcon />}
                          onClick={() => {
                            setSelectedTimesheet(timesheet);
                            setActionDialog("reject");
                          }}
                          sx={{ color: "#ef4444" }}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </Stack>
                </TableCell>
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
            Your team members will submit timesheets for your review here.
          </Typography>
        </Box>
      )}

      {/* Approval Dialog */}
      <Dialog open={actionDialog === "approve"} onClose={() => setActionDialog(null)}>
        <DialogTitle>Approve Timesheet</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ my: 2, color: "#cbd5e1" }}>
            Approve {selectedTimesheet?.hoursWorked} hours on {selectedTimesheet?.workDate}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(null)}>Cancel</Button>
          <Button onClick={handleApprove} variant="contained" color="success">
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={actionDialog === "reject"} onClose={() => setActionDialog(null)}>
        <DialogTitle>Reject Timesheet</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: "#cbd5e1" }}>
            Rejecting {selectedTimesheet?.hoursWorked} hours on {selectedTimesheet?.workDate}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please explain why this timesheet is being rejected"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(null)}>Cancel</Button>
          <Button onClick={handleReject} variant="contained" color="error">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
