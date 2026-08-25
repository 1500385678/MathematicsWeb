# PLAN · MathematicsWeb

> 任务队列 + 路线图。agent 每天醒后先读这个,挑 ready 的最高优先级任务做。
> 人工也可加任务(直接编辑 + commit)。状态: `[ ]` 待办 / `[~]` 进行中 / `[x]` 完成 / `[!]` 阻塞。
>
> **v0.6.6 框架规则**:完成的任务**从 PLAN 删除**(不保留 [x]),功能描述 append 到 AGENTS.md "项目已具备的能力" 段,审计留 CHANGELOG.md。PLANG 保持短小只管活跃任务。

---

## 路线图

- [x] Phase 0 · 资产盘点(2026-08-21)
- [x] Phase 1 · MVP(2026-08-21)
- [/] Phase 2 · 完整功能 — **当前阶段**
- [ ] Phase 3 · AI 智能化
- [ ] Phase 4 · 多端 + 商业化

---

## 产品开发计划(融合自 `数学顾问开发架构与计划.md` + `项目开发计划.md`)

> 2026-08-25 融合:2 个 .md 90% 内容重叠(都是"数学顾问 MathAdvisor"产品立项方案),取详版为骨架 + 精版最新状态为准,精简去重。**MathematicsWeb 是本产品的 Web App 形态(Phase 1 产物)**,此段为上层产品规划。
> 源文件保留:`数学顾问开发架构与计划.md` / `项目开发计划.md`(git 可查历史)

### 1. 项目代号 & 愿景

- **代号**:MathAdvisor(内部代号 14-数学-Mathematics)
- **版本**:v1.0
- **维护**:张勇
- **愿景**:**让每个学习者身边都有一位"IMO 金牌教练 + 数学系老教授"**
- **定位**:把张勇整理的"小学到大学 + 应用数学"完整知识图谱,做成**会思考的数学顾问** —— 既能查、能练、能讲,也能针对个人进度出题、纠错、推荐
- **核心差异**:**结构化知识图谱**为骨架,AI 仅作为讲解与出题的引擎(对比猿辅导/可汗/Wolfram 都缺这块)

### 2. 产品形态(6 个)

| 形态 | 场景 | 状态 |
|---|---|---|
| **飞书 Agent(当前)** | 工作中随问随答 | ✅ 已上线 |
| **Web App(核心)** = MathematicsWeb | 自学/教学/家长辅导 | ⏳ 规划中(Phase 1 产物) |
| **桌面端(Electron/Tauri)** | 离线场景 | 📋 远期 |
| **微信小程序** | 小学生/家长 | 📋 远期 |
| **REST API** | 嵌入其他系统 | 📋 远期 |
| **Mathpix 集成** | 拍照识别题目 | 📋 远期 |

### 3. 五大核心模块

```
┌──────────────────────────────────────────────────┐
│            数学顾问 MathAdvisor                   │
├──────────┬──────────┬──────────┬────────┬─────────┤
│ 知识图谱 │ 题目生成 │ 学习管理 │ 智能助手│  多端    │
│ (Graph) │ (Quiz)   │ (Study)  │ (AI)   │  (UI)   │
├──────────┴──────────┴──────────┴────────┴─────────┤
│          数据层 (PostgreSQL + SQLite 离线)         │
├──────────────────────────────────────────────────┤
│          内容层 (Markdown + JSON)                  │
└──────────────────────────────────────────────────┘
```

#### 模块 1:知识图谱(Knowledge Graph)
- **结构**:节点(知识点) + 边(前置/关联/升级)
- **覆盖**:小学 → 初中 → 高中 → 大学 → 应用数学
- **属性**:`name / grade / difficulty / tags / prerequisites / examples / questions / explanation`
- **查询**:图遍历(前置依赖)、全文搜索、推荐(基于当前学习位置)
- **当前状态**:**✅ 10 分类目录已入库**(`docs/knowledge_graph.json` · 10 节点 / 56 章节 / 30,873 字符,由 `tools/md_to_json.py` 生成)

#### 模块 2:题目生成(Quiz Engine)
- **输入**:知识点 + 难度 + 题型
- **题型**:单选/多选/填空/判断/计算/证明/应用
- **难度**:1-5 星
- **题库策略**:**静态题库(5000+)** + **动态生成**(模板+随机参数,无限) + **LLM 出题**(兜底)

#### 模块 3:学习管理(Study Manager)
- **进度追踪**:知识点掌握度(0-1)、用时、正确率
- **错题本**:自动收录 + 同类题推荐 + 周期性复盘
- **学习路径**:基于图谱生成个性化计划
- **成就系统**:勋章、连续打卡、关卡

#### 模块 4:智能助手(AI Tutor)
- **解题助手**:拍照/文字 → 思路 + 详解
- **讲解助手**:选知识点 → 多风格(小学版/中学版/大学版)
- **对话助手**:自由问答、追问、引导思考
- **应用助手**:选知识点 → 真实案例

