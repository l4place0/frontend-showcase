import { expect, test } from "@playwright/test";

const itemUrl = (id: string) => `./items/${id}/index.html`;

test("mobile accordion, floating cards and tabs remain operable by touch and keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });

  await page.goto(itemUrl("layout-accordion"));
  const accordionSkills = page.locator("#skills");
  await expect(page.locator('.nav-links a[href="#skills"]')).toBeVisible();
  await page.locator('.nav-links a[href="#skills"]').click();
  await expect(page).toHaveURL(/#skills$/);
  await expect.poll(() => accordionSkills.evaluate((element) => getComputedStyle(element).maxHeight)).toBe("2600px");
  await page.locator('.nav-links a[href="#about"]').focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#about$/);
  await expect.poll(() => page.locator("#about").evaluate((element) => getComputedStyle(element).maxHeight)).toBe("2600px");
  await page.locator('.logo[href="#top"]').click();
  await expect.poll(() => accordionSkills.evaluate((element) => getComputedStyle(element).maxHeight)).toBe("108px");

  await page.goto(itemUrl("layout-floating"));
  const floatingProjects = page.locator("#projects");
  const restingTransform = await floatingProjects.evaluate((element) => getComputedStyle(element).transform);
  await page.locator('.nav-links a[href="#projects"]').click();
  await expect.poll(() => floatingProjects.evaluate((element) => getComputedStyle(element).transform)).not.toBe(restingTransform);
  await page.locator('.nav-links a[href="#skills"]').click();
  await expect.poll(() => floatingProjects.evaluate((element) => getComputedStyle(element).transform)).toBe(restingTransform);

  await page.goto(itemUrl("layout-tabbed"));
  await expect(page.locator(".nav-links")).toBeVisible();
  await page.locator('.nav-links a[href="#skills"]').click();
  await expect(page.locator("#projects")).toBeHidden();
  await expect(page.locator("#skills")).toBeVisible();
  await page.locator('.nav-links a[href="#about"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#about")).toBeVisible();
});

test("ordered layouts keep main DOM, geometry and keyboard content order aligned", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const cases = [
    ["layout-reverse", ["contact", "blog", "about", "skills", "projects"]],
    ["layout-cta-first", ["contact", "projects", "skills", "about", "blog"]],
    ["layout-z-pattern", ["projects", "about", "contact", "skills", "blog"]],
  ] as const;

  for (const [id, expected] of cases) {
    await page.goto(itemUrl(id));
    const evidence = await page.locator("main").evaluate((main) => {
      const sections = [...main.querySelectorAll<HTMLElement>(":scope > section")];
      const focusableSectionOrder = [...main.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .map((element) => element.closest("section")?.id)
        .filter((sectionId, index, all): sectionId is string => Boolean(sectionId) && all.indexOf(sectionId) === index);
      return {
        dom: sections.map((section) => section.id),
        nav: [...document.querySelectorAll<HTMLAnchorElement>(".nav-links > a")].map((link) => link.hash.slice(1)),
        tops: sections.map((section) => section.getBoundingClientRect().top + window.scrollY),
        focusableSectionOrder,
        positiveTabIndexes: document.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').length,
      };
    });
    expect(evidence.dom, `${id} DOM order`).toEqual(expected);
    expect(evidence.nav, `${id} navigation and initial focus order`).toEqual(expected);
    expect(evidence.focusableSectionOrder, `${id} keyboard content order`).toEqual(expected.filter((sectionId) => evidence.focusableSectionOrder.includes(sectionId)));
    expect(evidence.tops, `${id} geometry order`).toEqual([...evidence.tops].sort((a, b) => a - b));
    expect(evidence.positiveTabIndexes, `${id} positive tabindex`).toBe(0);
  }
});
