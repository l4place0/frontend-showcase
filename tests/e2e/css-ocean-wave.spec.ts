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

  await page.getByLabel("黑夜模式").uncheck();
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
  await page.getByLabel("动画状态").selectOption("idle");
  await expect(frame.locator("html")).toHaveAttribute("data-animation-state", "idle");
});

test("CSS ocean wave keeps its standalone controls operable", async ({ page }) => {
  await page.goto("./items/css-ocean-wave/index.html");
  const root = page.locator("html");

  await expect(root).toHaveAttribute("data-night-mode", "false");
  await page.getByRole("button", { name: /开启黑夜模式/ }).click();
  await expect(root).toHaveAttribute("data-night-mode", "true");
  await page.getByRole("button", { name: /关闭黑夜模式/ }).click();
  await expect(root).toHaveAttribute("data-night-mode", "false");

  await expect(root).toHaveAttribute("data-animation-state", "idle");
  await page.getByRole("button", { name: /切换到激活动画状态/ }).click();
  await expect(root).toHaveAttribute("data-animation-state", "active");
  await page.getByRole("button", { name: /切换到闲置动画状态/ }).click();
  await expect(root).toHaveAttribute("data-animation-state", "idle");
});
