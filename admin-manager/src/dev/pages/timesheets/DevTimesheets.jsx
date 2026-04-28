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
import AddIcon from "@mui/icons-material/Add";
import SendIcon from "@mui/icons-material/Send";

/**
 * DevTimesheets - Add and manage own timesheets
 * 
 * TODO: Connect to backend endpoints:
 * - POST /api/developer/timesheets (create new)
 * - GET /api/developer/timesheets (view own)
 * - PATCH /api/developer/timesheets/{id}/submit (submit entry)
 * - DELETE /api/developer/timesheets/{id} (delete draft, optional)
 * 
 * Features to implement:
 * - Add new timesheet entry
 * - Select project (required)
 * - Select task (optional)
 * - Enter date
 * - Enter hours worked (must be > 0)
 * - Add work note/description
 * - Save as draft or submit immediately
 * - View own submitted entries and status
 * - View approval/rejection status
 */
export default function DevTimesheets() {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    projectId: "",
    taskId: "",
    workDate: new Date().toISOString().split("T")[0],
    hoursWorked: "",
    description: "",
  });

  // TODO: Replace with actual backend data from GET /api/developer/timesheets
  const mockTimesheets = [];

  // TODO: Fetch projects and tasks from backend
  const mockProjects = [];
  const mockTasks = [];

  const selectedProjectTasks = mockTasks.filter(
    (t) => t.projectId === formData.projectId
  );

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.projectId.trim()) {
      alert("Please select a project");
      return;
    }
    if (!formData.workDate.trim()) {
      alert("Please select a date");
      return;
    }
    if (!formData.hoursWorked || Number(formData.hoursWorked) <= 0) {
      alert("Hours must be greater than 0");
      return;
    }

    // TODO: Call POST /api/developer/timesheets with formData (status: DRAFT)
    alert("Timesheet saved as draft");
    setOpenDialog(false);
    resetForm();
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.projectId.trim()) {
      alert("Please select a project");
      return;
    }
    if (!formData.workDate.trim()) {
      alert("Please select a date");
      return;
    }
    if (!formData.hoursWorked || Number(formData.hoursWorked) <= 0) {
      alert("Hours must be greater than 0");
      return;
    }

    // TODO: Call POST /api/developer/timesheets with formData (status: SUBMITTED)
    alert("Timesheet submitted");
    setOpenDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      projectId: "",
      taskId: "",
      workDate: new Date().toISOString().split("T")[0],
      hoursWorked: "",
      description: "",
    });
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
          My Timesheets
        </Typography>
        <Stack direction="row" gap={2} alignItems="center">
          <Typography variant="body2" sx={{ color: "#94a3b8" }}>
            Total: {totalHours} hours
          </Typography>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => setOpenDialog(true)}
          >
            Add Entry
          </Button>
        </Stack>
      </Stack>

      {/* Timesheets Table */}
      <Paper sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.16)", overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: "rgba(104,81,255,0.08)" }}>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }}>Project</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }}>Task</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }} align="right">
                Hours
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#e2e8f0" }}>Status</TableCell>
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
                <TableCell sx={{ color: "#cbd5e1" }}>{timesheet.projectName}</TableCell>
                <TableCell sx={{ color: "#cbd5e1" }}>{timesheet.taskName}</TableCell>
                <TableCell sx={{ color: "#cbd5e1", fontWeight: 500 }} align="right">
                  {timesheet.hoursWorked}h
                </TableCell>
                <TableCell sx={{ color: "#cbd5e1", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {timesheet.description}
                </TableCell>
                <TableCell>
                  <Chip
                    label={timesheet.status}
                    size="small"
                    color={getStatusColor(timesheet.status)}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {mockTimesheets.length === 0 && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="h6" sx={{ color: "#cbd5e1", mb: 1 }}>
            No timesheet entries yet.
          </Typography>
          <Typography sx={{ color: "#94a3b8", mb: 3 }}>
            Create your first timesheet entry to track work hours.
          </Typography>
        </Box>
      )}

      {/* Add Entry Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Timesheet Entry</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ mt: 2 }}>
            <TextField
              label="Project"
              select
              fullWidth
              value={formData.projectId}
              onChange={(e) => {
                handleInputChange("projectId", e.target.value);
                handleInputChange("taskId", ""); // Reset task when project changes
              }}
              SelectProps={{ native: true }}
              required
            >
              <option value="">Select a project</option>
              {mockProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </TextField>

            <TextField
              label="Task (optional)"
              select
              fullWidth
              value={formData.taskId}
              onChange={(e) => handleInputChange("taskId", e.target.value)}
              SelectProps={{ native: true }}
              disabled={!formData.projectId}
            >
              <option value="">No specific task</option>
              {selectedProjectTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </TextField>

            <TextField
              label="Work Date"
              type="date"
              fullWidth
              value={formData.workDate}
              onChange={(e) => handleInputChange("workDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />

            <TextField
              label="Hours Worked"
              type="number"
              fullWidth
              inputProps={{ step: "0.5", min: "0" }}
              value={formData.hoursWorked}
              onChange={(e) => handleInputChange("hoursWorked", e.target.value)}
              required
            />

            <TextField
              label="Work Description"
              multiline
              rows={4}
              fullWidth
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="What did you work on?"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="outlined">
            Save as Draft
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<SendIcon />}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
