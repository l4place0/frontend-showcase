# 展品学习教程独立复检规范 v1

状态：第一阶段裁决基线  
适用范围：`specimens/catalog.mjs` 当前 62 件展品（30 theme + 30 layout + 2 static）  
裁决角色：独立复检 Agent；不得以实现者自测代替裁决证据

## 1. 逐件验收矩阵

逐件状态见同目录的 `learning-tutorial-matrix-v1.csv`。矩阵必须保留以下证据字段，任何一项不得仅填主观结论：

| 维度 | 必填证据 |
| --- | --- |
| 身份与来源 | item id、family、renderer、作者源路径、教程资源路径、教程版本 |
| 内容模型 | 学习目标、前置知识、原理拆解、关键代码、交互实验、练习/测验、常见错误、延伸阅读、完成标准 |
| 真实性 | 每段关键代码的 source file、稳定 selector/symbol、校验结果；禁止引用 `.generated/` 或 `dist/` 作为作者源 |
| 可执行性 | 每个实验的初态、操作、预期可观察结果、复位方式、Protocol control 映射 |
| AI Friendly | manifest 发现入口、结构化教程可解析、AI.md/ai-context 一致性、source references 可达 |
| 边界 | item 可独立运行、宿主不读 item DOM、MessageChannel 控制、sandbox default-deny、无 `allow-same-origin`、本地资源 |
| 渲染 | 桌面、窄屏、极端文本/内容、状态切换、标注碰撞与对比、无非预期页面跳变 |
| 可访问性 | 键盘路径、焦点可见、语义/名称、状态反馈、非 hover 等价路径、reduced motion、对比度 |
| 裁决 | 自动检查证据、人工截图/录像、缺陷编号、PASS/REVISE/FAIL、复检人和日期 |

### 计分结构（100 分）

- 教学内容与完成闭环：25
- 关键代码真实性与可追溯性：20
- 交互实验可执行性：15
- AI Friendly 与结构化发现：10
- item 独立性与 Protocol v1 边界：15
- 渲染稳定性：8
- 可访问性：7

分数不能抵消硬门槛；例如协议越界即使视觉满分仍为 FAIL。

## 2. 验收门槛

### 2.1 教程内容质量

每件教程必须形成“看见 → 操作 → 解释 → 回忆/应用”的闭环，并至少具备：

1. 1–3 个可观察、可测量的学习目标，不能写成“了解某风格”。
2. 明确前置知识；若无前置要求，也应显式为“无”。
3. 至少两个与该展品独特设计决策有关的原理拆解，禁止 62 件复用同一套泛化文案。
4. 每个原理至少绑定一个展品内可见证据或可执行实验。
5. 至少一个常见错误，说明错误结果如何在当前展品中被看见。
6. 延伸阅读必须是本地/稳定引用或概念关键词；外链不能成为教程完成的必要条件。
7. 完成标准必须可判定，例如“正确完成 3/3 题并能通过实验复现某状态”，不能只显示浏览进度。

内容审查时随机抽取一道题，要求答案不能仅由措辞猜出，且解释必须回指展品或真实代码。

### 2.2 关键代码真实性

硬门槛：教程展示的代码必须来自当前作者源，或由确定性提取器从作者源生成。

- theme：`src/themes/<slug>.css`，必要时可引用 `src/base.css` / `src/template.html`，但必须区分共享原理与展品特有原理。
- layout：`src/layouts/<slug>.css`，必要时可引用共享 `src/themes/zen.css`、`src/base.css` / `src/template.html`。
- static：`specimens/items/<id>/` 下声明的 source files。
- 每段代码记录 `file + selector/symbol + content digest`；构建或测试必须在源变化后发现陈旧摘录。
- 不接受手工复制后仅凭肉眼认为相同；不接受 `.generated/`、`dist/`、浏览器 computed style 作为唯一作者源。
- 教程解释的因果关系必须与代码一致。代码存在但解释错误，按真实性失败处理。

### 2.3 交互实验可执行性

