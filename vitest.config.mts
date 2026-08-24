import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/components/uxdotsol/components": fileURLToPath(
        new URL("./registry/uxdotsol/components", import.meta.url),
      ),
      "@/components/uxdotsol/flows": fileURLToPath(
        new URL("./registry/uxdotsol/flows", import.meta.url),
      ),
      "@/components/uxdotsol/templates": fileURLToPath(
        new URL("./registry/uxdotsol/templates", import.meta.url),
      ),
      "@/hooks/uxdotsol": fileURLToPath(
        new URL("./registry/uxdotsol/hooks", import.meta.url),
      ),
      "@/lib/uxdotsol": fileURLToPath(
        new URL("./registry/uxdotsol/lib", import.meta.url),
      ),
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 10_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "registry/uxdotsol/components/**/*.{ts,tsx}",
        "registry/uxdotsol/hooks/**/*.{ts,tsx}",
      ],
      exclude: ["**/*.d.ts"],
    },
  },
});
