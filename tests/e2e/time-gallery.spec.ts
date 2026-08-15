import { test, expect } from "@playwright/test";

test("time gallery completes the offline art-history flow", async ({ page }) => {
  // The isolated Linux runner uses software rendering; assertions stay unchanged,
  // but the complete 54-artwork interaction path consistently needs >120 seconds.
  test.setTimeout(180_000);
  const consoleErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith("http") && url.hostname !== "127.0.0.1" && url.hostname !== "localhost") externalRequests.push(request.url());
  });

  await page.goto("./#/items/time-gallery-webgl");
  const frame = page.frameLocator('[data-testid="specimen-frame"]');
  await expect(frame.locator('[data-screen="welcome"]')).toHaveClass(/is-active/);
  await expect(frame.locator("body")).toHaveAttribute("data-artworks", "54", { timeout: 30_000 });
  await frame.getByRole("button", { name: /开启旅程/ }).click();
  await expect(frame.locator('[data-screen="timeline"]')).toHaveClass(/is-active/);
  await expect(frame.locator(".period-node")).toHaveCount(9);
  await expect(frame.locator(".artist-branch")).toHaveCount(9);

  const firstPeriod = frame.locator(".period-node").first();
  await firstPeriod.hover();
  await expect(frame.locator("#period-preview")).toHaveClass(/is-visible/);
  await expect(frame.locator("#period-preview img")).toHaveAttribute("src", /^data:image\/jpeg;base64,/);
  await expect(frame.locator("#period-preview").getByRole("button")).toHaveCount(0);
  await firstPeriod.click();

  await expect(frame.locator('[data-screen="gallery"]')).toHaveClass(/is-active/);
  await expect(frame.locator("#webgl-root canvas")).toBeVisible({ timeout: 20_000 });
  await expect(frame.locator("#loading-card")).toHaveClass(/is-done/, { timeout: 20_000 });

  const webglRoot = frame.locator("#webgl-root");
  const canvasBox = await frame.locator("#webgl-root canvas").boundingBox();
  if (!canvasBox) throw new Error("WebGL canvas has no bounding box");
  const yawBeforeDrag = Number(await webglRoot.getAttribute("data-yaw"));
  await page.mouse.move(canvasBox.x + canvasBox.width * .72, canvasBox.y + canvasBox.height * .52);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + canvasBox.width * .58, canvasBox.y + canvasBox.height * .46, { steps: 8 });
  await page.mouse.up();
  const yawAfterDrag = Number(await webglRoot.getAttribute("data-yaw"));
  expect(Math.abs(yawAfterDrag - yawBeforeDrag)).toBeGreaterThan(.08);
  await expect(frame.locator("#art-detail")).not.toHaveClass(/is-open/);
  await page.mouse.move(canvasBox.x + canvasBox.width * .58, canvasBox.y + canvasBox.height * .46);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + canvasBox.width * .72, canvasBox.y + canvasBox.height * .52, { steps: 8 });
  await page.mouse.up();
  await frame.locator("body").press("a", { delay: 180 });
  const afterA = Number(await webglRoot.getAttribute("data-camera-x"));
  expect(afterA).toBeLessThan(-0.05);
  await frame.locator("body").press("d", { delay: 360 });
  const afterD = Number(await webglRoot.getAttribute("data-camera-x"));
  expect(afterD).toBeGreaterThan(afterA);
  await frame.locator("body").press("ArrowLeft", { delay: 180 });
  const afterLeft = Number(await webglRoot.getAttribute("data-camera-x"));
  expect(afterLeft).toBeLessThan(afterD);
  await frame.locator("body").press("ArrowRight", { delay: 360 });
  const afterRight = Number(await webglRoot.getAttribute("data-camera-x"));
  expect(afterRight).toBeGreaterThan(afterLeft);

  await expect(frame.locator("#art-prompt")).toBeVisible({ timeout: 10_000 });
  await frame.locator("body").press("e");
  await expect(frame.locator("#art-detail")).toHaveClass(/is-open/);
  await frame.locator("body").press("e");
  await frame.locator("body").press("e");
  await expect(frame.locator("#art-detail")).toHaveCount(1);
  await expect(frame.locator("#detail-image")).toHaveJSProperty("complete", true);
  const imageFit = await frame.locator("#detail-image").evaluate((image) => getComputedStyle(image).objectFit);
  expect(imageFit).toBe("contain");
  await frame.locator("body").press("Escape");
  await expect(frame.locator("#art-detail")).not.toHaveClass(/is-open/);
  await frame.getByRole("button", { name: /时间轴/ }).click();
  await expect(frame.locator('[data-screen="timeline"]')).toHaveClass(/is-active/);

  await expect(frame.locator("body")).toHaveAttribute("data-periods", "9");
  await expect(frame.locator("body")).toHaveAttribute("data-artists", "30");
  await expect(frame.locator("body")).toHaveAttribute("data-artworks", "54");
  expect(externalRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
