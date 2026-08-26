import { createHash } from "node:crypto";
import { lstat, readdir, readFile } from "node:fs/promises";
import path from "node:path";

export async function digestDirectory(root) {
  const resolvedRoot = path.resolve(root);
  const hash = createHash("sha256");
  let fileCount = 0;
  let totalBytes = 0;

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));

    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(resolvedRoot, absolute).split(path.sep).join("/");
      const stats = await lstat(absolute);
      if (stats.isSymbolicLink()) throw new Error(`artifact must not contain symbolic links: ${relative}`);
      if (stats.isDirectory()) {
        hash.update(`directory\0${relative}\0`);
        await visit(absolute);
        continue;
      }
      if (!stats.isFile()) throw new Error(`artifact contains unsupported entry: ${relative}`);
      const bytes = await readFile(absolute);
      hash.update(`file\0${relative}\0${stats.mode & 0o777}\0${bytes.length}\0`);
      hash.update(bytes);
      fileCount += 1;
      totalBytes += bytes.length;
    }
  }

  await visit(resolvedRoot);
  return { digest: `sha256:${hash.digest("hex")}`, fileCount, totalBytes };
}

export function sha256(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

export function specimenCatalogIdentity(catalog) {
  if (catalog?.specimenVersion !== 1 || !Array.isArray(catalog.items)) {
    throw new Error("specimen catalog must use Protocol v1 and contain an items array");
  }

  const ids = catalog.items.map((item) => item?.id);
  const invalidIds = ids.filter((id) => typeof id !== "string" || !id.trim());
  if (invalidIds.length) throw new Error("specimen catalog contains an invalid item id");

  const sortedIds = [...ids].sort((left, right) => left.localeCompare(right, "en"));
  if (new Set(sortedIds).size !== sortedIds.length) {
    throw new Error("specimen catalog contains duplicate item ids");
  }

  return {
    specimenCount: sortedIds.length,
    specimenIdsDigest: sha256(JSON.stringify(sortedIds)),
  };
}

export function requiredEnvironment(name, fallback) {
  const value = process.env[name] || fallback;
  if (!value) throw new Error(`missing required environment variable ${name}`);
  return value;
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
}
