import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createCatalog } from "../specimens/catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const item of createCatalog()) {
  const file = path.join(root, "specimens", "learning", "items", `${item.id}.json`);
  const resource = JSON.parse(await readFile(file, "utf8"));
  resource.contentRevision ||= 1;
  for (const step of resource.steps) {
    if (step.annotations?.length && !step.scene) {
      step.scene = { viewport: { minWidth: 640 }, controls: {}, screen: "initial", scroll: { x: 0, y: 0 } };
    }
    if (step.code) {
      step.code.sourceScope ||= "item";
      step.code.sourceAvailability ||= "build-time-author-source";
    }
  }
  resource.furtherReading = [
    { label: "AI reproduction guide", href: "./AI.md" },
    { label: "Structured specimen context", href: "./ai-context.json" }
  ];
  await writeFile(file, `${JSON.stringify(resource, null, 2)}\n`);
}
console.log("[learning] migrated scene, provenance and reading contracts for 62 resources");
