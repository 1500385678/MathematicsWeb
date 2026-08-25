# AGENTS.md · MathematicsWeb

> 项目铁律 + 架构 + 状态。能力库 / 项目宏观 / 历史 → 见 `.Log/` 目录。

## 0. 项目是什么

**MathematicsWeb** 跨学科数学可视化教学平台,每个"场景"是独立的动态 demo。30 场景(2D + 3D 双模)覆盖建筑 / 物理 / 音乐 / 生物 / 艺术 / 概率 / 机器学习 / 工程 8 大领域。

| 维度 | 值 |
|---|---|
| 仓库 | <https://github.com/1500385678/MathematicsWeb> + Gitee 镜像 |
| 端口 | 8765(默认,可在 start.ps1 改) |
| 后端 | 无(纯前端,MVP) |
| 前端 | 原生 ES Modules · 零构建工具,无 npm 依赖 |
| 渲染 | 2D Canvas2D + 3D three.js(场景级切换) |
| 数据 | IndexedDB(场景参数 / 收藏) · localStorage(LLM 配置) |
| 启动 | `start.ps1` / `start.bat` / `python -m http.server 8765` |

> 沿用 three.jsWeb 范式(动态 import + 顶层 await + window version + ?v=)+ canvasweb 思想(AI 助手是标配)。断网能跑(three.js 走 vendor/,LLM 默认 mock)。

## 项目状态速览(动态,agent 自动维护)

> agent 启动第一件事看这里。30 秒建认知。版本/进度/远端 + 当前活跃任务。

- **版本**:v0.6.30 · **阶段**:Phase 2 完整功能 · **进度**:30/30 场景 + 19/19 教学要点
- **远端**:GitHub `1500385678/MathematicsWeb` + Gitee `architectzy/MathematicsWeb`(镜像) · 端口 8765
- **当前活跃任务**(从 PLAN.md 拉):MATH-014 ✅ 收尾(10/10)· MATH-003 ✅ 收尾(19/19 v0.6.30)· MATH-015 [~] 接 M3 LLM,等 user 配 M3_API_KEY(配后 v0.6.22 完成)· MATH-016 [ ] 初中几何场景集 8 候选(等 MATH-015 后启动)· MATH-004/005/006/007 [ ]
- **完整流程**:`AGENTS.md`(本文件)+ `PLAN.md`(任务)+ `.Log/`(能力库/项目宏观)→ 3 文件体系(v0.6.31)
- **历史审计**:看 git commit message(本仓库无 CHANGELOG.md,审计在 commit)
- **项目宏观**:见 `.Log/项目宏观.md`(产品愿景/路线/技术栈/风险)

## 1. 改前必读(顺序)

1. **本文件**(`AGENTS.md`)· 铁律 + 架构 + 状态
2. **`PLAN.md`** · 任务清单
3. **`.Log/`** · 项目宏观 + 每日完成能力清单
4. **`README.md`**(非主要,顺带看)· 项目门面
5. 完整文件流:`viewer/scenes/XX_*.js` / `kernel/01_math-core.js` / `mock/01_llm-mock.js` 等源码 — 按需查

## 2. 架构

### 目录结构