每个实验必须声明并验证：

- 初态和复位状态；
- 用户动作与输入边界；
- 通过 MessageChannel/manifest control 产生的状态变化；
- 一个无需读取 iframe DOM 的人类可观察结果；
- 自动验证可以在 item frame 内断言结果，但 Catalog 生产代码不得读取或依赖 item DOM；
- 连续执行、乱序执行和复位后仍确定；
- 不通过重载 iframe 伪造状态切换；展示/学习切换保留同一 runtime。

若教程需要的实验能力不在现有 controls 中，应先扩展 item 自身与 manifest-driven control；不得通过宿主 CSS、React Context 或跨 frame DOM 操作绕过协议。

### 2.4 AI Friendly

每件展品需同时满足：

- `specimen.json`、`AI.md`、`ai-context.json` 和 HTML discovery links 均存在且一致；
- 教程有结构化、带版本的资源入口，字段能表达目标、前置、步骤、source refs、实验、题目、错误、阅读和完成标准；
- Protocol v1 manifest 保持开放：`category` / `renderer` 仍是字符串，教程扩展不得形成封闭枚举；
- AI 能从 item 的公开资源定位教程，不依赖 React bundle 反编译或 Catalog 私有状态；
- 教程的代码引用指向 source metadata；公开构建可提供摘录，但不得谎称生成文件是作者源；
- AI.md、教程结构化资源与实际 control keys/选项无漂移。

### 2.5 独立 item / Protocol v1 边界

以下均为硬门槛：

- item 独立 URL 可运行，仅使用本地资源；
- item 不依赖 Catalog DOM、React Context 或全局 CSS；
- Catalog-to-item 控制和生命周期仅走 MessageChannel bridge；
- iframe 权限来自 manifest，默认拒绝；不得加入 `allow-same-origin`；
- 教程是 Catalog 的学习视角，但 item 本身仍是唯一视觉运行主体；
- 学习资源作为 v1 的开放附加属性或独立可发现资源，不改变 `specimenVersion: 1` 的既有语义；
- WebGL、pointer lock、fullscreen 等权限只能按 manifest 声明，教程不能隐式扩大权限。

### 2.6 渲染门槛

逐件至少验证桌面 1440×900、窄屏 390×844，并对构图敏感项补测 1024×768：

- 展品始终是视觉中心；学习面板不能遮蔽主要观察对象；
- 标注点确实指向被解释区域，折线与摘要中部锚定，文本不越界；
- 标注线在最亮和最暗状态均可辨（双描边或等效对比策略）；
- 切换步骤、题卡和展示/学习模式时，不发生非预期文档高度或滚动位置跳变；
- 面板内部溢出可滚动，键盘焦点进入后仍可见；
- iframe 在学习切换中不重载，状态和 `performance.timeOrigin` 保持；
- 正常、极端 control、reduced-motion 和加载/错误状态均无布局崩坏。

视觉基线只能证明像素变化受控，不能单独证明标注语义正确。

### 2.7 可访问性门槛

- 所有教程步骤、实验、代码展开、题目与前后导航可仅用键盘完成；
- 焦点顺序与视觉顺序一致，焦点样式在暗/亮背景可见；
- 依赖 hover 展示的完整说明必须有 focus 和触控等价路径；
- 当前步骤、选择、正误、完成进度使用语义状态表达，不仅依赖颜色；
- 错误答案不得永久锁死；正确答案后的解释能被辅助技术感知；
- `prefers-reduced-motion: reduce` 同时覆盖宿主过渡与 item 动画；
- 装饰折线对辅助技术隐藏，摘要/详情具有明确关系；
- 文字与控件满足 WCAG 2.2 AA 的对比与触控目标要求，例外必须有书面理由和等价方式。

## 3. CSS Ocean 当前原型裁决

当前结论：**REVISE（可作为交互方向基准，不可直接批量生产化）**。

### 已成立的基线

