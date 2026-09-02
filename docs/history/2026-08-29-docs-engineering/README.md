# 文档工程重构

状态：**LIVE**
历史类型：**work-unit**
工作状态：**validating**
建立日期：2026-08-29

## 目标摘要

参考同目录 man-dotcom 的文档工程，把 frontend-showcase 的当前知识、冻结产品边界、开发工作流和历史证据分开，并让目录结构可自动验证。

## 阶段导航

- [需求](./01-requirement.md)
- [计划](./02-plan.md)
- [实现](./03-implementation.md)
- [验证](./04-validation.md)
- [后验证](./05-post-validation.md)
- [验收材料](./acceptance/README.md)

## 状态记录

| 日期 | 原状态 | 新状态 | 依据 |
| --- | --- | --- | --- |
| 2026-08-29 | - | `approved` | 用户明确要求参考 man-dotcom 改造 docs 架构 |
| 2026-08-29 | `approved` | `implementing` | 从 `origin/dev` 建立 `feature/docs-engineering` 并开始迁移 |
| 2026-08-29 | `implementing` | `validating` | 文档结构检查、构建、组件测试和 E2E 本地全量通过 |
| 2026-08-29 | `validating` | `implementing` | 用户要求在新信息架构上重新提炼完整仓库文档 |
| 2026-08-29 | `implementing` | `validating` | 长期文档重建完成，第二轮 build、component 与 E2E 全量通过 |
