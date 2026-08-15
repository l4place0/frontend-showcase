import { test, expect } from "./fixtures";

test("story gallery exposes component stories", async ({ page }) => {
  await page.goto("/playwright/gallery/index.html");
  const storyIds = await page.evaluate(() => window.listStories());
  expect(storyIds.length).toBeGreaterThan(0);
});

declare global {
  interface Window {
    listStories: () => string[];
  }
}
