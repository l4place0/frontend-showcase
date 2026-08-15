import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createCatalog } from "../specimens/catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generated = path.join(root, ".generated");
const publicDir = path.join(generated, "public");
const catalog = createCatalog();
const publicCatalog = catalog.map(({ source, sourceDir, sourceFiles, bundle, ...item }) => item);

await mkdir(publicDir, { recursive: true });
await writeFile(path.join(generated, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);
await writeFile(
  path.join(publicDir, "specimens.json"),
  `${JSON.stringify({ specimenVersion: 1, items: publicCatalog }, null, 2)}\n`,
);

console.log(`[catalog] generated ${catalog.length} specimen records`);
