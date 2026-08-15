# Repository Map

## Runtime and commands

- Node.js 20+、Vite 7、React 19；Specimen 自身是构建后可直接由静态服务器加载的独立 HTML 运行时。
- `npm run dev` 生成目录后启动 Vite；`npm run build` 依次执行类型检查、单元测试、源验证、Specimen 生成、Catalog 构建和产物验证。
- 相关验证命令：`npm run test:components`、`npm run test:e2e`、`npm run test:visual`。

## Relevant architecture

- `specimens/catalog.mjs` 是 Specimen Protocol v1 的源注册表；`staticItems` 是自包含实验的扩展点。
- `specimens/items/<id>/` 可拥有完整的 `index.html`、`AI.md`、脚本、样式和本地 assets；`scripts/build-specimens.mjs` 将目录复制到 `.generated/public/items/<id>` 并注入发现链接与 MessageChannel bridge。
- React Catalog 仅消费生成的 `specimens.json`，通过 `SpecimenViewer` 中的隔离 iframe 展示项目。项目不得依赖 Catalog DOM、React context 或全局 CSS。
- `.generated/` 和 `dist/` 是派生产物，不是编辑目标。

## Existing design and implementation patterns

- 清单采用开放字符串 `category`/`renderer`，运行时权限由 `runtime` 布尔字段声明，iframe 默认拒绝未声明权限且不使用 `allow-same-origin`。
- 所有生产 Specimen 必须包含 `specimen.json`、`AI.md` 和生成的 `ai-context.json`；静态展品由构建脚本生成后两者。
- Catalog 到项目的控制和生命周期事件统一经过 `specimens/shared/portfolio/bridge.js` 的 MessageChannel 通道。
- 现有 60 个样品复用 portfolio fixture；本原型将使用预留的 static renderer，避免污染既有主题/布局体系。

## Data and integration boundaries

- 生产运行必须零外部请求；Three.js 运行时代码、画作图像、艺术史数据和来源授权元数据全部进入项目目录。
- Wikimedia Commons API 仅在开发时用于筛选并下载授权标记为 Public domain 或 CC0 的图像；运行时不调用 API。
- 浏览器本地能力（WebGL2/WebGL、Pointer Lock、MessageChannel）通过特性检测和确定性回退处理。

## Verification tools

- Vitest 用于纯逻辑/URL 单测，Playwright Component Test 检查 Catalog 组件，Playwright E2E 检查隔离和 AI 资源。
- Playwright visual project 可进行代表性截图；本原型还需要离线请求审计、控制台错误捕获、画作比例检查和端到端流程脚本。
- `scripts/validate-source.mjs` 校验协议和静态源文件，`scripts/validate-dist.mjs` 校验构建产物。
