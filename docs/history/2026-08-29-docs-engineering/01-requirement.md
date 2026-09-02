# 文档工程重构需求

状态：**LIVE**

## 背景

原 `docs/` 只有 CI/CD 专题和学习复审材料，没有总入口，也没有区分当前事实与历史证据。CI/CD 文档中的 62 件基线已经被当前 64 件馆藏超越，但文件仍位于看似当前的专题目录。

## 目标

- 建立清晰的 docs 总入口和阅读路径。
- 分离 architecture、product、workflows 与 history 的责任。
- 保留既有 CI/CD 和学习复审证据。
- 增加可执行文档校验并纳入 build/check。
- 按 frontend-showcase 的规模适配，不复制 man-dotcom 不需要的业务 model 层。
- 基于源码、schema、构建脚本和测试重建长期文档，不把新目录停留在迁移摘要层。

## 非目标

- 修改 Catalog 或 Specimen 产品行为。
- 修复 Gargantua runtime 缺陷。
- 改写历史验收结论。
- 引入文档站点生成器或新 npm 依赖。

## 验收标准

| ID | 标准 |
| --- | --- |
| AC-DOC-001 | `docs/README.md` 可以导航到全部当前文档域和历史索引 |
| AC-DOC-002 | CI/CD 与学习复审材料作为 history 保留且内部链接可达 |
| AC-DOC-003 | 当前架构、产品和工作流不再把 62 件历史基线表述为当前事实 |
| AC-DOC-004 | `npm run docs:check` 能检查 Markdown 结构、相对链接和历史工作单元完整性 |
| AC-DOC-005 | `npm run build`、组件测试与 E2E 保持通过 |
| AC-DOC-006 | architecture 覆盖 Catalog、Specimen、Learning/AI 和构建交付四条主链 |
| AC-DOC-007 | product 明确受众、用户旅程、内容接纳与非目标 |
| AC-DOC-008 | workflows 能指导新增/修改 Specimen 和跨层诊断 |
