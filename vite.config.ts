import { defineConfig } from "vite"
import preact from "@preact/preset-vite"

// https://vitejs.dev/config/
export default defineConfig({
  root: "./web-ui",
  server: {
    port: 8000,
  },
  plugins: [preact()],
})
