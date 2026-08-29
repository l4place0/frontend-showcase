# 运行时与协议边界

状态：**LIVE**

## 1. 两个运行时

Catalog 和每件 Specimen 是不同的安全与生命周期边界。Catalog 可以选择 URL、传递 manifest controls、暂停或恢复 item，但不能读取或依赖 item 的内部组件树作为产品实现手段。

Specimen 必须在自己的 `index.html` 中完成渲染，并允许独立 URL 被人类或 AI 直接访问。

## 2. iframe 安全模型

权限由 manifest runtime 字段映射到浏览器能力。`scripts`、`forms`、`downloads` 和 `pointerLock` 分别映射为 sandbox token；fullscreen 通过 iframe allow 属性单独声明。没有声明的能力不开放。

`allow-same-origin` 永不加入 item frame。其代价是 sandbox 文档拥有 opaque origin，因此需要依赖本地模块图的生产 item 应在构建时打包为普通浏览器脚本，不能依赖 iframe 内的运行时 ES module fetch。

## 3. Specimen Protocol v1

Catalog 在 iframe load 后创建 MessageChannel，并发送 `specimen:init`。桥接层负责：

- 应用默认 controls 与 Catalog controls；
- 接收 reset、pause、resume 和 visibility；
- 回传 controls-applied、paused、resumed 与 protocol error；
- 在 bridge 建立后回传 `specimen:ready`。

Viewer 对握手设置 5 秒超时。协议版本不支持或 item 主动报告错误时进入 error 状态；iframe reload 会关闭旧 port 并重新握手。

Manifest controls 如果需要自动映射，必须声明受支持的 target。没有 target 的应用语义控制必须由 item 显式消费，不能只在 Catalog 中展示一个无效表单。

## 4. Bridge ready 与 application ready

```text
iframe document loaded
  -> bridge ready
  -> item application initialized
  -> first meaningful frame rendered
  -> application ready
```

这四个状态不能互相替代。通用 viewer 状态当前只覆盖 bridge ready；Canvas、WebGL、媒体和复杂状态机必须提供可观察的 application readiness，并由 hosted E2E 验证。

## 5. 独立性验收

每件生产 item 至少满足：

- 独立 URL 可加载；
- 不请求运行时 CDN；
- 不依赖 Catalog DOM、React context 或 CSS；
- iframe sandbox 不包含 `allow-same-origin`；
- declared controls 在 Catalog-hosted 路径真实生效；
- reduced motion 和 lifecycle 能停止适用的持续动画；
- `specimen.json`、`AI.md`、`ai-context.json`、`learning.json` 可发现。

## 6. Control 映射

Protocol v1 支持 `range`、`number`、`color`、`boolean`、`select`、`text`、`button` 和 `vector2`。共享 portfolio bridge 可以把声明了 target 的值映射到 CSS variable 或 data attribute；复杂应用语义必须由 item 自己消费消息。

Catalog 出现 control 并不能证明 control 有效。验收必须观察 item 行为或渲染结果，而不是只断言表单值变化。
