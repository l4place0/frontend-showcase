import { test, expect } from "./fixtures";

test("all manifest-driven controls update state", async ({ mount }) => {
  const component = await mount("ControlPanel#AllControls");

  await component.getByLabel("动画速度").fill("2.5");
  await component.getByLabel("强调色").fill("#a78bfa");
  await component.getByLabel("暂停动画").check();
  await component.getByLabel("密度").selectOption("high");
  await component.getByLabel("原点 X").fill("12");

  await expect(component.getByTestId("control-state")).toContainText('"speed":2.5');
  await expect(component.getByTestId("control-state")).toContainText('"accent":"#a78bfa"');
  await expect(component.getByTestId("control-state")).toContainText('"paused":true');
  await expect(component.getByTestId("control-state")).toContainText('"density":"high"');
  await expect(component.getByTestId("control-state")).toContainText('"origin":[12,0]');
});

test("control reset and empty state remain accessible", async ({ mount }) => {
  const component = await mount("ControlPanel#AllControls");
  await component.getByLabel("动画速度").fill("2");
  await component.getByRole("button", { name: "恢复默认参数" }).click();
  await expect(component.getByTestId("control-state")).toContainText('"speed":1');

  const empty = await mount("ControlPanel#Empty");
  await expect(empty).toContainText("没有可调参数");
});
