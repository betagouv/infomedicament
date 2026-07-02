import path from "node:path";
import { defineConfig } from "vitest/config";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globalSetup: ["./src/testsUtils/globalSetup.ts"],
    setupFiles: ["./src/testsUtils/vitest.setup.ts"],
    exclude: [...configDefaults.exclude, "e2e/**"],
    testTimeout: 20000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
