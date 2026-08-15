import { defineConfig, devices } from "@playwright/test";

const browserPort = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${browserPort}/frontend-showcase/`;
const reportScope = process.env.PLAYWRIGHT_REPORT_SCOPE ?? "browser";
const useExistingDist = process.env.PLAYWRIGHT_USE_EXISTING_DIST === "1";
const webglTests = ["e2e/time-gallery.spec.ts", "e2e/time-gallery-reduced-motion.spec.ts"];

export default defineConfig({
  testDir: "./tests",
  testMatch: ["e2e/**/*.spec.ts", "visual/**/*.spec.ts"],
  outputDir: `.generated/test-results/${reportScope}`,
  snapshotDir: "./tests/visual/__snapshots__",
  snapshotPathTemplate: "{snapshotDir}/{testFilePath}/{arg}{ext}",
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
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      maxDiffPixelRatio: 0.01,
    },
  },
  projects: [
    {
      name: "e2e-chromium",
      testMatch: "e2e/**/*.spec.ts",
      testIgnore: webglTests,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webgl-chromium",
      testMatch: webglTests,
      fullyParallel: false,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "visual-chromium",
      testMatch: "visual/**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
        deviceScaleFactor: 1,
        colorScheme: "dark",
      },
    },
  ],
  use: {
    baseURL,
    trace: process.env.CI ? "retain-on-failure-and-retries" : "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: useExistingDist
          ? `npm exec vite -- preview --host 127.0.0.1 --port ${browserPort} --strictPort`
          : `npm run build && npm exec vite -- preview --host 127.0.0.1 --port ${browserPort} --strictPort`,
        port: browserPort,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
