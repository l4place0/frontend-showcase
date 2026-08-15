# 展品学习教程第五轮独立裁决

日期：2026-08-15  
范围：最后 12 件布局教程逐件静态裁决；62 件终局矩阵准备  
原则：执行自检、schema/source 通过和全量 renderer 冒烟均不能替代逐件语义、视觉与可访问性证据

## 阶段裁决

最后 12 件均已脱离脚手架。初审为 **0 PASS / 12 REVISE / 0 FAIL**；完成常见桌面、窄屏、reduced-motion、逐件语义与有序导航复验后，终审为 **12 PASS / 0 REVISE / 0 FAIL**。

## 1. 逐件裁决

| item | 静态真实性 | 裁决 | PASS 前仍缺 |
| --- | --- | --- | --- |
| layout-newspaper | 刊头、双线、三栏和 featured 跨栏对应 | PASS | 常见桌面标注共视、窄屏与源码真实性通过 |
| layout-reverse | 构建期真实 DOM 倒序、正常 column 与 05→01 counter 对应 | PASS | nav、main DOM、几何、main 内焦点顺序严格一致 |
| layout-staggered | 860px 限宽、奇偶 5% 偏移和标题线交替对应 | PASS | 长滚动标注共视与窄屏通过 |
| layout-bands | full-bleed 色带、中央内容 calc 和偶数 surface-2 对应 | PASS | 跨色带折线对比与窄屏通过 |
| layout-album-rows | flex 横轨、固定卡宽、下一张露出和 snap 对应 | PASS | 键盘/触控与窄屏运行门槛通过 |
| layout-big-type | 122/80px clamp 标题与单列内容对应 | PASS | 常见桌面、窄屏与缩放风险抽样通过 |
| layout-z-pattern | 构建期真实 DOM 顺序与 grid 行列对应 | PASS | nav、main DOM、几何、main 内焦点顺序严格一致 |
| layout-f-pattern | 2:1 主/侧栏、projects 跨三行和 contact 收束对应 | PASS | 断点线性化与焦点顺序通过 |
| layout-axis | 2px 中轴、两侧 52px 沟槽和 -47px 节点对应 | PASS | 标注共轴与窄屏通过 |
| layout-index-page | 250px 左轨、counter 编号和 800px 正文对应 | PASS | 固定轨、移动替代和运行门槛通过 |
| layout-cta-first | 构建期真实 contact 首段、70vh Hero 与两列行动卡对应 | PASS | nav、main DOM、几何、main 内焦点顺序严格一致 |
| layout-compare | 等宽双列、共同双线基准和 contact 跨列对应 | PASS | 线性化、焦点顺序与长内容通过 |

## 2. 关键内容风险

### 视觉顺序不是语义顺序：CLOSED

- `layout-reverse`、`layout-cta-first`、`layout-z-pattern` 最终都不再靠 `column-reverse`、负 `order` 或脱离 DOM 的 grid 重排制造主路径。
- Catalog 的开放 `sectionOrder` 由通用 builder 同步重排真实 `.nav-links > a` 和真实 `<main> > section`；没有模板复制、item id 分支或正数 tabindex，生成失败会阻断不完整/重复顺序。
- 独立浏览器逐件验证 nav DOM、实际 Tab 路径、main DOM、main 内可聚焦区段与纵向几何一致；三件均无重复 id 和正数 tabindex。
- 该构建元数据不进入 item 运行依赖；生成后的 item 仍以独立 HTML、局部资源和 Protocol v1 bridge 运行。

### 伪元素承载有意义信息：CLOSED

- newspaper 的期号、hero-full 的“向下滚动”、timeline/index 的序号均由 `content` 生成。
- 终审把这些内容判为视觉编号/提示，主标题、区段 id、真实链接和教程正文均提供理解与导航所需的等价语义；它们不是完成任务的唯一信息源。

### 横向与长页场景：CLOSED

