# PLAN · MathematicsWeb

> **任务清单(纯)** · 状态: `[ ]` 待办 / `[~]` 进行中 / `[!]` 阻塞
>
> **v0.6.6 框架规则**:完成的任务**从 PLAN 删除**(不保留 [x]),功能描述 append 到 AGENTS.md "项目已具备的能力" 段,审计留 git commit message。PLAN 保持短小只管活跃任务。
>
> **v0.6.14 对话驱动**:**v0.6.19 修正** → **cron session 自动**做 P0/P1/P2 任务,不需 user 显式 "做 X"。用户说"加 / 做 / 改"项目内容 → agent 自动在 PLAN 加 `[ ]` 条目;**改 / 删 AGENTS.md 或项目基础架构(整目录 / git remote / cron prompt)等"破坏基础"动作仍需 user 显式确认**(防擅自破坏);代码层(场景 / 工具 / UI)agent 可自动做。

> **v0.6.20 PLAN 维护者**(细化红线):**改任务条目内容**(描述/验收/依赖/预计 commit 数/进度/子项/排序)**agent 可自动做**;**改 PLAN 框架/段结构(头部/路线图/产品开发计划/元数据)/ 改 AGENTS.md / 删整目录 / 改 git remote / 改 cron prompt 仍需 user 显式确认**。cron session 启动时"读 PLAN"后主动扫一遍找调整项自动改。
>
> 项目宏观(产品愿景/路线/技术栈/风险) → 见 **AGENTS.md** "## 项目宏观" 段。

---

## 任务队列

### P0 · 阻塞/紧急

_(无 — MATH-003 + MATH-014 + MATH-016 均已收尾完成 v0.6.30 / v0.6.25 / v0.6.40)_

### P1 · 重要

- [~] **MATH-015** · 接真 M3 LLM(等 user 配 M3_API_KEY)
  - **预计 commit 数: 3**(example 改详细配置 + AGENTS 能力段 append + README 配置段各 1 commit)
  - 描述: server.py v0.6.0 已支持 M3 代理(/api/chat endpoint + M3_API_KEY env 优先),但当前 key 未设 → AI 面板走 mock 返回"假"回复。user 反馈"假"自动入队(v0.6.14 对话驱动)
  - 验收: (1) _llm_config.example.json 改详细 step-by-step 配置指南 ✅ (2) AGENTS.md 能力段 append "M3 真实 LLM 代理" (3) README.md 加 M3 配置段 (4) user 配 M3_API_KEY → server 重启 → AI 面板显示真 LLM 回复(非 mock)
  - **状态**:agent 部分完成(example/AGENTS/README 改完),**等 user 配 M3_API_KEY**
  - user 配 key 步骤: PowerShell `[Environment]::SetEnvironmentVariable('M3_API_KEY', 'sk-cp-你的key', 'User')` 永久 User-scope
  - 依赖: user 配 M3_API_KEY(等 user,8/14 安全规则 agent 不主动要 token)
  - 发现者: **用户对话**(用户提"AI 假"反馈, v0.6.14 对话驱动自动入队)

