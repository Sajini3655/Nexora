import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173
  },

  // ✅ FIX for SockJS "global is not defined"
  define: {
    global: "window"
  }
});