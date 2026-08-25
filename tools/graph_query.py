#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
graph_query.py — 查询 docs/knowledge_graph.json 的 CLI。

数据源:由 md_to_json.py 生成的 docs/knowledge_graph.json(schema_version=1)。

支持子命令:
  list                 列出全部节点(摘要: id / title / category / 子节数)
  get <id>             查单个节点完整内容(JSON 打印)
  category <name>      按 category 过滤(精确匹配)
  tag <name>           按 tag 过滤(精确匹配,大小写不敏感)
  search <keyword>     全文搜索(title / 章节标题 / 子节标题)
  stats                全图统计(节点/章节/字符数 + 分类分布)
  paths                打印输入/输出文件路径

约定:
  - 无第三方依赖,纯标准库
  - 入参为 ID/分类/标签时不区分大小写
  - 搜索默认大小写不敏感
  - 输出统一用 UTF-8,中文不转义
  - 找不到结果时 exit code = 0(打印空),参数错误时 exit code = 2
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Iterable

# ---- 路径常量(与 md_to_json.py 保持一致)----
REPO_ROOT = Path(__file__).resolve().parent.parent          # MathematicsWeb/
GRAPH_FILE = REPO_ROOT / "docs" / "knowledge_graph.json"

# ---- 常量 ----
EXPECTED_SCHEMA_VERSION = 1


# ---------- 数据加载 ----------
def load_graph(path: Path = GRAPH_FILE) -> dict[str, Any]:
    """加载知识图谱 JSON,缺失或版本不匹配时给出友好错误并退出。"""
    if not path.exists():
        print(f"[ERROR] 知识图谱文件不存在: {path}", file=sys.stderr)
        print(f"        请先运行: python3 tools/md_to_json.py", file=sys.stderr)
        sys.exit(2)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"[ERROR] 解析 {path} 失败: {e}", file=sys.stderr)
        sys.exit(2)
    sv = data.get("schema_version")
    if sv != EXPECTED_SCHEMA_VERSION:
        print(f"[WARN] schema_version={sv}(期望 {EXPECTED_SCHEMA_VERSION}),"
              f"继续解析但字段可能不一致", file=sys.stderr)
    return data


# ---------- 工具函数 ----------
def _norm(s: str) -> str:
    """归一化:小写 + 去首尾空白,用于大小写不敏感比较。"""
    return (s or "").strip().lower()


def _iter_headings(node: dict[str, Any]) -> Iterable[tuple[str, str]]:
    """yield (level, heading):遍历节点的 h2 章节与 h3 子节标题。"""
    for sec in node.get("sections", []):
        yield ("2", sec.get("heading", ""))
        for sub in sec.get("subsections", []):
            yield ("3", sub.get("heading", ""))


def _format_node_summary(node: dict[str, Any]) -> str:
    """单行摘要: id | title | category | sub-count | chars """
    stats = node.get("stats", {})
    return (
        f"  {node.get('id', '?'):32s}  "
        f"{(node.get('title') or '?')[:40]:40s}  "
        f"[{node.get('category') or '?':12s}]  "
        f"sub={stats.get('subsections', 0):2d}  "
        f"chars={stats.get('chars', 0):,}"
    )


# ---------- 子命令实现 ----------
def cmd_list(graph: dict[str, Any], _args: argparse.Namespace) -> int:
    nodes = graph.get("nodes", [])
    if not nodes:
        print("(无节点)")
        return 0
    print(f"共 {len(nodes)} 个节点:")
    for n in nodes:
        print(_format_node_summary(n))
    return 0


def cmd_get(graph: dict[str, Any], args: argparse.Namespace) -> int:
    target = _norm(args.id)
    for n in graph.get("nodes", []):
        if _norm(n.get("id", "")) == target:
            # 完整 JSON 打印,无转义
            print(json.dumps(n, ensure_ascii=False, indent=2))
            return 0
    print(f"(未找到 id={args.id!r})", file=sys.stderr)
    return 0


def cmd_category(graph: dict[str, Any], args: argparse.Namespace) -> int:
    target = _norm(args.name)
    hits = [n for n in graph.get("nodes", [])
            if _norm(n.get("category", "")) == target]
    if not hits:
        print(f"(分类 {args.name!r} 无匹配节点)")
        return 0
    print(f"分类 {args.name!r} 命中 {len(hits)} 个节点:")
    for n in hits:
        print(_format_node_summary(n))
    return 0


