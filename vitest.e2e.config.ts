import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["extension/**/*.e2e.test.js"],
    exclude: ["node_modules", "dist"],
    testTimeout: 30000
  }
});
