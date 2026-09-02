# 展品学习教程第二轮独立裁决

日期：2026-08-15  
范围：通用 learning schema / renderer / build discovery 静态审查；52 件脚手架分层抽样 12 件；10 件高定静态复验准备  
限制：本轮未修改实现，也未把静态检查冒充运行态、视觉或可访问性通过

## 总裁决

**通用架构：REVISE。** 数据驱动方向、62/62 资源发现、作者源 digest 和统一 renderer 已成立，但实验状态模型、完成判定、source ownership、schema 约束和内容呈现仍不足以通过生产硬门槛。

**52 件脚手架：当前不能计为完成。** 12 件抽样结果为 0 PASS、8 REVISE、4 FAIL。脚手架可作为内容占位和 source-ref 初稿，不是逐件设计完成的教程。

**10 件高定：静态内容明显优于脚手架，均可进入运行态复验，但本轮不授予 PASS。** 它们仍受通用 renderer 缺陷影响，且视口、标注、键盘、触控、实验复位及真实完成闭环尚未逐件举证。

静态命令证据：

- `node scripts/validate-source.mjs`：通过，62 条 Protocol v1 record。
- `npm run typecheck`：通过。
- prototype-engineering ledger 仍只记录已 `productionize` 的 `webgl-time-gallery-v001`，没有本学习系统自身的边界、场景、验证和 productionize 决策。

## 1. 通用实现硬门槛审查

### 已满足或具备可信基础

1. `specimen.schema.json` 以开放附加属性加入 `learning.resource`，没有封闭 category/renderer，也没有修改 `specimenVersion: 1`。
2. Catalog、public manifest、HTML alternate link、embedded context、AI context、AI.md 和 llms.txt 均建立 learning discovery。
3. `LearningWorkspace` 对所有有 resource 的 item 使用同一 renderer，不再按 item id 写 React 分支。
4. `SpecimenViewer` 位于稳定树位置；展示/学习面板切换没有直接重建 iframe 的实现分支。
5. source validator 会检查 schema、itemId、step id、control key、quiz correct 范围、整文件 SHA-256 和 snippet 精确包含，并拒绝 `.generated/` / `dist/`。
6. 教程资源包含目标、前置、原理步骤、代码、实验、测验、常见错误、阅读和完成标准的基本字段。
7. renderer 已将 annotation detail 与 `aria-describedby` 关联，题目进度按 item + learningVersion 持久化，错误选择不再自动揭示正确选项。

### 必须修正的通用缺陷

#### R2-01：实验没有“初态 → 操作”两阶段语义（P1）

`LearningWorkspace.tsx:79,103` 将 `initial` 和 `controls` 一次合并，后者覆盖前者。用户点击时从未看到声明的初态，也不能比较变化；这与 schema 和教程文案中的因果实验模型不一致。

要求：实验 renderer 至少提供“设置基线/应用变化/复位”或等价的确定性状态机，并显示当前阶段。自动测试需断言初态和变化态均实际到达。

#### R2-02：reset 与 expected 被藏在 `title` 属性（P1）

有 controls 的实验仅显示 label；`expected` 和 `reset` 被拼进按钮 `title`。触控用户无法可靠发现，键盘/读屏也缺少明确操作闭环。每个实验要求的观察结果与复位方式必须是可见、可聚焦或有明确描述关系的内容，复位应可执行而非仅文字。

#### R2-03：完成标准没有被系统判定（P1）

renderer 只根据 quiz 正确数计算 `% MASTERY`，但资源中的完成标准通常还要求完成实验、说明不变量或指出源码。`completion.criteria` 仅被折叠展示，系统会在三题正确时视觉上显示 100%，造成“掌握”与真实完成标准冲突。

要求：区分 quiz score 与 lesson completion；完成状态必须覆盖资源声明的可追踪条件，不能追踪的口头标准不得自动显示已完成。

#### R2-04：furtherReading 被构建但从未渲染（P2）

schema 强制 `furtherReading`，62 个资源也都有值，但 `LearningWorkspace` 没有展示入口。内容模型在 UI 中不完整。

#### R2-05：source validator 没有验证 item-specific ownership（P1）

`validate-source.mjs:47-61` 只要求路径位于仓库且不在生成目录。任一 item 引用另一件 item 的 CSS、无关脚本或任意仓库文件，也能通过“author source”检查。

要求：theme 仅允许自己的 `item.source` 加声明的共享源；layout 仅允许自己的 layout source 加明确共享源；static 仅允许 `sourceDir/sourceFiles/bundle source`。共享源引用必须标记 shared，不能冒充 item 特有规则。

#### R2-06：locator 不可验证（P2）

schema 只要求非空字符串，validator 不检查 selector/symbol 是否与 snippet 对应、是否唯一或可定位。高定资源中的 `lines 12-17` 也会随文件变化而漂移，即使 digest 更新后 locator 仍可能错误。

要求：定义稳定 locator 类型（CSS selector / JS symbol / region id）并验证；行号只能作为生成展示信息，不作为稳定身份。

#### R2-07：实验值只校验 key，不校验 control 类型、选项和范围（P1）

