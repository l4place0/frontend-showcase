# Catalog runtime

状态：**LIVE**

## 1. 责任

Catalog 是 React SPA，负责读取公开馆藏、呈现集合和详情页、持久化控制与学习进度，并把一件 Specimen 作为不透明的独立文档托管。它不负责展品内部渲染。

## 2. 路由模型

应用使用 `HashRouter`，以兼容 GitHub Pages 静态托管和 `/frontend-showcase/` 基址。

| 路由 | 责任 |
| --- | --- |
| `#/` | 产品入口与馆藏导览 |
| `#/collections` | 风格和布局集合入口 |
| `#/collections/:category` | 开放 category 的过滤视图 |
| `#/collections/css-animation` | CSS 动画策展页 |
| `#/collections/webgl` | WebGL 策展页 |
| `#/items/:id` | 单件展品、控制、学习和 AI 参考 |
| 其他 | Not Found |

页面切换会恢复顶端滚动位置。稳定的 item id 是路由、learning、持久状态和公开资源之间的主键，因此重命名属于迁移，不是普通文案修改。

## 3. 数据加载

`CatalogProvider` 在启动时请求基址下的 `specimens.json`，并从 item 的 `category` 动态推导分类集合。加载失败必须显式呈现，不能回退到编译时复制的第二份馆藏。

Catalog 消费的是生成后的公开 manifest，不直接导入 `specimens/catalog.mjs`。这使本地预览、CI artifact 和生产站点遵循同一数据路径。

## 4. Item 页面组合

详情页把以下能力组合在同一产品表面，但保持数据责任分离：

- Specimen viewer：沙箱 iframe、连接状态、刷新、重置和全屏容器；
- Manifest controls：根据 control descriptor 渲染并通过 MessageChannel 下发；
- Learning workspace：读取 `learning.json`，管理步骤、标注、实验、测验和完成度；
- AI reference：发现 `AI.md` 与机器上下文；
- 相邻导航：基于当前 catalog 顺序，而非 item 内部知识。

## 5. 浏览器状态

控制值和学习进度可以保存在浏览器本地，但它们都是可丢失的客户端状态，不是服务端账户数据。学习进度 key 包含 item id、learning version 与 content revision；内容修订可以自然隔离旧进度。

## 6. 失败边界

Catalog 至少区分馆藏加载失败、iframe 文档加载失败、协议握手超时和 item 主动报告错误。桥接成功只更新 viewer 的协议状态；应用级 readiness 由具体 item 和 E2E 负责。
