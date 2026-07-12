import React, { createContext, useContext, useState } from "react";
import { closeWithBlur } from "../utils/focus";

const LayoutContext = createContext(null);

export function LayoutProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => closeWithBlur(() => setSidebarOpen(false));
  const toggleSidebar = () => setSidebarOpen((v) => !v);

  return (
    <LayoutContext.Provider
      value={{ sidebarOpen, openSidebar, closeSidebar, toggleSidebar }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}

