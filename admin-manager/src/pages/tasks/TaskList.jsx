import React, { useMemo, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Drawer,
  Divider,
  MenuItem
} from "@mui/material";

import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

const demoTasks = [
  { id: 101, title: "Setup project repo", assignee: "Dev B", status: "TODO", priority: "HIGH", due: "2025-12-20" },
  { id: 102, title: "Design dashboard UI", assignee: "Admin One", status: "IN_PROGRESS", priority: "MEDIUM", due: "2025-12-22" },
  { id: 103, title: "Implement JWT auth", assignee: "Manager A", status: "DONE", priority: "HIGH", due: "2025-12-18" }
];

const statusOptions = ["TODO", "IN_PROGRESS", "DONE"];
const priorityOptions = ["LOW", "MEDIUM", "HIGH"];

export default function TaskList() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return demoTasks.filter((t) => {
      const matchesQ =
        !s ||
        t.title.toLowerCase().includes(s) ||
        t.assignee.toLowerCase().includes(s);
      const matchesStatus = !statusFilter || t.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [q, statusFilter]);

  return (
    <Box>
      <PageHeader
        title="Tasks"
        subtitle="Track work, assignments, and progress."
        right={<Button variant="outlined">Create Task</Button>}
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12}>
          <Card sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
              <Input
                label="Search tasks"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                sx={{ minWidth: 240 }}
              />
              <Input
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ width: 180 }}
              >
                <MenuItem value="">All</MenuItem>
                {statusOptions.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Input>

              <Box sx={{ flexGrow: 1 }} />
              <Button variant="outlined">Bulk Actions</Button>
            </Box>

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ opacity: 0.8 }}>Title</TableCell>
                  <TableCell sx={{ opacity: 0.8 }}>Assignee</TableCell>
                  <TableCell sx={{ opacity: 0.8 }}>Status</TableCell>
                  <TableCell sx={{ opacity: 0.8 }}>Priority</TableCell>
                  <TableCell sx={{ opacity: 0.8 }}>Due</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((t) => (
                  <TableRow
                    key={t.id}
                    hover
                    onClick={() => setSelected(t)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell sx={{ fontWeight: 900 }}>{t.title}</TableCell>
                    <TableCell sx={{ opacity: 0.85 }}>{t.assignee}</TableCell>
                    <TableCell>
                      <Chip size="small" label={t.status} />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" label={t.priority} />
                    </TableCell>
                    <TableCell sx={{ opacity: 0.85 }}>{t.due}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Grid>
      </Grid>

      <Drawer
        anchor="right"
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 460 },
            p: 2.5,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
            borderLeft: "1px solid rgba(255,255,255,0.10)"
          }
        }}
      >
        <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
          Task Details
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          View & edit (backend later)
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Info label="Title" value={selected?.title} />
        <Info label="Assignee" value={selected?.assignee} />

        <Input select label="Status" defaultValue={selected?.status || "TODO"} sx={{ mb: 2 }}>
          {statusOptions.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </Input>

        <Input select label="Priority" defaultValue={selected?.priority || "MEDIUM"} sx={{ mb: 2 }}>
          {priorityOptions.map((p) => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </Input>

        <Input label="Due Date" defaultValue={selected?.due || ""} sx={{ mb: 2 }} />

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" fullWidth>
            Delete
          </Button>
          <Button fullWidth>Save</Button>
        </Box>
      </Drawer>
    </Box>
  );
}

function Info({ label, value }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" sx={{ opacity: 0.7 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 900 }}>{value || "-"}</Typography>
    </Box>
  );
}