```
MathematicsWeb/
├── index.html                  # 入口 + 动态 import + 水印
├── server.py                   # v0.6.0 一体化 HTTP 服务器(静态 + M3 代理)
├── start.ps1 / start.bat       # 启动脚本
├── _llm_config.example.json    # LLM 配置模板
├── _commit_push.ps1            # 自动 commit + push 包装
├── AGENTS.md                   # 本文件(铁律 + 架构 + 状态)
├── PLAN.md                     # 活跃任务队列(完成即删)
├── README.md                   # 项目门面
├── .Log/                       # 项目日志(v0.6.31 新增)
│   ├── 00-Index.md
│   ├── 项目宏观.md
│   └── YYYY-MM-DD.md
├── viewer/
│   ├── viewer.js               # 主壳 + 场景切换 + AI 面板宿主
│   ├── viewer.css              # 全部样式(tokens 体系)
│   ├── 02_ai-panel.js          # AI 助手 UI(对话/建议/状态)
│   └── scenes/                 # 30 个独立场景(2D + 3D 双模)
│       ├── 01_catenary-arch.js         # 悬链拱顶(3D)
│       ├── 02_planetary-orbits.js      # 行星轨道(3D · 完整 9 大行星 + 月球)
│       ├── 03_fourier-synth.js         # 傅里叶合成器(2D)
│       ├── 04_population-dynamics.js   # 种群动力学(2D)
│       ├── 05_mandelbrot.js            # 曼德尔布罗(2D)
│       ├── 06_simple-harmonic.js       # 简谐振动(2D · 教学要点样板)
│       ├── 07_golden-spiral.js         # 黄金螺旋(2D)
│       ├── 08_monte-carlo.js           # 蒙特卡洛(2D)
│       ├── 09_double-pendulum.js       # 双摆混沌(2D)
│       ├── 10_gradient-descent.js      # 梯度下降(3D)
│       ├── 11_lissajous.js             # Lissajous 曲线(2D)
│       ├── 12_clt.js                   # 中心极限定理(2D)
│       ├── 13_riemann-sum.js           # 黎曼和(2D)
│       ├── 14_bayesian.js              # 贝叶斯推断(2D)
│       ├── 15_lsystem.js               # L-系统植物(2D)
│       ├── 16_wave-interference.js     # 波叠加/干涉(2D)
│       ├── 17_julia.js                 # 朱利亚集(2D)
│       ├── 18_lagrange.js              # 拉格朗日乘子法(2D)
│       ├── 19_electric-field.js        # 电场可视化(2D)
│       ├── 20_neural-net.js            # 神经网络 2D 分类(2D)
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
├── kernel/
│   ├── 01_math-core.js         # 数学原语(Complex/Vec2/Mat2x2/catenary/DFT/Mandelbrot/LV)
│   ├── 02_animation.js         # rAF 循环 + Canvas 高 DPI 自适应
│   └── 03_llm-client.js        # LLM API 客户端(OpenAI 兼容,接 server.py 代理)
├── mock/
│   └── 01_llm-mock.js          # 本地 mock(无 key 时用,接 lesson 字段)
├── db/
│   ├── 01_indexeddb.js         # IndexedDB 封装(2 个 store: meta + sceneParams)
│   └── 02_workspace.js         # 工作区(轻量版,只存 last scene + fav + visited + sceneParams)
├── tools/                      # 辅助工具(纯 Python 3 标准库)
│   ├── graph_query.py          # 知识图谱查询 CLI
│   ├── md_to_json.py           # 知识图谱生成器
│   └── README.md
├── _test/                      # CDP headless 验证脚本(Edge 远程调试)
│   ├── _cdp_test.js
│   ├── _shot.js
│   ├── _test_all.ps1
│   └── _test_one.ps1
├── vendor/three/               # three.js r160 本地(从 three.jsWeb 复制,1.2MB)
└── Output/                     # 本地截图(不入仓,gitignore)
```

### 场景模块规范

每个场景文件 `viewer/scenes/XX_*.js` 必须导出 `createScene(host, opts)`,返回:
```js
{
  sceneId: '...',           // 唯一 ID(对应 SCENES.id)
  getFormula(): string,     // 核心公式(给 AI 上下文用)
  getLesson(): string,      // 教学要点(给 AI 上下文用,v0.6.4+)
  destroy(): void,          // 清理:动画停 + DOM 删 + GPU 资源释放
}
```

`host` 是 canvas 容器(已挂在 viewer 里),`opts.aiPanel` 是 AI 面板实例。

**Scene 内部**:
- 自己创建 canvas/three.js renderer
- 自己创建教学卡片(`.mathw-lesson`)+ 控件(`.mathw-controls`)
- 用 `kernel/02_animation.js` 的 `makeLoop` 管理 rAF
- ResizeObserver 跟 host 尺寸
- destroy() 必须把 RAF cancel + 几何体 dispose + DOM 全部 remove

