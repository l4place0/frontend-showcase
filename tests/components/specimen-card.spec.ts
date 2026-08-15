import { test, expect } from "./fixtures";

test("card exposes identity, tags and item navigation", async ({ mount }) => {
  const component = await mount("SpecimenCard#Default");
  await expect(component.getByRole("heading", { name: "控制探针" })).toBeVisible();
  await expect(component).toContainText("#protocol");
  await expect(component.getByRole("link", { name: "查看展品：控制探针" })).toHaveAttribute("href", "/items/control-probe");
  await expect(component).toContainText("05");
  await expect(component).toContainText("可学习 · beginner · 8 min");
});

test("card exposes revision-matched learning progress", async ({ page, mount }) => {
  await page.evaluate(() => localStorage.setItem("specimen-learning-progress:index", JSON.stringify({ "control-probe": { contentRevision: 1, completed: false, updatedAt: new Date().toISOString() } })));
  const component = await mount("SpecimenCard#Default");
  await expect(component).toContainText("学习中 · beginner · 8 min");
});

test("fallback decoration stays aligned with its background focal point", async ({ mount }) => {
  const component = await mount("SpecimenCard#Default");
  const fallback = component.locator(".preview-fallback");
  const decoration = fallback.locator("i");

  await expect(fallback).toBeVisible();
  await expect(decoration).toBeVisible();

  const [fallbackBox, decorationBox] = await Promise.all([
    fallback.boundingBox(),
    decoration.boundingBox(),
  ]);
  expect(fallbackBox).not.toBeNull();
  expect(decorationBox).not.toBeNull();

  const fallbackCenterX = fallbackBox!.x + fallbackBox!.width / 2;
  const fallbackFocalY = fallbackBox!.y + fallbackBox!.height * 0.45;
  const decorationCenterX = decorationBox!.x + decorationBox!.width / 2;
  const decorationCenterY = decorationBox!.y + decorationBox!.height / 2;

  expect(decorationCenterX).toBeCloseTo(fallbackCenterX, 0);
  expect(decorationCenterY).toBeCloseTo(fallbackFocalY, 0);
});

test("card renders a declared thumbnail instead of the fallback", async ({ mount }) => {
  const component = await mount("SpecimenCard#Thumbnail");
  const thumbnail = component.locator(".card-preview img");

  await expect(thumbnail).toBeVisible();
  await expect(thumbnail).toHaveJSProperty("complete", true);
  await expect(component.locator(".preview-fallback")).toHaveCount(0);
  expect(await thumbnail.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
});