- [x] **MATH-016** · 初中几何场景集(8 场景) ✅ 全部完成
  - **预计 commit 数: 4**(首批 2 + 第二批 1 + 第三批 1 + 第四批 1 + 收官 1,每 10 分钟 1 场景,实际 5 commit 跨 v0.6.36-40)
  - 描述: 对位人教版初中数学 7-9 年级,8 个核心几何场景。沿 MATH-014 节奏分批做
  - **进度: 8/8** ✅(v0.6.36 完成 2 + v0.6.37 完成 2 + v0.6.38 完成 2 + v0.6.39 完成 1 + v0.6.40 完成 1:31+32+33+34+35+36+37+38)
  - 候选清单(8 场景,user 可调):
    - [x] 31 `triangle-congruence` · 三角形全等判定 SSS/SAS/ASA/AAS(7 年级) ✅ v0.6.36
    - [x] 32 `pythagorean-theorem` · 勾股定理 + 7 种证法(8 年级,王炸) ✅ v0.6.36
    - [x] 33 `inscribed-angle` · 圆周角定理 = 1/2 圆心角 + Thales 半圆(8 年级) ✅ v0.6.37
    - [x] 34 `similar-triangles` · 相似三角形 + 平行线分线段 + 面积比 k²(8 年级) ✅ v0.6.37
    - [x] 35 `polygon-interior-angles` · 多边形内角和 = (N-2)×180° + 外角 360°(7 年级) ✅ v0.6.38
    - [x] 36 `quadrilateral-family` · 8 形状韦恩图 + 变形判别 + 画廊(7 年级) ✅ v0.6.38
    - [x] 37 `three-views-3d` · 立体几何三视图 3D(9 年级,唯一 3D) ✅ v0.6.39
    - [x] 38 `power-of-point` · 圆幂定理 PT² = PA·PB(8 年级) ✅ v0.6.40
  - 验收: ✅ 全过 (1) 8 场景文件落地 `viewer/scenes/31-38_*.js` (2) viewer.js SCENES 加 8 项(30+8=38 总场景) (3) 每个场景含 getFormula + getLesson (4) AGENTS §0 进度 30/30→38/38 (5) README 速览表加 8 行(对位 7/8/9 年级分组)
  - 创建: 2026-08-25
  - 完成: 2026-08-26
  - 依赖: 无(纯新增,不改现有 30 场景)
  - 发现者: **用户对话**(user 主动提"初中几何知识场景节点"需求, v0.6.14 对话驱动自动入队)
  - 优先级: 内容扩展(user 直接提需求)
  - 备注: 与 MATH-017(高中解析几何)互补,本任务覆盖初中课标 7-9 年级 ✅ 已完成,2026-08-26 v0.6.40 收官

- [ ] **MATH-017** · 高中解析几何场景集(6 场景)
  - **预计 commit 数: 5**(首批 3 + 第二批 3 + 目录/AGENTS 同步 + README 各 1 commit,每 10 分钟 1 场景)
  - 描述: 对位人教版高中数学选择性必修第一册(圆锥曲线 + 极坐标/参数方程),6 个核心解析几何场景。沿 MATH-016 节奏分批做
  - 候选清单(6 场景,user 可调):
    - [ ] 39 `conic-unified` · 圆锥曲线统一定义 R = ed(王炸,e<1 椭圆/e=1 抛物/e>1 双曲线)
    - [ ] 40 `ellipse-analytic` · 椭圆解析(标准方程 + 离心率 + 焦点 + 准线 + 焦半径公式)
    - [ ] 41 `hyperbola-analytic` · 双曲线解析(标准方程 + 渐近线 y=±b/a·x + 等轴 + 共轭)
    - [ ] 42 `parabola-analytic` · 抛物线解析(标准方程 + 焦点 + 准线 + 光学反射卫星天线)
    - [ ] 43 `parametric-curves` · 参数方程(摆线等时性 + 星形线 + 圆的渐开线)
    - [ ] 44 `polar-rose` · 极坐标曲线(玫瑰线 r=a·sin(nθ) + 心形线 + 阿基米德螺线)
  - 验收: (1) 6 场景文件落地 `viewer/scenes/39-44_*.js` (2) viewer.js SCENES 加 6 项(30+8+6=44 总场景) (3) 每个场景含 getFormula + getLesson (4) AGENTS §0 进度 38/38→44/44 + 能力 append 到 `.Log/YYYY-MM-DD.md`(v0.6.34 新规则) (5) README 速览表加 6 行(对位选择性必修第一册)
  - 创建: 2026-08-25
  - 依赖: 无(纯新增,不改现有 30 场景)
  - 发现者: **用户对话**(user 提"增加高中几何内容", v0.6.14 对话驱动自动入队)
  - 优先级: 内容扩展(MATH-016 之后启动,user 提需求排第二)
  - 备注: 补项目空白 — 现有 23_ellipse-reflection 是物理光学性质,高中课标的**解析性质**(标准方程 + 离心率 + 焦点 + 准线)没做

