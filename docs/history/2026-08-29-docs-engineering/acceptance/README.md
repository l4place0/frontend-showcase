# 文档工程重构验收材料

状态：**LIVE**

## 验收矩阵

| 标准 | 证据 | 当前结果 |
| --- | --- | --- |
| AC-DOC-001 | `docs/README.md` 与相对链接检查 | 通过 |
| AC-DOC-002 | history index、Git rename 与 archive README | 通过 |
| AC-DOC-003 | current docs 的 64 件事实与 history 责任声明 | 通过 |
| AC-DOC-004 | `npm run docs:check` | 通过；50 个 Markdown、3 个历史单元 |
| AC-DOC-005 | build、component、E2E | 通过；6 单测、9 组件、23 普通 E2E、6 WebGL |
| AC-DOC-006 | architecture 四条主链与源码事实抽查 | 通过；Catalog、runtime、Learning/AI、build/delivery 均有独立入口 |
| AC-DOC-007 | product 受众、旅程、准入和范围 | 通过；v1 四份契约互相导航且责任分离 |
| AC-DOC-008 | Specimen authoring 与诊断流程 | 通过；覆盖来源选择、controls、learning、双路径测试和故障分层 |

## 未包含

本材料不验收生产发布，也不把已发现的 Gargantua runtime 缺陷纳入本次文档架构变更。
