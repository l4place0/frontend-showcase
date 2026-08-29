# 展品学习教程第三轮独立裁决

日期：2026-08-15  
范围：第二轮通用 P1 复验；30 件高定教程逐件静态复判；代表性桌面、窄屏、键盘、reduced-motion 与 62 件统一 renderer 运行检查  
限制：本轮只审查并记录，不修改实现；自动校验通过不等于逐件视觉、交互与教学质量通过

## 总裁决

**通用 learning 架构由 `REVISE` 升为 `PRELIM_PASS`，30 件高定最终裁决均为 `REVISE`。**

- `node scripts/validate-source.mjs`：62/62 PASS。
- `npm run typecheck`：PASS。
- `npm run build`：PASS；含 unit 3/3、62 件生成与 dist 校验。
- `npx playwright test -c playwright.e2e.config.ts --project=e2e-chromium tests/e2e/learning-prototype.spec.ts`：4/4 PASS；62 件循环耗时 1.6 分钟，总耗时 1.8 分钟。
- 30 件高定的内容均已脱离通用脚手架：学习目标、核心机制、源码片段、实验和题目与各自展品相关；第二轮 4 个 FAIL 均已修到可进入运行复验。
- 本轮不授予最终 PASS：全量 E2E 证明资源可加载、步骤可渲染、声明场景可进入且布局不跳变，但没有逐件验证标注落点、原生实验结果、触控、item 键盘路径和 reduced-motion 视觉结果。

## 1. 第二轮通用 P1 复验

| Round 2 问题 | Round 3 裁决 | 证据与剩余边界 |
| --- | --- | --- |
| 实验没有两阶段 | PASS | control 实验明确提供设置基线、应用变化和复位；CSS ocean E2E 走通两阶段。 |
| expected/reset 不可见不可执行 | PASS_WITH_BOUNDARY | 预期与复位始终可见；control 实验有可执行复位。native 实验由 item 内操作完成，复位仍是明确文字动作。 |
| 完成标准只看 quiz | PASS_MODEL | quiz、实验、自检 criteria 分开计数，三者全部完成才显示教程完成。native 与口头 criteria 仍是学习者自证，不是自动证明。 |
| source ownership/control values | PASS | validator 按 item 类型限制作者源，校验 control 类型、范围和 options。 |
| annotation scene 缺失 | PASS_WITH_SELF_ATTESTATION | viewport/controls 自动校验；非 initial screen 或非零 scroll 必须由学习者在隔离 iframe 内对准后确认。该策略不扩展 Protocol v1，边界可接受。Catalog 无法验证 iframe 内真实 screen/scroll，因此它是明确的人工确认，不是语义证明。 |
| furtherReading/runtime validation | PASS | renderer 展示阅读入口并按 item 目录解析；运行时检查 learningVersion 和必要结构，失败进入安全错误态。 |
| provenance / public source | PASS | `sourceScope`、`sourceAvailability`、构建摘要与 public artifact 交叉校验已建立；作者源不可在线读取的语义明确。 |
| locator 不可验证 | PASS_V1 | 62 件现要求 `snippet.includes(locator.trim())` 精确成立；最后一处 Aurora prose locator 已替换为真实 selector。v1 的字符串 locator 仍是开放字段，但不再允许与 snippet 无关的猜测性描述。 |
| 内容修订污染旧进度 | PASS | 62/62 有 `contentRevision`，storage key 含 `v1:r1`，Catalog 也按 revision 丢弃旧进度。 |

### Protocol v1 边界裁决

人工“我已在展品内对准”策略在现有边界内可接受：它不读取 iframe DOM、不增加协议消息、不加入 `allow-same-origin`，也把不确定性明示给学习者。其证据等级只能是 `SELF_ATTESTED`。用户在确认后再次滚动或切换 item screen，Catalog 无法自动感知；UI 提供“重新对准”，但测试和验收不得把确认按钮点击等价为锚点正确。

time-gallery 原先同一步要求 timeline 与 gallery 两个不可共视锚点，现已拆成两个 step/scene；全量 E2E 会先点击开始进入 timeline、再点击时期进入 gallery 后确认，旧 FAIL 消除。

## 2. 30 件高定逐件裁决