#### 模块 5:多端 UI
- **Web App(核心) = MathematicsWeb**:响应式,PC/平板/手机
- 飞书机器人(当前)
- 小程序(家长端)
- 桌面端(离线)

### 4. 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| **后端** | FastAPI(Python) | 异步、自动文档、数学生态好(NumPy/SymPy/SciPy) |
| **前端** | React + TypeScript | 生态成熟、组件丰富 |
| **UI 库** | Ant Design / shadcn/ui | 中文友好 / 现代 |
| **数学引擎** | SymPy(符号) + MathJax/KaTeX(渲染) | 公式/符号计算 |
| **图表** | ECharts / D3.js | 图谱可视化 |
| **数据库** | PostgreSQL(主) + SQLite(离线) | 张勇已有 SQLite 经验 |
| **缓存** | Redis | 热点题目/用户会话 |
| **向量库** | pgvector / Chroma | 题目检索/推荐 |
| **LLM** | Claude / GPT / 本地 Ollama | 解题/讲解/出题 |
| **部署** | Docker Compose → K8s | 单机起步,平滑扩容 |
| **CI/CD** | GitHub Actions | 自动化 |
| **监控** | Sentry + Prometheus | 错误+性能 |
| **认证** | JWT + 飞书 OAuth | 飞书用户无缝 |

### 5. 迭代路线(Phase 0-4)

| 阶段 | 时间 | 关键产物 | 验证标准 | 当前进度 |
|---|---|---|---|---|
| **Phase 0** 资产盘点 | W1-2 | 知识图谱 JSON + 飞书 Bot | 6 份 md 全部入库,Bot 可查/可出题 | **🔄 进行中** |
| **Phase 1** MVP | W5-6 | Web MVP(= MathematicsWeb) | 100 用户内测,反馈 ≥ 4.0/5.0 | ⏳ 未开始 |
| **Phase 2** 完整功能 | W10-12 | 完整学习闭环 | 日活 1000+ · 留存 ≥ 30% | ⏳ 未开始 |
| **Phase 3** AI 智能化 | W16-20 | AI Tutor | 解题准确率 ≥ 85% | ⏳ 未开始 |
| **Phase 4** 商业化 | W24+ | 商业化版本 | DAU 1万+ / 付费转化 ≥ 5% | ⏳ 未开始 |

### 6. Phase 0 详细任务(进行中)

- [x] 写 `md_to_json.py` — 解析 6 份知识点 md → JSON
  - 2026-08-24 完成:10 分类目录(01-10) → `docs/knowledge_graph.json` · 10 节点 / 56 章节 / 30,873 字符
  - schema 5 字段(id/title/category/tags/sections) + audience/source/updated/stats/source_file
  - frontmatter 容错:YAML 覆盖,无 frontmatter fallback 元数据列表
- [x] 写图谱查询 CLI(`tools/graph_query.py`)
  - 2026-08-25 完成:7 子命令(`list` / `get` / `category` / `tag` / `search` / `stats` / `paths`)读 `docs/knowledge_graph.json`
  - 无第三方依赖,纯 stdlib
  - category/tag 大小写不敏感,search 走 title+章节+子节标题
- [ ] 建立知识图谱初始数据(小学 + 初中 + 高中 + 大学 + 应用,目前只有 10 个"通识"分类)
- [ ] SQLite → PostgreSQL 迁移脚本(张勇已有 SQLite `data.db`)
- [ ] 建表 + 灌库(预留 `data.db` 已有数据)
- [ ] 飞书 Bot 接入"知识点查询 + 出题"对话流程

### 7. Phase 1-4 任务简述(详细见 `项目开发计划.md` §6-§7)

- **Phase 1** MVP: FastAPI 骨架 + `/graph` `/quiz` 接口 · React 前端(知识图谱浏览 + 答题页) · 题目生成器(动态生成) · 错题本基础版 · 飞书 OAuth 登录 · Docker Compose 一键启动
- **Phase 2** 完整: 学习进度追踪 · 智能推荐 · 成就系统 · 学习路径生成 · 题目库扩展 5000+ · 题库 CMS · 移动端适配
- **Phase 3** AI 智能化: AI 解题助手 · 讲解助手(多风格) · 出题助手(兜底+难题) · 对话式辅导 · 学习数据分析(弱项诊断)
- **Phase 4** 商业化: 微信小程序 · 桌面端(Tauri) · 教师端(组卷/班级) · 付费内容/会员 · 多用户协作

### 8. 风险与下一步

#### 风险

| 风险 | 影响 | 应对 |
|---|---|---|
| 题目质量参差 | 用户体验 | 人工审核 + 反馈机制 |
| LLM 成本 | 商业化 | 本地 Ollama 兜底 / 缓存 |
| 知识点图谱构建慢 | 进度 | 模板化抽取 + 渐进式完善 |
| 飞书生态依赖 | 渠道单一 | Web / 小程序多端铺开 |
| 教师/家长付费意愿 | 商业化 | 先免费验证 → 增值服务 |

#### 下一步(3 步走)

