# 文档工程重构验证记录

状态：**LIVE**

## 验证对象

分支：`feature/docs-engineering`。

## 最新本地验证结果

验证日期：2026-08-29。

| 命令 | 结果 |
| --- | --- |
| `npm run docs:check` | 通过；检查 50 个 Markdown 文件和 3 个已索引历史单元 |
| `npm run build` | 通过；6 个单测通过，64/64 缩略图生成成功，64 个独立产物通过验证 |
| `npm run test:components` | 通过；9/9 |
| `PLAYWRIGHT_USE_EXISTING_DIST=1 npm run test:e2e` | 通过；普通 E2E 23/23，WebGL 专项 6/6 |
| `git diff --check` | 通过；无空白错误 |

这轮结果在 architecture、product、workflows 内容重建后重新执行，不沿用只有目录迁移时的首次结果。

## 观察

- Node 进程输出了 `NO_COLOR` 被 `FORCE_COLOR` 覆盖的警告，不影响测试结论。
- Gargantua 的生产构建 WebGL 专项通过；此前开发态真实页面暴露的沙箱 ES module 加载缺陷仍作为独立运行时问题保留，本次未修改运行时代码。
- 未运行视觉基线测试，因为本次没有代表性视觉变更。
- 对照 `src/`、两份 schema、catalog、build/validation scripts、Playwright 配置和 CI workflow 抽查长期文档事实；没有把可执行字段表复制成第二来源。
