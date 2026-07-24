# -*- coding: utf-8 -*-
"""
前端风格博物馆 · 生成器
========================
产出（共 63 页）：
  index.html            门户（两展柜入口 + 测试用例说明）
  styles.html           风格展览柜（30 风格卡片）
  layouts.html          布局展览柜（30 布局卡片）
  {style}.html × 30     风格展品页（base + 主题皮肤）
  layout-{name}.html ×30 布局展品页（base + zen 皮肤 + 布局 css）

维护方式：
  改内容 → src/template.html（改完全部重跑，勿直接改根目录生成的 HTML）
  改皮肤 → src/themes/<slug>.css；新增风格 → 加文件 + THEMES 注册
  改布局 → src/layouts/<slug>.css；新增布局 → 加文件 + LAYOUTS 注册
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"

THEMES = [
    ("cosmos",      "太空漫游", "Cosmos",      "深空星域，青紫辉光"),
    ("paper",       "纸感极简", "Paper",       "米白编辑排版，克制优雅"),
    ("terminal",    "极客终端", "Terminal",    "磷光绿命令行世界"),
    ("sunset",      "落日余晖", "Sunset",      "暖橙暗色，柔和圆润"),
    ("cyberpunk",   "赛博朋克", "Cyberpunk",   "霓虹夜色，故障美学"),
    ("neumorphism", "新拟态",   "Neumorphism", "柔和浮雕，触感界面"),
    ("swiss",       "瑞士网格", "Swiss",       "国际主义排版，红黑构成"),
    ("glass",       "玻璃拟态", "Glass",       "流光背景，毛玻璃卡片"),
    ("pixel",       "复古像素", "Pixel",       "8-bit 游戏机美学"),
    ("brutalist",   "粗野主义", "Brutalist",   "硬边黑框，生猛直接"),
    ("editorial",   "杂志编辑", "Editorial",   "粗衬线大字，报纸栏线"),
    ("artdeco",     "装饰艺术", "Art Deco",    "黑金几何，对称奢华"),
    ("vaporwave",   "蒸汽波",   "Vaporwave",   "粉紫青渐变，复古未来"),
    ("blueprint",   "工程蓝图", "Blueprint",   "蓝底白线，网格标注"),
    ("zen",         "禅意东方", "Zen",         "留白墨色，细线朱砂"),
    ("risograph",   "孔版印刷", "Risograph",   "颗粒质感，双色叠印"),
    ("popart",      "波普艺术", "Pop Art",     "漫画波点，红黄蓝撞色"),
    ("aurora",      "极光",     "Aurora",      "深空夜幕，流动光幕"),
    ("chalkboard",  "黑板粉笔", "Chalkboard",  "深绿板面，粉笔涂鸦"),
    ("memphis",     "孟菲斯",   "Memphis",     "几何撞色， playful 80s"),
    ("midnight",    "暗黑极简", "Midnight",    "纯黑克制，一束电蓝"),
    ("monochrome",  "黑白灰",   "Monochrome",  "零彩色，摄影集质感"),
    ("watercolor",  "水彩手绘", "Watercolor",  "不规则笔触，纸间晕染"),
    ("botanical",   "植物系",   "Botanical",   "鼠尾草绿，有机生长"),
    ("parchment",   "羊皮纸手稿", "Parchment", "古籍墨香，红泥印章"),
    ("bauhaus",     "包豪斯",   "Bauhaus",     "三原色几何构成"),
    ("y2k",         "千禧年",   "Y2K",         "金属银泡泡，浅蓝紫闪光"),
    ("matrix",      "黑客帝国", "Matrix",      "代码雨夜，绿光觉醒"),
    ("clay",        "粘土拟物", "Clay",        "奶油圆胖，触感膨胀"),
    ("candy",       "糖果马卡龙", "Candy",     "pastel 甜点铺"),
]

LAYOUTS = [
    ("classic",      "经典单栏", "Classic",     "垂直阅读流，返璞归真",     "rows"),
    ("magazine",     "杂志双栏", "Magazine",    "头条跨栏，大小错落",       "grid"),
    ("side-nav",     "侧边导航", "Side Nav",    "左轨右文，文档式",         "split"),
    ("hero-full",    "沉浸首屏", "Hero Full",   "超大标题占满第一屏",       "hero"),
    ("masonry",      "瀑布流",   "Masonry",     "双列区块自然跌落",         "masonry"),
    ("timeline",     "时间线",   "Timeline",    "竖线串珠，节点标记",       "timeline"),
    ("centered",     "居中窄栏", "Centered",    "720px 阅读带",             "rows"),
    ("horizontal",   "横向卷轴", "Horizontal",  "区块横排，scroll-snap",    "cols"),
    ("newspaper",    "报摊头版", "Newspaper",   "刊头居中大标题",           "hero"),
    ("dashboard",    "仪表盘",   "Dashboard",   "四格 widget 拼盘",         "grid"),
    ("split-screen", "左右分屏", "Split",       "左固定简介，右滚内容",     "split"),
    ("reverse",      "倒序",     "Reverse",     "联系在前，项目压轴",       "rows"),
    ("staggered",    "阶梯错位", "Staggered",   "区块左右交替递进",         "rows"),
    ("bands",        "全宽色带", "Bands",       "区块通栏，底色交替",       "band"),
    ("grid9",        "九宫格",   "Grid-9",      "内容入格，严丝合缝",       "grid"),
    ("tabbed",       "标签页",   "Tabbed",      "区块收进 Tab，锚点切换",   "rows"),
    ("accordion",    "手风琴",   "Accordion",   "默认折叠，悬停展开",       "rows"),
    ("chatflow",     "对话流",   "Chat Flow",   "区块成气泡，左右交谈",     "masonry"),
    ("panes",        "终端窗格", "Panes",       "tmux 分屏，标题栏装点",    "rows"),
    ("album-rows",   "横向图条", "Album Rows",  "卡片横向滑动条",           "cols"),
    ("big-type",     "大字报",   "Big Type",    "巨号标题，气场全开",       "hero"),
    ("z-pattern",    "Z 字动线", "Z-Pattern",   "视线折线引导",             "grid"),
    ("f-pattern",    "F 型阅读", "F-Pattern",   "左重右轻，扫视友好",       "split"),
    ("axis",         "中轴对称", "Axis",        "中线两侧，左右对望",       "timeline"),
    ("floating",     "悬浮错落", "Floating",    "卡片微旋，层叠漂浮",       "rows"),
    ("index-page",   "索引长页", "Index Page",  "左目录右正文，编号导览",   "split"),
    ("collage",      "自由拼贴", "Collage",     "不规则混排，手作感",       "grid"),
    ("one-screen",   "一屏尽览", "One Screen",  "全站压缩进一屏",           "grid"),
    ("cta-first",    "联系优先", "CTA First",   "行动导向，CTA 最前",       "rows"),
    ("compare",      "双列对照", "Compare",     "两两并置，左右互文",       "cols"),
]

PREVIEWS = {
    "rows":     '<div class="lp lp-rows"><i></i><i></i><i></i></div>',
    "cols":     '<div class="lp lp-cols"><i></i><i></i><i></i></div>',
    "grid":     '<div class="lp lp-grid"><i></i><i></i><i></i><i></i></div>',
    "split":    '<div class="lp lp-split"><i></i><i></i><i></i></div>',
    "timeline": '<div class="lp lp-timeline"><i></i><i></i><i></i><i></i></div>',
    "hero":     '<div class="lp lp-hero"><i class="hl"></i><i></i><i></i></div>',
    "masonry":  '<div class="lp lp-masonry"><i></i><i></i><i></i></div>',
    "band":     '<div class="lp lp-band"><i></i><i></i><i></i></div>',
}

STYLE_CARD = """    <div class="g-cell">
      <span class="g-num">{num:02d}</span>
      <a class="g-card t-{slug}" href="{slug}.html" target="_blank">
        <div class="g-preview">
          <div class="g-mini-title">l4place</div>
          <div class="g-mini-tag">AI 时代探索者</div>
          <div class="g-mini-btn">查看项目 ↓</div>
          <div class="g-mini-lines"><i style="width:84%"></i><i style="width:62%"></i></div>
        </div>
        <div class="g-info">
          <div class="g-names"><b>{zh} · {en}</b><span>{desc}</span></div>
          <div class="g-dots"><i style="background:var(--bg)"></i><i style="background:var(--surface-2)"></i><i style="background:var(--accent)"></i><i style="background:var(--accent-2)"></i></div>
        </div>
      </a>
    </div>"""

LAYOUT_CARD = """    <div class="g-cell">
      <span class="l-num">{num:02d}</span>
      <a class="l-card" href="layout-{slug}.html" target="_blank">
        {preview}
        <div class="l-info">
          <div class="l-names"><b>{zh} · {en}</b><span>{desc}</span></div>
        </div>
      </a>
    </div>"""

STYLE_CONTROLS = """
    <div class="pd-group"><div class="pd-label"><span>色相偏移</span><output data-output="hue">0°</output></div><input class="pd-range" type="range" data-param="hue" data-css="--p-hue" data-format="deg" min="-45" max="45" step="1" value="0"></div>
    <div class="pd-group"><div class="pd-label"><span>色彩饱和度</span><output data-output="saturation">100%</output></div><input class="pd-range" type="range" data-param="saturation" data-css="--p-saturation" data-format="scale" min="50" max="170" step="1" value="100"></div>
    <div class="pd-group"><div class="pd-label"><span>明暗对比度</span><output data-output="contrast">100%</output></div><input class="pd-range" type="range" data-param="contrast" data-css="--p-contrast" data-format="scale" min="75" max="135" step="1" value="100"></div>
    <div class="pd-group"><div class="pd-label"><span>文字比例</span><output data-output="font">100%</output></div><input class="pd-range" type="range" data-param="font" data-css="--p-font" data-format="scale" min="85" max="120" step="1" value="100"></div>
    <div class="pd-group"><div class="pd-label"><span>阅读行高</span><output data-output="line">170%</output></div><input class="pd-range" type="range" data-param="line" data-css="--p-line" data-format="scale" min="140" max="210" step="1" value="170"></div>
    <div class="pd-group"><div class="pd-label"><span>圆角强度</span><output data-output="radius">100%</output></div><input class="pd-range" type="range" data-param="radius" data-css="--p-radius" data-format="scale" min="0" max="220" step="1" value="100"></div>"""

LAYOUT_CONTROLS = """
    <div class="pd-group"><div class="pd-label"><span>内容最大宽度</span><output data-output="width">1080px</output></div><input class="pd-range" type="range" data-param="width" data-css="--p-width" data-format="px" min="720" max="1440" step="10" value="1080"></div>
    <div class="pd-group"><div class="pd-label"><span>区块纵向节奏</span><output data-output="space">100%</output></div><input class="pd-range" type="range" data-param="space" data-css="--p-space" data-format="scale" min="60" max="150" step="1" value="100"></div>
    <div class="pd-group"><div class="pd-label"><span>网格间距</span><output data-output="gap">100%</output></div><input class="pd-range" type="range" data-param="gap" data-css="--p-gap" data-format="scale" min="50" max="180" step="1" value="100"></div>
    <div class="pd-group"><div class="pd-label"><span>卡片最小宽度</span><output data-output="cardMin">310px</output></div><input class="pd-range" type="range" data-param="cardMin" data-css="--p-card-min" data-format="px" min="240" max="420" step="5" value="310"></div>
    <div class="pd-group"><div class="pd-label"><span>Hero 文字占比</span><output data-output="heroShare">68%</output></div><input class="pd-range" type="range" data-param="heroShare" data-css="--p-hero-left" data-format="share" min="40" max="80" step="1" value="68"></div>
    <div class="pd-group"><div class="pd-label"><span>卡片内边距</span><output data-output="cardPad">26px</output></div><input class="pd-range" type="range" data-param="cardPad" data-css="--p-card-pad" data-format="px" min="14" max="42" step="1" value="26"></div>"""


def render_exhibit(tpl, base, skin_css, body_class, label, cabinet, param_kind):
    """生成一个展品页（风格或布局）。cabinet = (name, url, short, other_name, other_url)"""
    cname, curl, cshort, oname, ourl = cabinet
    html = (tpl
            .replace("/*__BASE_CSS__*/", base)
            .replace("/*__THEME_CSS__*/", skin_css)
            .replace("{{BODY_CLASS}}", body_class)
            .replace("{{EXHIBIT_LABEL}}", label)
            .replace("{{CABINET_NAME}}", cname)
            .replace("{{CABINET_URL}}", curl)
            .replace("{{CABINET_SHORT}}", cshort)
            .replace("{{OTHER_NAME}}", oname)
            .replace("{{OTHER_URL}}", ourl)
            .replace("{{PARAM_KIND}}", param_kind)
            .replace("{{PARAM_TITLE}}", "视觉调色台" if param_kind == "style" else "布局实验台")
            .replace("<!--__PARAM_CONTROLS__-->", STYLE_CONTROLS if param_kind == "style" else LAYOUT_CONTROLS))
    leftover = re.findall(r"\{\{[^}]+\}\}|/\*__[A-Z_]+__\*/", html)
    if leftover:
        print(f"[warn] {label}: unresolved placeholders: {leftover}")
    return html


def main():
    base = (SRC / "base.css").read_text(encoding="utf-8")
    tpl = (SRC / "template.html").read_text(encoding="utf-8")
    mbar = (SRC / "museum-bar.css").read_text(encoding="utf-8")
    zen = (SRC / "themes" / "zen.css").read_text(encoding="utf-8")

    style_cabinet = ("风格展览柜", "styles.html", "风格柜", "布局展览柜", "layouts.html")
    layout_cabinet = ("布局展览柜", "layouts.html", "布局柜", "风格展览柜", "styles.html")

    # 1. 风格展品页
    var_blocks, style_cards = [], []
    for i, (slug, zh, en, desc) in enumerate(THEMES, 1):
        css = (SRC / "themes" / f"{slug}.css").read_text(encoding="utf-8")
        html = render_exhibit(tpl, base, css, f"t-{slug}", f"{zh} {en}", style_cabinet, "style")
        (ROOT / f"{slug}.html").write_text(html, encoding="utf-8")
        m = re.search(r"(\.t-" + slug + r"\s*\{[^}]*\})", css)
        if not m:
            print(f"[error] theme variable block not found: {slug}"); sys.exit(1)
        var_blocks.append(m.group(1))
        style_cards.append(STYLE_CARD.format(num=i, slug=slug, zh=zh, en=en, desc=desc))
    print(f"[ok] style exhibits: {len(THEMES)}")

    # 2. 布局展品页
    layout_cards = []
    for i, (slug, zh, en, desc, preview) in enumerate(LAYOUTS, 1):
        layout_css = (SRC / "layouts" / f"{slug}.css").read_text(encoding="utf-8")
        skin = zen + "\n" + layout_css
        html = render_exhibit(tpl, base, skin, f"t-zen l-{slug}", f"{zh} {en}", layout_cabinet, "layout")
        (ROOT / f"layout-{slug}.html").write_text(html, encoding="utf-8")
        layout_cards.append(LAYOUT_CARD.format(num=i, slug=slug, zh=zh, en=en, desc=desc, preview=PREVIEWS[preview]))
    print(f"[ok] layout exhibits: {len(LAYOUTS)}")

    # 3. 风格展览柜
    gal = (SRC / "gallery.html").read_text(encoding="utf-8")
    gal = (gal.replace("/*__MUSEUM_BAR_CSS__*/", mbar)
              .replace("/*__VAR_BLOCKS__*/", "\n".join(var_blocks))
              .replace("<!--__CARDS__-->", "\n".join(style_cards)))
    (ROOT / "styles.html").write_text(gal, encoding="utf-8")

    # 4. 布局展览柜
    lgal = (SRC / "layout-gallery.html").read_text(encoding="utf-8")
    lgal = (lgal.replace("/*__MUSEUM_BAR_CSS__*/", mbar)
               .replace("<!--__CARDS__-->", "\n".join(layout_cards)))
    (ROOT / "layouts.html").write_text(lgal, encoding="utf-8")

    # 5. 门户
    portal = (SRC / "portal.html").read_text(encoding="utf-8")
    portal_themes = "\n".join(
        (SRC / "themes" / f"{slug}.css").read_text(encoding="utf-8")
        for slug, *_ in THEMES
    )
    theme_data = ",\n    ".join(
        f"{{ slug: '{slug}', name: '{zh} · {en}' }}"
        for slug, zh, en, _ in THEMES
    )
    portal = (portal.replace("/*__MUSEUM_BAR_CSS__*/", mbar)
                    .replace("/*__PORTAL_THEMES__*/", portal_themes)
                    .replace("/*__THEME_DATA__*/", theme_data))
    (ROOT / "index.html").write_text(portal, encoding="utf-8")

    print("[ok] portal + style cabinet + layout cabinet")
    for f in ("styles.html", "layouts.html"):
        s = (ROOT / f).read_text(encoding="utf-8")
        leftover = re.findall(r"\{\{[^}]+\}\}|/\*__[A-Z_]+__\*/|<!--__[A-Z]+__-->", s)
        if leftover:
            print(f"[warn] {f}: unresolved placeholders: {leftover}")


if __name__ == "__main__":
    main()
