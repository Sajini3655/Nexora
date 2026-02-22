import React, { useState } from "react";
import { TextField, IconButton, Box } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

interface Props {
  sendMessage: (msg: string) => void;
}

const MessageInput: React.FC<Props> = ({ sendMessage }) => {
  const [msg, setMsg] = useState("");

  const handleSend = () => {
    if (msg.trim()) {
      sendMessage(msg);
      setMsg("");
    }
  };

  return (
    <Box sx={{ display: "flex", mb: 2 }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Type a message..."
        value={msg}
        onChange={e => setMsg(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSend()}
      />
      <IconButton color="primary" onClick={handleSend}>
        <SendIcon />
      </IconButton>
    </Box>
  );
};

export default MessageInput;
