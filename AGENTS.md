# AGENTS.md · MathematicsWeb · 跨学科数学可视化(项目铁律 + 架构 + 能力库)

> 任何 AI 改这个项目前,先读完本文件。**项目内 2 个动态文件**:AGENTS.md(本文件)+ PLAN.md(任务)。
> 这是项目元数据 + 操作约束 + 项目状态 + 能力库 的单一事实源。

---

## 0. 项目是什么

**MathematicsWeb** 是一个跨学科数学可视化教学平台。每个"场景"是一个独立的动态 demo,把抽象的数学概念嵌进真实的应用场景里——建筑、物理、音乐、生物、艺术、机器学习。

| 维度 | 值 |
|---|---|
| 版本 | v0.5.0 (2026-08-21) |
| 仓库 | <https://github.com/1500385678/MathematicsWeb> + Gitee 镜像 |
| 端口 | 8765(默认,可在 start.ps1 改) |
| 后端 | **无**(纯前端,MVP) |
| 前端 | 原生 ES Modules · 零构建工具,无 npm 依赖 |
| 渲染 | 2D Canvas2D + 3D three.js(场景级切换) |
| 数据 | IndexedDB(场景参数 / 收藏) · localStorage(LLM 配置) |
| 启动 | `start.ps1`(Win PowerShell)/ `start.bat`(Win CMD)/ `python -m http.server 8765` |
| 验证 | 6 个场景 Chrome headless 0 错误(2D 全过,3D 需真浏览器 WebGL) |

> 沿用 **three.jsWeb** 的范式:动态 import + 顶层 await + window version + ?v= 串号防缓存。沿用 **canvasweb** 的"AI 助手是标配"思想。两者都做到**断网能跑**(three.js 走 vendor,LLM 默认 mock)。

## 项目状态速览(动态,agent 自动维护)

> agent 启动第一件事看这里:版本/阶段/进度/远端。30 秒建认知。改动后跟 "项目已具备的能力" 段一起 append。

- **版本**:v0.6.29 · **阶段**:Phase 2 完整功能 · **进度**:30/30 场景 + 17/19 教学要点
- **远端**:GitHub `1500385678/MathematicsWeb` + Gitee `architectzy/MathematicsWeb`(镜像) · 端口 8765
- **当前活跃任务**(从 PLAN.md 拉):MATH-014 ✅ 收尾(10/10 全部落地)· MATH-003 [~] 17/19 教学要点,第十批 10 + 17 已加,剩 2 场景(19_electric-field · MATH-003 收尾) · MATH-004/005/006/007 [ ]
- **完整流程**:`AGENTS.md`(本文件)+ `PLAN.md`(任务)→ 这是项目内 2 个动态文件,agent 必读
- **历史审计**:看 git commit message(本仓库无 CHANGELOG.md,审计在 commit)
- **项目宏观**:见下面 "## 项目宏观" 段(产品愿景/路线/技术栈/风险)

## 项目宏观(产品愿景/路线/技术栈/风险)

> **项目级宏观内容** — 之前散落在 PLAN.md "## 产品开发计划" 段,v0.6.15 全部归到这里。PLAN.md 只管任务清单,本段管项目整体走向。

### 1. 项目代号 + 愿景

- **代号**:MathAdvisor(内部代号 14-数学-Mathematics)
- **MathematicsWeb = 上层"数学顾问"产品的 Web App 形态(Phase 1 产物)**
- **愿景**:让每个学习者身边都有一位"IMO 金牌教练 + 数学系老教授"。把已整理的"小学到大学 + 应用数学"完整知识图谱做成**会思考的数学顾问**——既查/练/讲,也对个人进度出题/纠错/推荐

### 2. 6 产品形态

| 形态 | 场景 | 状态 |
|---|---|---|
| 飞书 Agent | 工作中随问随答 | ✅ 已上线 |
| **Web App(核心) = MathematicsWeb** | 自学/教学/家长辅导 | ⏳ 规划中(Phase 1) |
| 桌面端(Electron/Tauri) | 离线场景 | 📋 远期 |
| 微信小程序 | 小学生/家长 | 📋 远期 |
| REST API | 嵌入其他系统 | 📋 远期 |
| Mathpix 集成 | 拍照识别题目 | 📋 远期 |

