import { mkdir, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const marker = process.argv.indexOf("--run");
const runId = marker >= 0 ? process.argv[marker + 1] : process.argv[2];
if (!/^\d+$/.test(runId || "")) {
  console.error("usage: npm run ci:diagnose -- --run <github-run-id>");
  process.exit(2);
}

const target = path.resolve(".generated", "ci-diagnose", runId);
await mkdir(target, { recursive: true });
const result = spawnSync("gh", ["run", "download", runId, "--pattern", "ci-diagnostics-*", "--dir", target], { stdio: "inherit" });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);

const candidates = [path.join(target, "summary.json")];
try {
  const entries = await import("node:fs/promises").then(({ readdir }) => readdir(target));
  for (const entry of entries) candidates.push(path.join(target, entry, "summary.json"));
} catch {}

let summary;
for (const candidate of candidates) {
  try {
    summary = JSON.parse(await readFile(candidate, "utf8"));
    break;
  } catch {}
}
if (!summary) throw new Error(`downloaded diagnostics for run ${runId}, but summary.json was not found`);

let artifactVerification = "not available";
if (summary.artifact?.name) {
  const artifactTarget = path.join(target, "site-artifact");
  await mkdir(artifactTarget, { recursive: true });
  const download = spawnSync(
    "gh",
    ["run", "download", runId, "--name", summary.artifact.name, "--dir", artifactTarget],
    { stdio: "inherit" },
  );
  if (download.status === 0) {
    const verify = spawnSync(process.execPath, [path.resolve("scripts/ci/verify-artifact.mjs"), artifactTarget], {
      stdio: "inherit",
      env: { ...process.env, CI_COMMIT_SHA: summary.run.commit },
    });
    if (verify.error) throw verify.error;
    if (verify.status !== 0) process.exit(verify.status || 1);
    artifactVerification = `verified at ${artifactTarget}`;
  } else {
    artifactVerification = "unavailable or expired; diagnostic evidence was still downloaded";
  }
}

console.log(JSON.stringify(summary, null, 2));
console.log(`\nDiagnostics downloaded to ${target}`);
console.log(`Site artifact: ${artifactVerification}`);
console.log("Reproduction commands:");
for (const [scope, command] of Object.entries(summary.reproduction || {})) console.log(`  ${scope}: ${command}`);
