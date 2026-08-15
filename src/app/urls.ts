const base = import.meta.env.BASE_URL;

export function publicUrl(path: string): string {
  if (/^(?:https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  const normalized = path.replace(/^\.\//, "").replace(/^\//, "");
  return `${base}${normalized}`;
}

export function itemRoot(id: string, explicit?: string): string {
  const candidate = explicit || `items/${id}/`;
  return publicUrl(candidate.endsWith("/") || /\.[a-z0-9]+$/i.test(candidate) ? candidate : `${candidate}/`);
}

export function itemAsset(item: { id: string; url?: string }, asset: string): string {
  if (/^(?:https?:)?\/\//.test(asset)) return asset;
  if (asset.startsWith("items/") || asset.startsWith("/items/")) return publicUrl(asset);
  const root = itemRoot(item.id, item.url);
  try {
    return new URL(asset, new URL(root, window.location.href)).toString();
  } catch {
    return `${root}${asset.replace(/^\.\//, "")}`;
  }
}