1. **本周**:Phase 0 收尾 — 把 6 份 md 全部手工梳理为 JSON + 飞书 Bot 接入
2. **下周**:SQLite → PostgreSQL 迁移 + 灌库 + 图谱查询 CLI(已完成,✓)
3. **W3-4**:搭建 FastAPI + React 骨架,先做知识图谱浏览页验证数据流通

> 哲学:**先做骨架,再长血肉**。Phase 0-1 把"查 + 练"打通,AI 和商业化都是后面的事。地基扎实了,上面随便盖。

---

## 任务队列

### P0 · 阻塞/紧急

(无活跃 P0 任务)

### P1 · 重要

- [~] **MATH-003** · 19 个场景补 `getLesson()` 教学要点
  - 描述: v0.6.4 已示范 1 个(simple-harmonic),剩 19 个。教学要点喂给 LLM,提升 AI 助手质量
  - 验收: 每个 scene 文件导出 `getLesson()`,`_buildSceneContext` 拼进 prompt
  - 创建: 2026-08-24
  - 依赖: v0.6.4 getLesson 框架(已落地)
  - 进度(2026-08-25 v0.6.9 → v0.6.10): 4/19 — 04/11/18/20 已加 getLesson
  - 优先级子项(教学价值排序,✅ = 已加):
    - ✅ 04_population-dynamics · Lotka-Volterra 双物种
    - ✅ 11_lissajous · 频率比 + 相位
    - ✅ 18_lagrange · 切点几何(本轮 v0.6.10)
    - ✅ 20_neural-net · 决策边界演化(本轮 v0.6.10)
    - 剩余 15 个按用户反馈优先级

- [ ] **MATH-004** · 确认 3D 场景在低 WebGL 环境的友好降级
  - 描述: CHANGELOG v0.1.0 已知问题 #1。是否要加 feature detection + 2D fallback?
  - 验收: 无 GPU / 旧 WebGL 时显示"请用现代浏览器"提示,而非 silent 报错
  - 创建: 2026-08-24
  - 依赖: 无

### P2 · 优化

- [ ] **MATH-005** · 整理 `_test/` 散落文件
  - 描述: `_test/_cdp_test.js` `_test/_shot.js` `_test/_test_all.ps1` `_test/_test_one.ps1` 在 _test 下,工具类应该归 tools/ 或类似
  - 验收: 单一来源,命名一致
  - 创建: 2026-08-24
  - 依赖: MATH-002

- [ ] **MATH-006** · 优化首屏加载
  - 描述: 1000 颗星空 + three.js 1.2MB + 20 场景,首次加载可能慢。考虑分场景懒加载
  - 验收: 首屏 < 2s (本地 8765)
  - 创建: 2026-08-24
  - 依赖: 无

- [ ] **MATH-007** · 移动端 scene 卡片可读性
  - 描述: 教学卡片文字在手机屏可能溢出,需要响应式
  - 验收: 375px 宽屏下文字不溢出、控件可点
  - 创建: 2026-08-24
  - 依赖: 无

- [~] **MATH-013** · 精简为 2 文件体系(AGENTS + PLAN),删冗余
  - 描述: 用户理想状态是项目内 2 文件动态更新: AGENTS(铁律+架构+能力+状态速览)+ PLAN(任务+路线图)。删 .Core/OVERVIEW.md(合并到 AGENTS 顶部)、CHANGELOG.md(审计靠 git commit)、docs/ 整个目录;README 留着但跟 AGENTS 同步(非主要文件)
  - 验收: (1) AGENTS.md 顶部加"项目状态速览"段 (2) README.md 重写,跟 AGENTS §0 同步 (3) 删 .Core/OVERVIEW.md / CHANGELOG.md / docs/ (4) AGENTS.md 第 2 段目录树自动同步(架构自动同步规则) (5) cron prompt 删 0 步读 OVERVIEW (6) 5 步归档规则更新(无 CHANGELOG,commit message 必含版本号) (7) README 同步规则文档化
  - 创建: 2026-08-25
  - 依赖: 无
  - 发现者: 用户指令(2 文件体系)

### 用户反馈

> 等用户首次发反馈后由 01_Owner 写入这里,P0 优先级。

---

## 关键决策记录(append-only,只追加不删)

- 2026-08-24: 零构建范式确认(不引 npm/webpack/vite)
- 2026-08-24: three.js 走 vendor/(避免 CDN 依赖)
- 2026-08-24: LLM 默认 mock 兜底,真 key 才接 M3
- 2026-08-24: v0.6.4 起 AI 上下文接 getLesson 教学要点通道
- 2026-08-24: 任务系统启用 PLAN.md 单一事实源
- 2026-08-24: MATH-002 完成 · untracked 文件归宿决策(tools 入仓 + 4 个根目录测试副本+1 个生成产物 gitignore + 2 个上层产品规划留 untracked)

---

## 元数据

- **最后更新**: 2026-08-25
- **更新者**: 张勇(初始化) + math-advisor(后续自动)
- **配套 cron**: math-advisor-daily-wake (每天 9:00)
- **配套反馈收件箱**: `D:\Mac\Mac\Mac\Consultant\.Shared\feedback_inbox.json`
