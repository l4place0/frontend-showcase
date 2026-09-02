# Frontend Showcase 文档中心

状态：**LIVE**
重构日期：2026-08-29

## 1. 文档地图

本仓库把长期知识分为四个责任明确的文档域：

| 文档域 | 状态 | 回答的问题 | 演进方式 |
| --- | --- | --- | --- |
| [architecture/](./architecture/README.md) | `LIVE` | Catalog、Specimen、协议、构建与交付为什么采用当前边界 | 与实现同步原位更新，重要决策保留在 decisions 中 |
| [product/](./product/README.md) | `FROZEN v1` | 产品必须提供什么，明确不提供什么 | 产品边界实质变化进入新版本 |
| [workflows/](./workflows/v1/README.md) | `LIVE v1` | 如何开发、验证、发布、回滚和维护文档 | 事实同步原位更新，流程语义变化进入新版本 |
| [history/](./history/README.md) | `LIVE` | 一项工作当时为何发生、怎样实施、如何验证 | 完成后只追加勘误或后验证，不重写为当前事实 |

`specimens/specimen.schema.json`、`specimens/learning.schema.json`、`specimens/catalog.mjs` 与测试是协议和馆藏模型的可执行来源，因此本仓库不复制 man-dotcom 的 `model/` 域。需要解释模型语义时，应链接这些源码契约，而不是维护第二份容易漂移的字段清单。

## 2. 推荐阅读顺序

### 理解系统

1. [当前架构基线](./architecture/README.md)
2. [Catalog runtime](./architecture/catalog-runtime.md)
3. [运行时与协议边界](./architecture/runtime-boundaries.md)
4. [内容、学习与 AI](./architecture/content-learning-and-ai.md)
5. [构建与交付](./architecture/build-and-delivery.md)
6. [产品定位与受众](./product/v1/vision-and-audiences.md)
7. [能力与用户旅程](./product/v1/capabilities-and-journeys.md)
8. [内容接纳契约](./product/v1/content-contract.md)

### 开始开发

1. [开发工作流 v1](./workflows/v1/README.md)
2. [本地开发](./workflows/v1/01-local-development.md)
3. [质量门禁](./workflows/v1/02-quality-gates.md)
4. [Specimen 创作与修订](./workflows/v1/06-specimen-authoring.md)
5. [调试与诊断](./workflows/v1/07-debugging-and-diagnostics.md)
6. [Definition of Done](./workflows/v1/05-definition-of-done.md)
7. 为非琐碎工作建立 [history 工作单元](./history/README.md)

## 3. 状态词

- `FROZEN`：已冻结的产品或流程契约；实质修改需要新版本或显式修订。
- `LIVE`：描述当前系统或当前采用的工作方式，必须与代码同步。
- `DRAFT`：候选内容，尚未被实现或验证采用。
- `CONTEXT`：用于解释背景，不直接产生实现义务。

历史工作单元另使用 `draft`、`approved`、`implementing`、`validating`、`observing`、`closed` 表示执行阶段；不要把工作状态与文档状态混用。

## 4. 更新责任

- 架构边界变化必须同步更新 `architecture/` 和相关测试。
- 产品能力或非目标变化必须同步更新 `product/`。
- 命令、分支、门禁或发布路径变化必须同步更新 `workflows/`。
- 非琐碎工作应在 `history/` 建立工作单元；历史材料记录当时事实，不替代当前架构。
- 文档链接、H1、状态词和历史索引由 `npm run docs:check` 验证。
- 不复制可由 catalog、schema、构建产物或测试稳定生成的大量信息。
