import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true, // ["9cc4ecaed446.ngrok-free.app"],
    proxy: {
      "/api": "http://localhost:8000",
      "/media": "http://localhost:8000",
      "/media-operator": "http://localhost:8000",
    },
  },
});
