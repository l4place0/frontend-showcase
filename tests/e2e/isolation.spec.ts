import { test, expect } from "@playwright/test";
import { readCatalog } from "../helpers/catalog";

test("specimen cannot mutate the catalog document", async ({ page, request }) => {
  const [item] = await readCatalog(request);
  await page.goto(`./#/items/${item.id}`);

  const frame = page.getByTestId("specimen-frame");
  await expect(frame).toHaveAttribute("sandbox", /allow-scripts/);
  await expect(frame).not.toHaveAttribute("sandbox", /allow-same-origin/);

  await expect(page.locator("html")).not.toHaveAttribute("data-specimen-owned");
});
