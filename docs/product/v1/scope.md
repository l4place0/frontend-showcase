# 产品范围 v1

状态：**FROZEN**

## 1. 产品目标

为人类学习者、视觉探索者和 AI 提供同一套可浏览、可运行、可解释、可复用的前端样品。

## 2. 必须提供

- Catalog：浏览、分类、搜索、稳定路由、控制与相邻导航。
- 独立 Specimen：每件展品可脱离 Catalog 运行，资源全部本地化。
- 安全嵌入：manifest-driven sandbox、默认拒绝权限、无 `allow-same-origin`。
- Protocol v1：开放 category/renderer、MessageChannel controls 和 lifecycle。
- 学习体验：每件展品有结构化 learning resource，并与作者源码绑定。
- AI 发现：每件展品发布 `AI.md`、`ai-context.json` 与 manifest；站点发布 catalog 与 `llms.txt`。
- 交付身份：同一不可变 artifact 经完整门禁后部署到 GitHub Pages。
- 可访问性与动效：键盘、窄屏、reduced motion 和代表性视觉回归得到验证。
- 故障可见性：catalog、iframe、协议与 learning 的失败不能伪装成成功或空状态。

## 3. 当前馆藏

当前源码 catalog 包含 64 件展品：60 件样式/布局、1 件 CSS 动画和 3 件 WebGL。数量是当前事实，不是封闭枚举；新增类别和 renderer 不需要修改 Protocol v1 的类型边界。

## 4. 非目标

- 在线可视化编辑器或用户生成内容平台；
- Catalog 与 item 共享组件树或运行时状态；
- 运行时 CDN、远程字体或远程核心素材；
- 服务器端账户、数据库和多人协作；
- 自动接受视觉基线或以 AI 判断替代确定性质量门禁；
- 为兼容模块加载而降低 iframe 隔离权限。

## 5. 产品完成证据

产品能力由 schema/source validation、独立构建、component、ordinary E2E、WebGL、visual、artifact identity 和 production smoke 共同证明。单一页面可见、bridge ready 或测试数量不能替代这些证据。

具体受众、旅程和内容准入分别由同目录的定位、能力与内容契约补充；发生冲突时，本 scope 定义产品边界，内容契约定义单件展品的接纳门槛。
