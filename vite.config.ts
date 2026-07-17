import { defineConfig } from 'vite'
import path from "path"
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/ui"),
    },
  },
  build: {
    outDir: "dist-react"
  },
  server: {
    port: 5123,
    strictPort: true
  }
})
