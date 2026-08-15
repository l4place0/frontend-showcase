import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createHash } from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
import { createCatalog } from "../specimens/catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = createCatalog();
const errors = [];
const allowedControls = new Set(["range", "number", "color", "boolean", "select", "text", "button", "vector2"]);
const schema = JSON.parse(await readFile(path.join(root, "specimens", "specimen.schema.json"), "utf8"));
const validateManifest = new Ajv2020({ allErrors: true }).compile(schema);
const learningSchema = JSON.parse(await readFile(path.join(root, "specimens", "learning.schema.json"), "utf8"));
const validateLearning = new Ajv2020({ allErrors: true }).compile(learningSchema);

function allowedLearningSources(item) {
  if (item.renderer === "portfolio-theme") return new Set([item.source, "src/base.css", "src/template.html"]);
  if (item.renderer === "portfolio-layout") return new Set([item.source, "src/themes/zen.css", "src/base.css", "src/template.html"]);
  const files = new Set((item.sourceFiles || []).map((name) => path.posix.join(item.sourceDir, name)));
  if (item.bundle?.source) files.add(path.posix.join(item.sourceDir, item.bundle.source));
  return files;
}

function controlValueError(control, value) {
  if (!control) return "unknown control";
  if (control.type === "boolean" && typeof value !== "boolean") return "must be boolean";
  if (["range", "number"].includes(control.type)) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "must be a finite number";
    if (control.min !== undefined && value < control.min) return `must be >= ${control.min}`;
    if (control.max !== undefined && value > control.max) return `must be <= ${control.max}`;
  }
  if (["text", "color"].includes(control.type) && typeof value !== "string") return "must be a string";
  if (control.type === "select") {
    const options = (control.options || []).map((option) => typeof option === "object" ? option.value : option);
    if (!options.includes(value)) return `must be one of ${options.join(", ")}`;
  }
  if (control.type === "vector2" && (!Array.isArray(value) || value.length !== 2 || value.some((part) => typeof part !== "number"))) return "must be a numeric pair";
  return null;
}

function locatorMatchesSnippet(locator, snippet) {
  return !/\bentire file\b/i.test(locator) && snippet.includes(locator.trim());
}

