import { specimenCatalogIdentity } from "./artifact-lib.mjs";

const base = new URL(process.argv[2] || process.env.DEPLOYMENT_URL || "http://127.0.0.1:4173/frontend-showcase/");
const expectedCommit = process.argv[3] || process.env.EXPECTED_COMMIT;
const attempts = Number(process.env.SMOKE_ATTEMPTS || 5);
const retryDelayMs = Number(process.env.SMOKE_RETRY_DELAY_MS || 5000);
const minimumSpecimenCount = Number(process.env.MIN_EXPECTED_SPECIMENS || 60);

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchRequired(relative, parser = "text") {
  const url = new URL(relative, base);
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15_000) });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return parser === "json" ? response.json() : response.text();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await wait(retryDelayMs);
    }
  }
  throw new Error(`${url} failed after ${attempts} attempts: ${lastError?.message}`);
}

const homepage = await fetchRequired("./");
if (!homepage.includes("<div id=\"root\"></div>")) throw new Error("deployed homepage is missing the React root");

const manifest = await fetchRequired("./artifact-manifest.json", "json");
if (
  manifest.schemaVersion !== 1 ||
  !manifest.distDigest ||
  !Number.isInteger(manifest.specimenCount) ||
  !manifest.specimenIdsDigest
) {
  throw new Error("deployed artifact manifest is missing its catalog identity");
}
if (expectedCommit && manifest.commit !== expectedCommit) {
  throw new Error(`deployed commit ${manifest.commit} does not match expected ${expectedCommit}`);
}

const catalog = await fetchRequired("./specimens.json", "json");
const catalogIdentity = specimenCatalogIdentity(catalog);
if (catalogIdentity.specimenCount < minimumSpecimenCount) {
  throw new Error(`deployed catalog contains only ${catalogIdentity.specimenCount} specimens; expected at least ${minimumSpecimenCount}`);
}
if (
  catalogIdentity.specimenCount !== manifest.specimenCount ||
  catalogIdentity.specimenIdsDigest !== manifest.specimenIdsDigest
) {
  throw new Error(
    `deployed catalog identity ${catalogIdentity.specimenCount}/${catalogIdentity.specimenIdsDigest} does not match manifest ${manifest.specimenCount}/${manifest.specimenIdsDigest}`,
  );
}
const missingThumbnails = catalog.items.filter((item) => item.thumbnail !== "thumbnail.webp");
if (missingThumbnails.length) throw new Error(`deployed catalog has invalid thumbnail metadata: ${missingThumbnails.map(({ id }) => id).join(", ")}`);
await Promise.all(catalog.items.map((item) => fetchRequired(`./items/${encodeURIComponent(item.id)}/${item.thumbnail}`)));

for (const relative of [
  "./items/time-gallery-webgl/index.html",
  "./items/time-gallery-webgl/AI.md",
  "./items/time-gallery-webgl/ai-context.json",
  "./items/time-gallery-webgl/learning.json",
  "./items/living-digital-organism/index.html",
  "./items/living-digital-organism/AI.md",
  "./items/living-digital-organism/ai-context.json",
  "./items/living-digital-organism/learning.json",
  "./items/gargantua-black-hole/index.html",
  "./items/gargantua-black-hole/AI.md",
  "./items/gargantua-black-hole/ai-context.json",
  "./items/gargantua-black-hole/learning.json",
]) {
  await fetchRequired(relative);
}

console.log(`[smoke] ${base} serves commit ${manifest.commit} (${manifest.distDigest}) with ${catalogIdentity.specimenCount} Protocol v1 specimens and thumbnails`);
