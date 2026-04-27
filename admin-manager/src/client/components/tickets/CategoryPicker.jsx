import React from "react";
import { TextField } from "@mui/material";

export default function CategoryPicker({ value, categories, onSelect }) {
  return (
    <TextField
      select
      label="Category"
      size="small"
      value={value}
      onChange={(e) => onSelect(e.target.value)}
      SelectProps={{ native: true }}
      fullWidth
    >
      <option value="">Select category</option>
      {categories.map((category) => (
        <option key={category} value={category}>
          {category}
        </option>
      ))}
    </TextField>
  );
}