### 3. 5 大核心模块

```
┌──────────────────────────────────────────────┐
│            数学顾问 MathAdvisor                │
├──────────┬──────────┬──────────┬────────┬─────┤
│ 知识图谱 │ 题目生成 │ 学习管理 │ AI 助教 │ 多端│
│ (Graph) │ (Quiz)   │ (Study)  │ (AI)   │(UI) │
└──────────┴──────────┴──────────┴────────┴─────┘
```

#### 模块 1 · 知识图谱(Knowledge Graph)
- 节点(知识点) + 边(前置/关联/升级) · 覆盖小学→大学→应用
- **当前状态**:✅ 10 分类目录已入库(`docs/knowledge_graph.json` · 10 节点 / 56 章节 / 30,873 字符)

#### 模块 2 · 题目生成(Quiz Engine)
- 静态题库(5000+) + 动态生成(模板+参数,无限) + LLM 出题(兜底)

#### 模块 3 · 学习管理(Study Manager)
- 进度追踪 / 错题本 / 学习路径 / 成就系统

#### 模块 4 · 智能助手(AI Tutor)
- 解题 / 讲解(多风格)/ 对话 / 应用案例

#### 模块 5 · 多端 UI
- Web App(=MathematicsWeb)+ 飞书 + 小程序 + 桌面端

### 4. 技术栈(关键选型)

| 层 | 选型 | 理由 |
|---|---|---|
| **后端** | FastAPI(Python) | 异步/自动文档/数学生态好 |
| **前端** | React + TypeScript | 生态成熟/组件丰富 |
| **数学引擎** | SymPy + MathJax/KaTeX | 公式/符号计算 |
| **数据库** | PostgreSQL(主) + SQLite(离线) | 张勇已有 SQLite 经验 |
| **LLM** | Claude / GPT / 本地 Ollama | 解题/讲解/出题 |
| **部署** | Docker Compose → K8s | 单机起步,平滑扩容 |

### 5. 路线图(Phase 0-4)

| 阶段 | 时间 | 关键产物 | 验证 | 当前进度 |
|---|---|---|---|---|
| **Phase 0** 资产盘点 | W1-2 | 知识图谱 JSON + 飞书 Bot | 6 份 md 入库,Bot 可查/可出题 | **🔄 进行中**(md_to_json.py + graph_query.py ✅) |
| **Phase 1** MVP | W5-6 | Web MVP(= MathematicsWeb) | 100 用户内测,反馈 ≥ 4.0/5.0 | ⏳ 未开始 |
| **Phase 2** 完整功能 | W10-12 | 完整学习闭环 | 日活 1000+ · 留存 ≥ 30% | ⏳ 未开始 |
| **Phase 3** AI 智能化 | W16-20 | AI Tutor | 解题准确率 ≥ 85% | ⏳ 未开始 |
| **Phase 4** 商业化 | W24+ | 商业化版本 | DAU 1万+ / 付费转化 ≥ 5% | ⏳ 未开始 |

### 6. 关键决策(append-only)

- 2026-08-21: 零构建范式(不引 webpack/vite/npm)
- 2026-08-21: three.js 走 vendor/(避免 CDN 依赖)
- 2026-08-21: LLM 默认 mock 兜底,真 key 才接 M3
- 2026-08-25: v0.6.4 AI 上下文接 getLesson 教学要点通道
- 2026-08-25: v0.6.6 3 文件自动化框架(PLAN/AGENTS/MEMORY)
- 2026-08-25: v0.6.7 AGENTS 架构自动同步规则(User Memory 永久)
- 2026-08-25: v0.6.11 产品开发计划融合进 PLAN
- 2026-08-25: v0.6.13 精简为 2 文件体系(AGENTS+PLAN)
- 2026-08-25: v0.6.14 对话驱动 PLAN 框架
- 2026-08-25: v0.6.15 PLAN 纯任务清单,宏观归 AGENTS

### 7. 风险(关注)

