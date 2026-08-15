import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const specimenRoot = path.dirname(fileURLToPath(import.meta.url));

function learningMetadata(id) {
  const resource = JSON.parse(readFileSync(path.join(specimenRoot, "learning", "items", `${id}.json`), "utf8"));
  return {
    resource: `items/${id}/learning.json`,
    contentRevision: resource.contentRevision,
    title: resource.title,
    difficulty: resource.difficulty,
    durationMinutes: resource.durationMinutes,
    concepts: resource.concepts,
  };
}

/**
 * Specimen Protocol v1 source registry.
 *
 * Keep product metadata here; the build adapter combines these lightweight
 * descriptors with the shared portfolio fixture in src/template.html.
 */
export const themes = [
  ["cosmos", "太空漫游", "Cosmos", "深空星域，青紫辉光"],
  ["paper", "纸感极简", "Paper", "米白编辑排版，克制优雅"],
  ["terminal", "极客终端", "Terminal", "磷光绿命令行世界"],
  ["sunset", "落日余晖", "Sunset", "暖橙暗色，柔和圆润"],
  ["cyberpunk", "赛博朋克", "Cyberpunk", "霓虹夜色，故障美学"],
  ["neumorphism", "新拟态", "Neumorphism", "柔和浮雕，触感界面"],
  ["swiss", "瑞士网格", "Swiss", "国际主义排版，红黑构成"],
  ["glass", "玻璃拟态", "Glass", "流光背景，毛玻璃卡片"],
  ["pixel", "复古像素", "Pixel", "8-bit 游戏机美学"],
  ["brutalist", "粗野主义", "Brutalist", "硬边黑框，生猛直接"],
  ["editorial", "杂志编辑", "Editorial", "粗衬线大字，报纸栏线"],
  ["artdeco", "装饰艺术", "Art Deco", "黑金几何，对称奢华"],
  ["vaporwave", "蒸汽波", "Vaporwave", "粉紫青渐变，复古未来"],
  ["blueprint", "工程蓝图", "Blueprint", "蓝底白线，网格标注"],
  ["zen", "禅意东方", "Zen", "留白墨色，细线朱砂"],
  ["risograph", "孔版印刷", "Risograph", "颗粒质感，双色叠印"],
  ["popart", "波普艺术", "Pop Art", "漫画波点，红黄蓝撞色"],
  ["aurora", "极光", "Aurora", "深空夜幕，流动光幕"],
  ["chalkboard", "黑板粉笔", "Chalkboard", "深绿板面，粉笔涂鸦"],
  ["memphis", "孟菲斯", "Memphis", "几何撞色，playful 80s"],
  ["midnight", "暗黑极简", "Midnight", "纯黑克制，一束电蓝"],
  ["monochrome", "黑白灰", "Monochrome", "零彩色，摄影集质感"],
  ["watercolor", "水彩手绘", "Watercolor", "不规则笔触，纸间晕染"],
  ["botanical", "植物系", "Botanical", "鼠尾草绿，有机生长"],
  ["parchment", "羊皮纸手稿", "Parchment", "古籍墨香，红泥印章"],
  ["bauhaus", "包豪斯", "Bauhaus", "三原色几何构成"],
  ["y2k", "千禧年", "Y2K", "金属银泡泡，浅蓝紫闪光"],
  ["matrix", "黑客帝国", "Matrix", "代码雨夜，绿光觉醒"],
  ["clay", "粘土拟物", "Clay", "奶油圆胖，触感膨胀"],
  ["candy", "糖果马卡龙", "Candy", "pastel 甜点铺"],
];

