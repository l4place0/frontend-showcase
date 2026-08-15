import { test, expect } from "@playwright/test";
import { itemRoot, readCatalog, resolveItemResource } from "../helpers/catalog";

test("formal specimen enables learning as a view without reloading the item runtime", async ({ page }) => {
  await page.goto("./#/items/css-ocean-wave");
  const viewer = page.getByTestId("specimen-viewer");
  await expect(viewer.getByRole("status")).toContainText("展品已就绪");
  const frame = page.frameLocator('[data-testid="specimen-frame"]');
  const runtimeBefore = await frame.locator("html").evaluate(() => performance.timeOrigin);

  await page.getByTestId("learning-mode-toggle").click();
  await expect(page).toHaveURL(/#\/items\/css-ocean-wave\?view=learn$/);
  const workspace = page.getByTestId("integrated-exhibit-workspace");
  const stepper = page.getByRole("navigation", { name: "学习视角" });
  await expect(workspace).toHaveClass(/is-learning/);
  await expect(workspace).toHaveCSS("transition-property", /height.*grid-template-columns/);
  await expect(stepper.getByRole("button")).toHaveCount(4);
  await expect(page.getByTestId("specimen-annotations").getByRole("button")).toHaveCount(2);
  await expect(viewer).toHaveCount(1);
  const runtimeDuringLearning = await frame.locator("html").evaluate(() => performance.timeOrigin);
  expect(runtimeDuringLearning).toBe(runtimeBefore);

  await stepper.getByRole("button", { name: /原理/ }).click();
  await page.waitForTimeout(600);
  await page.getByText(/查看对应关键代码/).click();
  await expect(page.getByTestId("learning-code")).toContainText("animation-direction: alternate-reverse");
  await stepper.getByRole("button", { name: /实验/ }).click();
  const firstExperiment = page.locator(".experiment-card").first();
  await firstExperiment.getByRole("button", { name: /设置基线/ }).click();
  await expect(firstExperiment).toContainText("基线已设置");
  await firstExperiment.getByRole("button", { name: /应用变化/ }).click();
  await expect(firstExperiment).toContainText("已完成");
  const explanationHeight = await workspace.evaluate((element) => element.getBoundingClientRect().height);
  const documentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await stepper.getByRole("button", { name: /测验/ }).click();
  await page.waitForTimeout(600);
  expect(Math.abs(await workspace.evaluate((element) => element.getBoundingClientRect().height) - explanationHeight)).toBeLessThan(0.1);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(documentHeight);

  await page.getByTestId("learning-mode-toggle").click();
  await expect(page).toHaveURL(/#\/items\/css-ocean-wave$/);
  await expect(page.getByTestId("integrated-exhibit-workspace")).not.toHaveClass(/is-learning/);
  const runtimeAfter = await frame.locator("html").evaluate(() => performance.timeOrigin);
  expect(runtimeAfter).toBe(runtimeBefore);
});

test("annotation contract hides positional teaching when the specimen stage is too narrow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/items/css-ocean-wave?view=learn");
  await expect(page.getByTestId("specimen-viewer").getByRole("status")).toContainText("展品已就绪");
  await expect(page.getByTestId("annotation-scene-status")).toContainText("当前画布过窄");
  await expect(page.getByTestId("specimen-annotations")).toHaveCount(0);
});

test("learning controls remain keyboard reachable and suppress transitions for reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#/items/css-ocean-wave?view=learn");
  const workspace = page.getByTestId("integrated-exhibit-workspace");
  expect(await workspace.evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration))).toBeLessThan(0.001);
  const stepButtons = page.getByRole("navigation", { name: "学习视角" }).getByRole("button");
  await stepButtons.first().focus();
  await page.keyboard.press("Tab");
  await expect(stepButtons.nth(1)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(stepButtons.nth(1)).toHaveAttribute("aria-current", "step");
  const codeSummary = page.locator("details.code-reference summary");
  await codeSummary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("details.code-reference")).toHaveAttribute("open", "");
});