validator 接受无效 select 值、boolean 字符串及越界 range。`initial` 和 `controls` 还可能互相矛盾。必须按 manifest control 的 type/min/max/options 验证。

#### R2-08：schema 与 validator 只保证“至少有一个”，不保证闭环质量（P2）

- annotations / experiments 可为空数组；仅外部 validator 检查全资源存在一处。
- annotation、experiment、quiz id 不检查重复。
- quiz options 不检查唯一；全部正确答案可固定同一位置。
- kind 是开放字符串，这是正确的开放性，但 renderer 对未知 kind 没有 capability/fallback 说明。
- TypeScript 将 schema 强制的 `concepts/commonMistakes/furtherReading` 声明为 optional，静态类型与协议不一致。

#### R2-09：public source reference 不可达（P2）

public `learning.json` 中的 `code.file` 仍是 `src/themes/...` 等仓库路径，部署后的 item 目录不包含这些作者源。AI 可以读取 snippet，却不能从当前公开 URL 获取所称 source file。需提供明确的 source provenance URL/仓库映射，或把“不可在线获取、仅构建时校验”写入结构化语义。

#### R2-10：运行时只检查 itemId，不做 schema/version 校验（P2）

`useLearningResource.ts:19-26` 对网络 JSON 只检查 `itemId`，然后直接交给 renderer。损坏的 steps/quiz 可导致运行时错误。构建期校验不能覆盖缓存损坏、错误部署或未来兼容问题。至少应检查 learningVersion 和必要结构，并提供安全错误态。

#### R2-11：annotation 仍没有 viewport/state 合同（P1）

坐标是相对播放器画布的百分比，但资源不声明适用 viewport、滚动位置、control state 或 item screen。切换实验后标注仍保持原位；WebGL 多 screen、horizontal scroll、accordion/tabbed 等 item 尤其无法由一套坐标证明指向正确。

要求：每组标注声明可复现的 scene/state/viewport，或采用 item-owned semantic anchor protocol。Catalog 生产代码仍不得读取 iframe DOM。

#### R2-12：触控/详情和 focus 可见性仍未证明（P2）

tooltip 依赖 hover/focus CSS；按钮点击没有展开状态或触控持久化。annotation layer `overflow:hidden` 也可能裁切边缘 tooltip。需要触控等价交互、Esc/外部关闭语义和视口碰撞验证。

#### R2-13：dist validator 不复核内容真实性（P2）

dist 只做 schema/discovery；它不确认 public learning 与已通过 source validation 的源资源逐字一致，也不记录内容摘要。标准 `npm run build` 顺序可以降低风险，但单独执行 builder/dist validator 仍可发布未经真实性验证的资源。建议给 learning artifact 加构建 provenance/hash 并交叉校验。

#### R2-14：缺少本学习系统 prototype lifecycle（P2）

当前 ledger 仍是无关的 WebGL prototype。学习架构已越过单件原型并进入全量生产化，但没有本系统自身的 hypothesis、boundary、scenarios、verification、record 和 decision 证据。

## 2. 52 件脚手架的系统性检查

静态统计：

- 26 个 scaffold theme 的 annotation 集合只有 **1** 种，实验 control shape 只有 **1** 种。
- 26 个 scaffold layout 的 annotation 集合只有 **1** 种，实验 control shape 只有 **1** 种。
- 52 件所有 quiz 的 `correct` 都是 **0**。
- 每件把 CSS parser 抽到的前两条规则直接当成两条教学原理；选择策略不理解 selector 的教学价值。
- observe 和 experiment 两个步骤重复放入同一组实验，用户会重复做相同动作。

这些资源满足“有 JSON、有精确 snippet”，但不满足用户要求的“对每件展品设计对应教程”。

### 分层抽样裁决（12 件）

