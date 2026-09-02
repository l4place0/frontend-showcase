# Specimen 创作与修订

状态：**LIVE**

## 1. 先选择来源模型

| 需求 | 来源模型 | 修改位置 |
| --- | --- | --- |
| 在共享 portfolio 上增加视觉语言 | theme | `src/themes/<slug>.css` |
| 在共享 portfolio 上增加内容编排 | layout | `src/layouts/<slug>.css` |
| 自己拥有 HTML、脚本、资源或复杂 runtime | static item | `specimens/items/<id>/` |

不要为只需一个 CSS 文件的变化复制完整 HTML，也不要把复杂应用塞进共享 fixture。新的生成模型或 renderer 需要独立架构工作单。

## 2. 建立身份与作者源码

1. 选择稳定 kebab-case id；layout 会使用 `layout-<slug>`。
2. 在 `specimens/catalog.mjs` 登记双语标题、描述、开放 category、tags、technology、renderer、runtime 和 controls。
3. Theme/layout 创建对应 CSS；static item 创建完整本地目录及 `AI.md`。
4. 有模块图、npm 依赖或 opaque-origin 兼容需求的 static item 声明构建期 bundle。
5. 选择 `capture` 或仅用于 static item 的 `poster` 预览策略。

Runtime 只声明确实需要的权限。不得加入 `allow-same-origin`，也不得用远程依赖绕过本地构建问题。

## 3. 建立 controls

- 每个 control key 在 item 内唯一，并有合法类型和 default；数值应声明合理 min/max。
- CSS variable 或 data attribute 可使用通用 target 映射。
- 复杂应用控制由 item 显式处理 `specimen:set-controls`。
- reset、pause、resume 和 reduced motion 必须与持续动画或资源消耗一致。

完成后用真实行为证明控制有效，不能只验证面板输入值。

## 4. 建立 Learning Contract

在 `specimens/learning/items/<id>.json` 创建同 id 资源，并满足 `specimens/learning.schema.json`：

1. 写明目标、难度、时间、概念、前置知识和至少四个步骤。
2. 至少一个步骤包含 scene-bound annotations。
3. 至少一个步骤引用允许的作者源码精确片段，并计算当前 SHA-256 digest。
4. 至少一个步骤包含合法 control experiment。
5. 至少一个步骤包含 mastery quiz，并避免所有正确答案固定在同一位置。
6. 写明 common mistakes、further reading 和 completion criteria。

作者源码或教学含义改变时递增 `contentRevision`。可使用仓库迁移/脚手架脚本辅助机械生成，但最终内容必须人工复核。

## 5. 生成与聚焦验证

```bash
npm run check
npm run generate
npm run dev
```

在独立 item URL 和 Catalog `#/items/<id>` 两条路径检查：资源加载、协议连接、controls、生命周期、窄屏、reduced motion、learning scene、AI links 和 console errors。

根据变更添加或更新：

- component test：Catalog 组件或通用协议行为；
- ordinary E2E：普通 item、学习、隔离和资源发现；
- WebGL E2E：图形、长路径、首帧或 GPU 生命周期；
- visual：代表性、稳定且确有产品意义的视觉表面。

## 6. 完整验收

至少执行：

```bash
npm run build
npm run test:components
PLAYWRIGHT_USE_EXISTING_DIST=1 npm run test:e2e
```

有意视觉变化再运行并审查 `npm run test:visual`；更新 baseline 必须是明确决策。最后确认工作区没有 `dist/`、`.generated/`、报告、日志或 build-info。
