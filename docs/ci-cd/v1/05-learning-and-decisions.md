# 学习历程与决策记录

本文记录本次 CI/CD 架构学习过程中形成的心智模型和已经收敛的决定。

## 1. 从“Git 约定”到“CI/CD 治理”

初始 Git 工作流：

```text
feature/* → dev → main
```

学习结论：CI/CD 不是替换该规范，而是把它从团队约定提升为自动验证、平台强制和可审计的工程制度。

| Git 约定 | CI/CD 治理 |
| --- | --- |
| 功能合回 dev | PR → dev + required quality gate |
| dev 验证后进入 main | release-policy + PR → main |
| main 是生产 | 只有 main verified artifact 可部署 |
| 构建产物不提交 | dist 使用 Actions/Pages artifacts |
| 原型证据保留但不发布 | Git 历史保留 + artifact validation 排除 |

## 2. Build 与 Artifact

学习重点：

- Build 不只是复制文件；它包含检查、生成、打包和验证。
- 同源码的多次构建不能天然证明是同一份内容。
- Cache 是可淘汰的加速材料，artifact 是本次执行的冻结证据。
- 应部署“被测试的那一箱”，而不是测试后重新做一箱。

决定：每个 run 只 build 一次，立即上传带 SHA/digest 的 artifact，测试和部署原样消费。

## 3. 测试分层

学习重点：

- 独立 job 与 worker 并行不是一回事。
- Component、普通 E2E、WebGL 和 visual 证明不同性质的质量。
- WebGL 串行不是降低标准，而是建立可控实验条件。
- Retry 如果把 flaky 视为成功，会悄悄降低门槛。

决定：四层独立；WebGL 单 worker；允许 retry 但启用 fail-on-flaky；visual 每个 PR required。

## 4. PR、dev 与 main

学习重点：

- CI 验证具体 SHA，不是抽象的“同一批代码”。
- PR merge ref、合并后的 dev commit 和最终 main commit 具有不同身份。
- 不同阶段重复 qualification 是有意验证；同一 run 内重复 build 才是架构浪费。

决定：PR → dev、push dev、PR dev → main、push main 都执行完整门禁；只有 push main 部署。

## 5. Branch Protection

学习重点：

- Workflow 回答“合格吗”；branch protection 执行“不合格不能合并”。
- 单人维护可以强制 PR，但 required approvals 为 0。
- Environment protection 与 branch protection 保护不同阶段。

决定：dev/main 必须 PR、required quality gate、最新分支、conversation resolution、禁止 force push/deletion；main 额外要求 dev 来源。

## 6. Concurrency

学习重点：

- 旧 PR 测试可安全取消；生产部署不应执行到一半被任意打断。
- Concurrency 不保证业务上的“最新版本正确部署”，因此 deploy 还需 freshness check。

决定：PR/dev 取消旧 run；main MVP 串行；Pages deploy 不取消当前部署并在执行前检查最新 main SHA。

## 7. 缓存与成本

学习重点：

- 优化首先是成本决策，不是 YAML 技巧。
- 当前失败耗时主要来自 WebGL timeout/retry，而不是约 5 秒的 npm ci 或约 9 秒的 build。
- 提前缓存 `node_modules`、浏览器或 dist 可能增加错误和维护成本。

决定：MVP 只使用 npm cache；通过低扰动探针采集 20–30 次基线，再按 P50/P95 优化。

## 8. 失败与证据

学习重点：

- 测试失败不应让诊断材料消失。
- Flaky 是现象，不是根因。
- 产品缺陷、测试缺陷和 runner 问题需要不同证据。
- 相同 CI artifact 是可靠复现的基础。

决定：独立 jobs 全部完成；失败上传 trace/video/report；建立固定排查顺序；telemetry 失败只告警，identity 失败必须阻止部署。

## 9. 回滚

学习重点：

- 发布前失败不叫回滚；deploy failure 与线上产品缺陷也不同。
- Git revert 保持 Git 与生产一致但较慢；历史 artifact promotion 快但会形成临时分离并增加来源验证复杂度。

决定：MVP 使用 fix forward/Git revert；历史 artifact 快速回滚放到第二阶段；部署后执行轻量 smoke。

## 10. Reusable Workflow 与 Environment

学习重点：

- Composite action 复用 steps，reusable workflow 复用 jobs。
- 抽象过早会增加诊断层级。
- Environment 只应包围真正的生产 deploy job。

决定：MVP 使用一个 `ci.yml` 和同一 run promotion；暂不使用 reusable workflow；只有 deploy 获得 Pages/OIDC 权限。

## 11. Agentic CI/CD

学习重点：

- GitHub run metadata 和文本日志在有权限时容易读取，但当前缺少 artifact 和机器可读诊断契约。
- AI 能快速看到症状，不等于能可靠完成根因诊断。
- Agent 友好依赖结构化输出、稳定 CLI、相同 artifact、明确权限和复现路径。
- 日志、PR 和网页内容可能包含 prompt injection，必须按不可信数据处理。

决定：MVP 建设 AI-readable/AI-diagnosable evidence plane；Agent 可以准备补丁，但不能绕过 Git/CI/CD 规范；自动 AI triage 和 patch 以后按只读、人工触发、draft PR 的顺序演进。

## 12. 已收敛的总决策

1. 产品模型：同一 run 内 build/test/promote/deploy。
2. Workflow：MVP 一个 `ci.yml`。
3. Visual：所有 PR required。
4. WebGL：专用串行 job，flaky fail。
5. Artifact：SHA/digest 身份链，build 后立即保存。
6. 分支：feature → dev → main，单人 approvals 0。
7. 权限：默认只读，deploy 最小写权限。
8. 优化：先探针后决策。
9. 回滚：MVP revert，后续 promotion。
10. Agentic：先 evidence plane，后有限自治。
