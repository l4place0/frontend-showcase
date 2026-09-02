# 当前架构决策

状态：**LIVE**

## 1. 决策表

| ID | 决策 | 当前依据 | 变更门槛 |
| --- | --- | --- | --- |
| AD-001 | Catalog 与 item 是独立 runtime | 隔离、防污染、独立分享和 AI 发现 | 产品与安全边界复审 |
| AD-002 | iframe 权限 manifest-driven、default-deny | 最小权限与开放 protocol | 安全复审；不得直接加入 `allow-same-origin` |
| AD-003 | controls/lifecycle 使用 MessageChannel | 明确通信契约，不依赖宿主 DOM | Protocol 版本或兼容策略 |
| AD-004 | 生产 item 只使用本地资产 | 可复现、离线验证和供应链控制 | 产品与交付架构复审 |
| AD-005 | sandbox item 的模块图在构建时打包 | opaque origin 下运行时 ES module 不可靠 | 需要等价安全模型与 hosted 证据 |
| AD-006 | CI build once、test artifact、promote without rebuild | 部署身份可追踪 | 新的 artifact promotion 设计和验收 |
| AD-007 | `.prototype-engineering/` 留在 Git、不进入部署 | 保留原型谱系且隔离生产产物 | 仓库治理复审 |
| AD-008 | 文档分为 current truth 与 history | 防止旧基线、旧数量和旧结论污染当前说明 | 文档工程 v2 |
| AD-009 | Catalog 运行时读取生成的 `specimens.json` | 本地预览、CI artifact 与生产使用相同数据路径 | 数据加载架构复审 |
| AD-010 | Learning 代码证据绑定作者源码 digest | 防止教程片段随实现漂移 | Learning Contract 版本或证据模型复审 |
| AD-011 | Hash routing 与固定 Pages base | 静态托管下保持深层产品路由稳定 | 托管平台或路由策略变化 |

## 2. 明确禁止

- item 依赖 Catalog DOM、React context 或全局 CSS；
- 在 item frame 添加 `allow-same-origin`；
- 直接编辑 `.generated/` 或 `dist/`；
- 在运行时从 CDN 获取脚本、字体或核心媒体；
- 测试 job 重新构建待部署产物；
- 把 bridge ready 当作所有复杂应用的 application ready；
- 把历史验收记录原位改写成当前架构说明。