- 题目质量参差 → 人工审核 + 反馈
- LLM 成本 → 本地 Ollama / 缓存
- 知识点图谱构建慢 → 模板化 + 渐进式
- 飞书生态依赖 → Web / 小程序多端

### 8. 哲学

> **先做骨架,再长血肉**。Phase 0-1 把"查 + 练"打通,AI 和商业化是后面的事。地基扎实了,上面随便盖。

## 项目已具备的能力(append-only)

> 任务从 PLAN 完成 → append 到这里。
> 规则:append-only,只加不删改,每条标版本号 + 简短描述,让 agent 启动一读就懂。

- **场景参数序列化**(v0.5.0):每个场景的 a/ω/N 等参数存 IndexedDB,刷新自动恢复。Workspace + IDB + viewer 三层 save/restore 链路已通
- **场景收藏 + 访问进度 UI**(v0.5.0):场景列表加收藏星标 + 进度计数,过滤按钮(全部/收藏/未访问),状态栏显示 `进度 N/20`
- **AI 教学要点通道 getLesson**(v0.6.4):每个场景可选实现 `getLesson()` 方法,AI 面板 `_buildSceneContext` 读后拼进 LLM prompt(`[教学要点: ...]`),提升 AI 助手质量。simple-harmonic 已示范
- **MATH-003 4/19 教学要点通道第三批**(v0.6.10):18_lagrange(切点几何/∇f 平行 ∇g/等周不等式)+ 20_neural-net(2 层全连接 2D 分类/反向传播/决策曲线演化)接 getLesson(),真 LLM 上下文继续扩展。剩余 15 个场景按用户反馈优先级
- **MATH-003 6/19 教学要点通道第四批**(v0.6.16):15_lsystem(Lindenmayer 1968 字符串重写/产生式 + 迭代 N 次/turtle 解释器 + stack push-pop/4 预设规则 + 迭代数 + 角度看植物形态)+ 14_bayesian(贝叶斯定理 P(θ|data) ∝ P(θ)·P(data|θ)/频率派 vs 信念派/Beta-Binomial 共轭 + MAP 公式/调 αβ 看观测怎么把后验拉向数据)接 getLesson()。剩余 13 个场景按教学价值排序,下一批 12_clt + 01_catenary
- **MATH-003 8/19 教学要点通道第五批**(v0.6.17):12_clt(中心极限定理:独立同分布随机变量之和 → 正态分布/N=1 均匀/N=2 三角/N≥30 几乎一样/调 N 看分布收敛 + 叠加理论正态曲线对比)+ 01_catenary-arch(悬链线 y = a·cosh(x/a) 倒置成拱/高迪圣家族大教堂 + 罗马万神殿/拖 a 看胖瘦 + 跨度 + 翻转/古代无钢筋混凝土大跨度方法)接 getLesson()。剩余 11 个场景按教学价值排序,下一批 09_double-pendulum + 03_fourier-synth
- **MATH-003 10/19 教学要点通道第六批**(v0.6.21):09_double-pendulum(Lagrangian L = T − V → Euler-Lagrange → 两个非线性 ODE/无解析解只能用 RK4 数值积分/8 条对照摆初值差 0.001 弧度演示蝴蝶效应/相空间 θ₁-ω₁ 填充)+ 03_fourier-synth(任何波形 = 一堆旋转箭头/方波只有奇数次谐波 bₙ = 4/(nπ)/N 越大越接近原函数 Gibbs 跳变点 9% 过冲/4 波形:方波/锯齿/三角/脉冲)接 getLesson()。剩余 9 个场景按教学价值排序,下一批 02_planetary-orbits + 13_riemann-sum
- **MATH-014 几何类 10 场景首批 3 个**(v0.6.22):21_voronoi(沃罗诺伊图:N 个种子按最近距离切平面/逐像素暴力 + Delaunay 对偶 /点鼠标加种子 /应用:最近邻查询·医院覆盖区·晶体学)+ 22_delaunay(德劳内三角剖分:Bowyer-Watson 增量法 / 空圆性质 / 拖动点重剖 / 最大化最小角可视化 / 应用:地形 TIN·有限元·3D 重建)+ 23_ellipse-reflection(椭圆 x²/a² + y²/b² = 1 / 从一焦点发光反射必过另一焦点 / 法线 + 入射 + 反射 + 焦点可视化 / 应用:天文望远镜·回声室·冲击波碎石)。viewer.js SCENES 数组加 3 项,场景库 20 → 23。剩余 7 个场景(24_lemniscate / 25_buffon-needle / 26_koch-snowflake / 27_sierpinski / 28_great-circle / 29_mobius-strip / 30_crystal-lattice)按 cron session 节奏继续
- **MATH-014 几何类 10 场景第二批 3 个**(v0.6.23):24_lemniscate(伯努利 1694 双纽线 r² = a²·cos(2θ)/8 字形 + 极坐标网格 + r(θ) 函数图/调 a 看胖瘦/应用:电偶极子等势线 + 双曲面透镜 + 复分析)+ 25_buffon-needle(布丰 1733 投针:P = 2L/(πd)/实时显示 π 估计 vs 真实 π 误差百分比/投 50/500 演示大数定律/应用:第一个蒙特卡洛方法 + 几何概率奠基 + MCMC 鼻祖)+ 26_koch-snowflake(Koch 1904 雪花:N 步迭代/周长 → 无穷大 + 面积收敛 + Hausdorff 维数 log4/log3 ≈ 1.26/动画生长 + 填充面积/应用:海岸线长度悖论 + 分形几何奠基 + 分数维示例)。viewer.js SCENES 数组加 3 项,场景库 23 → 26。剩余 4 个场景(27_sierpinski / 28_great-circle / 29_mobius-strip / 30_crystal-lattice)按 cron session 节奏继续
- **MATH-014 几何类 10 场景第三批 3 个**(v0.6.24):27_sierpinski(Sierpiński 1915 双视图:上方混沌游戏任意点跳随机顶点中点 + 下方 N 步确定性挖中间 3ⁿ 三角/Hausdorff 维数 log3/log2 ≈ 1.585/3 顶点 3 色点云累积 + 填色递归 + 3ⁿ 数字统计/应用:递归数据结构 + 分形天线 + Escher 极限版画 + 经典混沌游戏吸引子)+ 28_great-circle(球面大圆:10 城市(PEK/JFK/LHR/HND/SYD/CDG/PVG/LAX/SIN/CPT)/haversine 公式算球面距离 + 大圆航线(绿实线弯向高纬)+ 恒向线对比(黄虚线经纬拼接)/初始航向 + 大圆省 5-15% 数字显示/正交投影经纬网 + 赤道加粗/应用:跨洋航班 + 大圆海图 + GPS 距离 + 卫星轨道)+ 29_mobius-strip(Möbius 1858 单面环:3D three.js 参数曲面 x=(R+v·cos(u/2))·cos(u)/y=v·sin(u/2)/z=(R+v·cos(u/2))·sin(u) + DoubleSide 双面渲染展示"单面"拓扑 + 蚂蚁沿中心走 u∈[0,4π] 才回原面 + 中心参考圆 LineLoop/带宽 w + 半径 R + 走带速度 + 蚂蚁开关/应用:传送带(双面磨损均匀)+ 无感电阻 + 莫比乌斯环书 + 非可定向曲面经典)。viewer.js SCENES 数组加 3 项,场景库 26 → 29。剩 1 个场景(30_crystal-lattice)按 cron session 节奏继续
- **MATH-014 几何类 10 场景收尾 1 个**(v0.6.25):30_crystal-lattice(晶体格 3D:4 种 Bravais 晶系 SC/BCC/FCC/HCP 对比/配位数 6→8→12/APF 0.5236→0.6802→0.7405/晶格常数 a + 原子半径 r 滑块看原子接触转变/晶胞线框 + 邻居 27 晶胞展示周期性/HCP 用六方棱柱 c/a=√8/3 ≈ 1.633/例子面板:α-Po(SC)· α-Fe/Cr/Mo/W(BCC)· Cu/Au/Ag/Al/γ-Fe/NaCl(FCC)· Mg/Zn/Ti/Co(HCP)/应用:半导体晶圆 + 金属相变 α↔γ 铁 + X 射线衍射)。viewer.js SCENES 数组加 1 项,场景库 29 → 30。**MATH-014 完成,10/10 全部落地**
- **MATH-003 12/19 教学要点通道第七批**(v0.6.26):02_planetary-orbits(开普勒第三定律 T² ∝ a³ / 椭圆 r=a(1-e²)/(1+e·cosθ) / 9 大行星 + 月球绕地球 / a 用 log 压缩(冥王 40 AU vs 木星 5.2 真实差 8 倍,画不下)/ 调时间倍率外圈明显慢,直观体验 T∝a^1.5)+ 13_riemann-sum(∫ 算不出来就用矩形 / 梯形 / 抛物线堆 / 4 函数(sin/x²/e^(-x²)/1/(1+x²)) + 5 方法(左/右/中/梯形/Simpson) / 收敛阶对比:左/右 O(1/N) 慢 / 梯形 O(1/N²) / Simpson 抛物线 O(1/N⁴) 精度爆炸)接 getLesson(),真 LLM 上下文继续扩展。剩余 7 个场景按教学价值排序,下一批候选:05_mandelbrot / 07_golden-spiral / 16_wave-interference
- **MATH-003 13/19 教学要点通道第八批**(v0.6.27):05_mandelbrot(复动力系统 z_{n+1}=z_n²+c / M 集连通但边界 fractal(Douady-Hubbard 1982)/Hausdorff 维数猜想 2 / 1984 发现 M 集附近藏缩小副本 / 4 配色(海洋/火焰/灰度/彩虹)+ 迭代数 20-200 + 缩放演示 seahorse valley)+ 16_wave-interference(线性叠加原理 P=ΣAᵢcos(k·rᵢ−ωt)/建设性(同相) + 破坏性(反相)干涉 / 1801 Young 双缝实验 Δy=λL/d / 关键参数:λ 波长(条纹疏密)+ 源距 D(条纹方向)+ 分辨率 80-240)接 getLesson(),真 LLM 上下文继续扩展。剩余 4 个场景按教学价值排序,下一批候选:07_golden-spiral / 08_monte-carlo(数学+概率)
- **MATH-003 15/19 教学要点通道第九批**(v0.6.28):07_golden-spiral(欧几里得《几何原本》"中外比" = φ / 费波那契 1202 兔子问题 / F(n)/F(n-1) → φ 极限 / 黄金矩形自相似切 + 对数螺旋 r(θ)=a·e^(bθ) / 黄金角 137.5°=360°/φ² Vogel 1979 向日葵种子 / 欧几里得-达芬奇-帕特农神庙-米罗的维纳斯历史 / DNA 双螺旋 34Å/21Å ≈ φ / 股市斐波那契回调 0.382/0.618 = 1/φ)+ 08_monte-carlo(Ulam 1946 玩纸牌想到 / von Neumann 在曼哈顿计划 ENIAC 实现命名 Monte Carlo(摩纳哥赌场)/ 收敛 O(1/√N) 慢但与维度无关(黎曼和高维爆维数灾难)/ Metropolis-Hastings 1953 MCMC 鼻祖 / 4 大应用:Black-Scholes 期权 7 维积分 + 粒子输运 MCNP + 贝叶斯 MCMC + 量子蒙特卡洛 VASP / 路径追踪电影特效 / AlphaGo MCTS)接 getLesson(),真 LLM 上下文继续扩展。剩余 4 个场景按教学价值排序,下一批候选:10_gradient-descent / 17_julia / 19_electric-field
- **MATH-003 17/19 教学要点通道第十批**(v0.6.29):10_gradient-descent(凸优化 + Rosenbrock 1960 香蕉谷 + 鞍面 x²−y² 卡 0 梯度 / 三族优化器 GD 朴素 / Momentum Polyak 1964 v ← βv + g 助爬浅谷 / Adam Kingma & Ba 2014 一阶+二阶矩自适应 / 调 η 太小慢太大震荡 NaN / 应用:神经网络 SGD/AdamW/Lion + 物理仿真 + 投资组合 Markowitz + 有限元)+ 17_julia(复动力系统对偶:曼德尔布罗扫 c / 朱利亚扫 z₀ / 1918 Gaston Julia 一战住院研究 + 1980 Mandelbrot IBM 计算机可视化 / 1982 Douady-Hubbard 证明 M 集连通且内部 c → J 集连通 / 经典 c 值:−0.8+0.156i 螺旋 + −0.4+0.6i 树 + −0.835−0.2321i 谢尔宾斯基镂空 / 调 c 看形态巨变 + 迭代 20-200)接 getLesson(),真 LLM 上下文继续扩展。剩余 2 个场景(19_electric-field),MATH-003 接近收尾
- **MATH-003 2/19 教学要点通道第二批**(v0.6.9):04_population-dynamics(Lotka-Volterra 兔狐捕食)+ 11_lissajous(频率比决定图形/相位旋转移位)接 getLesson(),真 LLM 上下文现在能读到教学要点。剩余 17 个场景按教学价值排序,优先级:18_lagrange / 20_neural-net
- **20 跨学科场景(2D + 3D 双模)**(v0.6.0):建筑(悬链拱)/ 物理(行星轨道 · 双摆 · 简谐 · 波叠加 · 电场)/ 音乐(傅里叶 · Lissajous)/ 生物(种群 · L-系统)/ 艺术(曼德尔布罗 · 朱利亚 · 黄金螺旋)/ 概率(蒙特卡洛 · 中心极限定理 · 贝叶斯)/ 机器学习(梯度下降 · 神经网络)/ 工程(黎曼和 · 拉格朗日乘子)
- **2 文件自动化框架 PLAN/AGENTS**(v0.6.13):项目内 2 个动态文件 — AGENTS(铁律+架构+能力库+项目状态速览)+ PLAN(任务)。任务从 PLAN 完成 → 删 PLAN 条目 → append AGENTS 能力段 + AGENTS 状态速览同步 → README 同步(非主要,顺带)。`math-advisor-daily-wake` cron 每日 10:30 触发按 2 文件体系干活
- **AGENTS 架构自动同步规则**(v0.6.7):agent 改任何涉及文件/目录/模块/依赖的项目,自动增量同步 AGENTS.md 第 2 段(目录结构),不用问。永久规则已写入 User Memory,跨所有有 AGENTS.md 范式的项目适用
- **产品开发计划融合进 PLAN**(v0.6.11):`数学顾问开发架构与计划.md` + `项目开发计划.md` 内容去重融合到 PLAN.md"## 产品开发计划"段(8 节,完整开发计划清单)。源文件保留作参考归档。**MathematicsWeb = 上层"数学顾问"产品的 Web App 形态(Phase 1 产物)**,两层文档职责清晰不冲突
- **精简为 2 文件体系**(v0.6.13):删 `.Core/OVERVIEW.md`(合并到 AGENTS 顶部"项目状态速览"段)、`CHANGELOG.md`(审计靠 git commit message)、`docs/` 整个目录(02-05 + knowledge_graph.json)。README 保留但非主要,跟 AGENTS §0 同步。agent 必读路径:`AGENTS.md` + `PLAN.md`
- **Phase 0 知识图谱查询 CLI**(v0.6.8):`tools/graph_query.py` 7 子命令(list/get/category/tag/search/stats/paths)读 `docs/knowledge_graph.json`,纯 stdlib 无依赖,为 Phase 1 FastAPI 路由打底

