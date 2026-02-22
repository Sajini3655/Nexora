import React from "react";
import { Button, Box } from "@mui/material";

interface Props {
  startChat: () => void;
  endChat: () => void;
  chatStarted: boolean;
}

const ControlButtons: React.FC<Props> = ({ startChat, endChat, chatStarted }) => {
  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <Button variant="contained" color="success" onClick={startChat} disabled={chatStarted}>
        Start Chat
      </Button>
      <Button variant="contained" color="error" onClick={endChat} disabled={!chatStarted}>
        End Chat
      </Button>
    </Box>
  );
};

export default ControlButtons;
