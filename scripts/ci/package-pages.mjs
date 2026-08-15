import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const artifactRoot = path.resolve(root, process.argv[2] || ".");
const target = path.resolve(root, process.argv[3] || ".generated/pages");
const dist = path.join(artifactRoot, "dist");
const manifestPath = path.join(artifactRoot, "artifact-manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

if (target === dist || target.startsWith(`${dist}${path.sep}`)) {
  throw new Error("Pages package must be outside the verified dist directory");
}

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(dist, target, { recursive: true, errorOnExist: true });
await writeFile(path.join(target, "artifact-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`[pages] packaged verified commit ${manifest.commit} without rebuilding dist`);
