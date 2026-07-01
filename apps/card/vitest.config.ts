import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      "**/node_modules/**",
      "**/.next/**",
      "**/.next-build/**",
      "**/dist/**"
    ],
    include: ["src/__tests__/**/*.test.ts"]
  }
});
