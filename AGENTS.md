# AGENTS.md · MathematicsWeb

> 项目铁律 + 架构 + 状态。能力库 / 项目宏观 / 历史 / 场景规范 → `.Log/`。

## 0. 项目是什么

跨学科数学可视化教学平台,30 场景(2D+3D 双模)覆盖建筑/物理/音乐/生物/艺术/概率/机器学习/工程 8 大领域。

| 维度 | 值 |
|---|---|
| 仓库 | github.com/1500385678/MathematicsWeb + Gitee 镜像 |
| 端口 | 8765 |
| 后端 | 无(纯前端) |
| 前端 | ES Modules · 零构建 · 无 npm |
| 渲染 | 2D Canvas2D + 3D three.js |
| 数据 | IndexedDB(场景参数/收藏)+ localStorage(LLM 配置) |
| 启动 | `start.ps1` / `python -m http.server 8765` |

## 状态速览(动态,agent 自动维护)

- **版本**:v0.6.30 · **进度**:30/30 场景 + 19/19 教学要点
- **远端**:GitHub + Gitee(同步)
- **当前活跃任务**(见 `PLAN.md`):
  - MATH-015 [~] 接 M3 LLM,等 user 配 M3_API_KEY
  - MATH-016 [ ] 初中几何场景集 8 候选
  - MATH-004/005/006/007 [ ]
- **历史能力库**:`.Log/项目宏观.md` + `.Log/YYYY-MM-DD.md`
- **历史审计**:git commit message(无 CHANGELOG.md)

## 1. 改前必读(顺序)

1. `AGENTS.md` 本文件
2. `PLAN.md` 任务清单
3. `.Log/项目宏观.md` + 最近 `.Log/YYYY-MM-DD.md`(按需)
4. `README.md` + `viewer/scenes/XX_*.js` 等源码(按需)

## 2. 架构(目录)

```
MathematicsWeb/
├── index.html / server.py / start.ps1
├── AGENTS.md / PLAN.md / README.md
├── .Log/                              # 项目日志(能力/宏观/规范)
├── viewer/
│   ├── viewer.js / viewer.css / 02_ai-panel.js
│   └── scenes/ 01-30_*.js             # 30 场景
├── kernel/ 01_math / 02_animation / 03_llm-client
├── mock/01_llm-mock.js
├── db/ 01_indexeddb / 02_workspace
├── tools/ graph_query.py / md_to_json.py
├── _test/ CDP headless
└── vendor/three/                      # r160,1.2MB
```

**场景开发规范**:见 `.Log/场景开发规范.md`(createScene / getFormula / getLesson / destroy)
**完整 30 场景 ID + URL 参数**:见 `README.md`

## 3. 铁律(改前必看)

1. **零构建** — 不引 webpack/vite/npm
2. **断网能跑** — three.js 走 vendor/,LLM 默认 mock
3. **场景独立** — 一个挂了不影响其他
4. **窗口版本** — 改 `window.MATHW_V`,import 走 `?v=`
5. **DOM 收口** — destroy() 配对 cancelAnimationFrame + dispose + remove
6. **AI 兜底** — 默认 mock,真 key 走 server.py M3 代理
7. **中文文件名** — 文档/注释用中文
8. **不主动 rebase / force-push / amend**

## 4. agent 工作流(5 步归档)

### 启动(3 步,30 秒)
1. 读 `AGENTS.md` 本文件
2. 读 `PLAN.md` 找第一个 `[~]` 或 `[ ]` 任务
3. (按需) 读 `.Log/项目宏观.md` + 最近 `.Log/YYYY-MM-DD.md`

### 5 步归档(1 个 commit 里)
1. 改代码
2. commit + push(msg 含 `vX.Y.Z`)
3. AGENTS 同步(能力 → `.Log/`,§0 状态,第 2 目录树自动同步)
4. README 同步(非主要)
5. PLAN 删条目 + MEMORY 简记

### 任务来源
- **user 对话**(v0.6.14)→ agent 自动加 PLAN [ ]
- **feedback_inbox.json** → P0 催办
- **AGENTS §7 TODO** → 转 [ ]

### 规则
- 完成任务 → PLAN 删条目(不保留 [x])
- 架构变化 → AGENTS §2 自动同步
- 能力 append → `.Log/YYYY-MM-DD.md`(不在 AGENTS)
- **文档微调不推 git**(2026-08-25)
- **自动推进**(v0.6.19):cron session 自动做 P0/P1/P2
- **红线**(v0.6.20):改 AGENTS / 改 PLAN 框架 / 删整目录 / 改 git remote / 改 cron prompt → 需 user 显式

## 5. 跑起来

```powershell
.\start.ps1
# 浏览器:http://localhost:8765
```

## 6. 里程碑

- [x] **v0.6.30 (2026-08-25)**: 30 场景 + 19/19 教学要点 + M3 代理
- [ ] **v1.0**: 全套主题模块 + 教师模式 + 用户账号

## 7. 已知 TODO

- 3D 场景 WebGL 不可用时降级 2D 静态预览(MATH-004)
- 真 LLM 端到端测试(MATH-015,等 user 配 M3_API_KEY)
- GitHub 仓库 + 自动化 release

## 8. 兄弟项目

| 项目 | 关系 | 沿用 |
|---|---|---|
| three.jsWeb | 范式母版 | 零构建 · 动态 import · vendor 断网化 |
| canvasweb | 风格母版 | 暗色 · AI 面板 · tokens.css |
| OrangeSu | 工作区血缘 | 同在 `_Lib` 体系 |

## 9. 跨项目偏好(user memory 沿用)

- 文档 .md 文件名用中文,禁乱码
- 数字前缀宽度一致(01/02/.../09/10/11)
- 代码改动自动 commit + push
- 文档微调不推 git(2026-08-25)
- AI 味敏感,"结论优先、数字具体、去 AI 味"
- 永不让 user 明文发 token
