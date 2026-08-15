import { test, expect } from "./fixtures";

test("AI panel exposes the human-readable prompt", async ({ mount, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const component = await mount("AiReferencePanel#Default");

  await expect(component.getByRole("link", { name: "打开 AI.md" })).toHaveAttribute("href", /AI\.md$/);
  await expect(component.getByRole("link", { name: "结构化上下文" })).toHaveCount(0);
  await component.getByText("预览并复制 Prompt").click();
  await expect(component).toContainText("Verify the version 1 Specimen Protocol");
  await component.getByRole("button", { name: "复制完整 Prompt" }).click();
  await expect.poll(() => component.page().evaluate(() => navigator.clipboard.readText())).toContain("Specimen Protocol");
});
