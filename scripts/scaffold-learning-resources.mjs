import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createCatalog } from "../specimens/catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(root, "specimens", "learning", "items");
const missingOnly = process.argv.includes("--missing-only");
const preserveCurated = process.argv.includes("--preserve-curated");
const curatedIds = new Set(["css-ocean-wave", "time-gallery-webgl", "cosmos", "paper", "terminal", "artdeco", "layout-classic", "layout-magazine", "layout-dashboard", "layout-split-screen", "neumorphism", "watercolor", "matrix", "glass", "risograph", "layout-horizontal", "layout-accordion", "layout-one-screen", "layout-masonry", "layout-tabbed", "brutalist", "cyberpunk", "aurora", "blueprint", "botanical", "layout-collage", "layout-floating", "layout-grid9", "layout-chatflow", "layout-panes", "sunset", "swiss", "pixel", "editorial", "vaporwave", "zen", "popart", "chalkboard", "memphis", "midnight", "monochrome", "parchment", "bauhaus", "y2k", "clay", "candy", "layout-side-nav", "layout-hero-full", "layout-timeline", "layout-centered", "layout-album-rows", "layout-big-type", "layout-z-pattern", "layout-f-pattern", "layout-axis", "layout-index-page", "layout-newspaper", "layout-reverse", "layout-staggered", "layout-bands", "layout-cta-first", "layout-compare"]);

const digest = (source) => `sha256:${createHash("sha256").update(source).digest("hex")}`;

function cssRules(source) {
  return [...source.matchAll(/(?:^|\n)([^@\n][^{}]+)\{([^{}]+)\}/g)]
    .map((match) => `${match[1].trim()} {${match[2]}}`.trim())
    .filter((rule) => !rule.startsWith("from ") && !rule.startsWith("to "));
}

function exactCssRule(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return source.match(new RegExp(`${escaped}\\s*\\{[^{}]+\\}`))?.[0].trim() || cssRules(source)[0];
}

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`function ${name} not found`);
  const brace = source.indexOf("{", start);
  let depth = 0;
  for (let index = brace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`function ${name} is incomplete`);
}

const annotations = {
  theme: [
    { id: "visual-identity", anchor: [29, 31], elbow: [38, 22], end: [51, 22], summary: "视觉身份从 Hero 即刻建立", detail: "先忽略文字含义，只比较背景、标题、表面和强调色如何共同制造第一印象。" },
    { id: "navigation-surface", anchor: [79, 12], elbow: [70, 20], end: [58, 20], detailSide: "left", summary: "导航复用同一套表面语言", detail: "导航的背景、边界与文字层级应与正文卡片属于同一个 token 系统，而不是另做一套皮肤。" },
  ],
  layout: [
    { id: "reading-entry", anchor: [30, 32], elbow: [40, 23], end: [54, 23], summary: "首屏决定阅读入口", detail: "观察标题、引言和行动按钮的顺序，判断视线首先落在哪里、下一步又被引向哪里。" },
    { id: "content-rhythm", anchor: [52, 73], elbow: [63, 65], end: [76, 65], detailSide: "left", summary: "区块关系决定阅读节奏", detail: "布局的关键不是装饰，而是宽度、间距、顺序和网格如何组织同一份语义内容。" },
  ],
};

