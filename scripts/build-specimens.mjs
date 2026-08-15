import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { build as bundleJavaScript } from "esbuild";
import { createHash } from "node:crypto";
import { createCatalog } from "../specimens/catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src");
const generatedPublic = path.join(root, ".generated", "public");
const itemsRoot = path.join(generatedPublic, "items");
const catalog = createCatalog();
const UTF8_BOM = "\uFEFF";

const [template, baseCss, zenCss, bridge] = await Promise.all([
  readFile(path.join(src, "template.html"), "utf8"),
  readFile(path.join(src, "base.css"), "utf8"),
  readFile(path.join(src, "themes", "zen.css"), "utf8"),
  readFile(path.join(root, "specimens", "shared", "portfolio", "bridge.js"), "utf8"),
]);

function escapeInlineJson(value) {
  return JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");
}

function discoveryMarkup(item) {
  const context = {
    specimenVersion: 1,
    id: item.id,
    manifest: "./specimen.json",
    prompt: "./AI.md",
    context: "./ai-context.json",
    learning: "./learning.json",
    controls: item.controls,
  };
  return `<link rel="alternate" type="text/markdown" href="./AI.md" title="AI reproduction prompt">
<link rel="alternate" type="application/json" href="./ai-context.json" title="Structured specimen context">
<link rel="alternate" type="application/json" href="./specimen.json" title="Specimen manifest">
<link rel="alternate" type="application/json" href="./learning.json" title="Human learning resource">
<script type="application/json" id="specimen-context">${escapeInlineJson(context)}</script>`;
}

function stripLegacyHostUi(html) {
  return html
    .replace(/\n?<div class="museum-bar">[\s\S]*?<\/div>\s*(?=<nav>)/, "\n")
    .replace(/\n?<div class="param-dock"[\s\S]*?<script>\s*\/\/ 两柜参数独立记忆[\s\S]*?<\/script>\s*/, "\n")
    .replace(/<p>[^<]*\{\{CABINET_NAME\}\}[\s\S]*?<\/p>/, "");
}

function applySectionOrder(html, sectionOrder) {
  if (!sectionOrder) return html;
  const main = html.match(/<main>\s*([\s\S]*?)\s*<\/main>/);
  if (!main) throw new Error("portfolio template is missing <main>");
  const sections = [...main[1].matchAll(/<section id="([^"]+)">[\s\S]*?<\/section>/g)];
  const byId = new Map(sections.map((match) => [match[1], match[0]]));
  if (sections.length !== sectionOrder.length || sectionOrder.some((id) => !byId.has(id)) || new Set(sectionOrder).size !== sectionOrder.length) {
    throw new Error(`invalid sectionOrder: ${sectionOrder.join(", ")}`);
  }
  const reordered = sectionOrder.map((id) => byId.get(id)).join("\n\n");
  const withOrderedMain = html.replace(main[0], `<main>\n\n${reordered}\n\n</main>`);
  const nav = withOrderedMain.match(/<div class="nav-links">\s*([\s\S]*?)\s*<\/div>/);
  if (!nav) throw new Error("portfolio template is missing .nav-links");
  const links = [...nav[1].matchAll(/<a href="#([^"]+)">[\s\S]*?<\/a>/g)];
  const linksById = new Map(links.map((match) => [match[1], match[0]]));
  if (links.length !== sectionOrder.length || sectionOrder.some((id) => !linksById.has(id))) {
    throw new Error(`sectionOrder does not match nav links: ${sectionOrder.join(", ")}`);
  }
  const reorderedLinks = sectionOrder.map((id) => linksById.get(id)).join("\n      ");
  return withOrderedMain.replace(nav[0], `<div class="nav-links">\n      ${reorderedLinks}\n    </div>`);
}

