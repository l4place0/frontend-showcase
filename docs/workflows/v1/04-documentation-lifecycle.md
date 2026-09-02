# 文档生命周期

状态：**LIVE**

## 1. Current truth 与 history

```text
architecture / product / workflows
  = 当前采用的长期知识

history/<date>-<topic>
  = 一项工作在当时的需求、计划、实现、验证与观察
```

当前文档不能引用旧验收数字作为当前事实；历史文档也不能为了追上现状而抹掉当时的对象、失败和结论。

## 2. 何时建立工作单元

满足任一条件即视为非琐碎工作：

- 跨多个源码或文档域；
- 改变用户可见行为、协议、构建或部署；
- 需要设计判断、迁移、回滚或真实环境验证；
- 产生应长期保留的验收证据。

工作单元使用 `YYYY-MM-DD-short-topic` 命名，并从 [`docs/history/_template/`](../../history/_template/README.md) 创建。

## 3. 工作状态

```text
draft -> approved -> implementing -> validating -> observing -> closed
```

README 维护状态和导航；需求、计划、实现、验证、后验证各自承担单一责任。验收材料不得只写“测试通过”，必须说明对象、命令、结果和未验证范围。

## 4. 历史归档

采用新结构前已经存在的完整审计或复审材料可以登记为 `archive`，保留原文件结构。Archive 不伪装成按新模板执行的工作单元，但仍必须有 README、索引、状态和可达链接。

## 5. 自动校验

`npm run docs:check` 检查：

- 每个 Markdown 文件恰好一个 H1；
- heading 不跳级；
- 相对链接目标存在；
- 文档状态词合法；
- history 索引覆盖全部工作目录；
- work-unit 包含要求的阶段文件；
- 索引状态与工作单元 README 一致。
