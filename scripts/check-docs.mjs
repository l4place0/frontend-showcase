import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";

const root = process.cwd();
const docsRoot = join(root, "docs");
const failures = [];
const allowedStates = new Set(["FROZEN", "DRAFT", "LIVE", "CONTEXT"]);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

for (const required of [
  "README.md",
  "architecture/README.md",
  "product/README.md",
  "workflows/v1/README.md",
  "history/README.md",
]) {
  if (!existsSync(join(docsRoot, required))) failures.push(`docs/${required}: required documentation entry is missing`);
}

const files = walk(docsRoot).filter((file) => extname(file) === ".md");
for (const file of files) {
  const source = readFileSync(file, "utf8");
  const display = relative(root, file).replaceAll("\\", "/");
  const headings = [...source.matchAll(/^(#{1,6})\s+\S.*$/gm)];
  const h1Count = headings.filter((heading) => heading[1].length === 1).length;
  if (h1Count !== 1) failures.push(`${display}: expected exactly one H1, found ${h1Count}`);

  for (let index = 1; index < headings.length; index += 1) {
    if (headings[index][1].length > headings[index - 1][1].length + 1) {
      failures.push(`${display}: heading level jumps near ${headings[index][0]}`);
    }
  }

  const state = source.match(/^状态：\*\*([^*]+)\*\*/m)?.[1]?.trim();
  if (state) {
    const primary = state.split(/[（/\s]/, 1)[0];
    if (!allowedStates.has(primary)) failures.push(`${display}: unknown document state ${state}`);
  }

  for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].trim();
    if (/^(?:https?:|mailto:|#)/i.test(target)) continue;
    const pathPart = target.split("#", 1)[0];
    if (!pathPart) continue;
    const absolute = resolve(dirname(file), decodeURIComponent(pathPart));
    if (!existsSync(absolute)) failures.push(`${display}: missing relative link ${target}`);
  }
}

if (failures.length) {
  console.error(`Documentation checks failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Documentation checks passed: ${files.length} Markdown files.`);
}
