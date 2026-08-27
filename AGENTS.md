# AGENTS.md · MathematicsWeb

> 项目铁律 + 架构 + 状态 + 项目宏观 + 场景开发规范。能力历史 → `.Log/YYYY-MM-DD.md`(每日 append-only)。

## 0. 项目是什么

跨学科数学可视化教学平台,37 场景(2D+3D 双模)覆盖建筑/物理/音乐/生物/艺术/概率/机器学习/工程/初中几何 9 大领域。

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

- **版本**:v0.6.41 · **进度**:38/38 场景 + 27/27 教学要点 + WebGL 降级 + MATH-017 启动
- **远端**:GitHub + Gitee(同步)
- **当前活跃任务**(见 `PLAN.md`):
  - MATH-017 [~] **🚀 2026-08-27 启动**:高中解析几何场景集(6 场景:conic-unified + ellipse-analytic + hyperbola-analytic + parabola-analytic + parametric-curves + polar-rose,人教版选择性必修第一册,沿 MATH-016 节奏分批做)
  - MATH-015 [~] 接 M3 LLM,等 user 配 M3_API_KEY
  - MATH-016 ✅ 完成 8/8(triangle-congruence + pythagorean-theorem + inscribed-angle + similar-triangles + polygon-interior-angles + quadrilateral-family + three-views-3d + power-of-point)
  - MATH-005/006/007 [ ]
- **历史能力库**:`.Log/YYYY-MM-DD.md`(每日 append)
- **历史审计**:git commit message(无 CHANGELOG.md)

## 1. 改前必读(顺序)

1. `AGENTS.md` 本文件
2. `PLAN.md` 任务清单
3. `.Log/YYYY-MM-DD.md` 最近 1-2 个(能力历史,按需)
4. `viewer/scenes/XX_*.js` 等源码(按需)

## 2. 架构(目录结构 — 全面)

```
MathematicsWeb/
├── index.html                  # 入口 + 动态 import + 水印
├── server.py                   # v0.6.0 一体化 HTTP 服务器(静态 + M3 代理 /api/chat)
├── start.ps1 / start.bat       # 启动脚本(PowerShell / CMD)
├── _llm_config.example.json    # LLM 配置模板(7 步 step-by-step)
├── _commit_push.ps1            # 自动 commit + push 包装(GitHub + Gitee)
├── AGENTS.md                   # 本文件(铁律 + 架构 + 状态 + 宏观 + 场景规范)
├── PLAN.md                     # 活跃任务队列(完成即删)
├── README.md                   # 项目门面(URL 参数 + 30 场景速览)
├── .Log/                       # 项目日志(每日能力 append,仅此)
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
│       ├── 30_crystal-lattice.js       # 晶体格 / Bravais(3D · 材料科学)
│       ├── 31_triangle-congruence.js   # 三角形全等判定(2D · 初中几何 7 年级)
│       ├── 32_pythagorean-theorem.js   # 勾股定理(2D · 初中几何 8 年级)
│       ├── 33_inscribed-angle.js       # 圆周角定理(2D · 初中几何 8 年级)
│       ├── 34_similar-triangles.js     # 相似三角形(2D · 初中几何 8 年级)
│       ├── 35_polygon-interior-angles.js  # 多边形内角和(2D · 初中几何 7 年级)
│       ├── 36_quadrilateral-family.js  # 四边形家族(2D · 初中几何 7 年级)
│       └── 38_power-of-point.js       # 圆幂定理 PT² = PA·PB(2D · 初中几何 8 年级)
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
│   ├── _test_one.ps1           # 单场景验证(简单版)
│   └── _test_fallback.js       # WebGL 降级卡片 CDP 验证(Node 24 内置 WS)
├── vendor/three/               # three.js r160 本地(从 three.jsWeb 复制,1.2MB,断网)
└── Output/                     # 本地截图(不入仓,gitignore)
```

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
3. (按需) 读 `.Log/YYYY-MM-DD.md` 最近 1-2 个

### 5 步归档(1 个 commit 里)
1. 改代码
2. commit + push(msg 含 `vX.Y.Z`)
3. AGENTS 同步(能力 → `.Log/YYYY-MM-DD.md`,§0 状态,第 2 目录树自动同步)
4. README 同步(非主要)
5. PLAN 删条目 + MEMORY 简记

### 任务来源
- **user 对话**(v0.6.14)→ agent 自动加 PLAN [ ]
- **feedback_inbox.json** → P0 催办
- **AGENTS § 8 TODO** → 转 [ ]

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

## 6. 项目宏观(产品愿景/形态/模块/路线/风险/哲学)

### 6.1 项目代号 + 愿景

- **代号**:MathAdvisor(内部代号 14-数学-Mathematics)
- **MathematicsWeb = 上层"数学顾问"产品的 Web App 形态(Phase 1 产物)**
- **愿景**:让每个学习者身边都有一位"IMO 金牌教练 + 数学系老教授",把已整理的"小学到大学 + 应用数学"完整知识图谱做成**会思考的数学顾问**——既查/练/讲,也对个人进度出题/纠错/推荐

