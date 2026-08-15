# 当前状态与架构审计

本文记录 2026-08-15 的事实基线。它不是 v1 目标状态。

## 1. 仓库与发布背景

- `main` 是生产分支，远端基线为 `9a39d32c49b1fa4e3fdc4e4e11a74528968e4069`。
- `dev` 是唯一集成分支，设计工作起点为 `c5153cc8e81d0d7a537fa1125d5f4e6a0e13f3d2`。
- 功能开发从 `dev` 创建 `feature/*`，完成后合回 `dev`，验证后再由 `dev` 进入 `main`。
- 仓库发布 62 件独立 Specimen：30 visual-style、30 layout、1 CSS animation、1 WebGL。
- React Catalog 与每件 Specimen 是不同 runtime；item 不得依赖 Catalog DOM、React context 或全局 CSS。
- `dist/` 和 `.generated/` 是生成物，不提交 Git。
- `.prototype-engineering/` 必须保留在仓库历史中，但不得进入 `dist` 或 Pages。

## 2. 当前 workflows

### Verify museum

文件：`.github/workflows/verify.yml`

触发：

```text
push main
pull_request → main
```

执行：

```text
checkout
setup Node 22 + npm cache
setup Python 3.13
npm ci
npm run build
upload dist as a generic artifact
```

问题：

- 不覆盖 `dev` 或 PR → `dev`。
- Python setup 当前没有调用方。
- 上传的 artifact 不被 Deploy workflow 消费。
- job 名称为 build，但 `npm run build` 实际已经包含 typecheck、Vitest unit、source validation、generate、Vite build 和 dist validation；它不包含 Playwright component tests。

### Deploy GitHub Pages

文件：`.github/workflows/pages.yml`

触发：

```text
push main
workflow_dispatch
```

执行：

```text
npm ci
npm run build
install Chromium
npm run test:browser
configure Pages
upload Pages artifact
deploy
```

`test:browser` 又按顺序执行：

```text
component → E2E → visual
```

问题：

- E2E 失败后 visual 不运行。
- Pages artifact 只在所有浏览器命令成功后上传，失败时没有可部署或可复现的 build artifact。
- Playwright 生成的 trace、video、截图和 HTML report 没有上传步骤。
- Build、test 和 deploy 被合并在一个粗粒度 job 中，门禁和诊断不清晰。

## 3. 隐藏的四次构建

当前 `playwright.e2e.config.ts` 在没有 `PLAYWRIGHT_BASE_URL` 时使用：

```text
npm run build && vite preview
```

Deploy workflow 在 `test:e2e` 和 `test:visual` 之前又各启动一次该 webServer。因此一个 main push 最多产生：

```text
Verify workflow：npm run build                 1 次
Deploy workflow：显式 npm run build            1 次
E2E webServer：npm run build                   1 次
Visual webServer：npm run build                1 次
---------------------------------------------------
完整生产构建                                  4 次
```

这无法证明最终部署内容与所有测试看到的内容具有同一身份。

## 4. 当前测试结构

| 层 | 数量 | 配置 |
| --- | ---: | --- |
| Vitest unit | 由 build 执行 | jsdom |
| Playwright component | 7 | `fullyParallel=true`，CI retries 2 |
| E2E | 22 | 普通与 WebGL 混合，`fullyParallel=true`，CI 2 workers、retries 2 |
| Visual | 4 | 同一浏览器配置中的独立 project |

WebGL 相关测试分布在：

- `tests/e2e/time-gallery.spec.ts`：完整 iframe/WebGL 交互路径。
- `tests/e2e/learning-prototype.spec.ts`：reduced-motion render-count 与键盘控制。

由于两个测试没有独立 project/tag，并且全局完全并行，它们可能在同一双 worker E2E run 中同时竞争 CPU、GPU/软件渲染、焦点和 requestAnimationFrame 时间。

## 5. 失败 run 证据

GitHub run：`31862001933`
Workflow：Deploy GitHub Pages
Commit：`9a39d32c49b1fa4e3fdc4e4e11a74528968e4069`
Run attempts：2

### Attempt 1

- Component：7/7 passed。
- E2E：21 passed，time-gallery failed。
- time-gallery 首次及 2 次 retries 均超过 120 秒，但分别停在不同的后期 locator/action。
- 总耗时约 8.1 分钟。

### Attempt 2

- Component：7/7 passed。
- E2E：20 passed，1 flaky，1 failed。
- reduced-motion 测试首次执行在 `KeyW` 后 render-count 未增长，retry 后通过，因此被标为 flaky。
- time-gallery 最终失败；三次执行分别停在 camera attribute、body press 和 detail image 等不同位置。
- 总耗时约 8.7 分钟。

### 诊断缺口

Playwright 日志显示 runner 本地已经生成 trace、video、error-context 和失败截图，但 workflow 没有上传它们。该 run 的 GitHub artifact 数量为 0。

当前全局 retries 会把“首次失败、retry 后通过”视为整个命令成功。如果只出现 reduced-motion flaky 而没有另一最终失败，当前流程可能继续部署；因此当前 retry 事实上放宽了门槛。

## 6. 当前远端治理

只读 API 审计结果：

- `main` 没有传统 branch protection。
- `dev` 没有传统 branch protection。
- 仓库没有 repository ruleset。
- `github-pages` environment 已存在。
- environment deployment branch policy 只允许 `main`，该设置正确。

因此当前 CI 红灯是警告而不是强制合并门禁；有权限的用户仍可能直接 push 或合并。

## 7. 已有优势

- 构建命令已能完整验证 source 与 dist 中的 62 件独立 Specimen。
- Component、普通 E2E、WebGL 行为和 visual baseline 已有实际测试资产。
- `dist` 构建输入是明确枚举的源码，不会把仓库根目录整体复制，因此 `.prototype-engineering/` 当前不会自然进入 Pages。
- iframe、MessageChannel、独立资源和默认拒绝权限已有仓库级约束。
- GitHub Pages environment 已建立 main-only 边界。
- Playwright 已启用 failure trace、video 和 screenshot，只缺持久化上传与更合适的分层。

## 8. 审计结论

当前主要问题不是“测试太严格”，而是：

1. 触发模型没有覆盖既定 Git 分支流程。
2. 相同 run 内重复构建，缺少 artifact 身份链。
3. 普通 E2E、WebGL 和 visual 没有隔离。
4. retry 可掩盖 flaky。
5. 失败证据未持久化。
6. branch policy 仍停留在人工约定。
7. CI 输出面向人类日志，缺少稳定的 Agent 诊断契约。
