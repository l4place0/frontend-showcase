# CI/CD v1 目标架构

状态：**已实现并完成首次生产验收；持续采用远端门禁、deployment 和 smoke 作为采用证据**。

## 1. 选择的产品模型

v1 采用“单 workflow、同一 run 内分层验证与 artifact promotion”模型。

```text
source event
  → release policy
  → build once
  → immutable artifact
  → independent quality layers
  → quality gate
  → main-only Pages packaging
  → protected deploy
  → production smoke
```

MVP 使用 `.github/workflows/ci.yml` 统一编排，不立即引入 reusable workflow、跨 run promotion 或自动 AI 修复。

## 2. 触发矩阵

| 事件 | 目的 | 完整质量门禁 | 部署 |
| --- | --- | ---: | ---: |
| PR → `dev` | 功能是否可进入集成分支 | 是 | 否 |
| push `dev` | 准确的集成 commit 是否健康 | 是 | 否 |
| PR `dev` → `main` | 集成版本是否具备生产资格 | 是 | 否 |
| push `main` | 为准确生产 SHA 构建、验证和发布 | 是 | 是 |
| `workflow_dispatch` on main | 手动启动完整生产流水线 | 是 | 可部署 |

不为 feature push 额外运行一套重复 CI；PR synchronize 已覆盖新 commit。MVP 不使用 path filters，以免漏掉共享构建、Catalog、bridge、iframe 或生成器的间接影响。

## 3. Job DAG

### release-policy

- 对 PR → `main` 验证 `head=dev`、`base=main`。
- 对其他受支持事件输出成功但不改变其语义。
- 不授予写权限。

### build

- Checkout 精确事件 SHA。
- Node 22、npm cache、`npm ci`。
- 只执行一次 `npm run build`。
- 生成 artifact manifest。
- 立即上传普通 build artifact。
- 输出 artifact name、upload digest、dist digest 和大小。

### component

- 独立 checkout 与 `npm ci`。
- 不需要下载 `dist`。
- 运行 7 个 component tests。
- 上传 report/trace/screenshot。

### e2e

- `needs: build`。
- 下载并校验普通 build artifact。
- 启动只服务 `dist` 的 preview server，不运行 build。
- 运行剥离 WebGL 后的普通 E2E。
- 初始 2 workers。

### webgl

- `needs: build`。
- 下载同一 build artifact。
- 专用 Playwright project。
- 1 worker、非 fully-parallel、隔离 retry。
- 任何 flaky 使 job 失败。
- 收集完整图形、焦点、iframe 和 readiness 证据。

### visual

- `needs: build`。
- 下载同一 build artifact。
- 固定 Linux/Chromium/viewport/device scale/color scheme/seed/time。
- 每次 PR 都作为 required layer。

### quality-gate

- 使用稳定 check 名称 `CI / quality-gate`。
- 依赖 release-policy、build、component、e2e、webgl、visual。
- 必须显式检查所有依赖结果；failure、cancelled、意外 skipped 或缺失均不得被误判为成功。
- 不重新执行测试。

### diagnostic-finalizer

- 在 run 未被主动取消时执行。
- 汇总各 job 的报告和结构化结果。
- 上传 `ci-diagnostics-<SHA>-attempt-<N>`。
- 诊断/成本采集失败发出 warning，但不覆盖真实质量结果。
- Artifact identity 或 digest 验证不属于可选 telemetry，仍由强制层失败。

### package-pages

仅在以下条件全部成立时运行：

```text
event 是 push main 或受控的 main workflow_dispatch
quality-gate success
artifact commit == github.sha
artifact dist digest == manifest
```

它只下载、校验和封装，不重新 build。是否仍为最新 `main` 的 freshness check 在 deployment concurrency 锁内执行，避免检查后等待期间产生竞态。

### deploy

- `needs: package-pages`。
- `environment: github-pages`。
- 仅此 job 获得 `pages: write`、`id-token: write`。
- 固定 deployment concurrency group，不中断正在执行的部署。

### smoke

部署后轻量检查：

- 首页可访问。
- `specimens.json` 可读取且包含 62 项。
- 代表性 item URL 可访问。
- `AI.md`、`ai-context.json`、`learning.json` 可访问。
- 线上发布身份与 manifest 一致。

Smoke 不重新运行完整 WebGL suite。

## 4. Artifact 模型

普通 Actions artifact：

```text
site-<SHA>-attempt-<run-attempt>/
├── dist/
└── artifact-manifest.json
```

Manifest 最低字段：

```json
{
  "schemaVersion": 1,
  "commit": "full SHA",
  "runId": "GitHub run id",
  "runAttempt": 1,
  "nodeVersion": "22.x",
  "lockfileDigest": "sha256:...",
  "distDigest": "sha256:..."
}
```

Artifact 状态变化：

```text
built candidate
  → quality verified
  → production eligible
  → Pages packaged
  → deployed
```

状态变化不能修改 `dist` 内容。Pages artifact 是 verified generic artifact 的部署封装，不是新的项目构建。

## 5. 测试执行接口

目标 npm scripts：

```text
test:unit
test:components
test:e2e:ordinary
test:webgl
test:visual
ci:diagnose -- --run <run-id>
```

CI 必须能向 Playwright 提供已经启动的 artifact base URL，使 webServer 不再隐式执行 `npm run build`。本地仍可保留便利的 build + preview 模式，但 CI 路径必须可审计且无重建。

## 6. 权限模型

Workflow 默认：

```text
contents: read
```

Build/test/package 不获得：

```text
contents: write
pull-requests: write
actions: write
pages: write
id-token: write
```

Deploy 才获得：

```text
contents: read
pages: write
id-token: write
```

PR 使用 `pull_request`，不使用权限风险更高的 `pull_request_target`。Checkout 使用的 workflow token 仍受只读 `contents` 权限约束，测试或 Agent 不具备可推送凭据。

## 7. Concurrency

| 场景 | Group | `cancel-in-progress` |
| --- | --- | ---: |
| PR → `dev` | `ci-pr-<number>` | true |
| push `dev` | `ci-dev` | true |
| release PR | `ci-release-<number>` | true |
| main production pipeline | `ci-main` | MVP 串行 |
| Pages deployment | `github-pages-production` | false |
| nightly WebGL | `nightly-webgl` | true |

Deploy 获得 concurrency 锁后再次确认 artifact SHA 是否仍为最新 main。过期候选跳过部署；回滚必须由明确的 revert/promotion 操作完成。

## 8. 为什么 MVP 不使用 reusable workflow

当前只有一条主要产品流水线。单 workflow 具有：

- 同一 run artifact 来源清晰；
- required check 名称稳定；
- 权限流容易审计；
- 失败定位层级少。

当 nightly、跨 run promotion、历史回滚或多仓库复用成为真实需求时，再把质量层抽取为 `workflow_call`。
