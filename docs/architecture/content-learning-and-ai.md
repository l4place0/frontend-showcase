# 内容、学习与 AI 架构

状态：**LIVE**

## 1. 四种内容来源

| 类型 | 作者源码 | 生成方式 |
| --- | --- | --- |
| 视觉风格 | `src/themes/<slug>.css` + 共享 portfolio fixture | 主题 CSS 与共享 HTML、bridge 组合 |
| 页面布局 | `src/layouts/<slug>.css` + zen theme + 共享 fixture | 布局 CSS 与共享 HTML、bridge 组合 |
| 自包含 item | `specimens/items/<id>/` | 复制本地目录，必要时构建期 bundle |
| 学习资源 | `specimens/learning/items/<id>.json` | 原样发布并写入 digest 与发现信息 |

馆藏注册表为每种来源补充公开身份、运行权限、控制、预览和 AI 路径。新增 renderer 时必须同时提供生成适配器与校验策略，不能只给 catalog 增加一个字符串。

## 2. Learning Contract v1

每件 item 必须有同 id 的学习源文件。学习资源包含版本、内容修订、目标、前置知识、至少四个步骤、常见错误、延伸阅读和完成标准。

质量门禁还要求整套教程至少包含：

- 与明确 scene contract 绑定的展品标注；
- 来自该 item 作者源码的精确代码片段及 SHA-256 digest；
- 与 manifest control 类型和值域一致的交互实验；
- 选项唯一、正确索引有效且答案位置不过度固定的掌握测验。

代码片段不是手工摘录的装饰。source validation 会确认文件归属、source scope、locator、原文包含关系和 digest；作者源码变化后必须显式修订学习内容。

## 3. 标注场景

定位标注只在 viewport、宿主 controls 和人工确认的 item 内部画面同时匹配时显示。窄屏或场景偏离时隐藏标注，避免把教学箭头指向错误对象。Catalog 可以恢复宿主参数，但不能伪造 item 内部滚动或镜头状态。

## 4. AI 发现

每件构建产物发布：

- `AI.md`：面向生成与复现的可读提示，具有固定章节；
- `ai-context.json`：item、prompt、learning、作者源码和 artifact digest 的结构化上下文；
- `specimen.json`：运行和控制契约；
- `learning.json`：人类教程的公开副本。

站点根还发布 `specimens.json` 和 `llms.txt`。item HTML 通过 discovery links 和内嵌 context 暴露这些资源，使独立 URL 不依赖 Catalog 才能被理解。

## 5. 修订规则

- 视觉或交互变化影响教程时，更新 learning 内容并递增 `contentRevision`。
- 学习 schema 不兼容变化才提升 `learningVersion`；当前只接受 v1。
- item id 变化必须迁移 catalog、学习文件、资源路径、路由与测试。
- AI prompt 必须描述实际产物，不能引用只有 Catalog 才存在的 DOM 或 CSS。
