import { test, expect } from "@playwright/test";

test("CSS ocean wave switches between daylight and moonlight through the catalog control", async ({ page }) => {
  await page.goto("./#/items/css-ocean-wave");
  const viewer = page.getByTestId("specimen-viewer");
  await expect(viewer.getByRole("status")).toContainText("展品已就绪");
  const frame = page.frameLocator('[data-testid="specimen-frame"]');
  await expect(frame.locator("html")).toHaveAttribute("data-night-mode", "false");
  await expect(frame.getByText("澄澈潮汐")).toBeVisible();

  await page.getByLabel("黑夜模式").check();
  await expect(frame.locator("html")).toHaveAttribute("data-night-mode", "true");
  await expect(frame.getByText("月下潮汐")).toBeVisible();

  await frame.getByRole("button", { name: /关闭黑夜模式/ }).click();
  await expect(frame.locator("html")).toHaveAttribute("data-night-mode", "false");

  await expect(frame.locator("html")).toHaveAttribute("data-animation-state", "idle");
  const idleDuration = Number.parseFloat(await frame.locator(".wave-far").evaluate((element) => getComputedStyle(element).animationDuration));
  const idleTop = Number.parseFloat(await frame.locator(".sea").evaluate((element) => getComputedStyle(element).top));
  await expect(frame.locator(".sea")).toHaveCSS("transition-timing-function", "cubic-bezier(0.22, 1, 0.36, 1)");
  await page.getByLabel("动画状态").selectOption("active");
  await expect(frame.locator("html")).toHaveAttribute("data-animation-state", "active");
  const activeDuration = Number.parseFloat(await frame.locator(".wave-far").evaluate((element) => getComputedStyle(element).animationDuration));
  await expect.poll(() => frame.locator(".sea").evaluate((element) => Number.parseFloat(getComputedStyle(element).top))).toBeLessThan(idleTop);
  expect(activeDuration).toBeLessThan(idleDuration);
  await frame.getByRole("button", { name: /切换到闲置动画状态/ }).click();
  await expect(frame.locator("html")).toHaveAttribute("data-animation-state", "idle");
});