### 6.2 6 产品形态

| 形态 | 状态 |
|---|---|
| 飞书 Agent | ✅ 已上线 |
| **Web App(=MathematicsWeb)** | ⏳ 规划中(Phase 1) |
| 桌面端(Electron/Tauri) | 📋 远期 |
| 微信小程序 | 📋 远期 |
| REST API | 📋 远期 |
| Mathpix 集成 | 📋 远期 |

### 6.3 5 大核心模块

```
┌──────────────────────────────────────────────┐
│            数学顾问 MathAdvisor                │
├──────────┬──────────┬──────────┬────────┬─────┤
│ 知识图谱 │ 题目生成 │ 学习管理 │ AI 助教 │ 多端│
└──────────┴──────────┴──────────┴────────┴─────┘
```

- **知识图谱**:节点 + 边(覆盖小学→大学→应用)。当前 10 分类目录已入库(`docs/knowledge_graph.json` · 56 章节)
- **题目生成**:静态题库(5000+)+ 动态生成(模板+参数)+ LLM 出题
- **学习管理**:进度追踪 / 错题本 / 学习路径 / 成就系统
- **AI 助教**:解题 / 讲解(多风格) / 对话 / 应用案例
- **多端 UI**:Web + 飞书 + 小程序 + 桌面端

### 6.4 技术栈(关键选型)

| 层 | 选型 | 理由 |
|---|---|---|
| 后端 | FastAPI(Python) | 异步/自动文档/数学生态好 |
| 前端 | React + TypeScript | 生态成熟 |
| 数学引擎 | SymPy + MathJax/KaTeX | 公式/符号计算 |
| 数据库 | PostgreSQL(主)+ SQLite(离线) | 张勇有 SQLite 经验 |
| LLM | Claude / GPT / Ollama | 解题/讲解 |
| 部署 | Docker Compose → K8s | 平滑扩容 |

### 6.5 路线图(Phase 0-4)

| 阶段 | 时间 | 关键产物 | 验证 | 当前 |
|---|---|---|---|---|
| **Phase 0** 资产盘点 | W1-2 | 知识图谱 + 飞书 Bot | md 入库,Bot 可查/出题 | 🔄 |
| **Phase 1** MVP | W5-6 | Web MVP | 100 用户内测 ≥ 4.0 | ⏳ |
| **Phase 2** 完整功能 | W10-12 | 完整学习闭环 | 日活 1000+ | ⏳ |
| **Phase 3** AI 智能化 | W16-20 | AI Tutor | 解题准确率 ≥ 85% | ⏳ |
| **Phase 4** 商业化 | W24+ | 商业化 | DAU 1万+ | ⏳ |

### 6.6 关键决策(append-only)

- 2026-08-21: 零构建范式
- 2026-08-21: three.js 走 vendor/
- 2026-08-21: LLM 默认 mock
- 2026-08-25 v0.6.4: AI 上下文接 getLesson 通道
- 2026-08-25 v0.6.6: 3 文件自动化框架
- 2026-08-25 v0.6.7: AGENTS 架构自动同步规则
- 2026-08-25 v0.6.11: 产品开发计划融合
- 2026-08-25 v0.6.13: 精简 2 文件体系
- 2026-08-25 v0.6.14: 对话驱动 PLAN
- 2026-08-25 v0.6.15: PLAN 纯任务清单
- 2026-08-25 v0.6.19: 自动推进(cron session)
- 2026-08-25 v0.6.20: PLAN 维护者 + 红线分层
- 2026-08-25 v0.6.21: M3 真实 LLM 代理(等 user 配 key)
- 2026-08-25 v0.6.31: 新建 .Log/ 项目日志
- 2026-08-25 v0.6.33: AGENTS 瘦身保结构
- 2026-08-25 v0.6.34: AGENTS 整合 3 份参考文档
- 2026-08-25 v0.6.35: 3D WebGL feature detection + 降级卡片(MATH-004)
- 2026-08-26 v0.6.36: 初中几何场景集首批 2 个(MATH-016)· triangle-congruence(SSS/SAS/ASA/AAS/HL 5 判定法 + 拖动 DEF 验证) + pythagorean-theorem(a²+b²=c² + 3 证法视图:3-squares / Garfield 1876 / 赵爽弦图)
- 2026-08-26 v0.6.37: 初中几何场景集第二批 2 个(MATH-016 4/8)· inscribed-angle(4 视图:同弧一般/Thales 半圆 90°/同弧多点验证/圆内接四边形对角互补) + similar-triangles(3 视图:自由缩放/平行线分线段 Thales 比例/面积比 k²)
- 2026-08-26 v0.6.38: 初中几何场景集第三批 2 个(MATH-016 6/8)· polygon-interior-angles(4 视图:正 N 边形/自由多边形可拖凹形/三角形分解 N-2 块/外角和 360° 恒成立) + quadrilateral-family(3 视图:韦恩图集合嵌套/变形演示实时判别/8 形状对比画廊)
- 2026-08-26 v0.6.40: 初中几何场景集收官 1 个(MATH-016 8/8 全部完成)· power-of-point(圆幂定理:PT²=PA·PB+双割线等积+相交弦+径向扫描 4 视图 + Apollonius ~200BC)