function renderHtml(item, itemCss) {
  const bodyClass = item.renderer === "portfolio-theme"
    ? `t-${item.slug}`
    : `t-zen l-${item.slug}`;
  const skinCss = item.renderer === "portfolio-theme" ? itemCss : `${zenCss}\n${itemCss}`;
  const discovery = `
${discoveryMarkup(item)}
<style>
nav { top: 0; }
.hero { padding-top: 120px; }
html[data-specimen-paused="true"] *, html[data-specimen-paused="true"] *::before, html[data-specimen-paused="true"] *::after { animation-play-state: paused !important; }
</style>`;

  let html = applySectionOrder(stripLegacyHostUi(template), item.sectionOrder)
    .replace("/*__BASE_CSS__*/", baseCss)
    .replace("/*__THEME_CSS__*/", skinCss)
    .replaceAll("{{BODY_CLASS}}", bodyClass)
    .replaceAll("{{EXHIBIT_LABEL}}", `${item.title.zh} ${item.title.en}`)
    .replaceAll("{{CABINET_NAME}}", "前端样品博物馆")
    .replaceAll("{{CABINET_URL}}", `../../index.html#/items/${item.id}`)
    .replaceAll("{{CABINET_SHORT}}", "展柜")
    .replaceAll("{{OTHER_NAME}}", "全部展品")
    .replaceAll("{{OTHER_URL}}", "../../index.html")
    .replaceAll("{{PARAM_KIND}}", item.category)
    .replaceAll("{{PARAM_TITLE}}", "展品参数")
    .replace("<!--__PARAM_CONTROLS__-->", "")
    .replace("</head>", `${discovery}\n</head>`)
    .replace("</body>", `<script>${bridge}</script>\n</body>`);

  const unresolved = html.match(/\{\{[^}]+\}\}|\/\*__[A-Z_]+__\*\/|<!--__[A-Z_]+__-->/g);
  if (unresolved) throw new Error(`${item.id}: unresolved placeholders: ${unresolved.join(", ")}`);
  return html;
}

function renderStaticHtml(item, sourceHtml) {
  if (!/<\/head>/i.test(sourceHtml) || !/<\/body>/i.test(sourceHtml)) {
    throw new Error(`${item.id}: static renderer requires complete HTML with head and body`);
  }
  return sourceHtml
    .replace(/<\/head>/i, `${discoveryMarkup(item)}\n</head>`)
    .replace(/<\/body>/i, `<script>${bridge}</script>\n</body>`);
}

function extractTokens(css, bodyClass) {
  const selector = bodyClass.split(" ")[0];
  const block = css.match(new RegExp(`\\.${selector}\\s*\\{([\\s\\S]*?)\\}`))?.[1] || "";
  return Object.fromEntries(
    [...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]),
  );
}

