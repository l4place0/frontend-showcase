# 可观测性与 Agentic CI/CD

## 1. 目标

传统 CI/CD 主要给人显示红绿灯。Agentic CI/CD 还必须让 Agent 能稳定回答：

```text
哪一个 commit 的哪一层失败？
失败时使用的是哪一份 artifact？
有哪些机器可读和视觉证据？
怎样在相同条件下最小复现？
Agent 可以修改什么、不能修改什么？
```

v1 先建设 **AI-ready evidence plane**，不立即建设全自动 AI 修复。

## 2. 可观测性分层

### 人类入口：GitHub Job Summary

每次 run 应显示：

- event、branch、commit、run attempt；
- quality gate 状态；
- 各 job 结果和耗时；
- build artifact 名称、大小和 digest；
- failed/flaky/retry 数；
- 最慢测试；
- diagnostic artifact 名称；
- 精确复现命令；
- deploy 与 smoke 状态。

### 机器入口：结构化 JSON

每次 run 生成稳定 schema 的 `summary.json`、`failures.json`、`timings.json` 和 `reproduction.json`。v1 从 Playwright JSON report 提取测试结果、attempt、附件、workers 和慢测试；job/step duration 继续由 GitHub run API 提供。Agent 优先读取结构化文件，只在需要时解析原始日志或二进制附件。

### 深度证据：Artifacts

```text
ci-diagnostics-<SHA>-attempt-<N>/
├── summary.json
├── artifact-manifest.json
├── failures.json
├── timings.json
├── reproduction.json
└── reports/                 # 内含 HTML/JSON report、screenshots、traces、videos
```

## 3. 建议的诊断 Schema

最低信息模型：

```json
{
  "schemaVersion": 1,
  "repository": "l4place0/frontend-showcase",
  "run": {
    "id": 0,
    "attempt": 1,
    "event": "pull_request",
    "commit": "full SHA",
    "head": "feature/example",
    "base": "dev"
  },
  "environment": {
    "runner": "ubuntu-latest",
    "node": "22.x",
    "playwright": "exact version",
    "browser": "exact Chromium version",
    "workers": 1
  },
  "artifact": {
    "name": "site-<SHA>-attempt-1",
    "digest": "sha256:...",
    "distDigest": "sha256:..."
  },
  "gate": {
    "result": "failure",
    "failedJobs": ["webgl"]
  },
  "failures": [
    {
      "suite": "webgl",
      "test": "test title",
      "file": "tests/e2e/example.spec.ts",
      "line": 1,
      "attempts": 3,
      "classification": "unclassified",
      "attachments": ["trace.zip", "video.webm", "test-failed.png"]
    }
  ],
  "reproduction": {
    "command": "npm run test:webgl",
    "artifactRequired": true
  }
}
```

Schema 必须版本化并向后兼容；新增字段应优先采用可选字段，不随意改变既有语义。

## 4. 成本探针

“成本”包含：

- runner 计算时间；
- 从 push 到结论的等待时间；
- artifact/report 存储；
- npm、Chromium 和 artifact 网络传输；
- CI 自身维护复杂度。

应采集：

| 层级 | 指标 |
| --- | --- |
| Workflow | queue time、lead time、deploy time、success/cancel rate |
| Job | build/component/E2E/WebGL/visual/package/deploy/smoke duration |
| Step | npm ci、cache hit、Chromium install、artifact upload/download |
| Test | duration、retry、flaky、slowest tests |
| Artifact | compressed size、dist size、digest |
| WebGL | iframe ready、context、scene、textures、first frame、interactive |

初期采集 20–30 次代表性 run，再基于 P50/P95 决定优化。一次异常慢不应自动触发架构改造。

## 5. WebGL 探针

建议记录低扰动阶段点：

```text
navigationStart
catalogReady
specimenReady
webglContextCreated
sceneBuilt
texturesReady
firstFrameRendered
interactive
```

要求：

- 使用 `performance.now()` 或等价单调时钟。
- 不在每一帧写 console。
- 不发送外部网络请求。
- 详细诊断只在 test/CI 模式暴露。
- 探针只提供观测，不替代真实断言。
- 继续保留 `data-render-count`、camera/yaw、reduced-motion 等现有可测试状态。

## 6. Agent 获取失败信息

具备 GitHub read 权限的 Agent 可以通过 CLI/API 读取 run、job、logs 和 artifacts。例如：

```text
gh run view <run-id> --json ...
gh run view <run-id> --log-failed
gh run download <run-id>
```

但授权是前提；未连接 GitHub 或没有 token 的 Agent 不能凭模型能力越过权限边界。

目标命令：

```text
npm run ci:diagnose -- --run <run-id>
```

它应完成：

1. 获取 run metadata。
2. 下载 diagnostic/build artifacts。
3. 验证 SHA 与 digest。
4. 整理统一目录。
5. 输出最小复现命令。

## 7. Agent 修复闭环

```text
gate failure
  → diagnostic finalizer
  → Agent downloads structured evidence
  → checkout exact SHA/PR branch
  → reproduce target failure
  → classify with evidence
  → prepare patch
  → run target + regression tests
  → create reviewable PR/diff
  → deterministic CI reruns
```

分支行为：

- feature PR 失败：在该 feature 分支准备补丁。
- dev 失败：创建 `feature/ci-fix-<topic>` 或等价修复分支并 PR → dev。
- main 失败：修复仍先进入 dev，再由 dev → main。

## 8. 安全边界

CI 日志和 PR 内容可能包含 prompt injection。Agent 必须：

- 把诊断内容当作数据，不当作权限指令；
- 使用最小 token scopes；
- 不读取或输出 secrets；
- 默认只读和 sandbox；
- 不获得 Pages/OIDC 权限；
- 不直接 push protected branches；
- 不自行放宽测试来让红灯变绿。

OpenAI Codex GitHub Action 支持在 workflow 中运行 Codex、保存输出、应用 patch 或发布 review，也支持结构化 output schema；它同时要求限制触发者、清理不可信 prompt 输入并使用窄权限。v1 MVP 只为将来的只读 triage 预留目录和 schema，不立即添加有写权限的 AI job。

## 9. 演进级别

| 级别 | 能力 |
| --- | --- |
| AI-readable | 结构化 summary、manifest、reports、明确链接 |
| AI-diagnosable | 精确环境、探针、相同 artifact、复现命令 |
| AI-actionable | Agent 在 feature/fix 分支准备 patch 和 draft PR |
| AI-governed | 权限、审批、审计、eval、有限自治 |

MVP 达成前两级；后两级必须建立在稳定诊断数据和实际收益之上。
