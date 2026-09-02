# 构建与交付架构

状态：**LIVE**

## 1. 源码到产物

```text
src/ + specimens/ + scripts/
  -> validate-source
  -> generate catalog and item directories
  -> generate deterministic thumbnails
  -> Vite build
  -> validate-dist
  -> dist/
```

`validate-source` 先验证 manifest、learning、作者源码归属和 control 值。随后生成公开 catalog，构建 60 个共享 fixture item 和 4 个自包含 item，再产生 1200×900 WebP 缩略图。Vite 以 `.generated/public` 为 publicDir 构建 Catalog，最后 `validate-dist` 从消费者视角重新校验所有公开资源。

自包含 Specimen 源目录会被复制到生成目录。声明 `bundle` 的 item 由 esbuild 生成本地 IIFE；需要 npm 包、模块图或 sandbox 兼容性的 item 应使用这条路径。构建器同时注入 discovery links、context 与 Protocol bridge。

## 2. 公开产物契约

```text
site artifact/
|- artifact-manifest.json        CI 身份封套
`- dist/
   |- index.html + assets/       Catalog SPA
   |- specimens.json            公开馆藏
   |- llms.txt                   AI 入口
   `- items/<id>/
      |- index.html + item-owned local assets
      |- specimen.json + thumbnail.webp
      `- learning.json + AI.md + ai-context.json

Pages package/
  = verified dist contents + artifact-manifest.json at public root
```

缩略图必须为 1200×900 WebP 且不超过 200 KB。Public manifest 内的 item 资源链接使用相对路径，使目录可独立托管和验证。

## 3. Build once

CI 对一个 commit 只执行一次完整生产构建。ordinary E2E、WebGL 和 visual 下载并校验同一份 immutable site artifact，不允许测试 job 隐式重建。

Artifact manifest 记录 commit、run、attempt、Node、lockfile digest、dist digest、文件数和字节数。身份或 digest 不匹配属于强制失败，不是 telemetry warning。

## 4. 质量分层

| 层 | 责任 |
| --- | --- |
| source/build | schema、TypeScript、unit、生成、缩略图和 dist 完整性 |
| component | Catalog React 组件与协议 fixture |
| ordinary E2E | 导航、资源发现、隔离、学习与普通交互 |
| WebGL | 单 worker 的实时图形和长路径行为 |
| visual | 固定平台的代表性像素基线 |
| quality gate | 显式汇总所有 required layer |
| production smoke | 已部署 SHA、catalog、代表 item 与发现资源 |

## 5. Artifact 身份

构建 job 将 `dist/` 复制为 immutable site artifact，并记录 commit、run、attempt、Node、lockfile digest、dist digest、文件数和总字节数。下载者在运行测试或打包 Pages 前验证身份；测试报告不是站点 artifact 的一部分。

## 6. 部署边界

只有 `main` 的 production event 且 quality gate 成功时才能打包 Pages artifact。部署 job 是唯一拥有 Pages 与 OIDC 写权限的 job；package 和 deploy 都不重新构建项目。

完整的首次 CI/CD v1 形成过程和验收证据保存在[历史工作单元](../history/2026-08-15-ci-cd-v1/README.md)。
