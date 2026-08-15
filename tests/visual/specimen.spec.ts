import { test, expect } from "@playwright/test";
import { readCatalog } from "../helpers/catalog";

const cases = [
  { id: "cosmos", viewport: { width: 1440, height: 1000 }, label: "desktop" },
  { id: "layout-classic", viewport: { width: 1440, height: 1000 }, label: "desktop" },
  { id: "cosmos", viewport: { width: 390, height: 844 }, label: "mobile" },
  { id: "layout-classic", viewport: { width: 390, height: 844 }, label: "mobile" },
] as const;

for (const visualCase of cases) {
  test(`${visualCase.id} remains visually stable on ${visualCase.label}`, async ({ page, request }) => {
    const items = await readCatalog(request);
    const item = items.find(({ id }) => id === visualCase.id);
    expect(item, `${visualCase.id} is missing from the catalog`).toBeTruthy();
    await page.setViewportSize(visualCase.viewport);
    await page.goto(`./#/items/${visualCase.id}?testMode=1&seed=42&time=1000`);
    const viewer = page.getByTestId("specimen-viewer");
    await expect(viewer).toBeVisible();
    await expect(viewer.getByRole("status")).toContainText("展品已就绪");
    await expect(viewer).toHaveScreenshot(`${visualCase.id}-${visualCase.label}-viewer.png`);
  });
}
