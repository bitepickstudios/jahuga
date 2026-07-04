import { defineConfig } from "vitest/config";

/** Tests contra el proyecto Supabase real. Cargan env de .env.local. */
export default defineConfig({
  test: {
    include: ["src/**/*.integration.test.ts"],
    env: loadEnvLocal(),
    testTimeout: 30_000,
  },
});

function loadEnvLocal(): Record<string, string> {
  // ponytail: parser mínimo de .env.local, evita dependencia dotenv
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const content: string = require("node:fs").readFileSync(".env.local", "utf8");
    return Object.fromEntries(
      content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
    );
  } catch {
    return {};
  }
}
