import React from "react";
import { Alert } from "@mui/material";

interface Props {
  ticketMessage: string;
}

const TicketPrompt: React.FC<Props> = ({ ticketMessage }) => {
  return <Alert severity="warning">{ticketMessage}</Alert>;
};

export default TicketPrompt;
