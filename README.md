# 前端样品博物馆

一个面向人类与 AI 的前端样品平台。React Catalog 负责浏览、搜索、控制和展示；每件 Specimen 都在沙箱 iframe 中独立运行，并携带可供 AI 直接参考的提示词与结构化上下文。

当前馆藏包含 30 个视觉风格与 30 个布局样品。协议采用开放分类，后续可继续加入 CSS 组件、CSS 动画、Canvas、WebGL、Shader 和其他前端实验。

## 开发

环境要求：Node.js 20+。

```bash
npm install
npm run dev
```

常用命令：

| 命令 | 用途 |
| --- | --- |
| `npm run build` | 校验源码、生成60件独立展品、构建 SPA 并验证产物 |
| `npm run test:unit` | Vitest 逻辑测试 |
| `npm run test:components` | Playwright React 组件测试 |
| `npm run test:e2e` | Catalog、iframe、协议与 AI 资源测试 |
| `npm run test:visual` | 代表性展品视觉回归 |
| `npm run preview` | 预览 `dist/` |

## 架构

```text
React Catalog SPA
  └─ Specimen Viewer
       └─ sandboxed iframe
            └─ independent Specimen Item
```

- `src/`：React Catalog，以及现有 portfolio fixture 的模板和样式源码。
- `specimens/catalog.mjs`：60件现有展品的源注册表。
- `specimens/specimen.schema.json`：Specimen Protocol v1。
- `scripts/`：目录生成、展品构建和产物校验。
- `.generated/public/`：临时生成的 Vite publicDir，不提交。
- `dist/`：GitHub Pages 部署产物，不提交。

每件构建后的展品包含：

```text
items/<id>/
├─ index.html
├─ specimen.json
├─ AI.md
└─ ai-context.json
```

站点根目录同时发布 `specimens.json` 和 `llms.txt`。将独立展品的 `index.html` URL 交给 AI，即可发现对应提示词、Manifest 和机器可读上下文。

## 添加展品

新展品必须：

- 独立运行，不依赖 Catalog DOM 或 React Context；
- 使用 Manifest 声明开放分类、标签、能力和控制参数；
- 资源本地打包，不使用运行时 CDN；
- 提供 `AI.md`；
- 通过 MessageChannel 响应控制和生命周期消息；
- 通过源码与产物校验，并补充相应 Playwright 测试。

部署基址为 `/frontend-showcase/`，推送 `main` 后由 GitHub Actions 构建、执行浏览器测试并发布到 GitHub Pages。

## 分支工作流

- `main` 是生产分支，只接收已经在 `dev` 完成全量验证的版本。
- `dev` 是唯一的开发集成分支；日常开发不直接提交到 `main`。
- 功能开发从最新 `dev` 签出，命名为 `feature/<topic>`，完成并验证后合并回 `dev`。
- `dev` 通过 `npm run build`、`npm run test:components`、`npm run test:e2e` 和 `npm run test:visual` 后，才允许合并到 `main`。
- `.prototype-engineering/` 在 `dev` 与由其签出的开发分支中纳入版本控制，用于保存原型谱系、边界、证据与决策记录。

标准流程：

```bash
git switch dev
git pull --ff-only
git switch -c feature/my-change

# 完成开发和验证后
git switch dev
git merge --no-ff feature/my-change

# dev 全量验收通过后，再创建 dev → main 的生产合并
```
