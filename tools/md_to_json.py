#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
md_to_json.py — 把 _MathematicsLib/ 下的 10 个分类目录 md 解析为知识图谱 JSON。

约定 schema(每个分类节点):
{
  "id":         "01-数学起源与演变",        # 用目录名,稳定唯一
  "title":      "数学起源与演变",           # 来自一级 # 标题
  "category":   "起源与演变",              # 来自元数据 - **类型**: 知识库 > 数学 > <category>
  "tags":       ["数学史", "数学起源", ...],  # 来自元数据 - **关联技能**: a / b / c
  "audience":   "数学爱好者 / ...",         # 来自元数据 - **适用角色**
  "source":     "数学史研究",              # 来自元数据 - **来源**
  "updated":    "2026-05-30",             # 来自元数据 - **更新日期**
  "sections":   [                          # ## 一、/ ## 二、... + 各自子节
    {
      "heading": "一、数学大师讲起源",
      "level":   2,
      "subsections": [
        {"heading": "数学是什么？", "level": 3, "body": "..."},
        ...
      ]
    },
    ...
  ],
  "stats": {
    "lines":  240,
    "chars":  8521,
    "subsections": 8
  }
}

frontmatter 约定(YAML,可省略):
---
id: override-id
tags: [a, b, c]      # 覆盖元数据中的 tags
category: override   # 覆盖元数据
source: 自定义
---

容错策略:
- 文件无 frontmatter → 退化为元数据列表解析
- 元数据列表缺字段 → 填空字符串,不抛错
- ## 章节数为 0 → sections=[],节点仍生成
- 解析任何单文件失败 → 跳过该文件并打印 warning,继续处理其他文件
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

# ---- 路径常量 ----
REPO_ROOT = Path(__file__).resolve().parent.parent          # MathematicsWeb/
LIB_ROOT = REPO_ROOT.parent                                  # _MathematicsLib/
OUT_DIR = REPO_ROOT / "docs"
OUT_FILE = OUT_DIR / "knowledge_graph.json"

# 10 个分类目录(按编号排序,保证输出顺序稳定)
CATEGORY_DIRS = sorted(
    d for d in LIB_ROOT.iterdir()
    if d.is_dir() and d.name[:2].isdigit()
)

# ---- 正则 ----
RE_FRONTMATTER = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
RE_H1 = re.compile(r"^#\s+(.+?)\s*$")
RE_H2 = re.compile(r"^##\s+(.+?)\s*$")
RE_H3 = re.compile(r"^###\s+(.+?)\s*$")
RE_META = re.compile(r"^-\s+\*\*(.+?)\*\*\s*[:：]\s*(.+?)\s*$")


# ---------- 工具函数 ----------
def _strip_dir_prefix(name: str) -> str:
    """'01_数学起源与演变' → '数学起源与演变' """
    return re.sub(r"^\d{2}_", "", name)


def _parse_simple_yaml(s: str) -> dict[str, Any]:
    """极简 YAML 解析:仅支持 key: value 与 key: [a, b, c]。
    复杂嵌套请用 PyYAML,本脚本不依赖第三方库。"""
    out: dict[str, Any] = {}
    for line in s.splitlines():
        line = line.rstrip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$", line)
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip()
        # list
        if val.startswith("[") and val.endswith("]"):
            inner = val[1:-1].strip()
            out[key] = [x.strip().strip('"').strip("'") for x in inner.split(",") if x.strip()]
        else:
            out[key] = val.strip('"').strip("'")
    return out


def _parse_meta_list(lines: list[str]) -> dict[str, str]:
    """解析顶部元数据列表 - **字段**: 值 """
    out: dict[str, str] = {}
    for line in lines:
        m = RE_META.match(line)
        if m:
            out[m.group(1)] = m.group(2).strip()
    return out


def _safe_relative(p: Path) -> str:
    """相对 REPO_ROOT.parent 失败时,回退到绝对路径,保证不抛错。"""
    try:
        return str(p.relative_to(REPO_ROOT.parent))
    except ValueError:
        return str(p)


def _category_from_meta(type_str: str) -> str:
    """'知识库 > 数学 > 起源与演变' → '起源与演变' """
    if not type_str:
        return ""
    parts = [p.strip() for p in type_str.split(">")]
    return parts[-1] if parts else type_str


def _tags_from_skills(skills_str: str) -> list[str]:
    """'数学史 / 数学起源 / 数学发展' → ['数学史', '数学起源', '数学发展'] """
    if not skills_str:
        return []
    return [s.strip() for s in re.split(r"[/、,，]", skills_str) if s.strip()]


