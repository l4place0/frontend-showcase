import { test, expect } from "@playwright/test";
import { itemRoot, readCatalog, resolveItemResource } from "../helpers/catalog";

test("site publishes an AI-readable catalog", async ({ request }) => {
  const llms = await request.get("./llms.txt");
  expect(llms.ok()).toBeTruthy();
  const llmsText = await llms.text();
  expect(llmsText.trim().length).toBeGreaterThan(40);
  expect(llmsText).toContain("太空漫游");

  const items = await readCatalog(request);
  expect(new Set(items.map(({ id }) => id)).size).toBe(items.length);
});

test("an item URL advertises prompt and structured context", async ({ request }) => {
  const [item] = await readCatalog(request);
  const itemPage = await request.get(itemRoot(item));
  expect(itemPage.ok()).toBeTruthy();
  const html = await itemPage.text();

  expect(html).toMatch(/rel=["']alternate["']/i);
  expect(html).toMatch(/type=["']text\/markdown["']/i);
  expect(html).toMatch(/type=["']application\/json["']/i);
  expect(html).toContain("specimen-context");

  const promptPath = item.ai?.prompt ?? item.prompt ?? "AI.md";
  const contextPath = item.ai?.context ?? item.context ?? "ai-context.json";
  const [prompt, context] = await Promise.all([
    request.get(resolveItemResource(item, promptPath)),
    request.get(resolveItemResource(item, contextPath)),
  ]);

  expect(prompt.ok()).toBeTruthy();
  const promptText = await prompt.text();
  expect(promptText).toMatch(/Objective|目标/i);
  expect(promptText).toMatch(/[\u4e00-\u9fff]/);
  expect(context.ok()).toBeTruthy();
  expect((await context.json()).id).toBe(item.id);
});

test("every catalog item is independently loadable from the production build", async ({ request }) => {
  const items = await readCatalog(request);
  const responses = await Promise.all(items.map(async (item) => {
    const response = await request.get(itemRoot(item));
    return { item, response, html: response.ok() ? await response.text() : "" };
  }));

  for (const { item, response, html } of responses) {
    expect(response.ok(), `${item.id} returned ${response.status()}`).toBeTruthy();
    expect(html, `${item.id} has no protocol context`).toContain('id="specimen-context"');
  }
});

test("every catalog item publishes a matching structured learning resource", async ({ request }) => {
  const items = await readCatalog(request);
  const resources = await Promise.all(items.map(async (item) => {
    const path = item.learning?.resource || `items/${item.id}/learning.json`;
    const response = await request.get(resolveItemResource(item, path));
    return { item, response, learning: response.ok() ? await response.json() : null };
  }));
  for (const { item, response, learning } of resources) {
    expect(response.ok(), `${item.id} learning resource returned ${response.status()}`).toBeTruthy();
    expect(learning.itemId).toBe(item.id);
    expect(learning.learningVersion).toBe(1);
    expect(learning.contentRevision).toBeGreaterThanOrEqual(1);
    expect(learning.steps.length).toBeGreaterThanOrEqual(4);
    expect(learning.steps.some((step: { code?: unknown }) => step.code)).toBeTruthy();
    expect(learning.steps.some((step: { experiments?: unknown[] }) => step.experiments?.length)).toBeTruthy();
    expect(learning.steps.some((step: { quiz?: unknown[] }) => step.quiz?.length >= 3)).toBeTruthy();
  }
});
