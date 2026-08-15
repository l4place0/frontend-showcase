import { defineConfig, devices } from "@playwright/test";

const componentPort = Number(process.env.PLAYWRIGHT_COMPONENT_PORT ?? 4174);
const reportScope = process.env.PLAYWRIGHT_REPORT_SCOPE ?? "components";

export default defineConfig({
  testDir: "./tests/components",
  outputDir: `.generated/test-results/${reportScope}`,
  snapshotDir: "./tests/components/__snapshots__",
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  retryStrategy: process.env.CI ? "isolated" : "immediate",
  failOnFlakyTests: Boolean(process.env.CI),
  reporter: process.env.CI
    ? [
        ["github"],
        ["html", { outputFolder: `.generated/playwright-report/${reportScope}`, open: "never" }],
        ["json", { outputFile: `.generated/test-results/${reportScope}/results.json` }],
      ]
    : "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://127.0.0.1:${componentPort}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `npm exec vite -- --config playwright/gallery/vite.config.ts --port ${componentPort} --strictPort`,
    port: componentPort,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
