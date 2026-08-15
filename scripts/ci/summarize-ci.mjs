import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const input = path.resolve(root, process.argv[2] || ".generated/diagnostic-input");
const output = path.resolve(root, process.argv[3] || ".generated/ci-diagnostics");
const jobs = JSON.parse(process.env.CI_JOB_RESULTS || "{}");
const failedJobs = Object.entries(jobs).filter(([, result]) => result !== "success").map(([name]) => name);
const commit = process.env.GITHUB_SHA || "local";
const runId = process.env.GITHUB_RUN_ID || "local";
const runAttempt = Number(process.env.GITHUB_RUN_ATTEMPT || 1);

await mkdir(output, { recursive: true });

async function findFiles(directory, fileName, matches = []) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return matches;
    throw error;
  }
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await findFiles(absolute, fileName, matches);
    else if (entry.isFile() && entry.name === fileName) matches.push(absolute);
  }
  return matches;
}

function collectSpecs(suite, specs = []) {
  specs.push(...(suite.specs || []));
  for (const child of suite.suites || []) collectSpecs(child, specs);
  return specs;
}

let manifest = null;
for (const candidate of [
  path.join(input, "site", "artifact-manifest.json"),
  path.join(input, "artifact-manifest.json"),
]) {
  try {
    manifest = JSON.parse(await readFile(candidate, "utf8"));
    break;
  } catch {}
}

const summary = {
  schemaVersion: 1,
  repository: process.env.GITHUB_REPOSITORY || "local",
  run: {
    id: runId,
    attempt: runAttempt,
    event: process.env.GITHUB_EVENT_NAME || "local",
    commit,
    ref: process.env.GITHUB_REF || "local",
    head: process.env.CI_HEAD_REF || null,
    base: process.env.CI_BASE_REF || null,
  },
  environment: {
    runner: process.env.RUNNER_OS || "unknown",
    node: process.version,
  },
  artifact: manifest
    ? {
        ...manifest,
        name: process.env.CI_ARTIFACT_NAME || null,
        uploadDigest: process.env.CI_ARTIFACT_UPLOAD_DIGEST || null,
      }
    : null,
  gate: {
    result: failedJobs.length ? "failure" : "success",
    jobs,
    failedJobs,
  },
  reproduction: {
    component: "npm run test:components",
    e2e: "npm run test:e2e:ordinary",
    webgl: "npm run test:webgl",
    visual: "npm run test:visual",
  },
};

const failures = [];
const testTimings = [];
const reportSummaries = [];
for (const reportFile of await findFiles(path.join(input, "test-reports"), "results.json")) {
  const report = JSON.parse(await readFile(reportFile, "utf8"));
  const scope = path.basename(path.dirname(reportFile));
  reportSummaries.push({
    scope,
    playwright: report.config?.version || null,
    workers: report.config?.workers ?? null,
    stats: report.stats || null,
  });
  for (const suite of report.suites || []) {
    for (const spec of collectSpecs(suite)) {
      for (const test of spec.tests || []) {
        const duration = (test.results || []).reduce((total, result) => total + (result.duration || 0), 0);
        testTimings.push({ scope, title: spec.title, file: spec.file, line: spec.line, durationMs: duration, status: test.status });
        if (test.status === "unexpected" || test.status === "flaky") {
          const attempts = (test.results || []).map((result) => ({
            retry: result.retry,
            status: result.status,
            durationMs: result.duration,
            errors: (result.errors || []).map((error) => error.message || error.value || String(error)),
            attachments: (result.attachments || []).map((attachment) => ({ name: attachment.name, contentType: attachment.contentType, path: attachment.path || null })),
          }));
          failures.push({
            suite: scope,
            test: spec.title,
            file: spec.file,
            line: spec.line,
            project: test.projectName,
            classification: test.status === "flaky" ? "flaky" : "unclassified",
            attempts,
          });
        }
      }
    }
  }
}

testTimings.sort((left, right) => right.durationMs - left.durationMs);
summary.reports = reportSummaries;
summary.failures = failures;
summary.timings = {
  testCount: testTimings.length,
  slowestTests: testTimings.slice(0, 20),
};

await writeFile(path.join(output, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
await writeFile(path.join(output, "failures.json"), `${JSON.stringify({ schemaVersion: 1, failures }, null, 2)}\n`);
await writeFile(path.join(output, "reproduction.json"), `${JSON.stringify(summary.reproduction, null, 2)}\n`);
await writeFile(path.join(output, "timings.json"), `${JSON.stringify({ schemaVersion: 1, source: "Playwright JSON reports", reports: reportSummaries, tests: testTimings }, null, 2)}\n`);
if (manifest) await writeFile(path.join(output, "artifact-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

await rm(path.join(input, "site", "dist"), { recursive: true, force: true });
try {
  await cp(input, path.join(output, "reports"), { recursive: true });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const summaryFile = process.env.GITHUB_STEP_SUMMARY;
if (summaryFile) {
  const lines = [
    "## CI quality summary",
    "",
    `- Commit: \`${commit}\``,
    `- Run attempt: \`${runAttempt}\``,
    `- Gate: **${summary.gate.result.toUpperCase()}**`,
    `- Failed layers: ${failedJobs.length ? failedJobs.map((name) => `\`${name}\``).join(", ") : "none"}`,
    `- Artifact digest: \`${manifest?.distDigest || "unavailable"}\``,
    "",
    "### Reproduction",
    "",
    ...Object.entries(summary.reproduction).map(([name, command]) => `- ${name}: \`${command}\``),
    "",
  ];
  await writeFile(summaryFile, lines.join("\n"), { flag: "a" });
}

console.log(`[diagnostics] wrote ${path.relative(root, output)} for run ${runId} attempt ${runAttempt}`);
