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
          backgroundColor: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(12px)",
          transition: "all 160ms ease",
          "& fieldset": {
            borderColor: "rgba(255,255,255,0.14)"
          },
          "&:hover fieldset": {
            borderColor: "rgba(255,255,255,0.22)"
          },
          "&.Mui-focused fieldset": {
            borderColor: "rgba(124,92,255,0.75)",
            borderWidth: 1
          }
        },
        "& .MuiInputLabel-root": {
          color: "rgba(231,233,238,0.72)"
        },
        ...sx
      }}
      {...props}
    />
  );
}
