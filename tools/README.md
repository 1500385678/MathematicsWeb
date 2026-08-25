# tools/ · 工具脚本说明

本目录存放 MathematicsWeb 项目的辅助脚本,均为**纯 Python 3 标准库**,无第三方依赖。

---

## 1. `md_to_json.py` · md → 知识图谱 JSON(写入器)

把 `_MathematicsLib/` 下 10 个分类目录的 md 解析为结构化 JSON,
作为 Phase 0 知识图谱的初始数据。

### 用法

```bash
cd _MathematicsLib/MathematicsWeb
python3 tools/md_to_json.py
```

### 输入

`_MathematicsLib/` 下形如 `NN_xxx/` 的分类目录,每个目录内 1 份 `.md`。
本批次共 10 个目录(01-数学起源与演变 … 10-数学趣闻与奇观)。

### 输出

`docs/knowledge_graph.json` · 结构:

```json
{
  "schema_version": 1,
  "node_count": 10,
  "total_chars": 12345,
  "total_sections": 45,
  "nodes": [
    {
      "id": "01_数学起源与演变",
      "title": "数学起源与演变",
      "category": "起源与演变",
      "tags": ["数学史", "数学起源", "数学发展"],
      "audience": "数学爱好者 / 数学学习者 / 历史爱好者",
      "source": "数学史研究",
      "updated": "2026-05-30",
      "sections": [
        {
          "heading": "一、数学大师讲起源",
          "level": 2,
          "subsections": [
            {"heading": "数学是什么？", "level": 3, "body": "..."}
          ]
        }
      ],
      "stats": {"lines": 240, "chars": 8521, "subsections": 8},
      "source_file": "_MathematicsLib/01_数学起源与演变/数学起源与演变.md"
    }
  ]
}
```

### Frontmatter 约定(可选)

如需在 md 顶部覆盖默认值,可用 YAML frontmatter:

```markdown
---
id: custom-id
tags: [自定义标签, 覆盖元数据]
category: 自定义分类
source: 自定义来源
---

# 标题
...
```

> 不写 frontmatter 也可,脚本会自动从顶部元数据列表(`- **字段**: 值`)提取。

### 容错

| 场景 | 行为 |
|------|------|
| md 无 frontmatter | 退化为元数据列表解析 |
| 元数据缺字段 | 填空字符串,不抛错 |
| 章节为 0 | 节点仍生成,sections=[] |
| 单文件解析失败 | 跳过该文件,打印 warning,继续处理其他 |

### 不做什么(留给后续 phase)

- 不写 SQLite/PostgreSQL 灌库(Phase 0 后半)
- 不写 FastAPI 接口(Phase 1)
- 不写 React 前端(Phase 1)
- 暂不解析 6 份 K12/大学/应用 知识点体系 md(等张勇补完后扩展)

---

## 2. `graph_query.py` · 知识图谱查询 CLI(读取器)

读取 `md_to_json.py` 生成的 `docs/knowledge_graph.json`,提供子命令查询。

### 用法

```bash
cd _MathematicsLib/MathematicsWeb
python3 tools/graph_query.py <subcommand> [args]
```

### 子命令

| 子命令 | 作用 | 示例 |
|--------|------|------|
| `list` | 列出全部节点(摘要) | `graph_query.py list` |
| `get <id>` | 查单个节点完整 JSON | `graph_query.py get 01_数学起源与演变` |
| `category <name>` | 按 category 过滤(大小写不敏感) | `graph_query.py category 应用与建模` |
| `tag <name>` | 按 tag 过滤(大小写不敏感) | `graph_query.py tag 数学史` |
| `search <keyword>` | 全文搜索 title/章节/子节标题 | `graph_query.py search 欧几里得` |
| `stats` | 全图统计 + 分类分布直方图 | `graph_query.py stats` |
| `paths` | 打印 REPO_ROOT / GRAPH_FILE | `graph_query.py paths` |

### 约定

- 无第三方依赖,纯 Python 标准库。
- id / category / tag 默认大小写不敏感。
- 找不到结果时 exit code = 0(打印空),便于管道组合。
- 参数错误(缺子命令/关键词为空)时 exit code = 2。
- 输出统一用 UTF-8,中文不转义,直接对齐 `md_to_json.py` 的 JSON 格式。

### 用途

- Phase 0 飞书 Bot:把 `get` / `search` 包装成"按知识点查" / "关键词搜"两个意图。
- Phase 1 FastAPI:把每个子命令直接映射成 `/graph/...` 路由(后续)。
- 人工 debug:看当前 10 个分类长什么样、字符分布均不均。

---

## 变更记录

| 日期 | 变更 | 作者 |
|------|------|------|
| 2026-08-25 | 新增 `graph_query.py`:list/get/category/tag/search/stats/paths 7 个子命令 | 14-数学-Mathematics |
| 2026-08-24 | 初版:解析 10 个分类目录 md → JSON,容错 frontmatter | 14-数学-Mathematics |
