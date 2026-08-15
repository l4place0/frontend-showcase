# Prototype Record

## Changes from parent

首次原型，无父版本。新增 `time-gallery-webgl` 静态 Specimen、54 幅离线作品资产、Commons 资产生成脚本、构建期 Three.js/JSON/JPEG 单包适配器、Catalog 注册与专用 E2E 流程测试；没有修改既有 Specimen 运行时行为。

## Assumptions

- 一个统一的万神殿式圆厅足以验证 WebGL 展区的空间表现，时期差异主要由策展内容表达。
- Commons 的 `Public domain` 授权字段、description URL 与作者元数据可作为本次离线素材的可审计依据。
- 原型阶段的中文作品标题采用“画家作品 时期-序号”，英文原始文件标题和 Commons 署名同时保留，避免虚构尚未可靠翻译的正式中文馆藏名。
- 自动化环境可使用较低像素比执行完整后处理管线，人工截图使用正常视口验证视觉质量。

## Evidence

- `npm run build` 通过：61 个 Specimen 的类型检查、单测、源验证、生成、Vite 构建与产物验证全部成功。
- `npm run test:components`：6/6 通过。
- `npm run test:e2e`：8/8 通过，包含专用的完整流程、A/← 左移、D/→ 右移、54 幅数据、唯一详情、Esc 关闭、零外部请求和零 console error 断言。
- 视觉证据：欢迎页、完整树、悬停卡、最终圆厅和详情面板五张 PNG；最终圆厅可见大理石、拱券、真实照明、阴影与地板反射，未见大块纯黑空洞。
- `assets/artworks.json` 与 54 个本地 JPEG 一一对应；9 个时期、30 位实际入展画家、54 幅作品，授权均为 Public domain。

## Findings

- 设计假设成立：同一独立运行时可以把编辑式欢迎页、信息树与实时 3D 场景串成清晰闭环。
- 默认拒绝且无 `allow-same-origin` 的 iframe 会让外链 ES Module、JSON fetch 和 WebGL 图片纹理读取受到不透明源 CORS 限制；构建期打包脚本、JSON 和 base64 JPEG 能保持隔离规则同时实现真正零请求运行。
- 基于原始图像宽高生成几何能自然呈现横、竖、方形作品；详情中的 `object-fit: contain` 保持原图比例。
- Commons 搜索需同时校验作者元数据，单凭标题关键词会误纳“标题提到画家”的他人作品；资产脚本已经收紧并保留原始 attribution。

## Known gaps

- 中文作品标题目前是可靠但概括性的本地展签名，不等同于博物馆正式中文译名；英文原始文件标题和来源页仍完整保留。
- 圆厅以桌面键鼠为主要目标，窄屏提供阅读与 UI 重排，但没有实现触控摇杆。
- 浏览器不支持 WebGL 时有回退提示；该失败场景以代码路径检查为主，没有在完整测试套件中模拟 GPU 被禁用。

## Recommendation

将该原型生产化为 WebGL 展区的首个代表性 Specimen。当前已满足独立运行、离线、内容规模与完整交互验收；后续若继续扩展，优先补充策展审核过的正式中文作品译名和移动端触控漫游，而不改变已验证的隔离打包架构。
