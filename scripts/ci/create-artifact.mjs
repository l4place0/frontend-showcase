import { access, appendFile, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { digestDirectory, formatBytes, requiredEnvironment, sha256 } from "./artifact-lib.mjs";

const root = process.cwd();
const source = path.resolve(root, process.argv[2] || "dist");
const target = path.resolve(root, process.argv[3] || ".generated/ci/site-artifact");
const commit = requiredEnvironment("GITHUB_SHA", process.env.CI_COMMIT_SHA || "local");
const runId = process.env.GITHUB_RUN_ID || "local";
const runAttempt = Number(process.env.GITHUB_RUN_ATTEMPT || 1);

if (target === source || target.startsWith(`${source}${path.sep}`)) throw new Error("artifact staging directory must be outside dist");

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, path.join(target, "dist"), { recursive: true, errorOnExist: true });

const prototypePath = path.join(target, "dist", ".prototype-engineering");
try {
  await access(prototypePath);
  throw new Error("deployment artifact contains .prototype-engineering");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const directory = await digestDirectory(path.join(target, "dist"));
const lockfile = await readFile(path.join(root, "package-lock.json"));
const manifest = {
  schemaVersion: 1,
  commit,
  runId,
  runAttempt,
  nodeVersion: process.version,
  lockfileDigest: sha256(lockfile),
  distDigest: directory.digest,
  fileCount: directory.fileCount,
  totalBytes: directory.totalBytes,
};

await writeFile(path.join(target, "artifact-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `dist-digest=${directory.digest}\ntotal-bytes=${directory.totalBytes}\n`);
}
console.log(`[artifact] staged ${directory.fileCount} files (${formatBytes(directory.totalBytes)}) at ${path.relative(root, target)}`);
console.log(`[artifact] dist digest ${directory.digest}`);
