import { test, expect } from "./fixtures";

test("viewer initializes the isolated item over MessageChannel", async ({ mount }) => {
  const component = await mount("SpecimenViewer#ProtocolProbe");
  const frame = component.getByTestId("specimen-frame");
  await expect(frame).toHaveAttribute("sandbox", "allow-scripts");
  await expect(component.getByRole("status")).toContainText("展品已就绪");

  const itemDocument = frame.contentFrame();
  await expect(itemDocument.getByTestId("probe-state")).toContainText("specimen:set-controls");

  await component.getByRole("button", { name: "Set speed 2" }).click();
  await expect(itemDocument.getByTestId("probe-state")).toContainText('"speed":2');
});
