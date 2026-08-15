import type { APIRequestContext } from "@playwright/test";

export type CatalogItem = {
  id: string;
  url?: string;
  entry?: string;
  category?: string;
  ai?: { prompt?: string; context?: string };
  learning?: { resource?: string; contentRevision?: number; difficulty?: string; durationMinutes?: number; concepts?: string[] };
  prompt?: string;
  context?: string;
};

export async function readCatalog(request: APIRequestContext): Promise<CatalogItem[]> {
  const response = await request.get("./specimens.json");
  if (!response.ok()) throw new Error(`/specimens.json returned ${response.status()}`);
  const payload = (await response.json()) as CatalogItem[] | { items: CatalogItem[] };
  const items = Array.isArray(payload) ? payload : payload.items;
  if (!Array.isArray(items) || items.length === 0) throw new Error("Catalog contains no specimens");
  return items;
}

export function itemRoot(item: CatalogItem): string {
  return item.url ?? `items/${item.id}/index.html`;
}

export function resolveItemResource(item: CatalogItem, resource: string): string {
  if (resource.startsWith("items/")) return resource;
  const base = itemRoot(item);
  return new URL(resource, `http://fixture.invalid/${base}`).pathname.replace(/^\//, "");
}