- 正式 ItemPage 内以学习视角呈现，展品始终留在现场。
- 展示/学习切换复用同一 `SpecimenViewer`，现有 E2E 用 `performance.timeOrigin` 验证未重载。
- 四步结构已移除“协议”教学，把掌握环节改为三张选择题。
- 折线采用暗色 outline + 亮色 main line，摘要中心与线端共用坐标。
- 状态和视差代码摘录目前与 `specimens/items/css-ocean-wave/styles.css` 相符。
- 学习工作台固定高度、面板内部滚动，已有测试覆盖状态 → 测验的高度稳定。

### 生产化前必须修正

1. **专用品架构**：`ItemPage.tsx` 用 `item.id === "css-ocean-wave"` 分支，`CssOceanLearningWorkspace.tsx` 包含整套内容和 UI。扩展到 62 件会形成 62 个 React 特例。必须改为通用 learning renderer + 数据驱动资源。
2. **内容双份维护**：正式组件与 `LearningPrototypePage.tsx` 各维护一份同类步骤、标注、题目与代码，已具漂移风险。生产化只能有一个教程内容源。
3. **缺少结构化教程资源与发现**：当前 manifest/types/build/AI context 无 learning 入口；AI 只能从 React bundle 猜内容。必须增加带版本的独立结构化资源，并由 manifest/AI context 发现。
4. **关键代码为手工副本**：`studies.*.code` 手写在 TSX。虽然当前相符，但没有 source selector/digest 或陈旧检测。必须改为可验证引用/确定性摘录。
5. **内容模型不完整**：缺少显式学习目标、前置知识、常见错误、延伸阅读和可机器判定的完成标准；测验百分比不是完整完成规范。
6. **标注坐标脆弱**：百分比坐标硬编码并假定所有状态/视口构图稳定；移动端、字体变化、极端 control 下尚无逐标注碰撞/指向验证。需要按教程资源声明 viewport/state，或设计稳定的 item-owned semantic anchor 能力；宿主不得跨 frame 读 DOM。
7. **题目效度偏弱**：答错后组件立即给正确选项加 `correct` 样式，可能把“尝试后看答案”计成掌握；没有尝试次数、题序策略或完成状态持久化。需明确这是学习反馈还是验收，并为完成标准设计独立判定。
8. **进度仅组件内存**：切换 item/刷新即丢失，Catalog 尚无 item/version 级进度模型。若产品承诺进度，必须以教程版本为键持久化并处理版本迁移。
9. **可访问关系不足**：摘要按钮通过 CSS 显示内部 `<b>` 详情，但无显式 `aria-describedby`/展开状态；触控设备的详情保持/关闭行为未验证。标注和测验需完整键盘、触控、读屏复检。
10. **样式仍名为 prototype 且全局导入**：正式组件直接引入 `learning-prototype.css`，选择器为全局命名。生产化应有明确的通用组件边界和样式作用域，防止与开放 renderer/category 冲突。
11. **覆盖面不足**：当前正式学习 E2E 只覆盖 CSS ocean 的部分路径；没有教程 schema、62 件资源覆盖、source-ref 校验、移动端、键盘、触控、错误/空资源、WebGL 权限与性能测试。
12. **原型生命周期未记录**：现有 prototype-engineering ledger 指向已决定 productionize 的 `webgl-time-gallery-v001`，并非本学习原型。学习原型进入生产前应建立自己的可审计边界、验证证据和 productionize 决策，不能借用无关 ledger。

## 4. 首批抽样与全量复检策略

“抽样”只决定复检顺序，不减少最终范围；最终 62 件必须逐件裁决。

### 第一批：12 件校准样本

