# CI/CD v1 实施计划与验收

本文描述 v1 的实现顺序与验收清单。仓库内实现候选已完成本地验证；远端 PR 门禁、分支保护、Pages deployment 和 production smoke 尚须按本清单验收。

## 1. MVP 范围

### 仓库内变更

- 用 `.github/workflows/ci.yml` 收敛现有 verify/pages 编排。
- 调整 npm scripts，明确 ordinary E2E、WebGL、visual 和诊断入口。
- 调整 Playwright 配置，使 CI 使用已下载的 artifact，不隐式 build。
- 将两个 WebGL 测试划入专用 project/job。
- 增加 artifact manifest、verify、summary 和 diagnostics scripts。
- 增加失败附件上传和 Job Summary。
- 增加 lightweight production smoke。
- 更新运维文档。

### GitHub 平台变更

- 在新 checks 已成功出现后保护 `dev`。
- 验证 feature → dev 后保护 `main`。
- 保留 `github-pages` environment 的 main-only policy。
- 配置 artifact retention。
- 复核 Actions 默认权限和 Pages source。

### 明确不在 MVP

- Reusable workflow / `workflow_call`。
- Playwright browser cache 或固定容器。
- Path filtering、sharding、merge queue。
- 跨 run artifact promotion。
- 自动历史回滚。
- 自动调用 AI 修改代码。
- 外部长期 metrics 平台。

## 2. 实施顺序

### 阶段 A：命令与测试边界

1. 增加明确 npm test scripts。
2. 从 ordinary E2E 分离 WebGL tests。
3. 建立 artifact-only preview 启动方式。
4. 本地验证测试数量和无隐式 build。

### 阶段 B：Artifact 身份

1. 创建 manifest 和 digest scripts。
2. Build once 并上传 generic artifact。
3. 在 E2E/WebGL/visual jobs 中下载和校验。
4. 验证 `.prototype-engineering/` 不在 artifact。

### 阶段 C：Workflow DAG

1. 增加 release-policy、build、component、e2e、webgl、visual。
2. 增加严格 quality-gate。
3. 增加 diagnostic finalizer。
4. 增加 main-only package/deploy/smoke。
5. 设置 concurrency、timeouts 和最小 permissions。

### 阶段 D：受控失败演练

在不合入 dev/main 的测试 PR 中制造受控失败，验证：

- 其他测试层继续完成；
- quality gate 失败；
- Pages 不运行；
- build/report/trace/video/diagnostics 可下载；
- Agent 能用 run ID 获取证据和复现命令。

随后移除故障并验证全绿。

### 阶段 E：平台门禁

1. 配置 dev protection。
2. 验证直接 push 被拒绝、PR 正常。
3. 配置 main protection 和 release policy。
4. 验证 feature → main 被拒绝、dev → main 正常。
5. 复核 environment 与 deployment history。

### 阶段 F：观察期

采集 20–30 次代表性 run：

- P50/P95 lead time；
- job/step durations；
- WebGL readiness 与 flake；
- cache hit；
- artifact storage/transfer；
- cancellation 和 runner minutes。

观察期结束后再评审优化提案。

## 3. 可执行验收标准

### Build 与 Artifact

- [ ] 单个 workflow run 中 `npm run build` 只出现一次。
- [ ] Build 成功后立即上传 generic artifact。
- [ ] Manifest 记录 SHA、run、attempt、Node、lockfile digest 和 dist digest。
- [ ] 下载校验失败会阻止测试或部署。
- [ ] Artifact 不包含 `.prototype-engineering/`、测试报告源目录或本地日志。

### 测试

- [ ] Component 7 个测试独立执行。
- [ ] Ordinary E2E 预计 20 个测试独立执行。
- [ ] WebGL 2 个测试在 1 worker、非 fully-parallel project 中执行。
- [ ] Visual 4 个 case 每个 PR required。
- [ ] E2E/WebGL/visual 使用同一 artifact digest。
- [ ] Flaky 会使门禁失败。
- [ ] 任一层失败时其他层仍能完成并上传报告。

### 部署

- [ ] Package job 不运行项目 build。
- [ ] 任一 required layer 失败时 package/deploy 均不运行。
- [ ] 只有 main production event 可以进入 Pages environment。
- [ ] 只有 deploy job拥有 `pages: write` 和 `id-token: write`。
- [ ] 部署内容 SHA/digest 与 manifest 一致。
- [ ] Production smoke 验证首页、62 项 catalog、代表 item 和资源发现入口。

### 分支治理

- [ ] `dev/main` 必须走 PR。
- [ ] `CI / quality-gate` 为 required。
- [ ] Required approvals 为 0，符合单人维护状态。
- [ ] Force push/deletion 被禁止。
- [ ] feature → main 被 release-policy 拒绝。
- [ ] dev → main 在完整门禁后可合并。

### 诊断与 Agentic

- [ ] 失败 run 上传结构化 diagnostic bundle。
- [ ] Bundle 能定位 suite、test、file、line、attempt、artifact 和附件。
- [ ] `ci:diagnose -- --run <id>` 能下载、校验并输出复现命令。
- [ ] 给 Agent 一个失败 run ID，无需手工浏览 UI 即可获取核心证据。
- [ ] Agent 没有 protected branch 或 Pages 写权限。
- [ ] 成本 telemetry 失败只告警，identity 校验失败强制阻断。

### 仓库回归

- [ ] `npm run build` 通过。
- [ ] `npm run test:components` 通过。
- [ ] `npm run test:e2e` 通过。
- [ ] `npm run test:visual` 通过或按预期审慎更新 baseline。
- [ ] 62 件 Specimen 独立协议、MessageChannel 和默认拒绝 iframe 权限不变。

## 4. 主要风险与缓解

| 风险 | 缓解 |
| --- | --- |
| Required check 尚不存在就启用保护 | 先运行成功，再配置保护 |
| WebGL 隔离后仍 flaky | readiness/focus 探针、同 artifact 复现，不弱化门槛 |
| Artifact 过大或传输慢 | 先记录大小和 P95，再评估打包/布局 |
| Visual runner 差异 | 固定环境和输入，按平台保存 baseline，且只人工审查更新 |
| Condition 错误导致 PR 可部署 | main-only condition + environment policy + 最小权限三重防线 |
| Diagnostic bundle 泄露敏感信息 | 默认不采集 secrets/env，上传前清理和限制内容 |
| Prompt injection 影响 Agent | 诊断数据按不可信输入处理，只读/sandbox/人工确认 |
| 单个 quality-gate 汇总逻辑漏项 | 显式枚举结果并用受控失败演练验证 |
| 新 main 到达后旧部署晚到 | deploy concurrency + lock 后 freshness check |

## 5. 后续演进

### v1.1

- Nightly WebGL repeat/stress。
- 基于真实数据调整 timeout 和 retention。
- 必要时使用 Playwright blob report 汇总。
- 手动只读 AI triage。

### v2

- Reusable quality workflow。
- 跨 run verified artifact promotion。
- 历史 artifact 快速回滚。
- Draft fix PR Agent。

### 规模化阶段

- Merge queue。
- 有证据的 test sharding/path selection。
- 固定 Playwright image 或 browser cache。
- 外部时序 metrics 与预算告警。
- 经过 eval 和审计的有限自动修复。