- album-rows 的键盘/触控横滚和窄屏路径已进入运行复验。
- staggered/bands 的 y=1320 与 timeline 等长页 scene 已由常见桌面人工截图复核补足自动 scroll 只能证明定位动作的局限；抽样中的同场景两锚点共视。

## 3. 62 件终局运行结果

独立命令：

- `npm run build`：PASS；typecheck、unit 3/3、source 62/62、生成 62、dist 62 均绿。
- `npm run test:components`：7/7 PASS。
- `npm run test:e2e` 首次稳定重跑：19 PASS / 1 mobile overflow FAIL，耗时 2.7 分钟；修复后对唯一失败测试独立重跑，62 件窄屏循环 PASS（测试体 36.3 秒）。组合证据覆盖完整 20 项。
- PASS 范围：desktop 62 件 learning 循环；Protocol 隔离；AI 资源；CSS ocean；time-gallery 离线完整路径；62 件 reduced-motion CSS；time-gallery reduced-motion 下停止空闲 WebGL redraw 且保留用户控制。
- 原 FAIL：62 件窄屏 iframe overflow 循环。旧循环官方并发时停在 Cosmos，单测重跑停在 layout-floating；原因之一是遇首个失败即停止且未等待 iframe layout 稳定。

为区分真实溢出与 SPA 路由/iframe resize 时序，我另做 62 件只读稳定探针：每件 ready 后等待 350ms，再读取 iframe `documentElement.scrollWidth`。结果为 59/62 通过，3 件稳定失败：

| item | iframe viewport / scrollWidth | 越界来源 | 裁决 |
| --- | --- | --- | --- |
| layout-floating | 303 / 311 | 微旋 section 左右越界 | FIXED；窄屏归中并把姿态收敛为 ±0.35°，仍保留可触控扶正实验 |
| css-ocean-wave | 303 / 320 | item 最小画布宽 320px | FIXED；删除硬最小宽 |
| time-gallery-webgl | 303 / 307 | scribble/SVG/scene transform 越界 | FIXED；`#app` 裁切 screen/scribble 外溢 |

移动循环现逐件等待 ready + 350ms、收集全部 offender 后统一断言；修复后 62/62 PASS。Cosmos 的旧时序红灯没有复现，矩阵移动列统一记 `PASS_RUNTIME_NARROW_R5`。

移动端测试已进入 iframe 检查，因此比 Round 3 shell-only 证据更强；它仍只证明无横向溢出与教学标注安全隐藏，不证明移动导航、触控实验或逐件内容可读性。

### 常见桌面 scene P1：FIXED

代表性视觉复核曾在 1720×1000 浏览器发现：learning specimen stage 约 965.8px，21 件后批资源把 scene `minWidth` 设为 1000/1100/1200，导致常见桌面隐藏定位标注；旧 desktop E2E 使用 2400px viewport 掩盖了问题。

受影响：bauhaus、candy、clay、monochrome、parchment、y2k、layout-hero-full、layout-side-nav、layout-timeline，以及最后 12 件中除 layout-centered 外的 11 件。

修复后 21 件按真实机制断点使用 640/641/721/901，学习 dock 改为 `clamp(370px,23vw,400px)` 让展品优先。独立探针在 1689×1246 测得 stage 约 1079.5px：21/21 scene 不再过窄，按声明 scroll 后确认，21/21 标注可见。全量 desktop 测试也改为用户实际 1689×1246 并 62/62 通过。

人工截图抽样覆盖 Cosmos 暗背景、Chalkboard 高纹理、Staggered 长滚动、Z Pattern 重排和 Newspaper 多栏；双层折线在明暗/纹理背景均可辨，摘要框以中部锚定折线末端，抽样中的同场景两锚点均共视。

## 4. 62 件终局判定规则

矩阵只在对应自动与人工证据都返回后更新，不因 source/schema 单项通过而批量授予 PASS。

终局 PASS 至少需要：

