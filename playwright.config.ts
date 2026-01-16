import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

const isCI = !!process.env.CI;
const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  retries: isCI ? 1 : 0,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  reporter: isCI
    ? [["junit", { outputFile: "junit-e2e.xml" }], ["html", { open: "never" }], ["list"]]
    : [["html", { open: "never" }], ["list"]],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
