# CI/CD v1 实施与验收记录

## 1. 首次生产采用

| 项目 | 证据 |
| --- | --- |
| Feature PR | `#3`，`feature/ci-cd-v1-docs → dev` |
| Dev integration SHA | `bf2cd782f3c45d388503beff4f59592eef7d04e4` |
| Release PR | `#4`，`dev → main` |
| Production SHA | `63b4a58c3d96490fdbedc30f1805f29a9725bbe5` |
| Production run | `31876248218` |
| Deployment | `5919023547`，状态 `success` |
| Production URL | <https://l4place0.github.io/frontend-showcase/> |
| Dist digest | `sha256:2389b3aa367abfaad58a86fa6e2ed5b79d252f93a409243d0935806b97f768e1` |
| Artifact contents | 376 files，46,211,451 bytes，62 件 Specimen |

生产 run 结果：

```text
release-policy   success
build            success, 26s
component        success, 7/7
ordinary E2E     success, 20/20
WebGL E2E        success, 2/2, one worker, no flaky
visual           success, 4/4
quality-gate     success
diagnostics      success
package-pages    success, no project build
deploy           success
production-smoke success
```

线上 `artifact-manifest.json`、GitHub deployment SHA 和 `main` SHA 三者均为 `63b4a58…`。独立 smoke 再次验证首页、Protocol v1 的 62 项 catalog、代表 WebGL item 与 `AI.md`、`ai-context.json`、`learning.json`。

## 2. Artifact 身份链

首次生产 run 只执行一次 `npm run build`。Build job 随后产生：

- `site-<SHA>-attempt-1`：包含 `dist/` 和 `artifact-manifest.json`；
- `site-manifest-<SHA>-attempt-1`：供 finalizer 低成本读取身份；
- manifest 中的 commit、run、attempt、Node、lockfile digest、dist digest、文件数和字节数。

E2E、WebGL、visual 和 package-pages 分别下载相同名称的 site artifact 并重新计算 dist digest。Pages packaging 只复制已校验的 `dist` 并附加 manifest，不执行 build。线上 smoke 再读取该 manifest 验证预期生产 SHA。

Artifact 审计确认不包含 `.prototype-engineering/`、`.generated` 源路径、本地日志或测试报告。

## 3. 受控失败与修正

首次 feature PR run `31874954724` 是一次有效的受控失败演练：

- build、component 和 ordinary E2E 成功；
- visual 因 macOS baseline 被 Linux runner 复用而失败；
- WebGL 完整路径三次均在最后图片样式检查附近触及 120 秒；
- quality-gate 失败；
- package-pages、deploy、production-smoke 全部跳过；
- 各层 report、trace、video、截图和结构化 diagnostics 均被保存。

修正没有降低断言或像素容差：

1. Visual snapshot path 增加 `{platform}`，人工审查并分别保存 Darwin/Linux baseline。
2. WebGL 继续使用专用 job、单 worker、非 fully-parallel 和 fail-on-flaky；仅将已分类的 Linux 软件渲染完整路径预算从 120 秒调整为 180 秒。
3. 后续 PR/dev/main 三类真实 run 的 WebGL 均在首次 attempt 通过。

## 4. 可观测性成本反馈

受控失败 run 的第一版 diagnostic finalizer 重复下载并上传深度附件，诊断包达到 276,127,002 bytes。根据该成本探针立即修正数据平面：

- 每层额外上传小型 `*-machine-*` JSON artifact；
- finalizer 只下载 machine results 和 412-byte manifest probe；
- 结构化 `ci-diagnostics-*` 降至 4,599 bytes；
- HTML、trace、video 和 screenshot 仍在独立 `*-report-*` 中保留 14 天；
- `ci:diagnose` 默认快速读取核心证据，`--with-reports` 才下载深度附件。

这次优化由真实数据触发，而不是规模猜测；质量门槛和失败证据均未削弱。

## 5. Agentic 验收

使用以下单一入口完成远端证据读取：

```text
npm run ci:diagnose -- --run 31875509492
```

命令成功完成：

- 下载结构化 diagnostic artifact；
- 定位仓库、event、head/base、merge SHA 和 run attempt；
- 下载并重新验证 site artifact 的 commit、376 个文件、字节数和 dist digest；
- 输出 Playwright `1.62.1`、Node `22.23.2`、各层 workers、33 个测试结果、慢测试与复现命令；
- 默认不下载大体积深度附件。

Agent 的 workflow 权限保持 `contents: read`；只有 deploy job具有 `pages: write` 和 `id-token: write`。诊断能力不产生 protected branch 或生产绕过能力。

## 6. 平台治理验收

`dev` 与 `main` 均已配置：

- 必须通过 PR；
- required check 为稳定名称 `CI / quality-gate`；
- strict/up-to-date 为 true；
- required approvals 为 0，符合单人维护阶段；
- dismiss stale reviews 与 conversation resolution 开启；
- admin enforcement 开启；
- force push 和 branch deletion 禁止。

`github-pages` environment 使用 custom branch policy，只允许 `main`。Repository Actions 默认 workflow 权限为 read。非法 feature → main 由 release-policy 在 build 前拒绝，合法生产路径只有 dev → main。

## 7. 后续观察

首次验收不构成长期性能结论。继续按 20–30 次代表性 run 观察：

- ordinary E2E 与 WebGL P50/P95；
- Chromium 安装与 npm cache 命中；
- report artifact 在成功/失败场景的大小差异；
- WebGL flaky、超时和首次 frame/readiness；
- runner minutes、cancellation 与 artifact retention 成本。

在数据触及明确阈值前，不引入 path filtering、sharding、浏览器 cache、固定容器或跨 run promotion。