### AI 上下文协议

`index.html` 入口用 `viewer.aiPanel` 暴露 AI 面板,场景切换时:
```js
aiPanel.setActiveScene(scene, instance);  // 传 SCENES 项 + 场景实例
```
AI 提问时,`AIPanel._buildSceneContext()` 会读 `instance.getFormula()` + `instance.getLesson()` 拼上下文 → mock/real LLM。

## 3. 铁律(改前必看)

1. **零构建** — 不引 webpack/vite/npm,改完即跑。
2. **断网能跑** — three.js 走 `vendor/three/`,LLM 默认 mock。
3. **场景独立** — 一个场景挂了不影响其他场景加载,viewer 兜底显示错误。
4. **窗口版本** — 改 `window.MATHW_V` 一处全员生效,所有 `import` 走 `?v=${V}`。
5. **DOM 收口** — 每个场景 destroy() 必须配对 cancelAnimationFrame + removeEventListener + geometry.dispose + DOM remove。
6. **AI 兜底** — 永远默认 mock,真 LLM 通过 `_llm_config.json` 或 `M3_API_KEY` 启用,ping 失败降级 mock。
7. **中文文件名** — 文档/场景描述用中文,代码注释用中文(对齐 canvasweb / three.jsWeb)。
8. **不主动 rebase / force-push / amend**(项目推 GitHub 后启用)。

## agent 工作流(5 步归档,v0.6.13 启用)

> 每个任务一个完整循环(全部在 1 个 commit 里)。项目内 3 动态文件驱动,新 agent 启动 30 秒看懂。

### 启动(0-3 步)

1. 读 `AGENTS.md` 本文件(30 秒建认知:看"项目状态速览"段)
2. 读 `PLAN.md` 找第一个 `[~]` 或 `[ ]` 任务
3. (可选) 读 `.Log/项目宏观.md` + 最近 1-2 个 `.Log/YYYY-MM-DD.md` 了解能力库

### 5 步归档(干活中)

1. **改代码**(改 `viewer/scenes/XX_*.js` / `kernel/01_math-core.js` / `mock/01_llm-mock.js` 等)
2. **commit + push**(commit message 必含 `vX.Y.Z` + 关键改动;失败由 push-retry cron 处理)
3. **AGENTS.md 同步**(能力 → `.Log/YYYY-MM-DD.md`,§0 状态速览更新,第 2 段目录树自动同步)
4. **README.md 同步**(跟 AGENTS §0 / 能力段派生;**非主要,顺带更新**)
5. **PLAN.md 删条目 + MEMORY.md 简记**(agent 数据目录,不入仓)

### 任务来源(3 个,自动加 PLAN 条目)

| 来源 | 触发 | 何时加 |
|---|---|---|
| **user 对话**(v0.6.14) | 用户说"做 / 加 / 改 / 修 / 实现"等 + 实际项目内容 | agent 识别后**自动**在 PLAN 加 `[ ]` 条目,不需用户专门说 |
| **feedback_inbox.json** | 跨 agent P0 催办(open + target=math-advisor) | agent 读 inbox 加 `[ ]` |
| **AGENTS 已知 TODO**(§7) | 见 §7 段 | agent 启动时扫一次,转 `[ ]` |

**对话驱动识别规则**:涉及"做 / 加 / 实现 / 修 / 改"实际项目内容 = 任务;闲聊/查询/讨论 = 不是任务。

### 规则