# ---------- 核心解析 ----------
def parse_md(md_path: Path, dir_name: str) -> dict[str, Any] | None:
    """解析单个 md 文件,失败返回 None(不抛错)。"""
    try:
        text = md_path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"  [WARN] 无法读取 {md_path.relative_to(REPO_ROOT)}: {e}", file=sys.stderr)
        return None

    lines = text.splitlines()
    pos = 0

    # 1) 可选 frontmatter
    front: dict[str, Any] = {}
    fm_match = RE_FRONTMATTER.match(text)
    if fm_match:
        try:
            front = _parse_simple_yaml(fm_match.group(1))
        except Exception:
            front = {}
        pos = fm_match.end()  # 按字符位置折算到行(简化:用 splitlines 的索引)
        # fm_match.end() 是字符偏移,需要换算
        consumed_chars = fm_match.end()
        consumed_lines = consumed_chars // 80  # 粗略(下面用更精确的方法)
        # 用更精确的方法:重新扫描行累加长度
        char_count = 0
        real_lines = 0
        for i, line in enumerate(lines):
            char_count += len(line) + 1  # +1 for \n
            if char_count >= consumed_chars:
                real_lines = i + 1
                break
        pos = real_lines

    # 2) 找第一个 H1 作为标题
    title = ""
    for i in range(pos, len(lines)):
        m = RE_H1.match(lines[i])
        if m:
            title = m.group(1).strip()
            pos = i + 1
            break

    # 3) 解析元数据列表(跳过空行,遇到 --- 或非元数据行停止)
    meta: dict[str, str] = {}
    while pos < len(lines):
        line = lines[pos]
        stripped = line.strip()
        if not stripped:
            pos += 1
            continue
        if stripped == "---":
            pos += 1
            continue
        m = RE_META.match(line)
        if m:
            meta[m.group(1)] = m.group(2).strip()
            pos += 1
        else:
            break

    # 4) 跳过元数据后到第一个 ## 之前的所有内容
    sections: list[dict[str, Any]] = []
    current_h2: dict[str, Any] | None = None

    while pos < len(lines):
        line = lines[pos]
        if RE_H2.match(line):
            m = RE_H2.match(line)
            current_h2 = {
                "heading": m.group(1).strip(),
                "level": 2,
                "subsections": [],
            }
            sections.append(current_h2)
        elif RE_H3.match(line) and current_h2 is not None:
            m = RE_H3.match(line)
            current_h2["subsections"].append({
                "heading": m.group(1).strip(),
                "level": 3,
                "body": "",
            })
        elif current_h2 is not None and current_h2["subsections"]:
            # 累加到当前子节的 body
            current_h2["subsections"][-1]["body"] += line + "\n"
        pos += 1

    # 5) 清理 body 首尾空白
    for sec in sections:
        for sub in sec["subsections"]:
            sub["body"] = sub["body"].strip()

    # 6) 合成最终节点
    node_id = front.get("id") or dir_name
    category = front.get("category") or _category_from_meta(meta.get("类型", ""))
    tags = front.get("tags") or _tags_from_skills(meta.get("关联技能", ""))

    node = {
        "id":       str(node_id),
        "title":    title or _strip_dir_prefix(dir_name),
        "category": category,
        "tags":     tags,
        "audience": meta.get("适用角色", ""),
        "source":   front.get("source") or meta.get("来源", ""),
        "updated":  meta.get("更新日期", ""),
        "sections": sections,
        "stats": {
            "lines":       len(lines),
            "chars":       len(text),
            "subsections": sum(len(s["subsections"]) for s in sections),
        },
        "source_file": _safe_relative(md_path),
    }
    return node


# ---------- main ----------
def main() -> int:
    if not CATEGORY_DIRS:
        print(f"[ERROR] 在 {LIB_ROOT} 下未找到分类目录(00_xx 形式)", file=sys.stderr)
        return 1

    print(f"[INFO] 扫描目录: {LIB_ROOT.relative_to(REPO_ROOT.parent)}")
    print(f"[INFO] 发现 {len(CATEGORY_DIRS)} 个分类目录")

    nodes: list[dict[str, Any]] = []
    for d in CATEGORY_DIRS:
        md_files = sorted(d.glob("*.md"))
        if not md_files:
            print(f"  [SKIP] {d.name}/ (无 .md)")
            continue
        # 每个分类目录默认只取 1 份 md(本批次 10 个目录均只有 1 份)
        md = md_files[0]
        node = parse_md(md, d.name)
        if node is None:
            continue
        nodes.append(node)
        print(f"  [OK]   {d.name:30s}  sections={len(node['sections']):2d}  "
              f"subs={node['stats']['subsections']:2d}  chars={node['stats']['chars']}")

    # 写输出
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    graph = {
        "schema_version": 1,
        "generated_by":   "tools/md_to_json.py",
        "node_count":     len(nodes),
        "total_chars":    sum(n["stats"]["chars"] for n in nodes),
        "total_sections": sum(len(n["sections"]) for n in nodes),
        "nodes":          nodes,
    }
    OUT_FILE.write_text(
        json.dumps(graph, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    # 统计
    print()
    print("=" * 60)
    print(f" 节点数:   {graph['node_count']}")
    print(f" 章节数:   {graph['total_sections']}")
    print(f" 总字符数: {graph['total_chars']:,}")
    print(f" 输出文件: {OUT_FILE.relative_to(REPO_ROOT)}")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