export const layouts = [
  ["classic", "经典单栏", "Classic", "垂直阅读流，返璞归真"],
  ["magazine", "杂志双栏", "Magazine", "头条跨栏，大小错落"],
  ["side-nav", "侧边导航", "Side Nav", "左轨右文，文档式"],
  ["hero-full", "沉浸首屏", "Hero Full", "超大标题占满第一屏", { preview: { strategy: "capture", anchor: "viewport" } }],
  ["masonry", "瀑布流", "Masonry", "双列区块自然跌落"],
  ["timeline", "时间线", "Timeline", "竖线串珠，节点标记"],
  ["centered", "居中窄栏", "Centered", "720px 阅读带"],
  ["horizontal", "横向卷轴", "Horizontal", "区块横排，scroll-snap"],
  ["newspaper", "报摊头版", "Newspaper", "刊头居中大标题"],
  ["dashboard", "仪表盘", "Dashboard", "四格 widget 拼盘"],
  ["split-screen", "左右分屏", "Split", "左固定简介，右滚内容"],
  ["reverse", "倒序", "Reverse", "联系在前，项目压轴", { sectionOrder: ["contact", "blog", "about", "skills", "projects"] }],
  ["staggered", "阶梯错位", "Staggered", "区块左右交替递进"],
  ["bands", "全宽色带", "Bands", "区块通栏，底色交替"],
  ["grid9", "九宫格", "Grid-9", "内容入格，严丝合缝"],
  ["tabbed", "标签页", "Tabbed", "区块收进 Tab，锚点切换"],
  ["accordion", "手风琴", "Accordion", "默认折叠，悬停展开"],
  ["chatflow", "对话流", "Chat Flow", "区块成气泡，左右交谈"],
  ["panes", "终端窗格", "Panes", "tmux 分屏，标题栏装点"],
  ["album-rows", "横向图条", "Album Rows", "卡片横向滑动条"],
  ["big-type", "大字报", "Big Type", "巨号标题，气场全开"],
  ["z-pattern", "Z 字动线", "Z-Pattern", "视线折线引导", { sectionOrder: ["projects", "about", "contact", "skills", "blog"] }],
  ["f-pattern", "F 型阅读", "F-Pattern", "左重右轻，扫视友好"],
  ["axis", "中轴对称", "Axis", "中线两侧，左右对望"],
  ["floating", "悬浮错落", "Floating", "卡片微旋，层叠漂浮"],
  ["index-page", "索引长页", "Index Page", "左目录右正文，编号导览"],
  ["collage", "自由拼贴", "Collage", "不规则混排，手作感"],
  ["one-screen", "一屏尽览", "One Screen", "全站压缩进一屏"],
  ["cta-first", "联系优先", "CTA First", "行动导向，CTA 最前", { sectionOrder: ["contact", "projects", "skills", "about", "blog"] }],
  ["compare", "双列对照", "Compare", "两两并置，左右互文"],
];

const runtime = {
  scripts: true,
  webgl: false,
  audio: false,
  fullscreen: false,
  pointerLock: false,
};

export const styleControls = [
  { key: "hue", label: "色相偏移", type: "range", min: -45, max: 45, step: 1, default: 0, unit: "deg", target: { kind: "css-variable", name: "--p-hue", transform: "deg" } },
  { key: "saturation", label: "色彩饱和度", type: "range", min: 50, max: 170, step: 1, default: 100, unit: "%", target: { kind: "css-variable", name: "--p-saturation", transform: "percent-scale" } },
  { key: "contrast", label: "明暗对比度", type: "range", min: 75, max: 135, step: 1, default: 100, unit: "%", target: { kind: "css-variable", name: "--p-contrast", transform: "percent-scale" } },
  { key: "font", label: "文字比例", type: "range", min: 85, max: 120, step: 1, default: 100, unit: "%", target: { kind: "css-variable", name: "--p-font", transform: "percent-scale" } },
  { key: "line", label: "阅读行高", type: "range", min: 140, max: 210, step: 1, default: 170, unit: "%", target: { kind: "css-variable", name: "--p-line", transform: "percent-scale" } },
  { key: "radius", label: "圆角强度", type: "range", min: 0, max: 220, step: 1, default: 100, unit: "%", target: { kind: "css-variable", name: "--p-radius", transform: "percent-scale" } },
];

export const layoutControls = [
  { key: "width", label: "内容最大宽度", type: "range", min: 720, max: 1440, step: 10, default: 1080, unit: "px", target: { kind: "css-variable", name: "--p-width", transform: "px" } },
  { key: "space", label: "区块纵向节奏", type: "range", min: 60, max: 150, step: 1, default: 100, unit: "%", target: { kind: "css-variable", name: "--p-space", transform: "percent-scale" } },
  { key: "gap", label: "网格间距", type: "range", min: 50, max: 180, step: 1, default: 100, unit: "%", target: { kind: "css-variable", name: "--p-gap", transform: "percent-scale" } },
  { key: "cardMin", label: "卡片最小宽度", type: "range", min: 240, max: 420, step: 5, default: 310, unit: "px", target: { kind: "css-variable", name: "--p-card-min", transform: "px" } },
  { key: "heroShare", label: "Hero 文字占比", type: "range", min: 40, max: 80, step: 1, default: 68, unit: "%", target: { kind: "css-variable", name: "--p-hero-left", transform: "share-ratio" } },
  { key: "cardPad", label: "卡片内边距", type: "range", min: 14, max: 42, step: 1, default: 26, unit: "px", target: { kind: "css-variable", name: "--p-card-pad", transform: "px" } },
];

