import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],

  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },

  resolve: {
    alias: {
      "@": fileURLToPath(
        new URL("./src", import.meta.url)
      ),

      "@core": fileURLToPath(
        new URL("./src/core", import.meta.url)
      ),

      "@db": fileURLToPath(
        new URL("./src/core/database", import.meta.url)
      ),
    },
  },

  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,

    host: host || false,

    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,

    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});