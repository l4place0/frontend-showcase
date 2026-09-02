# 能力与用户旅程 v1

状态：**FROZEN**

## 1. 能力地图

| 能力 | 用户结果 | 最低产品行为 |
| --- | --- | --- |
| 发现 | 从馆藏定位感兴趣的作品 | 集合、开放分类、搜索/过滤、缩略图、稳定路由 |
| 体验 | 在真实页面中观察作品 | 独立 document、响应式呈现、本地资源、清晰加载状态 |
| 调参 | 理解关键设计变量 | manifest-driven controls、重置、可观察反馈 |
| 学习 | 从观察推进到掌握 | 多步骤视角、场景标注、源码、实验、测验、进度 |
| 复用 | 获得可追踪实现参考 | AI prompt、机器上下文、作者源码引用 |
| 分享 | 直接指向一件作品 | 稳定 Catalog item route 与独立 item URL |
| 维护 | 安全扩展馆藏 | 开放 protocol、确定性构建、分层验收 |

## 2. 主要旅程

### 浏览到体验

用户从首页或集合页进入详情，看到身份、标签和状态；viewer 完成协议连接后，用户操作声明的 controls，刷新或重置展品，并可移动到相邻作品。

### 体验到学习

用户在同一个 item runtime 周围切换学习视角。教程可以恢复宿主参数，但定位标注只在用户确认内部场景后出现。实验完成和测验结果形成仅在本地保存的进度。

### Item 到 AI

用户或 AI 从详情或独立 item URL 发现 manifest、prompt、learning 和 context。公开资源必须相互引用同一 id 和 content revision。

### 作者到生产

作者登记 item 与 learning，完成 source validation、独立构建、hosted browser validation 和视觉审查；经 dev 集成后，由同一 artifact 晋级生产。

## 3. 降级行为

- Catalog 加载失败时显示错误，不展示虚构的空馆藏。
- Learning 资源失败时不阻塞独立展品，但必须明确提示学习内容不可用。
- iframe 握手失败时 viewer 显示错误并允许刷新。
- 不满足标注 scene 时隐藏定位标注，保留文字教学。
- reduced motion 下停止可避免的重复运动，同时保留用户主动控制。
