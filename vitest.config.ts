import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "server/**/*.test.ts",
      "extension/**/*.test.tsx"
    ],
    exclude: [
      "node_modules",
      "dist",
      ".next",
      "extension/dist"
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "vitest.setup.ts",
        "**/*.test.ts",
        "**/*.test.tsx"
      ]
    },
    testTimeout: 10000
  }
});
