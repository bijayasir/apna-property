import { defineConfig } from "@playwright/test";
import fs from "node:fs";

const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  expect: { timeout: 10000 },
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "test-results/audit-results.json" }]],
  use: {
    baseURL: "http://localhost:3100",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: { executablePath: process.env.APNA_BROWSER_EXECUTABLE || (fs.existsSync(edge) ? edge : undefined) },
  },
  webServer: {
    command: "npm run start -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
