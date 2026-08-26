import { test, expect } from "@playwright/test";

test("living digital organism responds to scroll, pointer and catalog controls", async ({ page }) => {
  await page.goto("./#/items/living-digital-organism");
  const viewer = page.getByTestId("specimen-viewer");
  await expect(viewer.getByRole("status")).toContainText("展品已就绪");

  const frame = page.frameLocator('[data-testid="specimen-frame"]');
  const canvas = frame.locator("#organism");
  await expect(canvas).toBeVisible();
  await expect.poll(async () => Number(await canvas.getAttribute("data-render-count") || 0)).toBeGreaterThan(0);
  await expect.poll(async () => Number(await canvas.getAttribute("data-particle-count") || 0)).toBeGreaterThan(5_000);

  await frame.locator('[data-action="enter"]').click();
  await expect.poll(async () => frame.locator("#progress-number").textContent()).not.toBe("00");

  await page.getByLabel("生命强度").fill("140");
  await expect(frame.locator("html")).toHaveCSS("--organism-intensity", "1.4");
  await page.getByLabel("粒子扰动").fill("95");
  await expect(frame.locator("html")).toHaveCSS("--organism-turbulence", "0.95");
  await page.getByLabel("低频形变增益").fill("18");
  await expect(frame.locator("html")).toHaveCSS("--organism-audio-low-gain", "0.18");
  await page.getByLabel("中频速度增益").fill("140");
  await expect(frame.locator("html")).toHaveCSS("--organism-audio-mid-gain", "1.4");
  await page.getByLabel("高频粒径增益").fill("220");
  await expect(frame.locator("html")).toHaveCSS("--organism-audio-high-gain", "2.2");
  await expect(canvas).toHaveAttribute("data-audio-low-gain", "0.180");
  await expect(canvas).toHaveAttribute("data-audio-mid-gain", "1.400");
  await expect(canvas).toHaveAttribute("data-audio-high-gain", "2.200");

  const sound = frame.locator("#sound-toggle");
  await expect(sound).toHaveAccessibleName("开启环境声音");
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await expect(sound).toHaveAccessibleName("关闭环境声音");

  const spectrum = frame.locator("#spectrum-toggle");
  await spectrum.click();
  await expect(spectrum).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => {
    const bands = await canvas.evaluate((element) => [element.dataset.audioLow, element.dataset.audioMid, element.dataset.audioHigh].map(Number));
    return bands.every((value) => value > .05);
  }).toBe(true);

  const canvasBox = await canvas.boundingBox();
  if (!canvasBox) throw new Error("Organism canvas has no bounding box");
  await page.mouse.click(canvasBox.x + canvasBox.width * .88, canvasBox.y + canvasBox.height * .55);
  await expect.poll(async () => Number(await canvas.getAttribute("data-impact-count") || 0)).toBeGreaterThan(0);
  await expect(canvas).toHaveAttribute("data-last-impact", /\d+\.\d{3},\d+\.\d{3}/);
  await expect(canvas).toHaveAttribute("data-collision-model", "swept-disc-shell");
  await expect.poll(async () => Number(await canvas.getAttribute("data-first-collision-delay") || 0)).toBeGreaterThan(50);
  await expect.poll(async () => Number(await canvas.getAttribute("data-last-scattered") || 0)).toBeGreaterThan(1_000);
  await expect.poll(async () => Number(await canvas.getAttribute("data-particle-kinetic") || 0)).toBeGreaterThan(.001);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/items/living-digital-organism?view=learn");
  await expect(page.getByTestId("specimen-viewer").getByRole("status")).toContainText("展品已就绪");
  const narrowFrame = page.frameLocator('[data-testid="specimen-frame"]');
  await expect.poll(() => narrowFrame.locator("html").evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

  await page.getByRole("navigation", { name: "学习视角" }).getByRole("button").nth(1).click();
  const hintCard = page.locator(".canvas-context-hint");
  await expect(hintCard).toContainText("圆形粒子与扫掠壳层相交");
  await expect.poll(() => hintCard.evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(true);
});