function aiMarkdown(item, css) {
  const kind = item.category === "layout" ? "布局样品" : "视觉风格样品";
  const layoutNote = item.category === "layout"
    ? `保持既有内容语义，仅复刻 ${item.title.zh} 的信息层级、区块顺序、网格和响应式重排。`
    : "保持页面信息清晰，用颜色、字体、边框、表面和装饰塑造视觉身份。";
  const tokens = extractTokens(css, item.renderer === "portfolio-theme" ? `t-${item.slug}` : "t-zen");
  const tokenLines = Object.entries(tokens).slice(0, 24).map(([key, value]) => `- \`${key}\`: \`${value}\``).join("\n");
  return `# ${item.title.zh} · ${item.title.en} — AI Reproduction Guide

## Objective

仿照此 URL 中的${kind}制作新的前端制品。${item.description}。复刻设计语言与交互原则，不要机械复制演示文案。

## Visual Identity

- 分类：${item.category}
- 关键词：${item.tags.join("、")}
- 核心观感：${item.description}
- ${layoutNote}

## Design Tokens

${tokenLines || "- 以 index.html 内嵌 CSS 的自定义属性为准。"}

## Structure

样品使用语义化的导航、Hero、项目、技能、关于、文章、联系和页脚区块。生成新制品时可以替换内容，但应保留对该样品视觉或布局判断有意义的层级关系。

## Components

重点参考导航、CTA 按钮、项目卡片、标签、技能条、文章列表和联系卡片。组件的圆角、边框、阴影和悬停反馈应共享同一套设计变量。

## Interaction

支持页内锚点、键盘可操作链接、滚动显现和参数调节。可调参数定义见 specimen.json 的 controls。

## Motion

动画用于强调层次，不应阻碍阅读。尊重 prefers-reduced-motion；暂停状态下停止 CSS 动画，并为 Canvas/WebGL 循环提供等价的暂停机制。

## Responsive Behavior

桌面维持样品的主要构图；窄屏应折叠多列内容、保留合理触控尺寸并避免横向溢出。具体断点和重排规则以 index.html 内嵌 CSS 为准。

## Accessibility

使用语义化 HTML、可见焦点、足够对比度、图像替代文本，并确保核心体验不依赖鼠标悬停。

## Implementation Constraints

- 制品必须可独立运行，不依赖展柜 DOM 或 React 上下文。
- 资源本地打包，不使用运行时 CDN。
- 使用 CSS Variables组织可调设计参数。
- 保持动画、事件监听和渲染循环可清理、可暂停。

## Avoid

- 不添加与样品设计语言无关的流行效果。
- 不牺牲可读性来追求装饰。
- 不把展柜 UI 或宿主页面样式复制进制品。
- 不依赖远程字体、脚本或样式表。

## Source Reference

- 可运行且自包含的实现：./index.html
- 结构化清单：./specimen.json
- 机器可读上下文：./ai-context.json
`;
}

await mkdir(generatedPublic, { recursive: true });
await rm(itemsRoot, { recursive: true, force: true });
await mkdir(itemsRoot, { recursive: true });