1. 62/62 source、typecheck、build、component、desktop E2E、mobile loop、reduced-motion loop 全绿；本轮已满足；
2. item 独立 iframe、MessageChannel controls、默认拒绝权限与不使用 `allow-same-origin` 保持；
3. 每件教程的 scene/代码/实验/quiz 对应真实 item，代表性视觉复核覆盖高纹理、暗背景、滚动、多 screen 与重排布局；
4. 键盘和触控能完成原生实验，视觉顺序与语义顺序差异被审计；
5. 自动证据只支持其实际覆盖的列，未覆盖的列保持 REVISE/UNVERIFIED。

## 5. 原 6 件阻断关闭证据

| item | 独立复验 | 裁决 |
| --- | --- | --- |
| layout-accordion | 375px 导航可见且每个链接高 44px；touch 与 Tab+Enter 均令唯一 section 匹配 `:target`，切换或 `#top` 后旧段恢复 108px | PASS |
| layout-floating | 375px 保留 ±0.35° 微旋；touch 与 Tab+Enter 后目标段扶正上移，切换目标后前段恢复 | PASS |
| layout-tabbed | 375px 横滚导航可见且触控高度 ≥44px；touch 与 Tab+Enter 都只显示 fragment 对应面板 | PASS |
| layout-reverse | nav/main 为 contact→blog→about→skills→projects，几何 top 严格递增，实际 Tab 路径同序 | PASS |
| layout-cta-first | nav/main 为 contact→projects→skills→about→blog，几何 top 严格递增，实际 Tab 路径同序 | PASS |
| layout-z-pattern | nav/main 为 projects→about→contact→skills→blog，几何 top 严格递增，实际 Tab 路径同序 | PASS |

六件的 learning snippet 均为作者源精确子串，locator 可在 snippet 内精确命中，SHA-256 digest 与当前作者源一致；dist 的 learning 与源资源一致，并保留 `AI.md`、`ai-context.json`、`specimen.json`、`learning.json` 四类发现入口。独立运行 `tests/e2e/learning-accessibility.spec.ts` 为 2/2 PASS。

### Floating 窄屏安全边距补丁复验

终局裁决后，Floating 在 ≤640px 的 section 增加 `width/max-width: calc(100% - 16px)`，learning `contentRevision` 从 3 更新为 4。独立复验结果：

- 303px iframe：根节点 `clientWidth=303`、`scrollWidth=303`；旋转后 section 左右边界约为 4.34 / 298.66px。
- 375px iframe：根节点 `clientWidth=375`、`scrollWidth=375`；旋转后 section 左右边界约为 5.79 / 369.21px。
- 两种宽度都保留初始 ±0.35° 姿态；touch 选中后变为扶正并上移，切换目标后精确恢复初始 transform。
- 横向 nav 的离屏链接只位于自身 `overflow-x:auto` 滚动容器内，没有扩大根节点 scrollWidth。
- 更新后的 learning snippet 仍是作者源精确子串，locator 精确命中，SHA-256 digest 一致；`node scripts/validate-source.mjs` 为 62/62，独立 learning accessibility E2E 为 2/2 PASS。

该补丁关闭旋转几何的安全余量风险，没有改变教程语义、触控路径、Protocol v1 或 item 独立边界，维持 **62 PASS / 0 REVISE / 0 FAIL**。

time-gallery 的原生实验已由离线流程覆盖拖动降级、WASD/方向键、E 单例详情、Escape 与返回；独立补测还确认 period node 可聚焦、Enter 进入 gallery。其余通过项没有未解决的任务级交互阻断。

## 6. 终局裁决

- 通用架构：`PASS`。Protocol v1、独立 item、结构化 learning、作者源真实性、实验/完成模型和 reduced-motion 自动门槛成立。
- 内容静态：62/62 已逐件审查，均为 item-specific；没有保留脚手架 FAIL。
- 运行终局：build、components、Protocol、AI resources、常见桌面 62、移动 iframe 62、CSS reduced-motion 62、WebGL reduced-motion、CSS ocean 与 time-gallery 完整路径均通过。
- 最终 verdict：**62 PASS / 0 REVISE / 0 FAIL**。当前没有遗留逐件阻断。