- [ ] **MATH-018** · 天文数学场景集(10 场景)
  - **预计 commit 数: 7**(首批 3 + 第二批 3 + 第三批 2 + 第四批 2 + 目录/AGENTS 同步 + README 各 1 commit,每 10 分钟 1 场景)
  - 描述: 对位天文学基础(轨道/引力/距离)+ 宇宙学(红移/哈勃/年龄),10 个核心天文学数学场景。沿 MATH-016/017 节奏分批做
  - 候选清单(10 场景,user 可调):
    - [ ] 45 `kepler-laws` · 开普勒三定律(椭圆 + 等面积 + T²∝a³,王炸)
    - [ ] 46 `doppler-redshift` · 多普勒效应 + 哈勃定律(退行速度 = H₀·d,宇宙学)
    - [ ] 47 `binary-orbit` · 双星系统 + 共同质心(质量比调 + 开普勒第三定律)
    - [ ] 48 `parallax` · 三角视差测距(1 AU 基线 + 1 秒差距 = 3.26 光年)
    - [ ] 49 `stellar-magnitude` · 视星等 + 绝对星等 + 斯特藩-玻尔兹曼 L=4πR²σT⁴
    - [ ] 50 `orbital-resonance` · 轨道共振 + 拉格朗日 L1-L5(海王/冥王 3:2)
    - [ ] 51 `tidal-lock` · 潮汐锁定 + 洛希极限(月球永远一面朝地球)
    - [ ] 52 `logarithmic-spiral-galaxy` · 银河系旋臂 r=ae^(bθ)(对数螺线)
    - [ ] 53 `eclipse-geometry` · 日食/月食几何(本影/半影/伪本影)
    - [ ] 54 `precession-cycles` · 地球岁差 ~25800 年(地轴 23.5° 圆锥进动)
  - 验收: (1) 10 场景文件落地 `viewer/scenes/45-54_*.js` (2) viewer.js SCENES 加 10 项(30+8+6+10=54 总场景) (3) 每个场景含 getFormula + getLesson (4) AGENTS §0 进度 44/44→54/54 + 能力 append 到 `.Log/YYYY-MM-DD.md`(v0.6.34 规则) (5) README 速览表加 10 行(对位天文学基础 + 宇宙学)
  - 创建: 2026-08-26
  - 依赖: 无(纯新增,不改现有 44 场景)
  - 发现者: **用户对话**(user 提"增加天文数学场景", v0.6.14 对话驱动自动入队)
  - 优先级: 内容扩展(MATH-015 → 016 → 017 之后启动,user 提需求排第三)
  - 备注: 补项目空白 — 现有 30 场景覆盖建筑/物理/音乐/生物/艺术/概率/ML/工程/计算几何/分形拓扑/初中几何/高中解析,但**天文学方向还是 0**。这 10 个场景填补天文 + 宇宙学

### P2 · 优化

- [ ] **MATH-005** · 整理 `_test/` 散落文件
  - **预计 commit 数: 1**(单次整理,10 分钟)
  - 描述: `_test/_cdp_test.js` `_test/_shot.js` `_test/_test_all.ps1` `_test/_test_one.ps1` 在 _test 下,工具类应该归 tools/ 或类似
  - 验收: 单一来源,命名一致
  - 创建: 2026-08-24
  - 依赖: 无(MATH-002 已完成,2026-08-24 第二轮)

- [ ] **MATH-006** · 优化首屏加载
  - **预计 commit 数: 2**(拆分场景代码 + 加懒加载各 1 commit,每个 10 分钟)
  - 描述: 1000 颗星空 + three.js 1.2MB + 20 场景,首次加载可能慢。考虑分场景懒加载
  - 验收: 首屏 < 2s (本地 8765)
  - 创建: 2026-08-24
  - 依赖: 无

- [ ] **MATH-007** · 移动端 scene 卡片可读性
  - **预计 commit 数: 2**(CSS 响应式 + 控件触控适配各 1 commit,每个 10 分钟)
  - 描述: 教学卡片文字在手机屏可能溢出,需要响应式
  - 验收: 375px 宽屏下文字不溢出、控件可点
  - 创建: 2026-08-24
  - 依赖: 无

### 用户反馈

