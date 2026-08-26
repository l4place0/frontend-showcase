# Schwarzschild 光线实验室

## Objective

这是一个可运行的图形学教材，不是参数面板或电影特效演示。用户沿六个章节，从三维空间中的一条射线开始，推广到像素射线束，再对比同一初始条件下的欧氏直线与 Schwarzschild 零测地线，最终理解一个 Fragment Shader 像素。

## Visual Identity

深黑画布、暖白教材排版和克制的橙色数学标记。天球经纬网格承担视觉对照，不使用装饰性特效掩盖物理结构。

## Design Tokens

- 背景：`#060606`
- 正文：`#f2eee6`
- 次要文字：`#aaa6a0`
- 数学强调：`#c88b4c`
- 诊断蓝：`#081c40`

## Structure

全屏 Canvas 是唯一渲染层：前三课显示普通 Three.js 三维教学场景，后三课显示全屏 Fragment Shader。左侧教材一次只显示一个章节；顶部标识、底部图例和章节导航是轻量 HTML 覆盖层。

## Components

- 全屏 WebGL Canvas
- 六个互斥的课程章节
- `01–06` 章节导航与上一步/下一步
- 当前观察模式图例
- WebGL 初始化与上下文丢失提示

## 学习路径

1. **三维空间**：辨认世界原点、相机、成像平面和一条参数射线。
2. **像素射线束**：让成像平面上的每个采样点产生不同世界空间方向。
3. **单条弯曲光线**：保持起点与初始方向相同，对比欧氏直线与真实 RK4 零测地线。
4. **捕获与阴影**：把同一积分推广到所有像素；进入事件视界的方向写黑，逃逸方向采样天空。
5. **临界光线**：用有效势推导 `r_ph = 1.5rₛ` 与 `b_c = 3√3rₛ/2`，观察捕获/逃逸分界。
6. **像素成像**：捕获光线写黑色，逃逸光线采样星空，赤道面穿越累积盘面辐射。

课程状态由 JavaScript 的 `stage` 控制；只有后三课会映射到 Shader 的 `uStage`：

- Stage 0：普通 Three.js 场景中的一条射线。
- Stage 1：普通 Three.js 场景中的 `7 × 5` 条像素射线样本。
- Stage 2：在三维轨道平面中对比直线与单条 Schwarzschild 零测地线。
- Stage 3：逐像素分类 `captured / escaped`，直接显示“被捕获方向的集合”所形成的阴影。
- Stage 4：比较 `b = |L|/E` 与临界值 `b_c`，并用 `x_img / y_img` 坐标轴及三条动态冲量参数参考圈展示屏幕投影。
- Stage 5：用相邻积分点的符号变化检测赤道面穿越，在交点分别求值粒子的 HDR 核心和低透明辉光；粒子按 `ω ∝ r^-3/2` 运动，盘面不设外半径。远端通过半径相关 LOD 放大粒子采样足迹，并将亚像素粒子群折算为极弱的平均辉光，避免漏采样形成断带。中央纯黑仍严格来自 `captured`；外缘辉线由 `b≈b_c` 与 `r_min≈1.5r_s` 生成。

## 数学模型

使用几何单位 `G = c = rₛ = 1`：

```text
f(r) = 1 - rₛ/r
ds² = -f dt² + dr²/f + r²dΩ²
```

光线满足 `ds² = 0`。Schwarzschild 时空球对称，所以每条测地线都位于一个穿过原点的二维平面。该平面上的 Hamiltonian 为：

```text
H = 1/2 (-pₜ²/f + f pᵣ² + L²/r²) = 0
```

`pₜ` 与 `L = pφ` 守恒，Shader 只需推进 `r`、`φ` 与 `pᵣ`。实现使用固定上限 176 步的 RK4。

## 图形学映射

```text
pixel → camera ray → local orbital plane → RK4 path
      → horizon / disk / sky decision → tone mapping → pixel
```

吸积盘不是圆环几何体。每个积分步检查世界坐标 `y` 是否变号；变号表示光线跨过赤道面。强偏折光线可多次穿越，因此高阶盘面像来自积分结果。

## Three.js 的职责

Three.js 负责：

- 创建 WebGL2 renderer；
- 在前三课绘制坐标轴、网格、光线相机、成像平面、射线束与单条积分轨迹；
- 绘制覆盖屏幕的单个三角形平面；
- 提供相机矩阵与 OrbitControls；
- 把相机基向量和章节编号传给 Shader。

场景中没有黑球、圆环、星空贴图或后处理链。只有第 6 步为展示盘面粒子的轨道运动而持续更新。

## 性能原则

第 1–5 步仅在章节、镜头或窗口尺寸变化时重绘；第 6 步以最高 24 FPS 更新运动粒子。没有 HDR RenderTarget、Bloom、动态湍流或 Retina 质量档。

桌面 DPR 上限为 1.35，移动端为 1。单帧复杂度仍近似 `O(width × height × 176)`；前五步静止时 GPU 占用接近零，最终成像则用 24 FPS 上限控制持续积分成本。

## Interaction

- 点击 `01–06` 或使用左右方向键切换章节。
- 拖动旋转，滚轮缩放。
- 按 `R` 或点击“重置观察”恢复相机。

## Motion

第 6 步用 `uTime` 驱动程序化盘面粒子绕黑洞运动，并以 24 FPS 为上限持续绘制。第 1–5 步保持按需绘制；OrbitControls 不启用阻尼。

## Responsive Behavior

桌面端教材位于左侧，画面重心留在右侧。760px 以下教材移动到底部，隐藏次要代码标签与图例，Canvas DPR 固定为 1。

## Accessibility

Canvas、章节区和课程导航均有可读标签；章节按钮提供 `aria-current`；键盘可用方向键、数字 `1–6` 与 `R` 完成全部操作；错误状态使用 `role=alert`。

## 自动化

使用 `?capture=1&stage=5&time=1000` 获取确定性最终画面。`capture=1` 和缩略图使用的 `testMode=1` 会把 `uTime` 固定到 `time` 参数并在首帧后停止动画，避免 Software WebGL 截图被持续积分阻塞。等待 `html[data-capture-ready="true"]`，然后调用：

```js
window.__GARGANTUA_CAPTURE__()
window.__GARGANTUA_SET_STATE__({ stage: 4 })
```

## 本地资源

- `index.html`：六步教材结构。
- `styles.css`：学习界面。
- `app.js`：Three.js 场景、相机、章节状态、前五步按需渲染与最终成像限帧动画。
- `shaders.js`：全部物理与像素成像。
- `vendor/`：本地 Three.js 与 OrbitControls。

## Implementation Constraints

- 原生 HTML/CSS/JavaScript 与 ES Modules。
- 运行时不访问网络。
- 主图像必须来自 Fragment Shader 中的零测地线积分。
- 不添加任意物理参数、质量配置、后处理选项或氛围功能。

## Avoid

- 不添加黑球、圆环几何、星空贴图或视频。
- 不恢复质量档、参数面板、Bloom、音乐或电影镜头；持续动画仅限第 6 步的教学粒子运动。
- 不把数学推导藏在抽象框架或外部依赖中。

## Source Reference

- 独立入口：`./index.html`
- Three.js 编排：`./app.js`
- 测地线与成像：`./shaders.js`
- 学习资源：`../../learning/items/gargantua-black-hole.json`
- 已知问题：`./KNOWN_ISSUES.md`（BH-001：远距离光带仍可能不自然消失，暂缓处理）
