# 开发历史与工作单元

状态：**LIVE**

## 1. 目的

本目录保存非琐碎工作的需求、计划、实施、验证和后验证，以及采用本结构之前已经形成的审计归档。History 负责可追溯性，不替代当前架构、产品和工作流。

## 2. 当前工作单元索引

| 工作单元 | 类型 | 状态 | 结论 |
| --- | --- | --- | --- |
| [文档工程重构](./2026-08-29-docs-engineering/README.md) | `work-unit` | `validating` | 信息架构与长期文档均已重建并完成本地全量验证 |
| [CI/CD v1](./2026-08-15-ci-cd-v1/README.md) | `archive` | `closed` | 首次 artifact-first CI/CD 已完成生产验收 |
| [学习系统 v1 复审](./2026-08-15-learning-system-v1/README.md) | `archive` | `closed` | 62 件时期的教程与运行矩阵完成多轮审查 |

## 3. 新工作单元

从 [_template](./_template/README.md) 复制结构，使用 `YYYY-MM-DD-short-topic` 命名。建立时填写需求和验收标准；实现过程中记录偏差；验证阶段记录实际 commit、命令、结果和未覆盖范围。

## 4. 归档规则

- `work-unit` 必须具有 README、需求、计划、实现、验证、后验证和 acceptance README。
- `archive` 可以保留旧结构，但必须提供根 README，解释对象、时间、结论和与当前文档的关系。
- 已关闭历史只追加勘误、事故或后验证，不删除失败证据。
- 外部证据应记录稳定 ID、SHA、时间和摘要，不把 secrets 或私人数据写入 Git。
