import { readFile } from "node:fs/promises";
import path from "node:path";
import { digestDirectory, formatBytes } from "./artifact-lib.mjs";

const root = process.cwd();
const artifactRoot = path.resolve(root, process.argv[2] || ".");
const manifest = JSON.parse(await readFile(path.join(artifactRoot, "artifact-manifest.json"), "utf8"));
const expectedCommit = process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA;

if (manifest.schemaVersion !== 1) throw new Error(`unsupported artifact schema ${manifest.schemaVersion}`);
if (expectedCommit && manifest.commit !== expectedCommit) {
  throw new Error(`artifact commit ${manifest.commit} does not match expected ${expectedCommit}`);
}

const directory = await digestDirectory(path.join(artifactRoot, "dist"));
if (directory.digest !== manifest.distDigest) {
  throw new Error(`artifact digest ${directory.digest} does not match manifest ${manifest.distDigest}`);
}
if (directory.fileCount !== manifest.fileCount || directory.totalBytes !== manifest.totalBytes) {
  throw new Error("artifact file count or byte count does not match manifest");
}

console.log(`[artifact] verified ${manifest.commit} (${directory.fileCount} files, ${formatBytes(directory.totalBytes)})`);
console.log(`[artifact] dist digest ${directory.digest}`);
