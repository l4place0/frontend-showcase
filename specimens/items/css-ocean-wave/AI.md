# CSS 海浪动画 · CSS Ocean Wave — AI Reproduction Guide

## Objective

制作一件只依靠 HTML、CSS 与少量状态脚本运行的海浪动画。同一构图同时包含清透白昼海与深夜月光海，并由单个“黑夜模式”布尔开关平滑切换，不能维护两套页面。动画另有与昼夜正交的 `idle / active` 两态状态机，用于统一控制海浪区基准线和场景运动速度。

## Visual Identity

- 日间：通透青蓝天空、柔和日轮、浅青远海与逐层加深的近海。
- 夜间：深靛天空、弦月、稀疏星光、月光反射与低饱和蓝色海面。
- 整体克制、清澈，避免卡通描边、照片纹理与高饱和霓虹。

## Structure

场景由天空、天体、云层、光路、地平线、三层自带白色浪冠的海浪及轻量信息标识组成。昼夜共享所有 DOM 节点，仅通过根节点的 `data-night-mode` 属性替换 CSS 变量与状态。

## Design Tokens

- `--sky-top` / `--sky-bottom`：天空渐变的上下端颜色。
- `--far-sea` / `--mid-sea` / `--near-sea`：远、中、近三层海浪颜色；`--deep-sea` 仅作为页面后备底色。
- `--sun` / `--sun-glow`：日轮与月轮共用的天体颜色和光晕。
- `--wave-height`：协议可调的各层浪形高度基准。
- `--sea-top`：状态机控制的整个海浪区顶部基准线；闲置时下沉，激活时上升。
- `--wave-speed` / `--celestial-speed` / `--cloud-speed` / `--star-speed`：由动画状态机统一切换的运动周期。
- `--ease-scene`：昼夜过渡使用的非线性缓动。

## Components

核心组件包括场景标题、昼夜模式开关、共享日月天体、星点层、云层、月光路径、地平线标记，以及自身叠加白色浪冠的三层波浪。

## Interaction

画面内按钮与 Catalog 的 `nightMode` 控制都写入根节点 `data-night-mode`。动画状态按钮与 Catalog 的 `animationState` 控制写入 `data-animation-state`。状态机只接受 `idle` 和 `active`，切换时同时更新海浪区基准线与场景速度；两个内部按钮都会在属性变化后同步 `aria-pressed` 与动态可访问名称。

## Motion

- 三层波浪使用不同周期、相位与方向的 CSS keyframes，形成视差。
- 天体轻微漂浮，云层缓慢横移，星光只在夜间显现。
- 昼夜色彩与月相遮罩使用非线性过渡，不重载页面，也不中断波浪运动。
- 支持 `prefers-reduced-motion`、Catalog 暂停消息与 `--specimen-play-state`。

## Controls

- `nightMode`：黑夜模式；写入 `data-night-mode`。
- `waveHeight`：浪高基准；写入 `--wave-height`，用于手动微调各层浪形高度，不替代状态机控制的整体基准线升降。
- `animationState`：`idle` 使用最低速度并将海浪区基准线降至 `58%`，`active` 使用最高速度并将基准线升至 `44%`；写入 `data-animation-state`。整体升降使用 1.35 秒 `cubic-bezier(.22,1,.36,1)` 过渡。
- `foam`：浪花高光；写入 `data-foam`。

## Responsive Behavior

桌面保留标题、经纬度标线和完整昼夜开关标签；海浪区基准线在 `idle / active` 间使用 `58% → 44%`。窄屏压缩文字标识但保留昼夜与动画状态按钮、天体、地平线及三层海浪，并将基准线范围调整为 `54% → 40%`。任何尺寸下均不可横向溢出。

## Accessibility

昼夜与动画状态按钮都使用原生 `button`、同步 `aria-pressed`，并提供说明下一切换目标的动态可访问名称。动画装饰从辅助技术隐藏，主场景具有中文标签。

## Implementation Constraints

- 独立运行，不读取 Catalog DOM、React Context 或宿主 CSS。
- 本地资源且运行时零网络请求。
- 不使用 Canvas、WebGL、SVG 或位图模拟波浪；主要视觉由 CSS 渐变、圆角和变换完成。
- 保持一份昼夜共享结构，不复制整个场景。

## Avoid

- 不将日间和夜间拆为两个页面或两套重复 DOM。
- 不使用生硬闪切替代连续主题过渡。
- 不让所有波层共享完全相同的周期、相位和方向。
- 不使用远程图片、字体、脚本或运行时 API。

## Source Reference

- 独立入口：`./index.html`
- 样式与动画：`./styles.css`
- 昼夜按钮同步与动画状态机：`./app.js`
- 结构化清单：`./specimen.json`
