import React from "react";
import React, { useEffect, useState } from "react";
import { getTickets, deleteTicket } from "./api";
import { Button, Table, TableBody, TableCell, TableHead, TableRow, Paper } from "@mui/material";

const TicketList = ({ onEdit }) => {
  const [tickets, setTickets] = useState([]);

  const fetchTickets = async () => {
    try {
      const res = await getTickets();
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleDelete = async (id) => {
    await deleteTicket(id);
    fetchTickets(); // refresh list
  };

  return (
    <Paper style={{ padding: 20 }}>
      <h2>Tickets</h2>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Assignee</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tickets.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{t.title}</TableCell>
              <TableCell>{t.description}</TableCell>
              <TableCell>{t.status}</TableCell>
              <TableCell>{t.assignee}</TableCell>
              <TableCell>
                <Button onClick={() => onEdit(t)}>Edit</Button>
                <Button color="error" onClick={() => handleDelete(t.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default TicketList;
