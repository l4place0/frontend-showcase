import { test, expect } from "@playwright/test";
import { readCatalog } from "../helpers/catalog";

test("catalog opens a specimen in the isolated viewer", async ({ page, request }) => {
  const [item] = await readCatalog(request);
  await page.goto(`./#/items/${item.id}`);

  const viewer = page.getByTestId("specimen-viewer");
  await expect(viewer).toBeVisible();

  const iframe = page.getByTestId("specimen-frame");
  await expect(iframe).toBeVisible();
  await expect(iframe).toHaveAttribute("sandbox", /allow-scripts/);
  await expect(viewer.getByRole("status")).toContainText("展品已就绪");

  const itemDocument = page.frameLocator('[data-testid="specimen-frame"]');
  await expect(itemDocument.locator("body")).toBeVisible();

  const promptPanel = page.getByTestId("prompt-panel");
  await promptPanel.getByText("预览并复制 Prompt").click();
  await expect(promptPanel.locator("pre")).toContainText("## Objective");
});

test("catalog supports its stable navigation routes", async ({ page, request }) => {
  const [item] = await readCatalog(request);
  const paths = ["./#/", "./#/collections", `./#/items/${item.id}`];

  for (const path of paths) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
  }

  if (item.category) {
    await page.goto(`./#/collections/${encodeURIComponent(item.category)}`);
    await expect(page.locator("main")).toBeVisible();
  }
});

test("top-level collections are separated from style and layout filters", async ({ page }) => {
  await page.goto("./#/");

  const primaryNav = page.getByRole("navigation", { name: "主要导航" });
  for (const name of ["首页", "样式布局", "CSS 动画", "WebGL"]) {
    await expect(primaryNav.getByRole("link", { name, exact: true })).toBeVisible();
  }
  await expect(page.locator("#collections")).toBeVisible();
  await expect(page.locator(".specimen-grid")).toHaveCount(0);

  await page.goto("./#/collections");
  const categoryTabs = page.getByRole("navigation", { name: "分类" });
  for (const name of ["全部", "布局", "视觉样式"]) {
    await expect(categoryTabs.getByRole("link", { name, exact: true })).toBeVisible();
  }
  await expect(categoryTabs.getByRole("link", { name: "全部", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(categoryTabs).not.toContainText("CSS");
  await expect(categoryTabs).not.toContainText("WEBGL");

  await page.getByRole("link", { name: "WebGL", exact: true }).click();
  await expect(page.getByRole("heading", { name: "WebGL 实验展柜", exact: true })).toBeVisible();
  await expect(primaryNav.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(primaryNav.getByRole("link", { name: "WebGL", exact: true })).toHaveAttribute("aria-current", "page");

  await page.goto("./#/items/cosmos");
  await expect(primaryNav.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(primaryNav.getByRole("link", { name: "样式布局", exact: true })).toHaveAttribute("aria-current", "page");

  await page.goto("./#/collections/css-animation");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.evaluate(() => (document.querySelector<HTMLAnchorElement>('#site-nav a[href="#/collections/webgl"]'))?.click());
  await expect(page.getByRole("heading", { name: "WebGL 实验展柜", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("CSS animation collection introduces the opening exhibit", async ({ page }) => {
  await page.goto("./#/collections/css-animation");

  await expect(page.getByRole("heading", { name: "CSS 动画展柜" })).toBeVisible();
  await expect(page.locator("#opening-exhibit").getByRole("heading", { name: "CSS 海浪动画" })).toBeVisible();
  await expect(page.getByRole("link", { name: /进入展品/ })).toHaveAttribute("href", "#/items/css-ocean-wave");

  await page.getByRole("button", { name: /查看开幕展品/ }).click();
  await expect(page).toHaveURL(/#\/collections\/css-animation$/);
  await expect(page.locator("#opening-exhibit")).toBeInViewport();
});

test("home manifesto types its quote and keeps the supporting copy italic", async ({ page }) => {
  await page.goto("./#/");
  const manifesto = page.locator(".manifesto");
  await manifesto.scrollIntoViewIfNeeded();

  await expect(manifesto.getByRole("blockquote")).toHaveAttribute("aria-label", "“人类看到效果，AI 读到意图。”");
  await expect(manifesto.getByRole("blockquote").locator("span")).toHaveText("“人类看到效果，AI 读到意图。”", { timeout: 4_000 });
  await expect(manifesto.locator("p")).toHaveCSS("font-style", "italic");
  await expect(manifesto.getByRole("blockquote").locator("span")).toBeEmpty({ timeout: 6_000 });
  await expect(manifesto.getByRole("blockquote").locator("span")).toHaveText("“人类看到效果，AI 读到意图。”", { timeout: 4_000 });
});

test("home manifesto skips typing when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#/");
  await expect(page.locator(".manifesto blockquote span")).toHaveText("“人类看到效果，AI 读到意图。”");
});
