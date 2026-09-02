# Frontend Showcase 开发工作流 v1

状态：**LIVE**
采用日期：2026-08-15

## 1. 标准路径

```text
bounded request
  -> history work unit when non-trivial
  -> feature/<topic> from dev
  -> focused local checks
  -> full repository checks
  -> PR to dev
  -> CI / quality-gate
  -> integrated dev
  -> release PR dev to main
  -> verified artifact deploy
  -> production smoke
  -> post-validation and closure
```

## 2. 核心原则

1. `main` 是生产分支，`dev` 是唯一开发集成分支。
2. 开发分支从最新 `dev` 创建，统一命名 `feature/<topic>`。
3. 只有 `dev -> main` 可以表达生产晋级。
4. 本地检查提供反馈，稳定的 `CI / quality-gate` 是远端门禁。
5. 构建一次，测试和部署同一不可变 artifact。
6. 文档、Specimen、构建脚本和 workflow 变更接受同等审查。
7. 部署成功不等于工作闭环；适用的 smoke 和后验证必须完成。

## 3. 文档索引

- [01-local-development.md](./01-local-development.md)：环境、源码边界和本地循环。
- [02-quality-gates.md](./02-quality-gates.md)：命令、测试分层和 CI required gate。
- [03-release-and-rollback.md](./03-release-and-rollback.md)：dev、main、Pages、smoke 与恢复。
- [04-documentation-lifecycle.md](./04-documentation-lifecycle.md)：current truth、history 和工作单元。
- [05-definition-of-done.md](./05-definition-of-done.md)：分支、集成、发布和文档完成定义。
- [06-specimen-authoring.md](./06-specimen-authoring.md)：新增或修改一件展品的端到端流程。
- [07-debugging-and-diagnostics.md](./07-debugging-and-diagnostics.md)：区分 Catalog、bridge、application、artifact 与生产故障。

## 4. 当前生产证据

CI/CD v1 的首次生产采用、受控失败、远端治理和 artifact identity 证据保存在[2026-08-15 CI/CD 历史单元](../../history/2026-08-15-ci-cd-v1/README.md)。当前 workflow 事实以 `.github/workflows/ci.yml`、package scripts 和本目录为准。
