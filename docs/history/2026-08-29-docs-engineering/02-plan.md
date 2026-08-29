# 文档工程重构计划

状态：**LIVE**

## 1. 信息架构

建立 `architecture/`、`product/`、`workflows/` 和 `history/` 四个一级域。Specimen schema 与 catalog 继续承担可执行模型，不建立重复的 `model/` 文档域。

## 2. 历史迁移

- `docs/ci-cd/v1` 移入 `history/2026-08-15-ci-cd-v1`。
- `docs/reviews` 移入 `history/2026-08-15-learning-system-v1/reviews`。
- 只修复迁移造成的相对链接和索引，不改变当时结论。

## 3. 自动化

增加无外部依赖的 Node 脚本，校验文档状态、H1、heading、相对链接、history index 和 work-unit 必需文件，并通过 `docs:check` 接入 `npm run check`。

## 4. 验证

先运行文档检查，再执行仓库要求的 build、component 和 E2E。不存在代表性视觉变化，因此不更新 visual baseline。

## 5. 内容重建

目录结构验证后，从当前源码反向提炼 Catalog runtime、Protocol、Learning/AI、构建产物、产品旅程和作者操作手册。可执行 schema 和 catalog 保持唯一模型来源，文档只解释责任、流程和变更门槛。
