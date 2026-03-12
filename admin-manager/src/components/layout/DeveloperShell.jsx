import React from "react";
import DeveloperSidebar from "./DeveloperSidebar.jsx";
import DeveloperTopbar from "./DeveloperTopbar.jsx";
import Surface from "../ui/Surface.jsx";

export default function DeveloperShell({ children }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <DeveloperSidebar open={open} onClose={() => setOpen(false)} />
      <div style={{ flex: 1 }}>
        <DeveloperTopbar onMenuClick={() => setOpen((v) => !v)} />
        <div style={{ minHeight: 72 }} />
        <Surface>{children}</Surface>
      </div>
    </div>
  );
}