## 1. 改前必读(顺序)

1. **本文件**(`AGENTS.md`)· 铁律 + 架构 + 能力库 + 项目状态速览
2. **`PLAN.md`** · 任务清单 + 上层产品开发计划(找第一个 [~]/[ ] 任务)
3. **`README.md`**(非主要,顺带看)· 项目门面
4. 完整文件流:`viewer/scenes/XX_*.js` / `kernel/01_math-core.js` / `mock/01_llm-mock.js` 等源码 — 按需查

## 2. 架构

### 目录结构(v0.6.6 实际)

```
MathematicsWeb/
├── index.html                  # 入口 + 动态 import + 水印
├── server.py                   # v0.6.0 一体化 HTTP 服务器(静态 + M3 代理)
├── start.ps1 / start.bat       # 启动脚本
├── _llm_config.example.json    # LLM 配置模板
├── _commit_push.ps1            # 自动 commit + push 包装
├── AGENTS.md                   # 项目铁律 + 架构 + 能力库 + 项目状态速览(动态,本文件)
├── PLAN.md                     # 活跃任务队列(动态,完成即删)
├── README.md                   # 项目门面(跟 AGENTS §0 同步更新,非主要)
├── viewer/
│   ├── viewer.js               # 主壳 + 场景切换 + AI 面板宿主
│   ├── viewer.css              # 全部样式(tokens 体系)
│   ├── 02_ai-panel.js          # AI 助手 UI(对话/建议/状态,接 getLesson/getFormula 上下文)
│   └── scenes/                 # 29 个独立场景(2D + 3D 双模)
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
│   ├── md_to_json.py           # 数学知识图谱生成器
│   └── README.md               # 工具说明
├── _test/                      # CDP headless 验证脚本(Edge 远程调试)
│   ├── _cdp_test.js            # 单场景控制台错误 + canvas 截图
│   ├── _shot.js                # 等动画稳定后截屏
│   ├── _test_all.ps1           # 20 场景批量验证
│   └── _test_one.ps1           # 单场景验证(简单版)
├── vendor/three/               # three.js r160 本地(从 three.jsWeb 复制,1.2MB)
├── Output/                     # 本地截图(不入仓,gitignore)
├── AGENTS.md                   # 项目铁律 + 架构 + 能力库 + 项目状态速览(本文件)
├── PLAN.md                     # 活跃任务队列(完成即删,不保留 [x])
├── README.md                   # 项目门面(跟 AGENTS §0 同步更新)
└── .gitignore                  # 忽略规则(见 §3)
```