- **完成任务 → PLAN 删条目**(不保留 [x],保持短小)
- **架构变化**(加/删文件/目录/模块/依赖)→ AGENTS §2 目录树自动同步(架构自动同步规则 v0.6.7)
- **能力 append → `.Log/YYYY-MM-DD.md`**(新能力落地自动加,不在 AGENTS 段)
- **不写 CHANGELOG.md**(本项目已删,审计靠 git commit message)
- **MEMORY.md 不入仓**(在 agent 数据目录 `C:\Users\yongzhang\.minimax\agents\math-advisor\`,跨项目)
- **文档微调不推 git**(2026-08-25):AGENTS / PLAN / README 纯文档微调 → 只本地改,不 commit,不 push。代码改动仍走 5 步归档
- **自动推进**(v0.6.19 修正):**cron session 自动**做 P0/P1/P2 任务,不需 user 显式说"做 X"
- **基础架构红线**(v0.6.20 细化):分 2 层 — **改任务条目内容(描述/验收/依赖/预计 commit 数/进度/子项)agent 可自动做**;**改 PLAN 框架/段结构 / 改 AGENTS.md / 删整目录 / 改 git remote / 改 cron prompt 仍需 user 显式确认**
- **PLAN 维护者**(v0.6.20 新增):cron session 主动扫一遍 PLAN 找调整项,**自动改任务条目**(微调) — 不改任务/不改 framework

## 4. 跑起来

```powershell
# Windows PowerShell
.\start.ps1
# 浏览器:http://localhost:8765
```

```bash
# macOS / Linux
python3 -m http.server 8765
```

## 5. URL 参数

| 参数 | 作用 | 默认 |
|---|---|---|
| `?scene=<id>` | 初始场景 | `catenary-arch` |
| `?noai=1` | 关闭 AI 面板 | 开 |
| `?force=mock` | 强制 mock LLM(跳过 `_llm_config.json`) | 尝试真 LLM |

可用 scene id: `catenary-arch` / `planetary-orbits` / `fourier-synth` / `population-dynamics` / `mandelbrot` / `simple-harmonic` ...

## 6. 里程碑

- [x] **v0.5.0 (2026-08-21)**: 收藏 + 访问进度 + 场景参数持久化 + 最后访问恢复
- [x] **v0.2.0 (2026-08-21)**: 10 场景 + 真 LLM 接入 + 双平台发布
- [x] **v0.1.0 (2026-08-21)**: 6 场景 MVP · 2D/3D 双模 · AI 助手本地 mock · 6/6 headless 0 错误
- [x] **v0.6.30 (2026-08-25)**: 30 场景 + 19/19 教学要点 + M3 代理
- [ ] **v1.0 (1-2 月)**: 全套主题模块(几何/代数/微积分/概率/物理/工程)+ 教师模式 + 用户账号

## 7. 已知 TODO(按优先级)

- [ ] 3D 场景 WebGL 不可用时降级 2D 静态预览(MATH-004)
- [ ] 真 LLM 端到端测试(配 OpenAI 兼容 key — MATH-015 等 user 配 M3_API_KEY)
- [ ] GitHub 仓库 + 自动化 release(已开仓库,缺 release 自动化)

## 8. 跟兄弟项目的关系

| 项目 | 关系 | 沿用 |
|---|---|---|
| **three.jsWeb** | 范式母版 | 零构建 · 动态 import · 顶层 await · 窗口版本 · ?v= 串号 · 暗色主题 · AI 助手 · vendor 断网化 |
| **canvasweb** | 风格母版 | 暗色主题 · AI 面板 UX · tokens.css 体系 · 中文文档 · GitHub+Gitee 双平台 |
| **OrangeSu** | 工作区血缘 | 同在 `_Lib` 体系(本项目在 `Consultant/14-数学-Mathematics/_MathematicsLib/`) |

## 9. 跨项目偏好(从 user memory 沿用)

- 文档 .md 文件名用中文,禁乱码
- 数字前缀宽度一致(01/02/.../09/10/11)
- 项目推 GitHub 后改完自动 commit + push(代码改动)
- PLAN/AGENTS/README 文档微调不推 git(2026-08-25)
- AI 味敏感,输出"结论优先、数字具体、去 AI 味"
- 永不让用户明文发 token(走 _llm_config.json,gitignore)