function experimentSet(item) {
  if (item.category === "visual-style") return [
    { id: "color-isolation", label: "偏移色相，保留结构", initial: { hue: 0, saturation: 100 }, controls: { hue: 32, saturation: 72 }, expected: `观察${item.title.zh}的颜色身份发生偏移，但 Hero、导航和项目层级保持原位。`, reset: "使用播放器的“重置”恢复 manifest 默认值。" },
    { id: "surface-contrast", label: "强化对比，压低圆角", initial: { contrast: 100, radius: 100 }, controls: { contrast: 128, radius: 25 }, expected: `比较${item.title.zh}的边界、表面与按钮性格如何变化，并确认这不等于改变信息架构。`, reset: "使用播放器的“重置”恢复 manifest 默认值。" },
  ];
  if (item.category === "layout") return [
    { id: "narrow-composition", label: "收窄画布与卡片", initial: { width: 1080, cardMin: 310 }, controls: { width: 760, cardMin: 245 }, expected: `观察${item.title.zh}在更窄内容带中如何重排，同时保持原有区块语义。`, reset: "使用播放器的“重置”恢复 manifest 默认值。" },
    { id: "rhythm-stress", label: "拉开区块与网格节奏", initial: { space: 100, gap: 100 }, controls: { space: 145, gap: 165 }, expected: `判断${item.title.zh}的核心构图在高间距压力下是否仍然可辨。`, reset: "使用播放器的“重置”恢复 manifest 默认值。" },
  ];
  if (item.id === "css-ocean-wave") return [
    { id: "state-axis", label: "日间激活 → 夜间激活", initial: { nightMode: false, animationState: "active" }, controls: { nightMode: true, animationState: "active" }, expected: "天空与海面颜色变化，但 active 的海面位置和运动状态保持。", reset: "使用播放器的“重置”恢复日间闲置状态。" },
    { id: "wave-shape", label: "低浪 → 高浪", initial: { waveHeight: 75, foam: true }, controls: { waveHeight: 165, foam: true }, expected: "浪形高度明显改变，三层浪的周期差与相位关系保持。", reset: "使用播放器的“重置”恢复 110% 浪高。" },
  ];
  return [
    { id: "native-timeline", label: "在展品中进入时间轴", initial: {}, controls: {}, expected: "欢迎屏切换为九时期树状时间轴，画廊仍使用本地作品数据。", reset: "点击展品内返回首页按钮回到欢迎屏。" },
    { id: "native-gallery", label: "选择时期并进入展厅", initial: {}, controls: {}, expected: "所选时期决定展厅作品集合，帮助面板与退出路径保持可用。", reset: "按 Escape 或使用展品内返回时间轴操作。" },
  ];
}

function quizSet(item, sourcePath, core) {
  const isTheme = item.category === "visual-style";
  const isLayout = item.category === "layout";
  return [
    { id: "invariant", question: `操作参数时，${item.title.zh}中哪一项应作为不变量？`, options: ["所有颜色数值", "语义区块与内容层级", "所有尺寸数值"], correct: 1, explanation: "教程实验改变视觉或构图参数，但不应复制或重写展品的语义内容结构。" },
    { id: "source", question: `哪一个作者源直接定义了${item.title.zh}的核心实现？`, options: ["dist/index.html", ".generated/public/specimens.json", sourcePath], correct: 2, explanation: `关键代码摘录由 ${sourcePath} 校验，生成目录不是作者源。` },
    { id: "principle", question: `以下哪项最接近${item.title.zh}的核心判断？`, options: [core, isTheme ? "只增加装饰，不建立 token 关系" : isLayout ? "只改变颜色，不改变阅读路径" : "依赖远程资源替代本地实现", "让宿主直接修改 iframe DOM"], correct: 0, explanation: `${item.description}。这个判断必须能同时由眼前展品和作者源代码支持。` },
  ];
}

