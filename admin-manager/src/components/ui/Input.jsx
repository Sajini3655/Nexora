import React from "react";
import { TextField } from "@mui/material";

export default function Input({ sx, ...props }) {
  return (
    <TextField
      fullWidth
      size="medium"
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: 2.2,
          backgroundColor: "var(--nx-input)",
          transition: "all 160ms ease",
          "& fieldset": {
            borderColor: "var(--nx-border)"
          },
          "&:hover fieldset": {
            borderColor: "var(--nx-border-strong)"
          },
          "&.Mui-focused fieldset": {
            borderColor: "var(--nx-purple)",
            borderWidth: 1
          }
        },
        "& .MuiInputLabel-root": {
          color: "var(--nx-muted)"
        },
        "& .MuiInputBase-input": {
          color: "var(--nx-text)"
        },
        ...sx
      }}
      {...props}
    />
  );
}

