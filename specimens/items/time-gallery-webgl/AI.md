# 时光画廊 · Time Gallery — AI Reproduction Guide

## Objective

从零实现一个纯浏览器单机的中文沉浸式西方艺术史科普游戏。核心流程必须是：欢迎页 → 树状时间轴 → 第一人称 3D 画廊 → 画作详情 → 返回时间轴。

## Content

- 只收录西方艺术史，按时间顺序覆盖不少于 8 个时期、20 位画家和 50 幅真实作品。
- 图像必须来自 Public Domain 或 CC0 馆藏，本地内置；运行时不能请求网络。
- 每条记录保留作品名称、作者双语名、生卒年、年代、时期、来源页面与授权说明。

## Visual Identity

- 欢迎页用奶油纸色、钴蓝拱门、穿插细线和涂鸦色块形成简洁而有触感的编辑构图。标题、副标题和 CTA 位于拱门上方，标题使用粗体。
- 时间轴不是直线列表，而是一棵横向生长的艺术史树；时期是可点击节点，画家名是不可点击的装饰枝叶。悬停时只出现一张包含真实代表作的详情卡。
- 画廊采用万神殿式圆厅：暖白大理石、穹顶天窗、拱券、藻井、齿饰、壁柱与线脚，氛围庄严神圣。

## Design Tokens

- `--paper: #f1ecdf`：欢迎页与时间轴的纸张底色。
- `--ink: #172537`：深蓝墨色。
- `--blue: #1759b8`：拱门与主视觉钴蓝。
- `--coral: #df6f54`：CTA 与节点强调色。
- `--ease-out: cubic-bezier(.16, 1, .3, 1)`：主要非线性转场。

## Structure

保持四个互斥界面状态：welcome、timeline、gallery、art-detail。详情是覆盖在 gallery 上方的唯一 dialog，不创建嵌套弹窗。

## Components

核心组件包括欢迎页 CTA、时期节点、装饰性画家分支、悬停预览卡、画廊 HUD、准星、交互提示、3D 画框与单例详情面板。

## Rendering

- 使用 Three.js 本地模块；PBR 材质、真实 Point/Spot/Hemisphere 光源、软阴影、反射地板、SSAO、Unreal Bloom 与 ACES 色调映射。
- 光源必须由灯光对象产生，不能把明暗贴图画在墙面上冒充照明。
- 天窗内始终看得到渐变天空与太阳盘，拱门和建筑开口必须有材质或可见空间，不能出现大块纯黑。
- 画作几何尺寸由每张本地图片的真实宽高比决定，材质使用 sRGB 纹理，不拉伸。

## Interaction

- WASD 与方向键移动；A/← 向左，D/→ 向右。鼠标在用户点击空白处后尝试进入 Pointer Lock；宿主拒绝时自动切换为按住左键拖动转向。
- 射线检测附近画作；点击或按 E 打开详情。详情为单例近全屏面板，四周约 24px 留出画廊，Esc 关闭，快速连按 E 不叠加。
- 所有按钮没有黑色边框，hover/press、页面转场、树展开和面板开合均使用非线性动画。
- 支持 `prefers-reduced-motion` 和 Catalog MessageChannel 暂停状态。

## Motion

树枝使用路径绘制动画，节点以分段延迟和弹性缓动展开；页面、菜单、提示和详情面板均使用非线性缓动。减少动态偏好下把持续时间压缩到近零。

## Responsive Behavior

桌面以完整横向时间树和第一人称圆厅为主；窄屏时间轴允许水平浏览，画作详情切为上图下文，HUD 压缩但保留返回与移动提示。

## Accessibility

所有时期节点和按钮可键盘聚焦，有可见焦点环和中文可访问名称；详情使用 `role=dialog`、`aria-modal=true`，图片有作品与作者替代文本。核心流程不只依赖 hover。

## Offline and Isolation

- 项目必须在 iframe 与直接静态访问两种模式独立工作，不读取 Catalog DOM、React context 或宿主 CSS。
- 所有脚本、字体替代、JSON 与图片均位于项目目录，运行时零 CDN/API/远程字体依赖。
- 来源与授权总表位于 `assets/artworks.json`，画作原图位于 `assets/artworks/`。

## Implementation Constraints

- 不使用后端、远程脚本、远程字体、运行时 API 或 CDN。
- 不读取 Catalog DOM、React context 或全局 CSS。
- 不添加 `allow-same-origin`，Pointer Lock 权限由 manifest 声明。
- 作品纹理的几何比例必须来自本地图像宽高字段。

## Avoid

- 不用发光贴图冒充真实光源，不用纯黑平面充当门洞或天空。
- 不把横画或方画塞进统一竖框，不允许详情面板叠加。
- 不把画家分支做成链接，不在时期详情卡放“进入画廊”按钮。

## Source Reference

- 独立入口：`./index.html`
- 场景与交互：`./app.js`
- 样式与动效：`./styles.css`
- 画作来源与授权清单：`./assets/artworks.json`
