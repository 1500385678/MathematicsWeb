# tools/ · 工具脚本说明

本目录存放 MathematicsWeb 项目的辅助脚本,均为**纯 Python 3 标准库**,无第三方依赖。

---

## 1. `md_to_json.py` · md → 知识图谱 JSON

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

## 变更记录

| 日期 | 变更 | 作者 |
|------|------|------|
| 2026-08-24 | 初版:解析 10 个分类目录 md → JSON,容错 frontmatter | 14-数学-Mathematics |
