import { test, expect } from "@playwright/test";

test("time gallery stops idle WebGL redraws for reduced motion while preserving user control", async ({ page }) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./items/time-gallery-webgl/index.html");
  await page.locator('[data-action="start"]').click();
  await page.locator(".period-node").first().click();

  const webglRoot = page.locator("#webgl-root");
  await expect(webglRoot).toHaveAttribute("data-reduced-motion", "true");
  await expect.poll(async () => Number(await webglRoot.getAttribute("data-render-count") || 0), { timeout: 30_000 }).toBeGreaterThan(0);

  const idleCount = Number(await webglRoot.getAttribute("data-render-count"));
  await page.waitForTimeout(500);
  expect(Number(await webglRoot.getAttribute("data-render-count")) - idleCount).toBeLessThanOrEqual(1);

  await page.bringToFront();
  await page.keyboard.down("KeyW");
  try {
    await expect.poll(async () => Number(await webglRoot.getAttribute("data-render-count")), { timeout: 10_000 }).toBeGreaterThan(idleCount);
  } finally {
    await page.keyboard.up("KeyW");
  }
});