for (const item of catalog) {
  const itemDir = path.join(itemsRoot, item.id);
  const learningSource = path.join(root, "specimens", "learning", "items", `${item.id}.json`);
  const learning = JSON.parse(await readFile(learningSource, "utf8"));
  const learningDigest = `sha256:${createHash("sha256").update(JSON.stringify(learning)).digest("hex")}`;
  let html;
  let prompt;
  if (item.renderer === "static") {
    const sourceDir = path.resolve(root, item.sourceDir || "");
    if (!item.sourceDir || !sourceDir.startsWith(path.join(root, "specimens", "items") + path.sep)) {
      throw new Error(`${item.id}: static sourceDir must be inside specimens/items`);
    }
    await cp(sourceDir, itemDir, { recursive: true });
    const [sourceHtml, sourcePrompt] = await Promise.all([
      readFile(path.join(sourceDir, "index.html"), "utf8"),
      readFile(path.join(sourceDir, "AI.md"), "utf8"),
    ]);
    html = renderStaticHtml(item, sourceHtml);
    prompt = sourcePrompt;
    if (item.bundle) {
      const plugins = [];
      if (item.bundle.inlineArtworkImages) {
        plugins.push({
          name: "inline-artwork-images",
          setup(build) {
            build.onResolve({ filter: /^virtual:artwork-images$/ }, () => ({ path: "artwork-images", namespace: "inline-artwork-images" }));
            build.onLoad({ filter: /.*/, namespace: "inline-artwork-images" }, async () => {
              const catalogPath = path.join(sourceDir, item.bundle.inlineArtworkImages);
              const artworkCatalog = JSON.parse(await readFile(catalogPath, "utf8"));
              const entries = await Promise.all(artworkCatalog.artworks.map(async (artwork) => {
                const bytes = await readFile(path.join(sourceDir, artwork.image));
                return [artwork.image, `data:image/jpeg;base64,${bytes.toString("base64")}`];
              }));
              return { contents: `export default ${JSON.stringify(Object.fromEntries(entries))};`, loader: "js" };
            });
          },
        });
      }
      await bundleJavaScript({
        entryPoints: [path.join(sourceDir, item.bundle.source)],
        outfile: path.join(itemDir, item.bundle.output),
        bundle: true,
        format: "iife",
        platform: "browser",
        target: "es2022",
        minify: true,
        sourcemap: false,
        plugins,
      });
    }
  } else if (item.renderer === "portfolio-theme" || item.renderer === "portfolio-layout") {
    const itemCss = await readFile(path.join(root, item.source), "utf8");
    html = renderHtml(item, itemCss);
    prompt = aiMarkdown(item, item.renderer === "portfolio-theme" ? itemCss : `${zenCss}\n${itemCss}`);
  } else {
    throw new Error(`${item.id}: unsupported renderer ${item.renderer}`);
  }
  const publicManifest = {
    ...item,
    entry: "index.html",
    url: "index.html",
    ai: { prompt: "AI.md", context: "ai-context.json", source: "index.html" },
    learning: { ...item.learning, resource: "learning.json" },
  };
  delete publicManifest.source;
  delete publicManifest.sourceDir;
  delete publicManifest.sourceFiles;
  delete publicManifest.bundle;
  const aiContext = {
    specimenVersion: 1,
    id: item.id,
    url: "index.html",
    manifest: publicManifest,
    prompt,
    learning: { resource: "learning.json", version: learning.learningVersion, contentRevision: learning.contentRevision, title: learning.title, objectives: learning.objectives, artifactDigest: learningDigest },
    sourceFiles: item.renderer === "static"
      ? (item.sourceFiles || ["index.html", ...(item.bundle ? [item.bundle.output] : []), "styles.css"])
      : ["index.html"],
    discovery: { manifest: "specimen.json", prompt: "AI.md", context: "ai-context.json", learning: "learning.json" },
  };

  await mkdir(itemDir, { recursive: true });
  const promptWithLearning = `${prompt.replace(/\s+$/, "")}\n\n## Learning Resource\n\n- Human learning tutorial: ./learning.json\n- The tutorial is structured, versioned, and tied to this specimen's author-source references.\n`;
  await Promise.all([
    writeFile(path.join(itemDir, "index.html"), html),
    writeFile(path.join(itemDir, "specimen.json"), `${JSON.stringify(publicManifest, null, 2)}\n`),
    // Static hosts commonly serve Markdown without a charset. The UTF-8 BOM
    // keeps direct browser visits readable while remaining transparent to AI
    // clients and Markdown parsers.
    writeFile(path.join(itemDir, "AI.md"), `${UTF8_BOM}${promptWithLearning.replace(/^\uFEFF/, "")}`),
    writeFile(path.join(itemDir, "ai-context.json"), `${JSON.stringify(aiContext, null, 2)}\n`),
    writeFile(path.join(itemDir, "learning.json"), `${JSON.stringify(learning, null, 2)}\n`),
  ]);
}

const llms = `# Frontend Specimen Museum\n\n> AI-friendly, independently runnable frontend references with human learning resources.\n\n## Discovery\n\n- [Machine-readable catalog](./specimens.json)\n${catalog.map((item) => `- [${item.title.zh} · ${item.title.en}](./${item.entry}) — [prompt](./${item.ai.prompt}) · [learning](./${item.learning.resource})`).join("\n")}\n`;
await writeFile(path.join(generatedPublic, "llms.txt"), `${UTF8_BOM}${llms}`);

// Keep the public catalog canonical even if this script is invoked directly.
await writeFile(
  path.join(generatedPublic, "specimens.json"),
  `${JSON.stringify({ specimenVersion: 1, items: catalog.map(({ source, sourceDir, sourceFiles, bundle, ...item }) => item) }, null, 2)}\n`,
);

console.log(`[specimens] built ${catalog.length} self-contained items in .generated/public/items`);