if (catalog.length < 60) errors.push(`expected at least the 60 migrated items, found ${catalog.length}`);
const ids = new Set();
for (const item of catalog) {
  if (!validateManifest(item)) {
    errors.push(`${item.id}: schema validation failed: ${validateManifest.errors?.map((error) => `${error.instancePath || "/"} ${error.message}`).join(", ")}`);
  }
  if (item.specimenVersion !== 1) errors.push(`${item.id}: specimenVersion must be 1`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) errors.push(`${item.id}: invalid id`);
  if (ids.has(item.id)) errors.push(`${item.id}: duplicate id`);
  ids.add(item.id);
  for (const key of ["category", "renderer", "description"]) {
    if (!item[key] || typeof item[key] !== "string") errors.push(`${item.id}: missing ${key}`);
  }
  if (!Array.isArray(item.tags) || !item.tags.length) errors.push(`${item.id}: tags must be non-empty`);
  if (!item.runtime || typeof item.runtime.scripts !== "boolean") errors.push(`${item.id}: invalid runtime declaration`);
  if (!item.ai?.prompt || !item.ai?.context) errors.push(`${item.id}: missing AI discovery links`);
  if (!item.learning?.resource) errors.push(`${item.id}: missing learning discovery link`);
  try {
    const learning = JSON.parse(await readFile(path.join(root, "specimens", "learning", "items", `${item.id}.json`), "utf8"));
    if (!validateLearning(learning)) errors.push(`${item.id}: learning schema validation failed: ${validateLearning.errors?.map((error) => `${error.instancePath || "/"} ${error.message}`).join(", ")}`);
    if (learning.itemId !== item.id) errors.push(`${item.id}: learning itemId mismatch`);
    if (item.learning?.contentRevision !== learning.contentRevision) errors.push(`${item.id}: catalog learning contentRevision mismatch`);
    const stepIds = new Set();
    const allQuizCorrectPositions = [];
    const allowedSources = allowedLearningSources(item);
    for (const step of learning.steps || []) {
      if (stepIds.has(step.id)) errors.push(`${item.id}: duplicate learning step ${step.id}`);
      stepIds.add(step.id);
      for (const collection of [["annotation", step.annotations || []], ["experiment", step.experiments || []], ["quiz", step.quiz || []]]) {
        const [kind, entries] = collection;
        const entryIds = new Set();
        for (const entry of entries) {
          if (entryIds.has(entry.id)) errors.push(`${item.id}: duplicate ${kind} id ${entry.id} in step ${step.id}`);
          entryIds.add(entry.id);
        }
      }
      for (const experiment of step.experiments || []) {
        for (const [key, value] of [...Object.entries(experiment.initial || {}), ...Object.entries(experiment.controls || {})]) {
          const control = (item.controls || []).find((candidate) => candidate.key === key);
          const problem = controlValueError(control, value);
          if (problem) errors.push(`${item.id}: learning experiment ${experiment.id} control ${key} ${problem}`);
        }
      }
      if (step.annotations?.length && !step.scene) errors.push(`${item.id}: annotated step ${step.id} needs an explicit scene contract`);
      if (step.scene) {
        if (step.scene.viewport.maxWidth !== undefined && step.scene.viewport.maxWidth < step.scene.viewport.minWidth) errors.push(`${item.id}: learning scene ${step.id} has maxWidth below minWidth`);
        for (const [key, value] of Object.entries(step.scene.controls || {})) {
          const control = (item.controls || []).find((candidate) => candidate.key === key);
          const problem = controlValueError(control, value);
          if (problem) errors.push(`${item.id}: learning scene ${step.id} control ${key} ${problem}`);
        }
      }
      for (const quiz of step.quiz || []) {
        if (quiz.correct >= quiz.options.length) errors.push(`${item.id}: quiz ${quiz.id} correct index is out of range`);
        if (new Set(quiz.options).size !== quiz.options.length) errors.push(`${item.id}: quiz ${quiz.id} options must be unique`);
        allQuizCorrectPositions.push(quiz.correct);
      }
      if (step.code) {
        const sourcePath = path.resolve(root, step.code.file);
        if (!sourcePath.startsWith(root + path.sep) || sourcePath.includes(`${path.sep}.generated${path.sep}`) || sourcePath.includes(`${path.sep}dist${path.sep}`)) {
          errors.push(`${item.id}: learning code source is outside author sources: ${step.code.file}`);
        } else if (!allowedSources.has(step.code.file)) {
          errors.push(`${item.id}: learning code source is not owned by this item: ${step.code.file}`);
        } else {
          try {
            const source = await readFile(sourcePath, "utf8");
            const itemOwned = item.renderer === "static" || step.code.file === item.source;
            const expectedScope = itemOwned ? "item" : "shared";
            if (step.code.sourceScope !== expectedScope) errors.push(`${item.id}: learning code sourceScope must be ${expectedScope} for ${step.code.file}`);
            if (step.code.sourceAvailability !== "build-time-author-source") errors.push(`${item.id}: unsupported sourceAvailability ${step.code.sourceAvailability}`);
            const digest = `sha256:${createHash("sha256").update(source).digest("hex")}`;
            if (digest !== step.code.sourceDigest) errors.push(`${item.id}: stale learning source digest for ${step.code.file}`);
            if (!source.includes(step.code.snippet.trim())) errors.push(`${item.id}: learning snippet is not exact author source from ${step.code.file}`);
            if (!locatorMatchesSnippet(step.code.locator, step.code.snippet)) errors.push(`${item.id}: learning code locator is not verifiable against its snippet: ${step.code.locator}`);
          } catch {
            errors.push(`${item.id}: learning code source does not exist: ${step.code.file}`);
          }
        }
      }
    }
    if (allQuizCorrectPositions.length >= 3 && new Set(allQuizCorrectPositions).size < 2) errors.push(`${item.id}: quiz correct answers must not all use the same position`);
    if (!(learning.steps || []).some((step) => step.annotations?.length)) errors.push(`${item.id}: learning resource needs specimen annotations`);
    if (!(learning.steps || []).some((step) => step.code?.snippet)) errors.push(`${item.id}: learning resource needs a key code study`);
    if (!(learning.steps || []).some((step) => step.experiments?.length)) errors.push(`${item.id}: learning resource needs an interactive experiment`);
    if (!(learning.steps || []).some((step) => step.quiz?.length)) errors.push(`${item.id}: learning resource needs a mastery quiz`);
  } catch (reason) {
    errors.push(`${item.id}: missing or invalid learning resource (${reason.message})`);
  }
  const controlKeys = new Set();
  for (const control of item.controls || []) {
    if (controlKeys.has(control.key)) errors.push(`${item.id}: duplicate control ${control.key}`);
    controlKeys.add(control.key);
    if (!allowedControls.has(control.type)) errors.push(`${item.id}: unsupported control type ${control.type}`);
    if (control.default === undefined) errors.push(`${item.id}: control ${control.key} missing default`);
  }
  if (item.renderer === "static") {
    for (const name of ["index.html", "AI.md"]) {
      try { await access(path.join(root, item.sourceDir || "", name)); }
      catch { errors.push(`${item.id}: static source is missing ${name}`); }
    }
  } else if (item.renderer === "portfolio-theme" || item.renderer === "portfolio-layout") {
    try { await access(path.join(root, item.source)); }
    catch { errors.push(`${item.id}: source CSS does not exist: ${item.source}`); }
  } else {
    errors.push(`${item.id}: unsupported renderer ${item.renderer}`);
  }
}

for (const relative of ["src/template.html", "src/base.css", "specimens/shared/portfolio/bridge.js"]) {
  try {
    const content = await readFile(path.join(root, relative), "utf8");
    if (!content.trim()) errors.push(`${relative}: empty source`);
  } catch {
    errors.push(`${relative}: missing shared fixture source`);
  }
}

if (errors.length) {
  console.error(`[source] validation failed (${errors.length})\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`[source] validated ${catalog.length} Specimen Protocol v1 records`);
