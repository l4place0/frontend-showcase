# Frontend Showcase CI/CD v1

状态：**v1 已实现，并于 2026-08-15 完成首次生产验收**
文档日期：2026-08-15
设计基线：`dev` 提交 `c5153cc8e81d0d7a537fa1125d5f4e6a0e13f3d2`
改造前生产基线：`main` 提交 `9a39d32c49b1fa4e3fdc4e4e11a74528968e4069`

## 1. 目的

本目录记录 frontend-showcase CI/CD v1 的完整设计依据、工程约定、运行策略、Agentic 能力边界、学习历程和实施验收标准。

v1 的核心目标是：

> 对一个确定的 commit 只构建一次，让各质量层验证同一份不可变 artifact，并且只把这份已经通过门禁的 artifact 部署到 GitHub Pages。

系统同时面向人类维护者和代码 Agent：失败既要在人类界面中清楚，也要能被 Agent 以结构化方式发现、下载、复现和修复；Agent 不能因此获得绕过分支、质量或生产权限的能力。

## 2. 文档导航

| 文档 | 内容 |
| --- | --- |
| [00-current-state.md](./00-current-state.md) | 当前 workflow、脚本、测试结构、远端治理状态和失败证据 |
| [01-target-architecture.md](./01-target-architecture.md) | v1 产品模型、触发矩阵、job DAG、artifact promotion 和权限模型 |
| [02-engineering-conventions.md](./02-engineering-conventions.md) | 分支、门禁、测试、artifact、安全和文档的规范性约定 |
| [03-observability-and-agentic.md](./03-observability-and-agentic.md) | 成本探针、失败诊断包和 AI-ready/Agentic CI/CD 设计 |
| [04-operations.md](./04-operations.md) | 失败分类、排查、部署、smoke、恢复和回滚手册 |
| [05-learning-and-decisions.md](./05-learning-and-decisions.md) | 从 Git 工作流到 CI/CD 治理的学习历程和已收敛决策 |
| [06-delivery-plan.md](./06-delivery-plan.md) | MVP 范围、实施顺序、风险、验收和后续演进 |
| [07-acceptance-record.md](./07-acceptance-record.md) | 实施变更、受控失败、远端门禁、生产部署和独立复核证据 |

## 3. 设计原则

1. **Build once**：同一 workflow run 内只执行一次完整生产构建。
2. **Test what is deployed**：普通 E2E、WebGL E2E 和 visual 验证同一 artifact。
3. **Promote, do not rebuild**：质量通过后提升 artifact 资格，不重新制造产物。
4. **Deterministic gates first**：测试、schema、digest 和 branch policy 决定能否发布；AI 不能替代它们。
5. **Failure is evidence**：失败时保留 build artifact、report、trace、video、截图和结构化摘要。
6. **Default deny**：PR 和测试 job 只读；只有 production deploy job 获得 Pages/OIDC 权限。
7. **Stable interfaces**：required check 名称、诊断 schema、npm 命令和 artifact manifest 是长期接口。
8. **Observe before optimizing**：先采集成本与稳定性基线，再引入 cache、容器、分片或路径过滤。
9. **Repository rules remain authoritative**：Catalog 与 item runtime 隔离、Protocol v1 开放字段、MessageChannel、默认拒绝 iframe 权限等规则继续适用。
10. **Evidence defines adoption**：仓库内实现、远端门禁和生产发布分别验收；只有成功 run、deployment 与 smoke 证据才能证明能力已生效。

## 4. v1 一句话架构

```text
PR/dev/main event
  → release policy
  → build once + component
  → immutable artifact
  → ordinary E2E / serial WebGL / visual
  → quality gate
  → main-only Pages packaging
  → protected deploy
  → production smoke
  → human- and agent-readable evidence
```

## 5. 参考资料

- [GitHub Actions：在 jobs 间共享 workflow artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data)
- [GitHub Pages：使用 custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub：protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges/managing-protected-branches/about-protected-branches)
- [GitHub Actions：reusable workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)
- [Playwright：CLI 与 fail-on-flaky-tests](https://playwright.dev/docs/test-cli)
- [Playwright：parallelism 与 workers](https://playwright.dev/docs/test-parallel)
- [OpenAI：Codex GitHub Action](https://developers.openai.com/codex/github-action)