test("every specimen opens its learning view at a common desktop viewport around the same isolated runtime", async ({ page, request }) => {
  test.setTimeout(360_000);
  await page.setViewportSize({ width: 1689, height: 1246 });
  const items = await readCatalog(request);
  for (const item of items) {
    const learningResponse = await request.get(resolveItemResource(item, item.learning?.resource || "learning.json"));
    expect(learningResponse.ok(), item.id).toBeTruthy();
    const learning = await learningResponse.json() as { steps: Array<{ annotations?: unknown[]; scene?: { screen: string; scroll: { x: number; y: number } }; code?: unknown; experiments?: unknown[]; quiz?: unknown[] }> };
    await page.goto(`./#/items/${encodeURIComponent(item.id)}?view=learn`);
    const viewer = page.getByTestId("specimen-viewer");
    try {
      await expect(viewer.getByRole("status"), item.id).toContainText("展品已就绪", { timeout: 10_000 });
    } catch {
      await viewer.getByRole("button", { name: "刷新" }).click();
      await expect(viewer.getByRole("status"), `${item.id} retry`).toContainText("展品已就绪", { timeout: 10_000 });
    }
    const workspace = page.getByTestId("integrated-exhibit-workspace");
    const stepButtons = page.getByRole("navigation", { name: "学习视角" }).getByRole("button");
    await expect(stepButtons, item.id).toHaveCount(learning.steps.length);
    const workspaceHeight = await workspace.evaluate((element) => element.getBoundingClientRect().height);
    const documentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let index = 0; index < learning.steps.length; index += 1) {
      await stepButtons.nth(index).click();
      await expect(stepButtons.nth(index), `${item.id} step ${index + 1}`).toHaveAttribute("aria-current", "step");
      const step = learning.steps[index];
      if (step.annotations?.length) {
        if (step.scene && (step.scene.screen !== "initial" || step.scene.scroll.x !== 0 || step.scene.scroll.y !== 0)) {
          const frame = page.frameLocator('[data-testid="specimen-frame"]');
          if (step.scene.screen === "timeline") await frame.locator('[data-action="start"]').click();
          if (step.scene.screen === "gallery") await frame.locator(".period-node").first().click();
          await frame.locator("html").evaluate((_, scene) => window.scrollTo(scene.x, scene.y), step.scene.scroll);
          await page.getByRole("button", { name: "我已在展品内对准" }).click();
        }
        await expect(page.getByTestId("specimen-annotations"), `${item.id} annotations`).toBeVisible();
      }
      if (step.code) await expect(page.locator("details.code-reference"), `${item.id} code`).toHaveCount(1);
      if (step.experiments?.length) await expect(page.locator(".experiment-card"), `${item.id} experiments`).toHaveCount(step.experiments.length);
      if (step.quiz?.length) await expect(page.locator(".mastery-card"), `${item.id} quiz`).toBeVisible();
      expect(Math.abs(await workspace.evaluate((element) => element.getBoundingClientRect().height) - workspaceHeight), `${item.id} workspace height`).toBeLessThan(0.1);
      expect(await page.evaluate(() => document.documentElement.scrollHeight), `${item.id} document height`).toBe(documentHeight);
    }
    await expect(page.getByText("教程暂时不可用"), item.id).toHaveCount(0);
  }
});

test("every learning view has a stable narrow-screen fallback", async ({ page, request }) => {
  test.setTimeout(360_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const items = await readCatalog(request);
  const iframeOverflows: string[] = [];
  for (const item of items) {
    await page.goto(`./#/items/${encodeURIComponent(item.id)}?view=learn`);
    const viewer = page.getByTestId("specimen-viewer");
    try {
      await expect(viewer.getByRole("status"), item.id).toContainText("展品已就绪", { timeout: 10_000 });
    } catch {
      await viewer.getByRole("button", { name: "刷新" }).click();
      await expect(viewer.getByRole("status"), `${item.id} retry`).toContainText("展品已就绪", { timeout: 10_000 });
    }
    await expect(page.getByRole("navigation", { name: "学习视角" }).getByRole("button"), item.id).toHaveCount(4);
    await expect(page.getByTestId("annotation-scene-status"), item.id).toContainText("当前画布过窄");
    await expect(page.getByTestId("specimen-annotations"), item.id).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${item.id} horizontal overflow`).toBeTruthy();
    const frame = page.frameLocator('[data-testid="specimen-frame"]');
    await page.waitForTimeout(350);
    if (!await frame.locator("html").evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)) iframeOverflows.push(item.id);
  }
  expect(iframeOverflows, "stable iframe horizontal overflows").toEqual([]);
});

test("time gallery stops idle WebGL redraws for reduced motion while preserving user control", async ({ page }) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./items/time-gallery-webgl/index.html");
  await page.locator('[data-action="start"]').click();
  await page.locator(".period-node").first().click();
  await expect(page.locator("#webgl-root")).toHaveAttribute("data-reduced-motion", "true");
  await expect.poll(async () => Number(await page.locator("#webgl-root").getAttribute("data-render-count") || 0), { timeout: 30_000 }).toBeGreaterThan(0);
  const idleCount = Number(await page.locator("#webgl-root").getAttribute("data-render-count"));
  await page.waitForTimeout(500);
  expect(Number(await page.locator("#webgl-root").getAttribute("data-render-count")) - idleCount).toBeLessThanOrEqual(1);
  await page.keyboard.down("KeyW");
  await expect.poll(async () => Number(await page.locator("#webgl-root").getAttribute("data-render-count"))).toBeGreaterThan(idleCount);
  await page.keyboard.up("KeyW");
});

test("every standalone specimen suppresses repeating CSS motion when reduced motion is requested", async ({ page, request }) => {
  test.setTimeout(360_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const items = await readCatalog(request);
  for (const item of items) {
    await page.goto(itemRoot(item));
    const longestAnimationSeconds = await page.locator("html").evaluate(() => {
      const seconds = (token: string) => token.trim().endsWith("ms") ? Number.parseFloat(token) / 1000 : Number.parseFloat(token);
      return Math.max(0, ...[...document.querySelectorAll("*")].flatMap((element) => getComputedStyle(element).animationDuration.split(",").map(seconds).filter(Number.isFinite)));
    });
    expect(longestAnimationSeconds, `${item.id} reduced-motion animation duration`).toBeLessThan(0.001);
  }
});
