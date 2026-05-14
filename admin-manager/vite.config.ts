import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      // proxy AI service and backend endpoints to the local servers
      "/api": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
        secure: false,
      },
      "/ws": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/assign": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
      "/skill": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
      "/health": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
    }
  },

  // ✅ FIX for SockJS "global is not defined"
  define: {
    global: "window"
  }
});