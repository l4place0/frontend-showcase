import { test, expect } from "@playwright/test";

test.describe.configure({ timeout: 60_000 });

test("Schwarzschild lab teaches the raytracing pipeline in six steps", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));

  await page.goto("./items/gargantua-black-hole/index.html?capture=1&stage=0");
  await expect(page.locator("html")).toHaveAttribute("data-capture-ready", "true", { timeout: 30_000 });
  await expect(page.locator("html")).toHaveAttribute("data-lesson", "1");
  await expect(page.locator("[data-step]")).toHaveCount(6);
  await expect(page.locator("input, select, audio")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /三维空间/ })).toBeVisible();
  await expect(page.locator("#app")).toHaveClass(/space-mode/);
  await expect(page.locator("#label-camera")).toHaveText(/相机位置/);

  await page.getByRole("button", { name: "第二步：像素射线束" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-lesson", "2");
  await expect(page.getByRole("heading", { name: /每个像素/ })).toBeVisible();
  await expect(page.locator("#label-ray")).toHaveText(/每个像素一个方向/);

  await page.getByRole("button", { name: "第三步：单条弯曲光线" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-lesson", "3");
  await expect(page.getByRole("heading", { name: /直线如何变成/ })).toBeVisible();
  await expect(page.locator("#label-horizon")).toHaveText(/事件视界参考/);

  await page.getByRole("button", { name: "第四步：像素捕获与阴影" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-lesson", "4");
  await expect(page.getByRole("heading", { name: /阴影不是黑球/ })).toBeVisible();
  await expect(page.locator("#capture-key")).toBeVisible();
  await expect(page.locator("#capture-key")).toContainText("CAPTURED");

  await page.getByRole("button", { name: "第五步：光子球与临界光线" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-lesson", "5");
  await expect(page.getByRole("heading", { name: /临界亮环/ })).toBeVisible();
  await expect(page.locator("#critical-key")).toBeVisible();
  await expect(page.locator("#critical-key")).toContainText("b ≈ bc");
  await expect(page.locator("#critical-guides .guide-ring")).toBeVisible();
  await expect(page.locator("#critical-guides .axis-x")).toBeVisible();
  await expect(page.locator("#critical-guides .axis-y")).toBeVisible();
  await expect(page.locator("#critical-guides .impact-half")).toBeVisible();
  await expect(page.locator("#critical-guides .impact-outer")).toBeVisible();
  await expect(page.locator("#guide-angle")).toContainText("αc =");
  await expect(page.locator("#app")).toHaveAttribute("style", /--critical-radius: \d/);
  await expect(page.locator("#app")).toHaveAttribute("style", /--half-impact-radius: \d/);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("html")).toHaveAttribute("data-lesson", "6");

  const capture = await page.evaluate(() => (window as typeof window & {
    __GARGANTUA_CAPTURE__: () => { ready: boolean; dataUrl: string | null; state: { stage: number; renderCount: number } };
  }).__GARGANTUA_CAPTURE__());
  expect(capture.ready).toBe(true);
  expect(capture.state.stage).toBe(5);
  expect(capture.dataUrl).toMatch(/^data:image\/png;base64,/);
  expect(errors).toEqual([]);
});

test("Schwarzschild lab animates particles only in the final stage", async ({ page }) => {
  await page.goto("./items/gargantua-black-hole/index.html?stage=4");
  await expect(page.locator("html")).toHaveAttribute("data-capture-ready", "true", { timeout: 30_000 });
  const before = await page.evaluate(() => (window as typeof window & {
    __GARGANTUA_CAPTURE__: () => { state: { renderCount: number } };
  }).__GARGANTUA_CAPTURE__().state.renderCount);
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => (window as typeof window & {
    __GARGANTUA_CAPTURE__: () => { state: { renderCount: number } };
  }).__GARGANTUA_CAPTURE__().state.renderCount);
  expect(after).toBe(before);

  await page.getByRole("button", { name: "第六步：像素成像" }).click();
  await expect.poll(async () => page.evaluate(() => (window as typeof window & {
    __GARGANTUA_CAPTURE__: () => { state: { renderCount: number } };
  }).__GARGANTUA_CAPTURE__().state.renderCount)).toBeGreaterThan(before);
});

test("Schwarzschild capture mode freezes the final stage at a deterministic time", async ({ page }) => {
  await page.goto("./items/gargantua-black-hole/index.html?capture=1&stage=5&time=1000");
  await expect(page.locator("html")).toHaveAttribute("data-capture-ready", "true", { timeout: 30_000 });
  const before = await page.evaluate(() => (window as typeof window & {
    __GARGANTUA_CAPTURE__: () => { state: { renderCount: number } };
  }).__GARGANTUA_CAPTURE__().state.renderCount);
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => (window as typeof window & {
    __GARGANTUA_CAPTURE__: () => { state: { renderCount: number } };
  }).__GARGANTUA_CAPTURE__().state.renderCount);
  expect(after).toBe(before);
});

test("Schwarzschild lab keeps the lesson readable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./items/gargantua-black-hole/index.html?capture=1&stage=0");
  await expect(page.locator("html")).toHaveAttribute("data-capture-ready", "true", { timeout: 30_000 });
  await expect(page.locator(".lesson")).toBeVisible();
  await page.getByRole("button", { name: "下一步 →" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-lesson", "2");
  await expect(page.getByText("dᵢⱼ = normalize", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "下一步 →" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-lesson", "3");
  await expect(page.locator(".lesson-page:not([hidden]) .equation")).toContainText("H = ½");
  await page.getByRole("button", { name: "下一步 →" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-lesson", "4");
  await expect(page.locator(".lesson-page:not([hidden]) .equation")).toContainText("Sᵢⱼ = 1");
});