// Register future self-contained experiments here. A static specimen owns its
// complete source directory (index.html, AI.md, scripts, styles and assets).
// The builder copies it verbatim, then injects protocol and AI discovery data.
export const staticItems = [
  {
    id: "css-ocean-wave",
    slug: "css-ocean-wave",
    title: { zh: "CSS 海浪动画", en: "CSS Ocean Wave" },
    description: "同一片纯 CSS 海面在清透白昼与深夜月光之间平滑转换，由黑夜模式开关统一控制。",
    category: "css-animation",
    tags: ["css", "animation", "ocean", "day-night", "responsive"],
    technology: ["html", "css", "javascript"],
    runtime: { scripts: true, webgl: false, audio: false, fullscreen: false, pointerLock: false },
    controls: [
      { key: "nightMode", label: "黑夜模式", type: "boolean", default: false, target: { kind: "data-attribute", name: "data-night-mode" } },
      { key: "animationState", label: "动画状态", type: "select", default: "idle", options: [{ label: "闲置", value: "idle" }, { label: "激活", value: "active" }], target: { kind: "data-attribute", name: "data-animation-state" } },
      { key: "waveHeight", label: "浪高基准", type: "range", min: 70, max: 170, step: 5, default: 110, unit: "%", target: { kind: "css-variable", name: "--wave-height", transform: "percent-scale" } },
      { key: "foam", label: "浪花高光", type: "boolean", default: true, target: { kind: "data-attribute", name: "data-foam" } },
    ],
    sourceDir: "specimens/items/css-ocean-wave",
    sourceFiles: ["index.html", "styles.css", "app.js"],
  },
  {
    id: "time-gallery-webgl",
    slug: "time-gallery-webgl",
    title: { zh: "时光画廊", en: "Time Gallery" },
    description: "沿树状时间轴进入万神殿式圆厅，在真实 Open Access 画作之间漫游西方艺术史。",
    category: "webgl",
    tags: ["webgl", "three.js", "art-history", "first-person", "offline"],
    technology: ["html", "css", "javascript", "three.js", "webgl"],
    runtime: { scripts: true, webgl: true, audio: false, fullscreen: false, pointerLock: true },
    controls: [],
    sourceDir: "specimens/items/time-gallery-webgl",
    bundle: { source: "app.js", output: "app.bundle.js", inlineArtworkImages: "assets/artworks.json" },
    preview: { strategy: "poster", source: "assets/artworks/09-5-151972.jpg" },
    sourceFiles: ["index.html", "app.bundle.js", "styles.css", "assets/artworks.json"],
    content: {
      periods: 9,
      artists: 30,
      artworks: 54,
      sourceManifest: "assets/artworks.json",
      license: "Public Domain / CC0",
    },
  },
];

export function createCatalog() {
  const fromTuple = (tuple, kind) => {
    const [slug, zh, en, description, extensions = {}] = tuple;
    const isTheme = kind === "theme";
    const id = isTheme ? slug : `layout-${slug}`;
    const entry = `items/${id}/index.html`;
    return {
      specimenVersion: 1,
      id,
      slug,
      title: { zh, en },
      description,
      category: isTheme ? "visual-style" : "layout",
      tags: isTheme ? [slug, "portfolio", "visual-style"] : [slug, "portfolio", "layout"],
      technology: ["html", "css", "javascript"],
      renderer: isTheme ? "portfolio-theme" : "portfolio-layout",
      entry,
      url: entry,
      runtime: { ...runtime },
      controls: structuredClone(isTheme ? styleControls : layoutControls),
      ai: { prompt: `items/${id}/AI.md`, context: `items/${id}/ai-context.json`, source: `items/${id}/index.html` },
      source: isTheme ? `src/themes/${slug}.css` : `src/layouts/${slug}.css`,
      ...structuredClone(extensions),
    };
  };
  return [
    ...themes.map((item) => fromTuple(item, "theme")),
    ...layouts.map((item) => fromTuple(item, "layout")),
    ...staticItems.map((item) => ({
      specimenVersion: 1,
      technology: ["html", "css", "javascript"],
      runtime: { ...runtime },
      controls: [],
      ...structuredClone(item),
      renderer: "static",
      entry: `items/${item.id}/index.html`,
      url: `items/${item.id}/index.html`,
      ai: {
        prompt: `items/${item.id}/AI.md`,
        context: `items/${item.id}/ai-context.json`,
        source: `items/${item.id}/index.html`,
      },
    })),
  ].map((item) => ({
    ...item,
    thumbnail: item.thumbnail || "thumbnail.webp",
    preview: item.preview || { strategy: "capture", anchor: item.category === "layout" ? "main" : "viewport" },
    learning: learningMetadata(item.id),
  }));
}
