# 前端风格博物馆

同一份真实落地页内容，分别放进 **30 种视觉风格**与 **30 种布局排版**中观察。项目最终交付为 63 个零外部依赖的静态 HTML 页面，可以部署到任意静态托管。

## 快速开始

环境要求：

- Node.js 20+
- Python 3.10+

```bash
npm run dev
```

打开 <http://127.0.0.1:8081/>。开发服务器会监听 `src/` 与 `build.py`，保存后自动重新生成并刷新浏览器。

如果 Python 不在系统 PATH，可显式指定：

```powershell
$env:MUSEUM_PYTHON = "C:\path\to\python.exe"
npm run dev
```

## 工程命令

| 命令 | 用途 |
| --- | --- |
| `npm run generate` | 从 `src/` 生成根目录 63 个 HTML |
| `npm run check` | 检查页面数量、结构、链接、参数柜和生成时效 |
| `npm run build` | 生成、校验，并输出可部署的 `dist/` |
| `npm run dev` | 自动生成 + 文件监听 + 浏览器热刷新 |
| `npm run preview` | 在 8082 端口预览 `dist/` 生产产物 |

项目没有前端运行时依赖，所有工程脚本均使用 Node.js 标准库。

## 目录结构

```text
.
├─ build.py                 # 页面目录与生成规则
├─ src/
│  ├─ template.html        # 60 个展品共享的内容结构与交互
│  ├─ base.css             # 基础设计系统和参数系统
│  ├─ themes/              # 30 套视觉主题
│  ├─ layouts/             # 30 套布局实验
│  ├─ portal.html          # 博物馆门户
│  ├─ gallery.html         # 风格展览柜
│  └─ layout-gallery.html  # 布局展览柜
├─ scripts/                # 开发、校验、打包、预览工具
├─ dist/                   # npm run build 生成，不提交
└─ *.html                  # build.py 生成的可直接浏览页面
```

## 维护原则

不要直接修改根目录 HTML，它们会在下一次生成时被覆盖。

- 内容或交互：修改 `src/template.html`
- 通用设计与参数：修改 `src/base.css`
- 视觉主题：修改 `src/themes/<slug>.css`
- 布局实验：修改 `src/layouts/<slug>.css`
- 展品目录：修改 `build.py` 中的 `THEMES` 或 `LAYOUTS`

提交前运行：

```bash
npm run build
```

## 设计实验

- 风格展品提供可拖动的「视觉调色台」。
- 布局展品提供可拖动的「布局实验台」。
- 门户每 10 秒随机切换主题，使用新旧页面快照交叉渐变。
- 展品内容来自 [l4place0](https://github.com/l4place0) 的公开项目数据，仅作为真实业务测试用例。
