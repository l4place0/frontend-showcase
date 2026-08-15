# CI/CD v1 运行与恢复手册

## 1. 标准成功路径

```text
event
→ build artifact
→ component/E2E/WebGL/visual
→ quality gate
→ main-only Pages package
→ deploy
→ smoke
```

如果事件不是 main production event，流程在 quality gate 和诊断汇总后结束。

## 2. 失败时的系统行为

### Build 失败

- 不产生完整 production artifact。
- 其他不依赖 build 的 component job可以完成并提供独立结果。
- E2E/WebGL/visual 因没有受验证 artifact 而不得运行。
- 保存 unit、typecheck、validation 和 build logs。

### 测试失败

- 其余独立测试层继续完成。
- Quality gate 失败。
- Package/deploy 跳过。
- 线上继续保留最近成功部署。
- 上传 reports、trace、video、截图、诊断 JSON 和 build artifact。

### Pages deploy 失败

- Artifact 已经通过质量门禁。
- 优先重试同一 run 的 deploy，不重新 build。
- 线上状态通过 deployment history 和 smoke 复核。

### Smoke 失败

- 进行有限、短暂重试以排除传播延迟。
- 仍失败则标记 deployment unhealthy，保存 HTTP/资源/identity 证据。
- MVP 不自动回滚，由维护者选择重新部署、fix forward 或 revert。

## 3. 标准排查顺序

1. **Job Summary**：确定失败层、测试、attempt、artifact 和主要阶段。
2. **Screenshot/Error Context**：确定页面处于 welcome、timeline、gallery、detail、fallback 或 crash 状态。
3. **Video**：观察点击、iframe reload、焦点、动画和卡住时间点。
4. **Trace**：检查 action、DOM、locator、console、network、iframe 和 assertion 时间线。
5. **比较 attempts**：同点失败更接近确定性问题；不同后期点陆续超时更接近整体资源/时序退化。
6. **下载同一 artifact 复现**：不得仅用本地重新 build 的内容替代 CI 产物做结论。

## 4. 失败分类

### 产品缺陷

示例：ready race、render loop 逻辑错误、iframe lifecycle 丢失、WebGL fallback 错误。

### 测试缺陷

示例：固定 sleep、未建立焦点、读取过早、依赖短暂 DOM 或坐标假设。

### Runner/环境故障

示例：browser disconnect、WebGL context 创建失败、GitHub 服务故障、异常资源抢占。

### Flaky

Flaky 只是“首次失败、retry 后通过”的现象，不是根因类别。它仍阻止发布，直到产品、测试或环境原因被解释并处理。

## 5. 报告保留

初始建议：

| 内容 | 保留时间 |
| --- | ---: |
| PR build artifact | 7 天 |
| dev candidate | 14 天 |
| main verified artifact | 30–90 天 |
| Playwright reports/trace/video | 14 天 |
| 机器结果与 CI diagnostics | 30 天 |
| trace/video/screenshots | 14 天 |
| CI metrics | 30 天 |
| Visual baseline | Git 历史永久保存 |

保留值应在成本探针形成基线后调整。

## 6. 回滚策略

### Fix forward

适用于影响有限、修复明确且回退会损失其他重要改动的情况。

### Git revert

MVP 默认回滚方式：

```text
在 dev 撤销问题改动
→ PR/CI
→ dev → main
→ main production pipeline
→ smoke
```

Revert 添加反向 commit，不重写历史。

### 历史 Artifact Promotion

第二阶段能力。它必须验证：

- artifact 来自当前仓库；
- 来源是 main 的成功 workflow；
- required checks 当时通过；
- SHA 与 manifest 一致；
- digest 一致；
- 记录 source run ID、expected SHA、操作者和原因。

历史 artifact 回滚会造成“线上=A、main=B”的临时分离，必须随后同步 dev/main，防止 B 再次上线。

## 7. 恢复目标

MVP 的初步 RTO 是“一个完整生产流水线周期内恢复”；RPO 是“最近一次成功部署”。在 20–30 次真实 run 后，根据 pipeline P95 决定是否需要分钟级历史 artifact promotion。

## 8. 单人维护处置清单

1. 确认当前线上 deployment SHA。
2. 判断是测试、产品、runner 还是 Pages 故障。
3. 下载对应 diagnostic/build artifact。
4. 用目标命令最小复现。
5. 平台失败则重试同一 artifact；产品/测试问题则准备修复。
6. 修复进入 feature/fix → dev，不直接 push protected branches。
7. 通过 dev 和 main 门禁。
8. 部署后执行 smoke。
9. 记录根因、恢复时间、缺失的测试和是否需要调整探针。

## 9. 平台设置审计

设置完成后应通过 GitHub UI 与只读 API 双重确认：

- `dev/main` required PR 和 quality gate；
- force push/deletion 禁止；
- required approvals 为 0（单人阶段）；
- `github-pages` 只允许 main；
- workflow 默认只读；
- deploy job是唯一 Pages/OIDC 写权限持有者；
- artifact retention 符合本手册。