| item | 层 | 静态裁决 | 主要证据 |
| --- | --- | --- | --- |
| neumorphism | 低对比/表面 theme | REVISE | token 与多组件 shadow 代码真实，实验能改变对比/圆角；但标注、实验、题目均为 theme 通稿，没有讲光源方向、双阴影与低对比可访问性边界。 |
| watercolor | 有机纹理 theme | REVISE | token 与径向晕染代码对应；没有拆解不规则边缘/纸感/笔触，通用圆角实验不能证明水彩核心。 |
| matrix | 强运动 theme | REVISE | token 与标题 glow 对应；教程主题写“代码雨夜”，却未选择代码雨/运动规则，也未设计 reduced-motion 实验。 |
| brutalist | 高对比 theme | REVISE | token 和 nav 粗边真实；关键代码不足以解释硬框、错位阴影和直接层级，通用色相实验偏离核心。 |
| glass | 透明表面 theme | REVISE | token 与背景光场真实；没有引用或实验 `backdrop-filter`/半透明叠层，因此未真正解释“毛玻璃卡片”。 |
| risograph | 印刷纹理 theme | REVISE | token 与网点背景真实；缺少双色套印/错版关系，通用圆角实验不能验证印刷机制。 |
| layout-horizontal | 非标准滚动 layout | FAIL | 核心代码 `display:flex/overflow-x/scroll-snap` 真实，但实验只改 width/cardMin/space/gap。该 layout 明确 `main max-width:none`、section `min-width:82vw`，所谓“收窄画布重排”不能验证核心横向滚动，也无滚动/键盘实验。 |
| layout-accordion | hover 交互 layout | FAIL | 代码真实但核心展开只用 `:hover`；教程既没有触发展开实验，也不能键盘完成。通用间距实验与“默认折叠、悬停展开”无因果关系，并暴露 item 自身可访问性硬缺陷。 |
| layout-one-screen | 视口强约束 layout | REVISE | 字号/hero 代码相关但只覆盖密度机制很小一部分；space/gap 压力有部分价值，却没有验证“一屏”是否成立、信息隐藏代价和窄屏降级。 |
| layout-masonry | 多列流 layout | FAIL | columns/break-inside 代码真实；通用实验不改变 columns、column-gap 或 break behavior，width 还被 layout 的固定 `max-width:1080px` 覆盖，核心实验不可执行。 |
| layout-tabbed | target 交互 layout | FAIL | 所选关键代码只有 hero/main 尺寸，没有选择 `section:target`、`:has()` 与 reduced-motion；实验也不执行 tab 切换，无法完成标题承诺的“锚点切换”。 |
| layout-collage | 非规则网格 layout | REVISE | 六列 grid 与 section surface 代码相关；没有讲各区段 placement/rotation，通用 width 控制被固定 max-width 覆盖，实验未验证拼贴关系。 |

### 对全部 52 件的外推边界

抽样足以证明脚手架生成策略存在系统性缺陷，因此其余 40 件不能因 schema/validator 通过而获得 PASS。但不得仅凭抽样给未读内容逐件 FAIL；矩阵保留 `NOT_REVIEWED` / validator evidence，等待高定与逐件复检。

## 3. 10 件高定静态复验准备

| item | 静态状态 | 下一步运行态必测 |
| --- | --- | --- |
| css-ocean-wave | READY_FOR_RUNTIME_REVIEW | 三个实验真实两阶段、标注随昼夜/浪高状态仍准确、触控 tooltip、完成判定。 |
| time-gallery-webgl | READY_FOR_RUNTIME_REVIEW | 四 screen 路径、keyboard preview、pointer-lock 拒绝 fallback、WebGL 性能与多 screen 标注合同。 |
| cosmos | READY_FOR_RUNTIME_REVIEW | 低饱和/低对比实验、亮暗状态线条对比、AA 可读性。 |
| paper | READY_FOR_RUNTIME_REVIEW | radius/line/contrast 实际映射、文字行长与窄屏、纸面标注指向。 |
| terminal | READY_FOR_RUNTIME_REVIEW | steps motion/reduced-motion、字体密度、标注与伪元素对应。 |
| artdeco | READY_FOR_RUNTIME_REVIEW | radius 参数是否确被 item token 约束、双线/菱形标注、金色弱化后的对比。 |
| layout-classic | READY_FOR_RUNTIME_REVIEW | space/width 实际效果、长页滚动与标注、移动阅读顺序。 |
| layout-magazine | READY_FOR_RUNTIME_REVIEW | 700px viewport 实验是否真可执行、featured 源顺序、窄屏标注。 |
| layout-dashboard | READY_FOR_RUNTIME_REVIEW | 860px 断点、widget 点击目标/焦点、隐藏信息的可访问影响。 |
| layout-split-screen | READY_FOR_RUNTIME_REVIEW | 880px 断点、fixed/offset 同步、焦点与页面滚动、学习 dock 对 viewport 的影响。 |

高定内容已能回答“为何这件展品如此”，代码选择也比脚手架可信；但视口类实验当前呈现为静态说明块，用户没有内建 viewport 控件，必须在真实运行态证明可完成性。

## 4. 本轮矩阵写入规则

- 10 件高定：`content_model`、`code_truth` 标记静态通过或准备复验；`experiment` 保持 runtime review；最终 verdict 为 `REVISE`，不得提前 PASS。
- 12 件脚手架样本：写入本轮逐件 verdict 和具体证据路径。
- 其余 40 件脚手架：只承认 validator 证明资源/schema/snippet 存在，不外推内容质量。
- 62 件的 desktop/mobile/keyboard/reduced_motion 不由本轮静态证据判定。

## 5. 进入下一轮的放行条件

1. 先修 R2-01、02、03、05、07、11 这些 P1 通用缺陷，否则逐件运行审查会反复命中同一问题。
2. 52 件脚手架全部改成 item-specific 内容；至少包含独特原理、独特代码选择、能触发核心机制的实验、难以靠位置猜出的题目和 state/viewport-aware 标注。
3. 10 件高定按上表跑桌面、窄屏、键盘、reduced-motion 与实验复位，逐件留下证据。
4. 增加自动反模板检查：不能简单禁止共享结构，但应检测全族相同 annotation/experiment、全部正确答案同位置、核心 selector 未被教程引用等明显占位模式。
5. 学习系统建立自己的 prototype ledger 并完成 verified → recorded → decided 后，才可声称从原型生产化。
