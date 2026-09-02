# 调试与诊断

状态：**LIVE**

## 1. 先定位故障层

| 现象 | 优先检查 |
| --- | --- |
| Catalog 空白或无项目 | `specimens.json` 请求、基址、CatalogProvider error |
| 独立 item 正常，Catalog 内失败 | iframe sandbox、资源相对路径、MessageChannel、opaque origin |
| Viewer 显示已就绪但画面未完成 | application readiness、模块/资源异常、首帧信号 |
| controls 面板变化但展品不变 | target 映射或 item 消息处理器 |
| Learning 标注消失 | viewport、scene controls、内部画面人工确认 |
| 本地通过但 CI artifact 失败 | 隐式重建、lockfile、digest、平台视觉差异 |
| 已部署页面与预期 SHA 不符 | artifact manifest、freshness check、Pages deployment |

## 2. 浏览器诊断顺序

1. 从 Catalog item route 复现，不只打开独立 HTML。
2. 记录外层页面、iframe 和网络请求的 console/error。
3. 检查 iframe sandbox 与 manifest runtime 是否一致。
4. 区分 document load、bridge ready、application initialized 和 first meaningful frame。
5. 操作一项 control，触发 pause/resume，再验证独立 URL。
6. 对生产构建问题使用现有 `dist`，避免开发服务器转换掩盖差异。

## 3. 本地命令

```bash
npm run check
npm run build
PLAYWRIGHT_USE_EXISTING_DIST=1 npm run test:e2e:ordinary
PLAYWRIGHT_USE_EXISTING_DIST=1 npm run test:webgl
```

Playwright 默认使用 4173，组件 gallery 使用 4174；需要覆盖端口时使用配置支持的环境变量。共享端口调整或用户级浏览器安装受本机 Steward 规则约束。

## 4. CI 诊断

远端失败优先下载结构化 diagnostics：

```bash
npm run ci:diagnose -- --run <run-id>
```

确认失败 job、machine result、site artifact identity、commit SHA 和 retry attempt。Diagnostics 用于解释失败，不会把 failed、cancelled、unexpected skipped 或 flaky 改判为成功。

## 5. 修复边界

- 运行时错误在作者源码修复，不直接改 `.generated/` 或 `dist/`。
- 构建适配问题在 scripts 与对应 source contract 修复。
- 不用放宽 sandbox、关闭校验或自动更新视觉基线来消除症状。
- 生产 smoke 失败时停止宣称发布完成；修复后以明确 commit 重新走完整门禁。