### 场景模块规范

每个场景文件 `viewer/scenes/XX_*.js` 必须导出 **`createScene(host, opts)`** 函数,返回:

```js
{
  sceneId: '...',           // 唯一 ID(对应 SCENES.id)
  getFormula(): string,     // 核心公式(给 AI 上下文用)
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
AI 提问时,`AIPanel._buildSceneContext()` 会读 `instance.getFormula()` 拼上下文 → mock/real LLM。

## 3. 铁律(从兄弟项目沿用,改前必看)

1. **零构建** — 不引 webpack/vite/npm,改完即跑。
2. **断网能跑** — three.js 走 `vendor/three/`,LLM 默认 mock。
3. **场景独立** — 一个场景挂了不影响其他场景加载,viewer 兜底显示错误。
4. **窗口版本** — 改 `window.MATHW_V` 一处全员生效,所有 `import` 走 `?v=${V}`。
5. **DOM 收口** — 每个场景 destroy() 必须配对 cancelAnimationFrame + removeEventListener + geometry.dispose + DOM remove。
6. **AI 兜底** — 永远默认 mock,真 LLM 通过 `_llm_config.json` 启用,ping 失败降级 mock。
7. **中文文件名** — 文档/场景描述用中文,代码注释用中文(对齐 canvasweb / three.jsWeb)。
8. **不主动 rebase / force-push / amend**(项目推 GitHub 后启用,目前还没开仓库)。

## agent 工作流(5 步归档,v0.6.13 启用)

> 每个任务一个完整循环(全部在 1 个 commit 里)。项目内 2 动态文件驱动,新 agent 启动 30 秒看懂。

### 启动(0-2 步)

1. 读 `AGENTS.md` 本文件(30 秒建认知:看"项目状态速览"段)
2. 读 `PLAN.md` 找第一个 `[~]` 或 `[ ]` 任务

### 5 步归档(干活中)

1. **改代码**(改 `viewer/scenes/XX_*.js` / `kernel/01_math-core.js` / `mock/01_llm-mock.js` 等)
2. **commit + push**(commit message 必含 `vX.Y.Z` + 关键改动;失败由 push-retry cron 处理)
3. **AGENTS.md 同步**(能力 append + §0 状态速览更新 + 第 2 段目录树自动同步)
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
- **架构变化**(加/删文件/目录/模块/依赖)→ AGENTS.md 第 2 段自动同步(架构自动同步规则,不用问)
- **AGENTS 能力段 / 状态速览 append**(新能力落地自动加)
- **不写 CHANGELOG.md**(本项目已删,审计在 git commit message)
- **MEMORY.md 不入仓**(在 agent 数据目录 `C:\Users\yongzhang\.minimax\agents\math-advisor\`,跨项目)
- **对话驱动 PLAN**(v0.6.14):用户说"加/做/改"项目内容 → agent 自动加 PLAN [ ]
- **自动推进**(v0.6.19 修正):**cron session 自动**做 P0/P1/P2 任务(从 [ ] → [~] → 实施 → 5 步归档),**不需 user 显式说"做 X"**。PLAN 入队即开工。
- **基础架构红线**(v0.6.20 细化):分 2 层 — **改任务条目内容(描述/验收/依赖/预计 commit 数/进度/子项)agent 可自动做**;**改 PLAN 框架/段结构(头部说明/路线图/产品开发计划/元数据) / 改 AGENTS.md / 删整目录 / 改 git remote / 改 cron prompt 仍需 user 显式确认**(防"擅自破坏"基础)。
- **PLAN 维护者**(v0.6.20 新增):cron session 启动时"读 PLAN"后,主动扫一遍 PLAN 找调整项(过期/已完成未删/估算不准/缺验收/缺依赖/排序乱/重复任务),**自动改任务条目**(微调) — 不改任务/不改 framework,只**优化已有任务的内容质量**。

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

可用 scene id: `catenary-arch` / `planetary-orbits` / `fourier-synth` / `population-dynamics` / `mandelbrot` / `simple-harmonic`

## 6. 里程碑

- [x] **v0.5.0 (2026-08-21)**: 收藏 + 访问进度 + 场景参数持久化 + 最后访问恢复 · 双摆加相空间 · 梯度下降加 Momentum + Adam · AI 面板加测 LLM 按钮
- [x] **v0.2.0 (2026-08-21)**: 10 场景 + 真 LLM 接入 + 双平台发布
- [x] **v0.1.0 (2026-08-21)**: 6 场景 MVP · 2D/3D 双模 · AI 助手本地 mock · 6/6 headless 0 错误
- [ ] **v0.6 (2-3 周)**: 扩到 12-15 场景 + 主题模块化
- [ ] **v1.0 (1-2 月)**: 全套主题模块(几何/代数/微积分/概率/物理/工程)+ 教师模式 + 用户账号

## 7. 已知 TODO(按优先级)

- [ ] 3D 场景 WebGL 不可用时降级 2D 静态预览
- [ ] 真 LLM 端到端测试(配 OpenAI 兼容 key)
- [ ] GitHub 仓库 + 自动化 release(沿用 canvasweb 范式 — 仓库已开,缺 release 自动化)

## 8. 跟兄弟项目的关系

| 项目 | 关系 | 沿用 |
|---|---|---|
| **three.jsWeb** | 范式母版 | 零构建 · 动态 import · 顶层 await · 窗口版本 · ?v= 串号 · 暗色主题 · AI 助手 · vendor 断网化 |
| **canvasweb** | 风格母版 | 暗色主题 · AI 面板 UX · tokens.css 体系 · 中文文档 · GitHub+Gitee 双平台 |
| **OrangeSu** | 工作区血缘 | 同在 `_Lib` 体系(本项目在 `Consultant/14-数学-Mathematics/_MathematicsLib/`) |

## 9. 跨项目偏好(从 user memory 沿用)

- 文档 .md 文件名用中文,禁乱码
- 数字前缀宽度一致(01/02/.../09/10/11)
- 项目推 GitHub 后改完自动 commit + push(目前本项目无仓库,先本地)
- AI 味敏感,输出要"结论优先、数字具体、去 AI 味"
- 永不让用户明文发 token(LLM key 走 `_llm_config.json`,gitignore)