> 等用户首次发反馈后由 01_Owner 写入这里,P0 优先级。

---

## 元数据

- **最后更新**: 2026-08-26 · v0.6.40 + MATH-016 收官 8/8 全部完成
- **更新者**: math-advisor(对话驱动框架启用)
- **本轮改动**: (1) **MATH-016 收官 1/8 完成 v0.6.40**:38_power-of-point(2D:圆幂定理 PT²=PA·PB+外点切线割线+双割线等积+内点相交弦+径向扫描 4 视图 + Apollonius ~200BC《圆锥曲线论》)· 28178 字节(2) viewer.js SCENES 数组加 1 项(37→38)(3) AGENTS §0 v0.6.39→v0.6.40 + 进度 37/37→38/38 + 教学要点 26/26→27/27 + MATH-016 7/8→8/8 ✅(4) AGENTS §2 目录树加 38(5) AGENTS §6.6 决策 append v0.6.40(6) AGENTS §8 里程碑加 v0.6.40 + v0.6.39 恢复(7) README 37→38 场景 + 速览表"数学 × 初中几何"行加 1 项(8) PLAN MATH-016 标 [x] ✅ 完成 8/8 + 进度 7/8→8/8 + 全部子项 31-38 [x](9) P0 段标"无 — MATH-003 + MATH-014 + MATH-016 均已收尾"(10) .Log/2026-08-26.md append v0.6.40 段(11) 新建 _test/_38_modes_test.js 验证 4 模式切换(12) Output/38_power-of-point-modes.png 截屏验证
- **上轮改动(2026-08-26 v0.6.37)**: (1) **MATH-016 第二批 2/8 完成 v0.6.37**:33_inscribed-angle(4 视图:同弧一般/Thales 半圆 90°/同弧多点验证/圆内接四边形对角互补)+ 34_similar-triangles(3 视图:自由缩放/平行线分线段 Thales 比例/面积比 k²)(2) viewer.js SCENES 数组加 2 项(32→34)(3) AGENTS §0 v0.6.36→v0.6.37 + 进度 32/32→34/34 + 教学要点 21/21→23/23(4) AGENTS §2 目录树加 33 + 34(5) AGENTS §6.6 决策 append v0.6.37(6) AGENTS §8 里程碑加 v0.6.37(7) README 32→34 场景 + 速览表加 2 项(8) PLAN MATH-016 进度 2/8→4/8 + 子项 33 + 34 ✅
- **上轮改动(2026-08-26 v0.6.36)**: (1) **MATH-016 首批 2/8 完成 v0.6.36**:31_triangle-congruence(5 判定法 + 拖动验证)+ 32_pythagorean-theorem(3 证法视图:3-squares / Garfield 1876 / 赵爽弦图)(2) viewer.js SCENES 数组加 2 项(30→32)(3) AGENTS §0 v0.6.35→v0.6.36 + 进度 30/30→32/32 + 教学要点 19/19→21/21(4) AGENTS §2 目录树加 31 + 32(5) AGENTS §6.6 决策 append v0.6.36(6) AGENTS §8 里程碑加 v0.6.36(7) README 30→32 场景 + 速览表加"数学 × 初中几何"行(8) PLAN MATH-016 [ ] → [~] + 子项 31 + 32 ✅ + 进度 0/8→2/8
- **配套 cron**: math-advisor-daily-wake(每天 10:30,v0.6.34 规则已嵌入)
- **配套反馈收件箱**: `D:\Mac\Mac\Mac\Consultant\.Shared\feedback_inbox.json`
- **2026-08-25 重构总结**:AGENTS.md v0.6.30 371 行 → v0.6.34 233 行(-37%),期间:① 拆 .Log/(v0.6.31)② 压扁结构(翻车 v0.6.32)③ 恢复结构(v0.6.33)④ 整合参考文档(v0.6.34,user 嫌 .Log/ 文件太多,3 份融 AGENTS,只留 .Log/YYYY-MM-DD.md 每日能力);v0.6.35 MATH-004 完成 3D WebGL 降级;v0.6.36 MATH-016 首批 2/8 落地
