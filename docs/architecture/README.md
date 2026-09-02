# Frontend Showcase 当前架构基线

状态：**LIVE**
整理日期：2026-08-29

## 1. 系统定义

Frontend Showcase 不是把示例组件直接渲染进 React 页面，而是由一个 Catalog 应用承载多个独立 Web 文档。Catalog 提供发现、导航、控制、学习和 AI 入口；Specimen 自己拥有文档、样式、脚本与资源，并通过沙箱 iframe 接入 Catalog。

这条边界同时服务三个目标：展品可独立分享，Catalog 不会被展品样式或脚本污染，生产产物可被浏览器与 AI 从稳定 URL 发现。

产品承诺见[产品 v1](../product/README.md)，工程执行方式见[工作流 v1](../workflows/v1/README.md)。

## 2. 系统拓扑

```text
Git author sources
  |- src/                         Catalog 与共享 portfolio author source
  |- specimens/catalog.mjs       馆藏源注册表
  |- specimens/items/            自包含复杂展品
  |- specimens/learning/items/   一件一份学习契约
  `- scripts/                     生成、校验与交付适配器
          |
          v
generated public surface
  |- Catalog SPA
  |- specimens.json + llms.txt
  `- items/<id>/
       |- index.html + local assets
       |- specimen.json
       |- learning.json
       |- AI.md
       `- ai-context.json
          |
          v
React Catalog ---- MessageChannel ---- sandboxed Specimen document
```

## 3. 不可跨越的边界

1. `src/`、`specimens/` 与 `scripts/` 是作者源码；`.generated/` 和 `dist/` 只能由命令生成。
2. Catalog 与 Specimen 不共享 DOM、React context 或全局 CSS。
3. Catalog 只根据公开 manifest 和 MessageChannel 协议控制 item，不读取 item 内部实现。
4. iframe 权限由 `runtime` 声明映射，默认拒绝，永不添加 `allow-same-origin`。
5. 生产 Specimen 不依赖运行时 CDN、远程字体或远程核心媒体。
6. `category` 与 `renderer` 是开放字符串；当前 UI 分类不是协议枚举。
7. `.prototype-engineering/` 是 Git 内的原型谱系，不进入站点产物。

## 4. 源头责任

| 事实 | 唯一来源 | 派生产物或消费者 |
| --- | --- | --- |
| 馆藏身份、分类、runtime、controls | `specimens/catalog.mjs` | `specimens.json`、item manifest、Catalog |
| Manifest 结构边界 | `specimens/specimen.schema.json` | source/dist validation |
| 学习内容 | `specimens/learning/items/<id>.json` | `learning.json`、Catalog learning workspace |
| 学习结构边界 | `specimens/learning.schema.json` | source/dist validation |
| Catalog 行为 | `src/` | Vite SPA |
| Portfolio 样式与布局作者源码 | `src/themes/`、`src/layouts/`、共享 fixture | 60 个生成 item |
| 复杂 item 作者源码 | `specimens/items/<id>/` | 4 个静态 item 目录 |
| CI 与发布语义 | `.github/workflows/ci.yml`、`scripts/ci/` | immutable artifact、Pages deployment |

文档解释这些来源如何协作，但不复制所有可执行字段或馆藏清单。

## 5. 架构导航

- [Catalog runtime](./catalog-runtime.md)：路由、数据加载、viewer 与持久状态。
- [运行时与协议边界](./runtime-boundaries.md)：iframe 安全、握手、控制和生命周期。
- [内容、学习与 AI](./content-learning-and-ai.md)：四类作者源码如何形成面向人类和机器的公开资源。
- [构建与交付](./build-and-delivery.md)：生成图、artifact、测试分层和部署身份。
- [当前架构决策](./decisions.md)：稳定决策、禁止方案与变更门槛。

## 6. 当前风险

`specimen:ready` 目前表示协议桥已连接，不等于复杂应用已经完成 Canvas/WebGL 初始化或首个有效帧。复杂 item 必须另有可观察状态并通过 hosted E2E 证明。Gargantua 的开发态沙箱 ES module 加载问题仍属于独立运行时缺陷；生产构建专项测试当前通过。
