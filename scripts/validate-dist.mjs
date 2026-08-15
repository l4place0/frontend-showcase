import { access, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { createHash } from "node:crypto";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.resolve(root, process.argv[2] || "dist");
const errors = [];
const schema = JSON.parse(await readFile(path.join(root, "specimens", "specimen.schema.json"), "utf8"));
const validateManifest = new Ajv2020({ allErrors: true }).compile(schema);
const learningSchema = JSON.parse(await readFile(path.join(root, "specimens", "learning.schema.json"), "utf8"));
const validateLearning = new Ajv2020({ allErrors: true }).compile(learningSchema);

async function readJson(relative) {
  try {
    return JSON.parse(await readFile(path.join(target, relative), "utf8"));
  } catch (error) {
    errors.push(`${relative}: ${error.message}`);
    return null;
  }
}

const index = await readJson("specimens.json");
const items = index?.items || [];
if (index?.specimenVersion !== 1) errors.push("specimens.json: invalid protocol version");
if (items.length < 60) errors.push(`specimens.json: expected at least 60 migrated items, found ${items.length}`);

for (const item of items) {
  const dir = path.join("items", item.id);
  const manifest = await readJson(path.join(dir, "specimen.json"));
  const context = await readJson(path.join(dir, "ai-context.json"));
  const learning = await readJson(path.join(dir, "learning.json"));
  let html = "";
  let prompt = "";
  try { html = await readFile(path.join(target, dir, "index.html"), "utf8"); } catch (error) { errors.push(`${item.id}: missing index.html (${error.message})`); }
  try { prompt = await readFile(path.join(target, dir, "AI.md"), "utf8"); } catch (error) { errors.push(`${item.id}: missing AI.md (${error.message})`); }
  if (manifest?.id !== item.id) errors.push(`${item.id}: manifest/catalog id mismatch`);
  if (manifest && !validateManifest(manifest)) {
    errors.push(`${item.id}: public manifest schema validation failed: ${validateManifest.errors?.map((error) => `${error.instancePath || "/"} ${error.message}`).join(", ")}`);
  }
  if (manifest?.entry !== "index.html" || manifest?.ai?.prompt !== "AI.md" || manifest?.ai?.context !== "ai-context.json" || manifest?.learning?.resource !== "learning.json") {
    errors.push(`${item.id}: public manifest links must be relative to the item directory`);
  }
  if (item.thumbnail !== "thumbnail.webp" || manifest?.thumbnail !== item.thumbnail) errors.push(`${item.id}: catalog/manifest thumbnail contract mismatch`);
  try {
    const thumbnailPath = path.join(target, dir, item.thumbnail || "");
    const [metadata, details] = await Promise.all([sharp(thumbnailPath).metadata(), stat(thumbnailPath)]);
    if (metadata.format !== "webp" || metadata.width !== 1200 || metadata.height !== 900) {
      errors.push(`${item.id}: thumbnail must be a 1200x900 WebP`);
    }
    if (details.size > 200_000) errors.push(`${item.id}: thumbnail exceeds 200000 bytes (${details.size})`);
  } catch (error) {
    errors.push(`${item.id}: missing or invalid thumbnail (${error.message})`);
  }
  if (context?.id !== item.id || !context?.prompt) errors.push(`${item.id}: invalid AI context`);
  if (context?.learning?.resource !== "learning.json" || context?.learning?.version !== 1 || context?.learning?.contentRevision !== learning?.contentRevision) errors.push(`${item.id}: invalid learning discovery in AI context`);
  if (learning?.itemId !== item.id || (learning && !validateLearning(learning))) errors.push(`${item.id}: invalid public learning resource`);
  if (learning) {
    const digest = `sha256:${createHash("sha256").update(JSON.stringify(learning)).digest("hex")}`;
    if (context?.learning?.artifactDigest !== digest) errors.push(`${item.id}: public learning artifact digest mismatch`);
    try {
      const sourceLearning = JSON.parse(await readFile(path.join(root, "specimens", "learning", "items", `${item.id}.json`), "utf8"));
      if (JSON.stringify(sourceLearning) !== JSON.stringify(learning)) errors.push(`${item.id}: public learning resource differs from source`);
    } catch (error) {
      errors.push(`${item.id}: unable to cross-check source learning resource (${error.message})`);
    }
  }
  if (!html.includes('id="specimen-context"')) errors.push(`${item.id}: missing embedded specimen context`);
  if (!html.includes('type="text/markdown" href="./AI.md"')) errors.push(`${item.id}: missing AI.md discovery link`);
  if (!html.includes('href="./learning.json"')) errors.push(`${item.id}: missing learning discovery link`);
  if (!html.includes("specimen:ready")) errors.push(`${item.id}: missing protocol bridge`);
  if (/<(?:script|link)[^>]+(?:src|href)=["']https?:\/\//i.test(html)) errors.push(`${item.id}: runtime CDN dependency found`);
  for (const heading of ["Objective", "Visual Identity", "Design Tokens", "Structure", "Components", "Interaction", "Motion", "Responsive Behavior", "Accessibility", "Implementation Constraints", "Avoid", "Source Reference"]) {
    if (!prompt.includes(`## ${heading}`)) errors.push(`${item.id}: AI.md missing ${heading}`);
  }
  if (!prompt.includes("## Learning Resource")) errors.push(`${item.id}: AI.md missing learning discovery`);
}

try { await access(path.join(target, "llms.txt")); } catch { errors.push("llms.txt: missing"); }

if (errors.length) {
  console.error(`[dist] validation failed (${errors.length})\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`[dist] validated ${items.length} independent specimens in ${path.relative(root, target) || "."}`);