function sharedResource(item, sourcePath, source, firstRule, secondRule) {
  const family = item.category === "visual-style" ? "theme" : "layout";
  const core = item.description;
  const selectorOf = (rule) => rule.slice(0, rule.indexOf("{")).trim();
  const principles = item.category === "visual-style"
    ? [`识别${item.title.zh}如何用共享 token 建立“${core}”的视觉身份`, "区分视觉参数变化与页面语义结构变化"]
    : [`识别${item.title.zh}如何用区块顺序、宽度和间距形成“${core}”`, "在压力实验中判断核心阅读路径是否仍然成立"];
  return {
    learningVersion: 1,
    itemId: item.id,
    title: `${item.title.zh}现场拆解`,
    summary: `围绕正在运行的展品，观察、操作并解释${item.title.zh}的核心设计决策。`,
    difficulty: item.category === "visual-style" ? "入门" : "进阶",
    durationMinutes: 12,
    concepts: [...new Set([item.title.en, item.category, ...item.tags.slice(0, 3)])],
    objectives: principles,
    prerequisites: item.category === "visual-style" ? ["CSS 自定义属性与层叠基础"] : ["CSS 正常流、Grid/Flex 与响应式基础"],
    steps: [
      { id: "observe", kind: "observe", label: "观察", hint: "先建立视觉基准", eyebrow: "OBSERVE THE SPECIMEN", title: `先看见${item.title.zh}的决定`, body: `${core}。先不读代码，沿标注比较首屏入口、导航表面和内容层级。`, annotations: annotations[family], experiments: experimentSet(item), question: "参数改变后，哪些关系仍然让你一眼认出这件展品？" },
      { id: "principle", kind: "explain", label: "原理", hint: "把视觉证据连回作者源", eyebrow: "READ WHAT YOU SEE", title: `第一条规则如何奠定${item.title.zh}`, body: `作者源中的 ${selectorOf(firstRule)} 是这件展品的直接证据。对照展品辨认它控制的区域，而不是只记属性名。`, annotations: [annotations[family][0]], code: { file: sourcePath, locator: selectorOf(firstRule), snippet: firstRule, sourceDigest: digest(source) }, question: "删除这条规则后，当前展品最先失去哪一种可见特征？" },
      { id: "experiment", kind: "experiment", label: "实验", hint: "用极端参数检验设计边界", eyebrow: "CHANGE ONE RELATION", title: "改变参数，但不改语义", body: `第二组作者规则 ${selectorOf(secondRule)} 展示了${item.title.zh}如何继续约束局部构图。运行实验，区分稳定原则与偶然数值。`, annotations: [annotations[family][1]], code: { file: sourcePath, locator: selectorOf(secondRule), snippet: secondRule, sourceDigest: digest(source) }, experiments: experimentSet(item), question: "哪一个参数越过边界后，会最先破坏这件展品的核心判断？" },
      { id: "mastery", kind: "mastery", label: "测验", hint: "用选择证明理解", eyebrow: "QUICK RECALL", title: "对照展品，完成三次判断", body: "答案必须同时能由眼前效果、实验结果和作者源解释。", quiz: quizSet(item, sourcePath, core) },
    ],
    commonMistakes: [`只复制${item.title.zh}的表面数值，却没有保留“${core}”背后的关系。`, "把实验参数当成新的固定设计稿，而没有重置并比较基准状态。"],
    furtherReading: [{ label: "AI reproduction guide", href: "./AI.md" }, { label: "Structured specimen context", href: "./ai-context.json" }],
    completion: { criteria: ["完成两组实验并能说出一个保持不变的关系", "三道测验全部回答正确", `能从 ${sourcePath} 指出至少一条决定当前效果的规则`] },
  };
}

