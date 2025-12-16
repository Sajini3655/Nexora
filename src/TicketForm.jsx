import React from "react";
import React, { useState, useEffect } from "react";
import { createTicket, updateTicket } from "./api";
import { TextField, Button, Paper, Stack } from "@mui/material";

const TicketForm = ({ ticket, onSaved, onCancel }) => {
  const [form, setForm] = useState({ title: "", description: "", status: "", assignee: "" });

  useEffect(() => {
    if (ticket) setForm(ticket);
  }, [ticket]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (ticket) await updateTicket(ticket.id, form);
    else await createTicket(form);
    onSaved();
    setForm({ title: "", description: "", status: "", assignee: "" });
  };

  return (
    <Paper style={{ padding: 20, marginTop: 20 }}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField label="Title" name="title" value={form.title} onChange={handleChange} required />
          <TextField label="Description" name="description" value={form.description} onChange={handleChange} required />
          <TextField label="Status" name="status" value={form.status} onChange={handleChange} required />
          <TextField label="Assignee" name="assignee" value={form.assignee} onChange={handleChange} required />
          <Stack direction="row" spacing={2}>
            <Button type="submit" variant="contained">{ticket ? "Update" : "Create"}</Button>
            <Button variant="outlined" onClick={onCancel}>Cancel</Button>
          </Stack>
        </Stack>
      </form>
    </Paper>
  );
};

export default TicketForm;
