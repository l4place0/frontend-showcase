import { test as base, expect, type Locator } from "@playwright/test";

type ComponentFixtures = {
  mount: (storyId: string) => Promise<Locator>;
};

export const test = base.extend<ComponentFixtures>({
  mount: async ({ page }, use) => {
    await page.goto("/playwright/gallery/index.html");
    await expect(page.getByTestId("story-gallery-ready")).toBeVisible();

    await use(async (storyId) => {
      await page.evaluate(async (id) => window.renderStory(id), storyId);
      const story = page.getByTestId("story-root");
      await expect(story).toBeVisible();
      return story;
    });
  },
});

export { expect };

declare global {
  interface Window {
    renderStory: (storyId: string) => Promise<void>;
  }
}
