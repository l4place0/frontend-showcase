# 质量门禁

状态：**LIVE**

## 1. 本地命令契约

| 命令 | 责任 |
| --- | --- |
| `npm run docs:check` | 文档链接、结构、状态和历史索引 |
| `npm run build` | docs、typecheck、unit、source、生成、Vite 和 dist validation |
| `npm run test:components` | React Catalog 组件和协议 fixture |
| `npm run test:e2e` | ordinary E2E 与串行 WebGL |
| `npm run test:visual` | 代表性视觉回归 |
| `npm run ci:artifact:create` / `ci:artifact:verify` | 创建或验证不可变站点 artifact |

相关变更完成前必须运行 `npm run build`、`npm run test:components` 和 `npm run test:e2e`。视觉变化只有在明确意图和人工审查后更新 baseline。

## 2. CI required layers

CI 分离 release policy、build、component、ordinary E2E、WebGL 和 visual。`CI / quality-gate` 必须显式确认所有层成功；failure、cancelled、意外 skipped 和 flaky 都不能视为通过。

测试 job 下载并验证 build artifact。任何 commit、digest、文件数或 artifact identity 不一致必须失败。

## 3. 失败证据

测试层上传 machine result 与深度 report。Diagnostics finalizer 汇总结构化结果，但不能覆盖真实质量结论。复现远端失败使用：

```bash
npm run ci:diagnose -- --run <run-id>
```

## 4. Hosted 与 standalone 覆盖

复杂 Specimen 至少需要两条测试路径：

- standalone：证明 item 独立运行；
- Catalog-hosted：证明 sandbox、bridge、application readiness 与 manifest controls 集成正确。

两者不能互相替代。

## 5. 证据选择

- 文档变化：docs check；若接入主检查链，还要 build。
- Catalog 行为：component + hosted ordinary E2E。
- 新 item：source/dist validation + standalone + hosted E2E。
- WebGL/Canvas/长动画：专项串行 E2E、application readiness 和 reduced motion。
- 代表性视觉变化：固定平台 snapshot，人工确认后才更新 baseline。
- 交付脚本：unit、artifact identity 和 CI workflow 证据。
