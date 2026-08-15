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
