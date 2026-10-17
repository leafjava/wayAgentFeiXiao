import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@app": path.resolve(__dirname, "app"),
      "@components": path.resolve(__dirname, "components"),
    },
  },
  test: {
    environment: "node",
    fileParallelism: false,
    include: ["test/**/*.test.ts"],
    globals: false,
  },
});
