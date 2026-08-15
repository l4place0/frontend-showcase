import { access, mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imageRoot = path.join(root, "assets", "artworks");
const API = "https://commons.wikimedia.org/w/api.php";

const periods = [
  {
    id: "early-renaissance", order: 1, years: "约 1300—1490", zh: "早期文艺复兴", en: "Early Renaissance", accent: "#c97852",
    intro: "人文主义在城邦与工坊中苏醒。画家重拾透视、体积与自然观察，让神圣叙事重新拥有人的尺度。",
    artists: [
      ["Fra Angelico", "弗拉·安杰利科", "Fra Angelico", "约 1395—1455"],
      ["Sandro Botticelli", "桑德罗·波提切利", "Sandro Botticelli", "1445—1510"],
      ["Andrea Mantegna", "安德烈亚·曼特尼亚", "Andrea Mantegna", "约 1431—1506"],
    ],
  },
  {
    id: "high-renaissance", order: 2, years: "约 1490—1600", zh: "盛期文艺复兴", en: "High Renaissance", accent: "#9b6d4d",
    intro: "平衡、秩序与宏伟构图抵达高峰。人体、色彩和空间被组织成一种近乎建筑般稳定的理想世界。",
    artists: [
      ["Raphael", "拉斐尔", "Raphael", "1483—1520"],
      ["Titian", "提香", "Titian", "约 1488—1576"],
      ["Correggio", "柯勒乔", "Correggio", "约 1489—1534"],
    ],
  },
  {
    id: "baroque", order: 3, years: "约 1600—1725", zh: "巴洛克", en: "Baroque", accent: "#8e4b3f",
    intro: "光线成为戏剧的导演。强烈明暗、瞬间动作与感官丰盛把观看者卷入宗教、权力和日常生活的现场。",
    artists: [
      ["Rembrandt", "伦勃朗", "Rembrandt van Rijn", "1606—1669"],
      ["Peter Paul Rubens", "彼得·保罗·鲁本斯", "Peter Paul Rubens", "1577—1640"],
      ["Diego Velazquez", "迭戈·委拉斯开兹", "Diego Velázquez", "1599—1660"],
      ["Johannes Vermeer", "约翰内斯·维米尔", "Johannes Vermeer", "1632—1675"],
    ],
  },
  {
    id: "rococo", order: 4, years: "约 1720—1780", zh: "洛可可", en: "Rococo", accent: "#d39a83",
    intro: "宫廷趣味转向轻盈、亲密与机智。粉彩、曲线和松弛笔触营造出游乐、爱情与室内生活的感官剧场。",
    artists: [
      ["Francois Boucher", "弗朗索瓦·布歇", "François Boucher", "1703—1770"],
      ["Jean Honore Fragonard", "让-奥诺雷·弗拉戈纳尔", "Jean-Honoré Fragonard", "1732—1806"],
      ["Giovanni Battista Tiepolo", "乔瓦尼·巴蒂斯塔·提埃波罗", "Giovanni Battista Tiepolo", "1696—1770"],
    ],
  },
  {
    id: "neoclassicism", order: 5, years: "约 1760—1830", zh: "新古典主义", en: "Neoclassicism", accent: "#7890a3",
    intro: "考古发现与启蒙理性唤回古典秩序。清晰轮廓、节制情感和英雄伦理成为革命时代的视觉语言。",
    artists: [
      ["Jacques Louis David", "雅克-路易·大卫", "Jacques-Louis David", "1748—1825"],
      ["Angelica Kauffmann", "安杰莉卡·考夫曼", "Angelica Kauffman", "1741—1807"],
      ["Jean Auguste Dominique Ingres", "让-奥古斯特-多米尼克·安格尔", "Jean-Auguste-Dominique Ingres", "1780—1867"],
    ],
  },
  {
    id: "romanticism", order: 6, years: "约 1790—1850", zh: "浪漫主义", en: "Romanticism", accent: "#536c80",
    intro: "崇高、激情与个人经验冲破理性边界。风暴、革命、异域和梦魇共同描绘现代主体的内心景观。",
    artists: [
      ["Eugene Delacroix", "欧仁·德拉克洛瓦", "Eugène Delacroix", "1798—1863"],
      ["J. M. W. Turner", "约瑟夫·马洛德·威廉·透纳", "J. M. W. Turner", "1775—1851"],
      ["Francisco Goya", "弗朗西斯科·戈雅", "Francisco de Goya", "1746—1828"],
    ],
  },
  {
    id: "realism", order: 7, years: "约 1840—1880", zh: "现实主义", en: "Realism", accent: "#6e7159",
    intro: "画家把目光投向劳动者、乡村与未经修饰的当代生活。宏大画布不再只属于神话，也属于真实的人。",
    artists: [
      ["Gustave Courbet", "居斯塔夫·库尔贝", "Gustave Courbet", "1819—1877"],
      ["Jean Francois Millet", "让-弗朗索瓦·米勒", "Jean-François Millet", "1814—1875"],
      ["Honore Daumier", "奥诺雷·杜米埃", "Honoré Daumier", "1808—1879"],
    ],
  },
  {
    id: "impressionism", order: 8, years: "约 1860—1890", zh: "印象主义", en: "Impressionism", accent: "#658b89",
    intro: "现代都市、闲暇与瞬息光色进入画布。分散笔触和户外观察把“看见的过程”本身变成主题。",
    artists: [
      ["Claude Monet", "克劳德·莫奈", "Claude Monet", "1840—1926"],
      ["Edgar Degas", "埃德加·德加", "Edgar Degas", "1834—1917"],
      ["Pierre Auguste Renoir", "皮埃尔-奥古斯特·雷诺阿", "Pierre-Auguste Renoir", "1841—1919"],
      ["Camille Pissarro", "卡米耶·毕沙罗", "Camille Pissarro", "1830—1903"],
    ],
  },
  {
    id: "post-impressionism", order: 9, years: "约 1880—1905", zh: "后印象主义", en: "Post-Impressionism", accent: "#b88945",
    intro: "画家从印象主义出发，分别走向结构、象征、纯色与主观笔触，为二十世纪艺术打开多条道路。",
    artists: [
      ["Vincent van Gogh", "文森特·梵高", "Vincent van Gogh", "1853—1890"],
      ["Paul Cezanne", "保罗·塞尚", "Paul Cézanne", "1839—1906"],
      ["Paul Gauguin", "保罗·高更", "Paul Gauguin", "1848—1903"],
      ["Georges Seurat", "乔治·修拉", "Georges Seurat", "1859—1891"],
    ],
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const safeFetch = async (url, attempts = 7) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": "frontend-showcase-offline-asset-builder/1.0" } });
    if (response.ok) return response;
    if (attempt === attempts) throw new Error(`${response.status} ${url}`);
    await sleep(attempt * 2500);
  }
};

const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const stripMarkup = (value = "") => value.replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();

async function candidatesFor(query) {
  const params = new URLSearchParams({
    action: "query", format: "json", origin: "*", generator: "search",
    gsrsearch: `\"${query}\" painting filetype:bitmap`, gsrnamespace: "6", gsrlimit: "50",
    prop: "imageinfo", iiprop: "url|size|extmetadata", iiurlwidth: "960",
  });
  const search = await safeFetch(`${API}?${params}`).then((r) => r.json());
  const surname = normalize(query).split(/\s+/).at(-1).replace(/[^a-z]/g, "");
  return Object.values(search.query?.pages || {}).filter((item) => {
    const info = item.imageinfo?.[0];
    const meta = info?.extmetadata || {};
    const artistMetadata = normalize(stripMarkup(meta.Artist?.value || "")).replace(/[^a-z ]/g, "");
    const title = normalize(item.title).replace(/[^a-z ]/g, "");
    const license = normalize(meta.LicenseShortName?.value || "");
    const artistMatches = artistMetadata ? artistMetadata.includes(surname) : title.includes(surname);
    return info?.thumburl && artistMatches && (license.includes("public domain") || license.includes("cc0"));
  });
}

await mkdir(imageRoot, { recursive: true });
const artworks = [];
for (const period of periods) {
  const pool = [];
  for (const [query, artistZh, artistEn, lifespan] of period.artists) {
    const items = await candidatesFor(query);
    for (const item of items.slice(0, 3)) pool.push({ item, artistZh, artistEn, lifespan });
    await sleep(900);
  }
  const groups = period.artists.map(([, , artistEn]) => pool.filter((entry) => entry.artistEn === artistEn));
  const selected = [];
  for (let round = 0; round < 3 && selected.length < 6; round += 1) {
    for (const group of groups) {
      if (group[round] && !selected.some((entry) => entry.item.pageid === group[round].item.pageid)) selected.push(group[round]);
      if (selected.length === 6) break;
    }
  }
  const unique = selected;
  if (unique.length < 6) throw new Error(`${period.id}: only found ${unique.length} eligible paintings`);
  for (const [position, entry] of unique.entries()) {
    const { item, artistZh, artistEn, lifespan } = entry;
    const info = item.imageinfo[0];
    const meta = info.extmetadata || {};
    const filename = `${period.order.toString().padStart(2, "0")}-${position + 1}-${item.pageid}.jpg`;
    const imageSourceUrl = info.thumburl;
    const localPath = path.join(imageRoot, filename);
    try {
      await access(localPath);
    } catch {
      const bytes = await safeFetch(imageSourceUrl).then((r) => r.arrayBuffer());
      await writeFile(localPath, Buffer.from(bytes));
      await sleep(1500);
    }
    artworks.push({
      id: `commons-${item.pageid}`,
      periodId: period.id,
      titleZh: `${artistZh}作品 ${period.order}-${position + 1}`,
      titleEn: item.title.replace(/^File:/, "").replace(/\.[^.]+$/, "")
        .replace(/\s*-\s*Google Art Project.*$/i, "")
        .replace(/\s*-\s*WGA\d+.*$/i, "")
        .replace(/\s*\(painting\).*$/i, "")
        .replace(/^['\"]|['\"]$/g, "")
        .trim(),
      artistZh,
      artistEn,
      attribution: stripMarkup(meta.Artist?.value) || artistEn,
      lifespan,
      date: stripMarkup(meta.DateTimeOriginal?.value || meta.DateTime?.value) || "年代不详",
      medium: "绘画",
      image: `assets/artworks/${filename}`,
      width: info.thumbwidth,
      height: info.thumbheight,
      sourceUrl: info.descriptionurl,
      imageSourceUrl,
      source: "Wikimedia Commons",
      license: `${meta.LicenseShortName?.value || "Public domain"}${meta.LicenseUrl?.value ? ` · ${meta.LicenseUrl.value}` : ""}`,
      accessionNumber: `Commons page ${item.pageid}`,
    });
  }
  console.log(`[assets] ${period.zh}: ${unique.length}`);
}

await writeFile(path.join(root, "assets", "artworks.json"), `${JSON.stringify({
  generatedFrom: `${API} generator=search + imageinfo extmetadata`,
  generatedAt: new Date().toISOString(),
  licensePolicy: "Every record was selected from Wikimedia Commons only when extmetadata.LicenseShortName was Public domain or CC0. Each record preserves its description page and license label.",
  periods: periods.map(({ artists, ...period }) => ({
    ...period,
    artists: artists.map(([, zh, en, lifespan]) => ({ zh, en, lifespan })),
  })),
  artworks,
}, null, 2)}\n`);

const referenced = new Set(artworks.map((artwork) => path.basename(artwork.image)));
for (const filename of await readdir(imageRoot)) {
  if (/\.jpe?g$/i.test(filename) && !referenced.has(filename)) await unlink(path.join(imageRoot, filename));
}

console.log(`[assets] wrote ${artworks.length} local CC0 artworks`);
