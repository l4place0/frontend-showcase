# 本地开发

状态：**LIVE**

## 1. 环境

要求 Node.js 20+，依赖由 `package-lock.json` 固定。首次准备：

```bash
npm ci
npx playwright install chromium
```

Playwright 浏览器属于用户级共享缓存，按本机环境治理规则先与 Steward 协调；仓库内 `npm ci` 不需要机器级协调。

## 2. 分支

```bash
git switch dev
git pull --ff-only
git switch -c feature/<topic>
```

不得从 `main` 开始日常开发，也不得把无关工作区修改带入功能分支。

## 3. 开发循环

```text
inspect source of truth
  -> make bounded change
  -> run focused check
  -> inspect diff
  -> run full required checks
```

- 修改 Catalog：使用 `src/`。
- 修改 Specimen：使用 `specimens/` 和相关构建脚本。
- 不编辑 `.generated/` 或 `dist/`。
- 运行开发站点使用 `npm run dev`。
- 需要测试已构建 artifact 时设置 `PLAYWRIGHT_USE_EXISTING_DIST=1`，避免隐式重建。

具体新增或修订展品见 [Specimen 创作与修订](./06-specimen-authoring.md)。故障分层见[调试与诊断](./07-debugging-and-diagnostics.md)。

## 4. 真实浏览器检查

用户可见或 iframe 相关变化必须在真实 Catalog 路径验证，而不能只访问独立 item。至少检查外层 viewer、sandbox iframe、应用 readiness、controls/lifecycle 和 console errors。

开发服务器会先生成 `.generated/public` 再启动 Vite。若只修改 author source 而生成物没有同步，应重新运行 `npm run generate` 或重启 `npm run dev`，不要手工修补生成目录。