### 6.7 风险(关注)

- 题目质量参差 → 人工审核 + 反馈
- LLM 成本 → 本地 Ollama / 缓存
- 知识点图谱构建慢 → 模板化 + 渐进式
- 飞书生态依赖 → Web / 小程序多端

### 6.8 哲学

> **先做骨架,再长血肉**。Phase 0-1 把"查 + 练"打通,AI 和商业化是后面的事。地基扎实了,上面随便盖。

## 7. 场景开发规范

### 7.1 createScene 返回结构

每个场景文件 `viewer/scenes/XX_*.js` 必须导出 `createScene(host, opts)`,返回:

```js
{
  sceneId: '...',           // 唯一 ID(对应 SCENES.id)
  getFormula(): string,     // 核心公式(给 AI 上下文)
  getLesson(): string,      // 教学要点(给 AI 上下文,v0.6.4+)
  destroy(): void,          // 清理:动画停 + DOM 删 + GPU 资源释放
}
```

- `host`: canvas 容器(已挂在 viewer 里)
- `opts.aiPanel`: AI 面板实例

### 7.2 Scene 内部

- 自己创建 canvas/three.js renderer
- 自己创建教学卡片(`.mathw-lesson`)+ 控件(`.mathw-controls`)
- 用 `kernel/02_animation.js` 的 `makeLoop` 管理 rAF
- ResizeObserver 跟 host 尺寸

### 7.3 destroy() 必须配对

- `cancelAnimationFrame` 停动画
- `removeEventListener` 清事件
- `geometry.dispose` + `material.dispose` 释放 GPU
- 全部创建过的 DOM 节点 `remove`

### 7.4 AI 上下文协议

```js
aiPanel.setActiveScene(scene, instance);  // 传 SCENES 项 + 场景实例
```

AI 提问时,`AIPanel._buildSceneContext()` 读 `instance.getFormula()` + `instance.getLesson()` 拼上下文 → mock/real LLM。

### 7.5 注册新场景 3 步

1. 创建 `viewer/scenes/XX_xxx.js`
2. `viewer/viewer.js` SCENES 数组末尾加一项(`{ id, title, desc, create, category }`)
3. AGENTS §2 目录树自动同步(架构同步规则 v0.6.7)

### 7.6 教学要点 getLesson

每个场景应实现 `getLesson()` 返回纯文本,包括:核心概念 / 历史背景 / 关键参数 / 3-5 个应用。参考 `06_simple-harmonic`。

## 8. 里程碑

- [x] **v0.6.30 (2026-08-25)**: 30 场景 + 19/19 教学要点 + M3 代理
- [x] **v0.6.35 (2026-08-25)**: 3D 场景 WebGL feature detection + 降级卡片(MATH-004)
- [x] **v0.6.36 (2026-08-26)**: 32 场景 + 21/21 教学要点 + 初中几何 2 场景(MATH-016 首批)
- [x] **v0.6.37 (2026-08-26)**: 34 场景 + 23/23 教学要点 + 初中几何第二批 2 场景(MATH-016 4/8)
- [x] **v0.6.38 (2026-08-26)**: 36 场景 + 25/25 教学要点 + 初中几何第三批 2 场景(MATH-016 6/8)
- [x] **v0.6.39 (2026-08-26)**: 37 场景 + 26/26 教学要点 + 初中几何第四批 1 场景(MATH-016 7/8 · 3D 唯一)
- [x] **v0.6.40 (2026-08-26)**: 38 场景 + 27/27 教学要点 + 初中几何 8 场景全部完成(MATH-016 8/8)· 收官场景 power-of-point(圆幂定理)
- [ ] **v1.0**: 全套主题模块 + 教师模式 + 用户账号

## 9. 已知 TODO

- 真 LLM 端到端测试(MATH-015,等 user 配 M3_API_KEY)
- GitHub 仓库 + 自动化 release

## 10. 兄弟项目

| 项目 | 关系 | 沿用 |
|---|---|---|
| three.jsWeb | 范式母版 | 零构建 · 动态 import · vendor 断网化 |
| canvasweb | 风格母版 | 暗色 · AI 面板 · tokens.css |
| OrangeSu | 工作区血缘 | 同在 `_Lib` 体系 |

## 11. 跨项目偏好(user memory 沿用)

- 文档 .md 文件名用中文,禁乱码
- 数字前缀宽度一致(01/02/.../09/10/11)
- 代码改动自动 commit + push
- 文档微调不推 git(2026-08-25)
- AI 味敏感,"结论优先、数字具体、去 AI 味"
- 永不让 user 明文发 token
