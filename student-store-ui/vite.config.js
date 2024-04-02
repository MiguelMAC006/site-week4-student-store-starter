import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig((envConfig) => ({
  plugins: [
    react({
      include: ["./src/main.jsx"],
    }),
  ],
  server: {
    port: 5173,
    open: true,
    host: true,
  },
}))
