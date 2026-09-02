# 内容接纳契约 v1

状态：**FROZEN**

## 1. 接纳单位

产品接纳的最小单位是一件完整 Specimen，而不是一张截图或一个孤立 CSS 文件。每件生产 item 必须同时具备身份、可运行内容、学习资源、AI 资源、预览和验证覆盖。

## 2. 必备内容

| 面向 | 必备内容 |
| --- | --- |
| 人类体验 | 独立 `index.html`、本地样式/脚本/媒体、响应式与 reduced-motion 行为 |
| Catalog | manifest metadata、category、tags、renderer、runtime、controls、thumbnail |
| 学习 | 同 id 的 Learning Contract v1，包含标注、作者源码、实验与测验 |
| AI | `AI.md`、`ai-context.json` 和发现链接 |
| 运维 | source/dist validation、hosted E2E；视觉或复杂 runtime 的专项证据 |

## 3. 内容分类

当前产品策展视觉风格、页面布局、CSS 动画和 WebGL，但 category 与 renderer 保持开放。新类别可以加入 v1，条件是 Catalog 能展示、生成器能产出、质量门禁能验证，且不会破坏独立 runtime 契约。

## 4. 不接纳

- 依赖 Catalog DOM、React context 或宿主全局样式才能工作的 item；
- 运行时请求 CDN、远程字体或未归档核心素材的 item；
- 通过 `allow-same-origin` 才能运行的实现；
- controls 只在面板显示、对 item 没有真实效果的内容；
- 学习代码无法回溯到允许的作者源码或 digest 已过期的内容；
- 只有 standalone 演示、没有 Catalog-hosted 沙箱验证的复杂 item；
- 无明确许可或来源记录的媒体资产。

## 5. 修订与下架

修订不得悄悄破坏稳定 id 或资源 URL。重大内容替换应递增 learning content revision、更新缩略图与相关基线，并记录历史工作单。内容不能继续满足安全、许可或独立运行要求时，应先从 catalog 下架，再保留可审计的历史说明。
