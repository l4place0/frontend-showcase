# 文档工程重构实施记录

状态：**LIVE**

## 已实施

- 从 `origin/dev` 创建 `feature/docs-engineering`。
- 建立 docs 总入口和四个长期文档域。
- 将两组旧材料迁入 history archive。
- 建立本工作单元和复用模板。
- 增加文档与历史结构检查脚本。
- 将 `docs:check` 接入 `npm run check`。
- 更新仓库根 README 的当前馆藏事实、命令索引和文档入口。
- 重建 architecture，补充 Catalog runtime、内容/Learning/AI、公开产物和 source-of-truth 矩阵。
- 重建 product，补充受众、体验原则、能力旅程和内容接纳契约。
- 重建 workflows，补充 Specimen 创作、分层调试和证据选择。
- 校正 `specimens/README.md` 中 60 件时期的旧说明，并连接到长期文档。

## 适配判断

没有复制 man-dotcom 的业务 `model/` 目录。frontend-showcase 的稳定模型已经由开放的 Specimen Protocol schema、learning schema、catalog 和 tests 表达；再维护文档字段表会制造第二来源。

没有要求既有 archive 补写成完整新模板，因为那会事后虚构需求批准和验收过程。Archive 只增加根索引并保留原材料。
