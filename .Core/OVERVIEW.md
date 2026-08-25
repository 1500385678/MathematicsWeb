# MathematicsWeb · 项目全局一览 (OVERVIEW)

> Agent 启动必读 · 30 秒读懂项目全貌 · 目标 < 100 行 / 3-5 KB
> 详细规则看 **AGENTS.md** · 当前任务看 **PLAN.md** · 历史看 **CHANGELOG.md** · 完整流程看 **.Core/AUTOMATION_TEMPLATE.md**(待建)

---

## 1. 一句话定义

**跨学科数学可视化教学平台** · 20 个场景(2D + 3D 双模)· AI 教学助手 · 零构建 · 断网能跑

## 2. 当前状态(2026-08-25 · v0.6.11)

| 维度 | 值 |
|---|---|
| **版本** | v0.6.11(本地 + GitHub + Gitee 三方同步,0 落后) |
| **阶段** | Phase 2 完整功能(20 场景全到位) |
| **场景数** | 20(3 个 3D + 17 个 2D) |
| **教学要点** | 4/19 场景接 `getLesson()`(simple-harmonic 样板 + 04/11/18/20) |
| **自动化框架** | 3 文件(PLAN/AGENTS/MEMORY)5 步归档 + cron 10:30 触发,已 dogfooding 跑通 |
| **远端** | GitHub `1500385678/MathematicsWeb` + Gitee `architectzy/MathematicsWeb`(镜像) |
| **端口** | 8765(`start.ps1` 启 `python server.py`) |

## 3. 3 文件职责(快查)

| 文件 | 职责 | 什么时候写 |
|---|---|---|
| **AGENTS.md** | 项目铁律(8 条) + 架构骨架 + 项目能力库(append-only) | 改规则 / 加能力时 |
| **PLAN.md** | 任务队列(完成即删)+ 上层产品开发计划(融合自 2 个 .md) | 加任务 / 完成归档时 |
| **MEMORY.md**(agent 数据目录) | agent 临时工作笔记(跨项目状态、push 诊断、cron 触发记录) — **不入仓** | agent 内部 |

## 4. 下一步(从 PLAN.md 拉,2026-08-25)

| ID | 优先级 | 标题 |
|---|---|---|
| **MATH-003** [~] | P1 | 19 场景补 `getLesson()`(4/19 进度,下一批:15_lsystem / 14_bayesian / 12_clt / 01_catenary) |
| **MATH-004** [ ] | P1 | 3D 场景 WebGL 不可用时友好降级提示(feature detection + 2D fallback) |
| **MATH-005** [ ] | P2 | 整理 `_test/` 散落文件(注:MATH-002 已部分解决) |
| **MATH-006** [ ] | P2 | 优化首屏加载(1000 星空 + three.js 1.2MB) |
| **MATH-007** [ ] | P2 | 移动端 scene 卡片可读性 |

## 5. 关键链接(导航)

| 类型 | 路径 |
|---|---|
| 铁律 | `AGENTS.md` |
| 任务 + 路线图 | `PLAN.md`(含"## 产品开发计划"段上层产品规划) |
| 版本历史 | `CHANGELOG.md`(append-only) |
| 场景清单 | `docs/03_场景清单.md`(20 场景数学原理 + 实现要点) |
| 架构详情 | `docs/02_项目架构.md` |
| 踩坑 | `docs/04_开发纪要.md` |
| LLM 接入 | `docs/05_接真LLM指南.md` |
| 知识图谱 | `docs/knowledge_graph.json`(由 `tools/md_to_json.py` 生成) |
| 工具 | `tools/md_to_json.py` + `tools/graph_query.py` + `tools/README.md` |
| 测试 | `_test/_cdp_test.js` + `_test/_test_all.ps1`(CDP 验证 20 场景) |
| 启动 | `start.ps1` / `python server.py` → http://localhost:8765 |

## 6. 关键决策(最近 5 条,append-only)

- **2026-08-25** · 产品开发计划融合进 PLAN(v0.6.11)· `MathematicsWeb = 上层"数学顾问"产品的 Web App 形态(Phase 1 产物)`,两层文档职责清晰
- **2026-08-25** · AGENTS 架构自动同步规则(永久,已写 User Memory)· 涉及文件/目录/模块/依赖变化自动同步 AGENTS 第 2 段,不用问
- **2026-08-25** · 3 文件自动化框架 PLAN/AGENTS/MEMORY(v0.6.6)· 完成即删 PLAN,功能 append AGENTS,审计留 CHANGELOG
- **2026-08-25** · getLesson AI 教学要点通道(v0.6.4)· simple-harmonic 第一个样板,接真 LLM 上下文
- **2026-08-21** · 20 跨学科场景(2D + 3D 双模)(v0.6.0)· 数学 × 建筑/物理/音乐/生物/艺术/概率/机器学习/工程/优化 9 主题

## 7. Agent 操作入口

```
启动顺序(30 秒内完成):
  1. 读 .Core/OVERVIEW.md ← 你现在
  2. 读 AGENTS.md(铁律 + 能力库)
  3. 读 PLAN.md(找第一个 [~] / [ ] 任务)
  4. 读 MEMORY.md(跨项目状态 / push 诊断)
  5. 读 .Shared/feedback_inbox.json(P0 反馈)
  6. cd 项目目录,git log + git status
  7. 按 PLAN 优先级挑 1 件做 → 5 步归档
```

**5 步归档** = 改代码 → commit + push → CHANGELOG → AGENTS append → PLAN 删除 + MEMORY 简记

**完整流程**:`.Core/AUTOMATION_TEMPLATE.md`(整条链路文档,待建)

---

> **最后更新**: 2026-08-25 · v0.6.11 · 由 math-advisor 创建
