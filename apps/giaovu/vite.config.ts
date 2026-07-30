import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@sotam/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
  server: { port: 5174 },
  build: { outDir: "dist", sourcemap: true },
});
