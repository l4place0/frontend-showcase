import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { createCatalog } from "../specimens/catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, ".generated", "public");
const reportDir = path.join(root, ".generated", "reports");
const diagnosticsDir = path.join(root, ".generated", "thumbnail-diagnostics");
const catalog = createCatalog();
const width = 1200;
const height = 900;
const quality = 82;

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

function localPathFromRequest(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl || "/", "http://127.0.0.1").pathname);
  const candidate = path.resolve(publicRoot, `.${pathname}`);
  return candidate === publicRoot || candidate.startsWith(`${publicRoot}${path.sep}`) ? candidate : null;
}

function startServer() {
  const server = createServer(async (request, response) => {
    const candidate = localPathFromRequest(request.url);
    if (!candidate) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    try {
      const bytes = await readFile(candidate);
      response.writeHead(200, { "content-type": contentTypes.get(path.extname(candidate).toLowerCase()) || "application/octet-stream" });
      response.end(bytes);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function serverOrigin(server) {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("thumbnail server did not expose a TCP address");
  return `http://127.0.0.1:${address.port}`;
}

async function writeWebp(input, output, fit = "cover", outputQuality = quality) {
  await sharp(input)
    .resize(width, height, { fit, position: "centre" })
    .webp({ quality: outputQuality, effort: 4 })
    .toFile(output);
  const bytes = await readFile(output);
  return {
    bytes: bytes.length,
    digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
  };
}

await Promise.all([
  mkdir(reportDir, { recursive: true }),
  mkdir(diagnosticsDir, { recursive: true }),
]);

const server = await startServer();
const browser = await chromium.launch({ headless: true });
const webglBrowser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  colorScheme: "dark",
  reducedMotion: "reduce",
});
const page = await context.newPage();
const webglContext = await webglBrowser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  colorScheme: "dark",
  reducedMotion: "reduce",
});
const webglPage = await webglContext.newPage();
const results = [];
let failed = false;

try {
  for (const item of catalog) {
    const activePage = item.runtime?.webgl ? webglPage : page;
    const startedAt = performance.now();
    const itemDir = path.join(publicRoot, "items", item.id);
    const output = path.join(itemDir, item.thumbnail);
    const strategy = item.preview?.strategy || "capture";
    try {
      let identity;
      if (strategy === "poster") {
        if (!item.preview?.source) throw new Error("poster strategy requires preview.source");
        const source = path.resolve(itemDir, item.preview.source);
        if (!source.startsWith(`${itemDir}${path.sep}`)) throw new Error("poster source escapes the item directory");
        identity = await writeWebp(source, output, "cover", 74);
      } else if (strategy === "capture") {
        const url = `${serverOrigin(server)}/items/${encodeURIComponent(item.id)}/index.html?testMode=1&seed=42&time=1000`;
        const response = await activePage.goto(url, { waitUntil: "load", timeout: 30_000 });
        if (!response?.ok()) throw new Error(`preview returned ${response?.status() || "no response"}`);
        await activePage.evaluate(async () => {
          await document.fonts.ready;
          window.scrollTo(0, 0);
        });
        await activePage.addStyleTag({ content: "*,*::before,*::after{animation-delay:0s!important;animation-duration:0s!important;transition:none!important;caret-color:transparent!important}html{scroll-behavior:auto!important}" });
        if (item.preview?.anchor && item.preview.anchor !== "viewport") {
          await activePage.locator(item.preview.anchor).waitFor({ state: "visible" });
          await activePage.evaluate((selector) => {
            const anchor = document.querySelector(selector);
            if (!anchor) throw new Error(`preview anchor not found: ${selector}`);
            window.scrollTo(0, anchor.getBoundingClientRect().top + window.scrollY);
          }, item.preview.anchor);
        }
        await activePage.waitForTimeout(100);
        identity = await writeWebp(await activePage.screenshot({
          animations: "disabled",
          caret: "hide",
          timeout: item.runtime?.webgl ? 90_000 : 30_000,
        }), output, "fill");
      } else {
        throw new Error(`unsupported preview strategy ${strategy}`);
      }
      const result = {
        id: item.id,
        strategy,
        status: "generated",
        cacheHit: false,
        durationMs: Math.round(performance.now() - startedAt),
        ...identity,
      };
      results.push(result);
      console.log(`[thumbnail] ${item.id} ${strategy} ${result.bytes} bytes ${result.durationMs}ms`);
    } catch (error) {
      failed = true;
      const message = error instanceof Error ? error.message : String(error);
      results.push({ id: item.id, strategy, status: "failed", cacheHit: false, durationMs: Math.round(performance.now() - startedAt), error: message });
      try { await activePage.screenshot({ path: path.join(diagnosticsDir, `${item.id}.png`) }); } catch { /* Preserve the original failure. */ }
      console.error(`[thumbnail] ${item.id} failed: ${message}`);
    }
  }
} finally {
  await context.close();
  await webglContext.close();
  await browser.close();
  await webglBrowser.close();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

const report = {
  schemaVersion: 1,
  expected: catalog.length,
  generated: results.filter(({ status }) => status === "generated").length,
  failed: results.filter(({ status }) => status === "failed").length,
  totalBytes: results.reduce((sum, result) => sum + (result.bytes || 0), 0),
  totalDurationMs: results.reduce((sum, result) => sum + result.durationMs, 0),
  items: results,
};
await writeFile(path.join(reportDir, "thumbnail-report.json"), `${JSON.stringify(report, null, 2)}\n`);

if (failed) process.exit(1);
console.log(`[thumbnail] generated ${report.generated}/${report.expected} previews (${report.totalBytes} bytes, ${report.totalDurationMs}ms cumulative)`);