以下 `REVISE` 都表示：**静态内容与统一运行链合格，缺逐件终验**，不是退回脚手架重写。

| item | 内容/真实性复判 | 最终裁决 | 进入 PASS 尚缺 |
| --- | --- | --- | --- |
| css-ocean-wave | 三个正交变量、真实 CSS snippet、两阶段实验成立 | REVISE | 三个实验逐一观察、tooltip 触控、完整完成闭环截图/记录 |
| time-gallery-webgl | 四态、DOM/WebGL 共享状态、timeline/gallery scene 已拆分 | REVISE | 键盘进入时期、E 打开详情、Pointer Lock 拒绝后的拖动降级实测 |
| cosmos | 光场/表面/标题亮度层级与源码对应 | REVISE | 暗态/低对比 AA 与移动标注实测 |
| paper | 暖白、衬线、细边和左强调代码真实 | REVISE | 窄屏行长、hover/focus 等价与标注落点 |
| terminal | 等宽语言、提示符和 steps 闪烁对应 | REVISE | reduced-motion、键盘焦点与密度实验结果 |
| artdeco | 中轴、硬边、重复几何与金色层级对应 | REVISE | 弱化金色后的对比和伪元素标注实测 |
| layout-classic | 单栏节奏与 width/space 实验相关 | REVISE | 长页滚动、移动阅读顺序与标注实测 |
| layout-magazine | 跨栏主推、单栏断点和源码顺序成立 | REVISE | 700px 断点、键盘阅读顺序与 scene 落点 |
| layout-dashboard | 四列 placement、信息删减、900px 降级成立 | REVISE | 860px 断点、widget 焦点与隐藏信息审计 |
| layout-split-screen | 42% fixed hero 与右侧 offset 机制真实 | REVISE | 880px 解固定、页面滚动和焦点路径实测 |
| neumorphism | 双向外阴影与 inset 凹陷已成为核心 | REVISE | 低对比边界、focus 可见性与触控状态 |
| watercolor | 四个色斑、交替圆角和轻旋转对应 | REVISE | 小屏不规则边缘与文字对比实测 |
| matrix | 发光文字、离散光标、条纹数据条对应 | REVISE | reduced-motion 与低对比信号丢失实测 |
| glass | 流光、半透明和 backdrop-filter 因果链真实 | REVISE | 无 backdrop-filter 降级、移动性能和对比 |
| risograph | 网点、双色硬影和斜纹机制真实 | REVISE | 高饱和对比、hover/focus 与打印式纹理实测 |
| layout-horizontal | 82vw、overflow-x、mandatory snap 已成为核心；旧 FAIL 消除 | REVISE | 键盘横滚、触控 snap、断点与 scene y=700 实测 |
| layout-accordion | 已补 `:focus-within` 并同步教程、源码和测验；旧 FAIL 消除 | REVISE | Tab 实际展开、焦点样式、触控无 hover 的任务可完成性 |
| layout-one-screen | 选择性删减而非机械缩放，实验能隔离内部密度 | REVISE | 一屏约束在常见高度与窄屏降级实测 |
| layout-masonry | columns、break-inside 和高度因果实验成立；旧 FAIL 消除 | REVISE | 两列落点、720px 单列、长内容不跨列实测 |
| layout-tabbed | `:target`、`:has()` 默认态、reduced-motion 与原生切换齐备；旧 FAIL 消除 | REVISE | 键盘切 tab、fragment/历史、无 `:has()` 降级实测 |
| brutalist | 3px 黑框、硬影和 hover 位移配对真实 | REVISE | hover/focus/active 等价与高对比模式 |
| cyberpunk | 扫描线、稀疏 glitch、切角和 reduced-motion 对应；遗漏 expected 已修正 | REVISE | reduced-motion 运行截图、静态色差对比和键盘态 |
| aurora | 双周期光幕与静止降级对应 | REVISE | reduced-motion 实测、毛玻璃降级与移动性能 |
| blueprint | 120/24px 网格、虚实线构件与 FIG.01 对应 | REVISE | 低对比细线、hover/focus 转实线与窄屏 |
| botanical | 奇偶镜像叶片缺口与自然色阶对应 | REVISE | 非色彩识别、focus/hover 和小尺寸缺口 |
| layout-collage | 六列 placement、微旋与 900px 单列对应 | REVISE | 880px 断点、阅读顺序和多锚点共视 |
| layout-floating | 负间距、递增 z-index、交替旋转对应；已补 `:focus-within` 等价姿态 | REVISE | Tab 实际触发、焦点可见性与触控路径实测 |
| layout-grid9 | 五区段九宫 placement 与删减策略对应 | REVISE | 880px 线性化、阅读顺序与 scene 落点 |
| layout-chatflow | 奇偶对齐、镜像缺口/尾巴与内部降级对应 | REVISE | 长文本、读屏顺序和 640px 内部单列 |
| layout-panes | `::before` 路径标题与统一窗格 padding 对应 | REVISE | 小屏溢出、标题可访问语义和键盘滚动 |

