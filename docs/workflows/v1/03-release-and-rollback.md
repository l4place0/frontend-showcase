# 发布与回滚

状态：**LIVE**

## 1. 集成与发布

功能分支完成后通过 PR 合入 `dev`。`dev` 完整门禁健康后，再创建 `dev -> main` release PR。feature 分支不能直接进入 `main`，release-policy 会拒绝非法路径。

`main` push 触发完整生产流水线：验证精确 SHA、构建一次、分层测试、quality gate、Pages packaging、deploy 和 smoke。

## 2. 部署身份

生产发布必须能同时关联：

- `main` commit SHA；
- generic site artifact；
- artifact manifest 与 dist digest；
- Pages deployment；
- 线上 `artifact-manifest.json`；
- production smoke 结果。

## 3. 失败处理

- quality layer 失败：不 package、不 deploy，下载 diagnostics 并在 feature/dev 修复。
- package identity 失败：视为供应链或产物错误，不重新构建后绕过。
- 过期 main candidate：freshness check 拒绝部署。
- deploy 失败：保留上一生产版本，修复发布链后重跑明确的 main 候选。
- production smoke 失败：停止宣称发布完成，分类为部署、缓存、资源或应用问题。

## 4. 回滚

当前回滚通过明确 revert 或重新晋级已知良好源码完成，并重新经过完整质量门禁。不得在 Pages 上手工覆盖文件，也不得从本地 `dist/` 直接发布。
