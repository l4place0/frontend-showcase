import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const root = process.cwd();
const historyRoot = join(root, "docs", "history");
const failures = [];
const types = new Set(["work-unit", "archive"]);
const states = new Set(["draft", "approved", "implementing", "validating", "observing", "closed"]);
const requiredWorkUnitFiles = [
  "README.md",
  "01-requirement.md",
  "02-plan.md",
  "03-implementation.md",
  "04-validation.md",
  "05-post-validation.md",
  "acceptance/README.md",
];

function field(source, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return source.match(new RegExp(`^${escaped}：\\*\\*([^*]+)\\*\\*`, "m"))?.[1]?.trim();
}

const indexPath = join(historyRoot, "README.md");
const indexSource = readFileSync(indexPath, "utf8");
const indexed = new Map();
for (const match of indexSource.matchAll(/^\| \[([^\]]+)]\((\.\/[^)#]+\/README\.md)\) \| `([^`]+)` \| `([^`]+)` \|/gm)) {
  const [, name, target, type, state] = match;
  const unitRoot = dirname(resolve(historyRoot, target));
  const relativeUnit = relative(historyRoot, unitRoot);
  if (relativeUnit === ".." || relativeUnit.startsWith(`..${sep}`)) {
    failures.push(`docs/history/README.md: ${name} resolves outside history`);
    continue;
  }
  if (indexed.has(unitRoot)) failures.push(`docs/history/README.md: duplicate index entry for ${relativeUnit}`);
  indexed.set(unitRoot, { name, type, state });
}

const units = readdirSync(historyRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
  .map((entry) => join(historyRoot, entry.name));

for (const unitRoot of units) {
  const display = relative(root, unitRoot).replaceAll("\\", "/");
  const indexEntry = indexed.get(unitRoot);
  if (!indexEntry) {
    failures.push(`${display}: missing from docs/history/README.md index`);
    continue;
  }
  const readme = join(unitRoot, "README.md");
  if (!existsSync(readme)) {
    failures.push(`${display}: README.md is missing`);
    continue;
  }
  const source = readFileSync(readme, "utf8");
  const type = field(source, "历史类型");
  const state = field(source, "工作状态");
  if (!types.has(type)) failures.push(`${display}: unknown or missing 历史类型 ${JSON.stringify(type)}`);
  if (!states.has(state)) failures.push(`${display}: unknown or missing 工作状态 ${JSON.stringify(state)}`);
  if (type !== indexEntry.type) failures.push(`${display}: index type ${indexEntry.type} does not match README ${type}`);
  if (state !== indexEntry.state) failures.push(`${display}: index state ${indexEntry.state} does not match README ${state}`);
  if (type === "work-unit") {
    for (const required of requiredWorkUnitFiles) {
      if (!existsSync(join(unitRoot, required))) failures.push(`${display}: missing ${required}`);
    }
  }
}

for (const [unitRoot] of indexed) {
  if (!existsSync(unitRoot)) failures.push(`docs/history/README.md: indexed directory is missing ${relative(root, unitRoot)}`);
}

if (failures.length) {
  console.error(`History checks failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`History checks passed: ${units.length} indexed units.`);
}
