# 展品学习教程第四轮独立裁决

日期：2026-08-15  
范围：第四、第五批 20 件高定教程静态真实性与场景复核  
运行底证：Round 3 全 62 件 learning renderer E2E 绿色；本轮不把该底证当作逐件视觉或原生实验通过

## 总裁决

本轮 20 件均已形成 item-specific 教程，静态裁决为 **0 PASS / 20 REVISE / 0 FAIL**。

- `node scripts/validate-source.mjs`：62/62 PASS。
- `npm run typecheck`：PASS。
- 20 件均有独特学习目标、核心机制、源码 snippet、因果实验、scene、测验与完成标准，没有发现脚手架复用。
- 初审发现 Pixel `pixblink` 与 Y2K `y2ksparkle` 缺少 reduced-motion 收束。实现方已补作者源并同步教程的原理、实验、测验、错误、完成标准和 digest；复判后由 FAIL 候选升为 REVISE。
- 仍不授予 PASS：本批没有逐件标注视觉、移动、键盘、触控与 reduced-motion 运行证据。

## 1. 逐件裁决

| item | 静态真实性 | 裁决 | PASS 前仍缺 |
| --- | --- | --- | --- |
| sunset | 两层底部径向光、118% 圆心、标题渐变与胶囊语法对应 | REVISE | 暗背景折线可见性、低对比和移动实测 |
| swiss | 零圆角、粗栏线、稀缺红标与无阴影层级对应 | REVISE | 大字/紧行高溢出、focus 与移动导航 |
| pixel | 扫描线、硬影、steps(2)、离散技能条对应；reduced-motion 已修并同步 | REVISE | reduced-motion 运行截图、闪烁停止与静态像素身份实测 |
| editorial | 粗衬线、规则线、双线特稿与透明表面对应 | REVISE | 大字号换行、长文阅读和标注落点 |
| vaporwave | 下部 mask 网格、44px 周期和三色渐变对应 | REVISE | 小屏 mask、霓虹对比与背景折线可见性 |
| zen | 12px 字距、52px 墨线、隐藏 tag 与朱砂短线对应 | REVISE | 1px 线对比、中文换行与键盘焦点 |
| popart | 24px 波点、7px 硬影、原色与斜纹技能条对应 | REVISE | 高对比、触控/focus 反馈与小屏密度 |
| chalkboard | 7px 粉尘、虚线、模糊字迹和斜纹粉笔条对应 | REVISE | 低对比可读性、模糊文本与移动渲染 |
| memphis | 四层不同周期几何、交替圆角与撞色硬影对应 | REVISE | 高密度背景下标注线、focus 与 reduced-motion 底证 |
| midnight | 2.8%/6% 表面、12% 边框与集中电蓝对应 | REVISE | 暗部对比、焦点可见性与折线轮廓实测 |
| monochrome | 灰阶、字距和边框替代色相分组，hue 不变量实验合理 | REVISE | 非色彩层级、强制颜色模式与移动实测 |
| parchment | 双周期纸斑、边缘暗化、红章和首字下沉对应 | REVISE | 纸纹下正文对比、长文与小屏实测 |
| bauhaus | 红圆/黄线/蓝圆不对称配重与组件几何复用对应 | REVISE | 高饱和可读性、标注共视与焦点态 |
| y2k | 六星点透明度呼吸、蓝粉裁字与三层按钮光影对应；reduced-motion 已修并同步 | REVISE | 星点冻结、玻璃降级、移动性能和对比 |
| clay | 亮边/暗边/宽外影的软体厚度与珊瑚按钮对应 | REVISE | 低反差文字、focus/active 与高对比塑料化边界 |
| candy | 四团椭圆光、粉蓝主味与四色循环配料对应 | REVISE | 马卡龙低对比、显式胶囊/变量圆角差和移动实测 |
| layout-side-nav | 901px 以上 210px 侧轨与 hero/section/footer 同步偏移对应 | REVISE | 900px 断点、移动导航替代、键盘顺序与固定轨滚动 |
| layout-hero-full | 100vh、11vw clamp 标题和底部提示对应；reduced-motion 已声明 | REVISE | 常见视口高度、提示可访问语义、reduced-motion 实测 |
| layout-timeline | main 单一母线、section 空心节点和 counter 编号对应；scroll scene 合理 | REVISE | y=760 两锚点共视、编号读屏语义和长内容连续性 |
| layout-centered | 头像 order、纵向中轴、720px 阅读带与单列内部布局对应 | REVISE | order 的读屏/视觉顺序差、窄屏和长内容实测 |

## 2. 内容与实验复判

### 通过静态真实性门槛

1. 所有 code snippet 均由 source validator 以 item ownership、digest 与 exact snippet 复核。
2. 实验使用 manifest 中真实 control 值，且都描述了明确不变量；布局类实验能区分外层布局与内部密度。
3. quiz 正确位置有分散，不再是脚手架固定答案；题目直接询问展品机制。
4. scene 均声明 viewport/screen/scroll。本批仅 timeline 使用非零 y=760，两个锚点都针对同一正文母线场景，静态上可共视。
5. Pixel/Y2K 的 reduced-motion 内容已从“记录缺口”收敛为“停止运动、保留静态身份”，与当前作者源一致。

### 仍需运行证明

1. 主题在复杂、低对比或同色背景下，标注的双层折线是否始终可辨。
2. 说明文本是否以中部锚定折线末端并避免大偏移；百分比 scene 只能提供候选位置。
3. native reduced-motion 实验是否真实停止 item 主题动画，而不仅是学习外壳过渡。
4. `layout-side-nav` 在小于 901px 后的导航可达性；共享 base 当前隐藏 `.nav-links`，需确认是否有等价入口。
5. `layout-centered` 的 CSS `order` 是否造成视觉顺序与读屏顺序认知差异。
6. `layout-hero-full` 的伪元素“向下滚动”提示是否需要可访问文本，而不只是视觉装饰。

## 3. Round 5 前阻断项

- 本批无静态内容 FAIL，可进入逐件运行审查。
- Pixel/Y2K 必须保留 reduced-motion 回归测试，避免源码与教程再次漂移。
- 20 件矩阵的 desktop 只记为全量 renderer 底证，不标记视觉 PASS；mobile/keyboard/reduced-motion 仍保留 `UNVERIFIED` 或 `PASS_STATIC_SOURCE`。
- 自动化下一步应按明暗/高纹理/布局滚动分层抽样，而不是只复用 CSS ocean。

结论：**20 件内容静态合格，最终 0 PASS / 20 REVISE / 0 FAIL。**