### 原 4 个 FAIL 的复判

- `layout-horizontal`：FAIL → REVISE。核心横向轨道、snap 与不变量实验已出现。
- `layout-masonry`：FAIL → REVISE。实验现在通过区段/卡片高度改变真实列流落点。
- `layout-tabbed`：FAIL → REVISE。关键代码与原生 tab 实验已覆盖 fragment、`:target`、`:has()` 和 reduced-motion。
- `layout-accordion`：FAIL → REVISE。源码新增 `:focus-within`，教程与题目同步；仍需真实键盘/触控终验。

## 3. 运行态证据能证明什么

### 已证明

1. 展示/学习转换不重载 item iframe；CSS ocean 的 `performance.timeOrigin` 前后一致。
2. 测验步骤不会改变 workspace 或 document 高度，用户报告的页面跳变有自动回归覆盖。
3. 学习 stepper、code details 可用键盘操作；reduced-motion 下 workspace transition 低于 0.001 秒。
4. 窄屏时不满足 scene viewport 的定位标注会隐藏。
5. 62 件均能加载 learning resource；每步对应 annotation/code/experiment/quiz renderer 可出现，切换步骤不改变页面整体高度。
6. 全量场景测试会按声明 scroll iframe；time-gallery 会实际进入 timeline/gallery，再进行人工确认。

### 尚未证明

1. 62 件的百分比坐标是否逐件落在正确视觉对象，说明与折线是否碰撞、偏离或被背景吞没。
2. native 实验的 expected 是否实际发生；当前完成按钮是学习者自证。
3. 29 件非 CSS ocean 的移动、键盘与 reduced-motion 表现。
4. item 内部 hover 行为的触控与键盘等价；`layout-floating` 已有 `:focus-within` 静态路径，但仍缺运行证据。
5. 各教程完成标准是否由真实理解而非机械勾选达成。

## 4. 下一批与最终放行阻断项

1. 对 30 件建立逐件 screenshot/runtime evidence：桌面 scene、移动降级、键盘路径、reduced-motion；至少包含一次真实实验预期与复位。
2. 给 scene 审查加入视觉裁决，而非只验证 renderer 可见；同一步多个锚点必须在声明 scene 中共视。
3. 给 native experiment 建立 `SELF_ATTESTED` 证据标记，避免与宿主 control 自动执行混为一谈。
4. 运行验证 `layout-floating` 的 `:focus-within` 扶正路径，并明确无 hover 触控设备上的等价任务。
5. 后续版本可把 locator 演进为 selector/symbol/region 的结构化身份；v1 已以 locator 必须精确包含在 snippet 中建立最低可验证门槛。
6. 本学习系统仍应补自己的 prototype-engineering record/decision；当前 ledger 只覆盖独立的 WebGL time-gallery 原型。

## 5. PASS / REVISE / FAIL 规则沿用

- **PASS**：静态真实性、实验闭环、桌面/移动/键盘/reduced-motion、标注共视与 Protocol 隔离均有逐件证据，无 P0/P1。
- **REVISE**：核心内容可信且可继续验证，但缺一个必需运行证据或有可局部修复的 P1/P2。
- **FAIL**：核心教学对象错误、代码/实验声称与真实展品矛盾、任务不可执行，或破坏 item 独立/Protocol v1 安全边界。

本轮结论为：**通用架构 PRELIM_PASS；30 件内容静态合格，最终 0 PASS / 30 REVISE / 0 FAIL。**