function staticResource(item, sourcePath, source, snippets) {
  const ocean = item.id === "css-ocean-wave";
  const first = snippets[0];
  const second = snippets[1];
  const selector = (snippet) => snippet.startsWith("function ") ? snippet.match(/^function\s+([^\s(]+)/)?.[1] || "function" : snippet.slice(0, snippet.indexOf("{")).trim();
  const baseAnnotations = ocean ? [
    { id: "state", anchor: [65, 28], elbow: [57, 18], end: [39, 18], summary: "主题 token：同一节点切换昼夜", detail: "昼夜只替换视觉 token，不复制场景结构。" },
    { id: "waves", anchor: [57, 75], elbow: [65, 66], end: [79, 66], detailSide: "left", summary: "时间关系制造三层视差", detail: "不同周期、负延迟与反向播放共同打散同步。" },
  ] : [
    { id: "timeline", anchor: [48, 54], elbow: [58, 45], end: [72, 45], detailSide: "left", summary: "时间轴把本地数据变成入口", detail: "九个时期节点来自本地结构化作品目录，并提供键盘焦点预览。" },
    { id: "gallery", anchor: [50, 72], elbow: [39, 63], end: [25, 63], summary: "选中时期后才布置 WebGL 展厅", detail: "时期筛选先决定作品集合，再交给同一个 GalleryApp 加载。" },
  ];
  return {
    learningVersion: 1, itemId: item.id, title: `${item.title.zh}现场拆解`, summary: `在运行中的${item.title.zh}里完成观察、操作、源码解释与掌握测验。`, difficulty: ocean ? "进阶" : "高级", durationMinutes: ocean ? 15 : 20,
    concepts: item.tags, objectives: ocean ? ["解释昼夜与运动为何是两个独立状态轴", "通过周期、延迟和方向解释海浪视差"] : ["解释本地艺术史数据如何驱动时间轴与展厅", "区分 DOM 导览状态与 WebGL 场景生命周期"], prerequisites: ocean ? ["CSS Variables、data attribute 与 keyframes"] : ["JavaScript 状态管理、Canvas/WebGL 与键盘交互基础"],
    steps: [
      { id: "observe", kind: "observe", label: "观察", hint: "先建立运行基准", eyebrow: "OBSERVE THE SPECIMEN", title: ocean ? "分开观察光线与运动" : "沿真实用户路径观察三个界面层次", body: item.description, annotations: baseAnnotations, experiments: experimentSet(item), question: ocean ? "切换主题时，运动状态是否被重置？" : "欢迎页、时间轴和展厅分别承担哪一种决策？" },
      { id: "principle", kind: "explain", label: "原理", hint: "把变化连回作者源", eyebrow: "READ WHAT YOU SEE", title: ocean ? "两个状态轴，而不是四套场景" : "本地数据先形成时间轴", body: ocean ? "主题 token 与运动节奏分别由不同状态控制。" : "时间轴节点、曲线和预览都从同一份本地时期数据确定性生成。", annotations: [baseAnnotations[0]], code: { file: sourcePath, locator: selector(first), snippet: first, sourceDigest: digest(source) }, question: ocean ? "为什么不定义四套组合场景？" : "为什么时期数据应先于 WebGL 场景创建？" },
      { id: "experiment", kind: "experiment", label: "实验", hint: "执行完整因果路径", eyebrow: "CHANGE ONE RELATION", title: ocean ? "相似浪形，不同时间关系" : "从时期选择到展厅加载", body: ocean ? "三层浪共享形状规则，却用周期、负延迟和反向播放形成视差。" : "选择时期会筛选作品集合、切换界面，再由同一 GalleryApp 加载对应展厅。", annotations: [baseAnnotations[1]], code: { file: sourcePath, locator: selector(second), snippet: second, sourceDigest: digest(source) }, experiments: experimentSet(item), question: ocean ? "三层同周期同方向时会失去什么？" : "在何处失败时仍应保留返回时间轴的路径？" },
      { id: "mastery", kind: "mastery", label: "测验", hint: "用选择证明理解", eyebrow: "QUICK RECALL", title: "对照展品，完成三次判断", body: "每个答案都应能回指正在运行的展品和作者源。", quiz: quizSet(item, sourcePath, item.description) },
    ],
    commonMistakes: ocean ? ["把昼夜颜色与动画速度绑定成一个不可组合状态。", "只增加浪层数量，却让所有浪层同周期同方向。"] : ["在进入时期前就一次性初始化所有 WebGL 场景，造成不必要成本。", "把 pointer lock 作为唯一观察方式，忽略拖拽与键盘退出路径。"],
    furtherReading: [{ label: "AI reproduction guide", href: "./AI.md" }, { label: "Structured specimen context", href: "./ai-context.json" }],
    completion: { criteria: ocean ? ["完成昼夜/运动组合实验并说明不变量", "三道测验全部回答正确", "能指出状态轴与视差各自的作者源规则"] : ["独立完成欢迎页→时间轴→展厅→返回路径", "三道测验全部回答正确", "能指出 buildTimeline 与 enterGallery 的职责边界"] },
  };
}

await mkdir(outputRoot, { recursive: true });
let written = 0;
for (const item of createCatalog()) {
  const output = path.join(outputRoot, `${item.id}.json`);
  if (preserveCurated && curatedIds.has(item.id)) continue;
  if (missingOnly) {
    try { await access(output); continue; } catch { /* scaffold missing resource */ }
  }
  let resource;
  if (item.renderer === "portfolio-theme" || item.renderer === "portfolio-layout") {
    const sourcePath = item.source;
    const source = await readFile(path.join(root, sourcePath), "utf8");
    const rules = cssRules(source);
    resource = sharedResource(item, sourcePath, source, rules[0], rules[1] || rules[0]);
  } else if (item.id === "css-ocean-wave") {
    const sourcePath = "specimens/items/css-ocean-wave/styles.css";
    const source = await readFile(path.join(root, sourcePath), "utf8");
    resource = staticResource(item, sourcePath, source, [exactCssRule(source, ':root[data-animation-state="active"]'), exactCssRule(source, ".wave-mid")]);
  } else {
    const sourcePath = "specimens/items/time-gallery-webgl/app.js";
    const source = await readFile(path.join(root, sourcePath), "utf8");
    resource = staticResource(item, sourcePath, source, [extractFunction(source, "buildTimeline"), extractFunction(source, "enterGallery")]);
  }
  await writeFile(output, `${JSON.stringify(resource, null, 2)}\n`);
  written += 1;
}
console.log(`[learning] scaffolded ${written} resource${written === 1 ? "" : "s"}`);
