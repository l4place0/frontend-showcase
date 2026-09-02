# Definition of Done

状态：**LIVE**

## 1. Feature 分支完成

- [ ] 目标与请求或工作单元一致，没有无关修改。
- [ ] Catalog/item runtime、sandbox、Protocol v1 和本地资产边界未被破坏。
- [ ] 新行为有 focused tests；复杂 item 同时覆盖 standalone 与 hosted 路径。
- [ ] 用户可见变化完成真实浏览器检查。
- [ ] 当前架构、产品、工作流和 history 与实现一致。
- [ ] 新增或修订 item 的 manifest、learning、AI 和 thumbnail 资源相互一致。
- [ ] Learning 中的代码片段、locator、source scope 与 digest 仍绑定当前作者源码。
- [ ] `npm run build`、`npm run test:components`、`npm run test:e2e` 通过。
- [ ] 视觉变化已明确审查；未意图改变视觉时不更新 baseline。
- [ ] diff 不含 `dist/`、`.generated/`、日志、报告或 build-info。

## 2. 可以合入 dev

- [ ] PR base 是 `dev`，head 是 `feature/*`。
- [ ] PR 描述包含目标、变更、非目标、验证、风险和回滚。
- [ ] `CI / quality-gate` 成功且没有未分类 flaky 或 skipped。
- [ ] 文档工作单元至少进入 `validating`，实际验证已记录。
- [ ] 所有 review conversation 已处理。

## 3. dev 可以晋级 main

- [ ] Release PR 是 `dev -> main`。
- [ ] dev 当前 SHA 的完整门禁健康。
- [ ] 已知限制、迁移和回滚路径明确。
- [ ] 合并代表立即发布生产的意图。

## 4. 发布完成

- [ ] 部署来源、artifact、digest 与目标 main SHA 一致。
- [ ] production smoke 验证首页、catalog、代表 item 和发现资源。
- [ ] 没有未处理的生产错误。
- [ ] 适用的 history post-validation 已更新，遗留问题有独立工作项。