| item | 选择理由 | 重点风险 |
| --- | --- | --- |
| css-ocean-wave | 已有基准原型 | 数据化迁移、代码真实性、切换稳定 |
| time-gallery-webgl | 独立 WebGL 高复杂度 | pointer lock、性能、权限、教程不遮挡 |
| cosmos | 主题基线与强视觉 | 暗背景标注、主题 token |
| terminal | 文字/终端风格 | 代码与展品代码混淆、可读性 |
| neumorphism | 低对比典型 | AA 对比、焦点可见 |
| watercolor | 纹理/有机视觉 | 标注落点、可解释性 |
| matrix | 强运动主题 | reduced motion、动画干扰 |
| layout-classic | 布局基线 | 共享模板与特有规则区分 |
| layout-horizontal | 非标准滚动 | 键盘、横向滚动、焦点保持 |
| layout-dashboard | 高密度布局 | 窄屏重排、标注碰撞 |
| layout-accordion | 交互布局 | hover/keyboard 等价性 |
| layout-one-screen | 视口强约束 | 工作台高度、缩放与溢出 |

第一批先用 CSS ocean 校准裁决尺度，再并行审查其余 11 件。每批执行 Agent 的交付必须先经过自动事实检查，再由独立裁决 Agent 看源码、运行实验和人工视觉；实现者不得自签 PASS。

### 后续批次

- 对 30 theme 按暗/亮、低对比、强运动、强装饰、排版主导分层，确保每批都有不同风险类型。
- 对 30 layout 按常规流、网格密集、视口约束、非标准滚动、交互折叠、响应式重排分层。
- 两个 static 始终单独审查，不套用 portfolio CSS 教程模板。
- 每批回归已 PASS 的 2 件（一个 theme、一个 layout）；涉及通用 renderer/schema 时另回归两个 static。
- 最终进行 62/62 manifest/resource/source-ref 静态校验与 62/62 独立入口冒烟；人工完整路径也必须留下逐件证据。

## 5. PASS / REVISE / FAIL

### PASS

同时满足：

- 所有硬门槛通过；
- 100 分制得分 ≥ 85，且任一维度不低于该维度满分的 70%；
- 没有 P0/P1 缺陷；
- 该 item 的桌面、窄屏、键盘、reduced-motion、实验复位、独立入口、AI 发现和 source-ref 证据齐全；
- 复检 Agent 能从作者源独立复现关键代码与解释的对应关系。

### REVISE

适用于核心方向可保留、item 仍安全独立运行，但存在可局部修复的问题，例如：内容字段缺失、题目效度不足、标注碰撞、某一 viewport/键盘路径失败、source ref 缺 digest、进度或完成标准不完整。REVISE 不得计入“改造完成”。修复后必须针对缺陷和受影响的通用路径复检。

### FAIL

出现任一项即 FAIL：

- 教程关键代码或因果解释与作者源不符；
- item 无法独立运行，或依赖 Catalog DOM/React/global CSS；
- 生产代码跨 iframe 读取/修改 item DOM，绕过 MessageChannel；
- sandbox 出现未声明权限或 `allow-same-origin`；
- 运行时依赖远程资源；
- 必需的 specimen.json、AI.md、ai-context.json、教程资源/发现入口缺失或互相矛盾；
- 教程导致 iframe 重载、状态丢失、主要展品不可观察，或核心实验不可执行；
- WebGL/fullscreen/pointer lock 等权限超出 manifest；
- 通过伪造测试、生成产物手改或跳过作者源来“修复”教程。

FAIL 修复后按新交付重新完整审查，不能只验证单个症状。

## 6. 完成全量改造所需的最终证据

全局完成声明必须同时提供：

- 矩阵 62/62 均为 PASS，且每行有独立复检人、日期和证据路径；
- 构建、source validation、dist validation、component、E2E 全部通过；
- 自动检查能证明 62/62 教程资源存在、schema 合法、source refs 未陈旧、control 引用有效；
- 62/62 独立入口冒烟，且 Catalog 学习切换不重载 runtime；
- 62/62 至少桌面与窄屏视觉证据；高风险样本另有 1024×768、键盘/触控/reduced-motion 证据；
- 通用 renderer、manifest 扩展和教程资源格式有架构说明，并证明 Protocol v1 兼容与 category/renderer 开放性。

在上述证据未齐前，“测试通过”只能说明被覆盖路径通过，不能据此裁决全量完成。
