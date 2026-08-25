# AGENTS.md · MathematicsWeb

> 项目铁律 + 架构 + 状态。能力库 / 项目宏观 / 场景规范 → `.Log/`。

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
4. `viewer/scenes/XX_*.js` 等源码(按需)

## 2. 架构(目录结构 — 全面)

```
MathematicsWeb/
├── index.html                  # 入口 + 动态 import + 水印
├── server.py                   # v0.6.0 一体化 HTTP 服务器(静态 + M3 代理 /api/chat)
├── start.ps1 / start.bat       # 启动脚本(PowerShell / CMD)
├── _llm_config.example.json    # LLM 配置模板(7 步 step-by-step)
├── _commit_push.ps1            # 自动 commit + push 包装(GitHub + Gitee)
├── AGENTS.md                   # 本文件(铁律 + 架构 + 状态)
├── PLAN.md                     # 活跃任务队列(完成即删)
├── README.md                   # 项目门面(URL 参数 + 30 场景速览)
├── .Log/                       # 项目日志(v0.6.31)
│   ├── 00-Index.md
│   ├── 项目宏观.md
│   ├── 场景开发规范.md
│   └── YYYY-MM-DD.md
├── viewer/
│   ├── viewer.js               # 主壳 + 场景切换 + AI 面板宿主 + SCENES 数组
│   ├── viewer.css              # 全部样式(mathw- tokens 体系)
│   ├── 02_ai-panel.js          # AI 助手 UI(对话/建议/状态,接 getLesson/getFormula 上下文)
│   └── scenes/                 # 30 个独立场景(2D + 3D 双模)
│       ├── 01_catenary-arch.js         # 悬链拱顶(3D · 建筑)
│       ├── 02_planetary-orbits.js      # 行星轨道(3D · 完整 9 大行星 + 月球)
│       ├── 03_fourier-synth.js         # 傅里叶合成器(2D · 音乐)
│       ├── 04_population-dynamics.js   # 种群动力学(2D · 生物)
│       ├── 05_mandelbrot.js            # 曼德尔布罗(2D · 艺术)
│       ├── 06_simple-harmonic.js       # 简谐振动(2D · 教学要点样板)
│       ├── 07_golden-spiral.js         # 黄金螺旋(2D · 艺术)
│       ├── 08_monte-carlo.js           # 蒙特卡洛(2D · 概率)
│       ├── 09_double-pendulum.js       # 双摆混沌(2D · 物理)
│       ├── 10_gradient-descent.js      # 梯度下降(3D · 机器学习)
│       ├── 11_lissajous.js             # Lissajous 曲线(2D · 音乐)
│       ├── 12_clt.js                   # 中心极限定理(2D · 概率)
│       ├── 13_riemann-sum.js           # 黎曼和(2D · 工程)
│       ├── 14_bayesian.js              # 贝叶斯推断(2D · 概率)
│       ├── 15_lsystem.js               # L-系统植物(2D · 生物)
│       ├── 16_wave-interference.js     # 波叠加/干涉(2D · 物理)
│       ├── 17_julia.js                 # 朱利亚集(2D · 艺术)
│       ├── 18_lagrange.js              # 拉格朗日乘子法(2D · 工程)
│       ├── 19_electric-field.js        # 电场可视化(2D · 物理)
│       ├── 20_neural-net.js            # 神经网络 2D 分类(2D · 机器学习)
│       ├── 21_voronoi.js               # 沃罗诺伊图(2D · 计算几何)
│       ├── 22_delaunay.js              # 德劳内三角剖分(2D · 计算几何)
│       ├── 23_ellipse-reflection.js    # 椭圆光学反射(2D · 物理)
│       ├── 24_lemniscate.js            # 双纽线(2D · 计算几何)
│       ├── 25_buffon-needle.js         # 布丰投针(2D · 几何概率)
│       ├── 26_koch-snowflake.js        # Koch 雪花(2D · 分形几何)
│       ├── 27_sierpinski.js            # 谢尔宾斯基三角(2D · 分形几何)
│       ├── 28_great-circle.js          # 球面大圆(2D · 球面几何)
│       ├── 29_mobius-strip.js          # 莫比乌斯带(3D · 拓扑几何)
│       └── 30_crystal-lattice.js       # 晶体格 / Bravais(3D · 材料科学)
├── kernel/                     # 数学/动画/LLM 客户端
│   ├── 01_math-core.js         # 数学原语(Complex/Vec2/Mat2x2/catenary/DFT/Mandelbrot/LV)
│   ├── 02_animation.js         # rAF 循环 + Canvas 高 DPI 自适应
│   └── 03_llm-client.js        # LLM API 客户端(OpenAI 兼容,接 server.py 代理)
├── mock/
│   └── 01_llm-mock.js          # 本地 mock(无 key 时用,接 lesson 字段)
├── db/
│   ├── 01_indexeddb.js         # IndexedDB 封装(2 个 store: meta + sceneParams)
│   └── 02_workspace.js         # 工作区(轻量版,只存 last scene + fav + visited + sceneParams)
├── tools/                      # 辅助工具(纯 Python 3 标准库)
│   ├── graph_query.py          # 知识图谱查询 CLI(7 子命令)
│   ├── md_to_json.py           # 知识图谱生成器
│   └── README.md
├── _test/                      # CDP headless 验证脚本(Edge 远程调试)
│   ├── _cdp_test.js            # 单场景控制台错误 + canvas 截图
│   ├── _shot.js                # 等动画稳定后截屏
│   ├── _test_all.ps1           # 20 场景批量验证
│   └── _test_one.ps1           # 单场景验证(简单版)
├── vendor/three/               # three.js r160 本地(从 three.jsWeb 复制,1.2MB,断网)
└── Output/                     # 本地截图(不入仓,gitignore)
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