def cmd_tag(graph: dict[str, Any], args: argparse.Namespace) -> int:
    target = _norm(args.name)
    hits = []
    for n in graph.get("nodes", []):
        if any(_norm(t) == target for t in n.get("tags", [])):
            hits.append(n)
    if not hits:
        print(f"(标签 {args.name!r} 无匹配节点)")
        return 0
    print(f"标签 {args.name!r} 命中 {len(hits)} 个节点:")
    for n in hits:
        print(_format_node_summary(n))
    return 0


def cmd_search(graph: dict[str, Any], args: argparse.Namespace) -> int:
    """全文搜索:title / 章节标题 / 子节标题,默认大小写不敏感。"""
    kw = _norm(args.keyword)
    if not kw:
        print("[ERROR] 关键词不能为空", file=sys.stderr)
        return 2
    regex = re.compile(re.escape(kw), re.IGNORECASE)

    hits: list[tuple[dict[str, Any], list[tuple[str, str]]]] = []
    for n in graph.get("nodes", []):
        matched: list[tuple[str, str]] = []
        # title
        if regex.search(n.get("title", "")):
            matched.append(("title", n.get("title", "")))
        # 章节 + 子节标题
        for level, heading in _iter_headings(n):
            if regex.search(heading):
                matched.append((f"h{level}", heading))
        if matched:
            hits.append((n, matched))

    if not hits:
        print(f"(关键词 {args.keyword!r} 无匹配)")
        return 0
    print(f"关键词 {args.keyword!r} 命中 {len(hits)} 个节点:")
    for n, m in hits:
        print(f"  · {n.get('id')}  ({n.get('title')})")
        for kind, heading in m[:5]:  # 每节点最多列 5 条
            print(f"      [{kind}] {heading}")
        if len(m) > 5:
            print(f"      ... 还有 {len(m) - 5} 条")
    return 0


def cmd_stats(graph: dict[str, Any], _args: argparse.Namespace) -> int:
    nodes = graph.get("nodes", [])
    n_total = len(nodes)
    n_total_sections = sum(len(n.get("sections", [])) for n in nodes)
    n_total_subs = sum(n.get("stats", {}).get("subsections", 0) for n in nodes)
    n_total_chars = sum(n.get("stats", {}).get("chars", 0) for n in nodes)

    # 分类分布
    cat_dist: dict[str, int] = {}
    for n in nodes:
        cat = n.get("category") or "(无)"
        cat_dist[cat] = cat_dist.get(cat, 0) + 1

    print(f"节点数:    {n_total}")
    print(f"章节数:    {n_total_sections}")
    print(f"子节数:    {n_total_subs}")
    print(f"总字符数:  {n_total_chars:,}")
    print()
    print("分类分布:")
    for cat in sorted(cat_dist, key=lambda c: (-cat_dist[c], c)):
        bar = "█" * cat_dist[cat]
        print(f"  {cat:14s}  {cat_dist[cat]:2d}  {bar}")
    return 0


def cmd_paths(_graph: dict[str, Any], _args: argparse.Namespace) -> int:
    print(f"REPO_ROOT  = {REPO_ROOT}")
    print(f"GRAPH_FILE = {GRAPH_FILE}")
    return 0


# ---------- argparse 接线 ----------
def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="graph_query",
        description="查询 docs/knowledge_graph.json 的 CLI。"
                    "数据源由 tools/md_to_json.py 生成。",
    )
    sub = p.add_subparsers(dest="cmd", metavar="<subcommand>")
    sub.required = True  # type: ignore[attr-defined]

    sub.add_parser("list", help="列出全部节点(摘要)")

    p_get = sub.add_parser("get", help="按 id 查单个节点(JSON 完整内容)")
    p_get.add_argument("id", help="节点 id,如 '01_数学起源与演变'")

    p_cat = sub.add_parser("category", help="按 category 过滤节点")
    p_cat.add_argument("name", help="分类名,如 '起源与演变'")

    p_tag = sub.add_parser("tag", help="按 tag 过滤节点")
    p_tag.add_argument("name", help="标签名,如 '数学史'")

    p_sea = sub.add_parser("search", help="全文搜索(title/章节/子节标题)")
    p_sea.add_argument("keyword", help="关键词")

    sub.add_parser("stats", help="全图统计(节点/章节/分类分布)")
    sub.add_parser("paths", help="打印输入/输出路径")

    return p


COMMANDS = {
    "list":     cmd_list,
    "get":      cmd_get,
    "category": cmd_category,
    "tag":      cmd_tag,
    "search":   cmd_search,
    "stats":    cmd_stats,
    "paths":    cmd_paths,
}


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    handler = COMMANDS[args.cmd]
    graph = load_graph()
    return handler(graph, args)


if __name__ == "__main__":
    sys.exit(main())
