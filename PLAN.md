# PLAN · MathematicsWeb

> **任务清单(纯)** · 状态: `[ ]` 待办 / `[~]` 进行中 / `[!]` 阻塞
>
> **v0.6.6 框架规则**:完成的任务**从 PLAN 删除**(不保留 [x]),功能描述 append 到 AGENTS.md "项目已具备的能力" 段,审计留 git commit message。PLAN 保持短小只管活跃任务。
>
> **v0.6.14 对话驱动**:用户说"做 / 加 / 改 / 修"项目内容 → agent 自动在 PLAN 加 `[ ]` 条目;但**不擅自实施**,等用户说"做 X"才动代码。
>
> 项目宏观(产品愿景/路线/技术栈/风险) → 见 **AGENTS.md** "## 项目宏观" 段。

---

## 任务队列

### P0 · 阻塞/紧急

- [ ] **MATH-014** · 加 10 个几何类场景(21-30)
  - 描述: 用户对话提需求"再加 10 个不同应用场景,最好都是几何类"。演示对话驱动 PLAN 框架(v0.6.14 首次启用)
  - 验收: (1) 10 个场景文件 viewer/scenes/21-30.js (2) viewer.js SCENES 数组加 10 项 (3) AGENTS §0 进度 20→30 (4) AGENTS 能力段 append (5) README 场景速览表加 10 个,跨学科统计更新 (6) 5 步归档
  - 场景清单(按 ID):
    - 21_voronoi(沃罗诺伊图 / 计算几何 / 地图分区)
    - 22_delaunay(德劳内三角剖分 / 计算几何 / 地形建模)
    - 23_ellipse-reflection(椭圆光学反射 / 应用物理 / 天文望远镜)
    - 24_lemniscate(双纽线 / 极坐标几何 / 场论)
    - 25_buffon-needle(布丰投针 / 几何概率 / 求 π)
    - 26_koch-snowflake(Koch 雪花 / 分形几何 / 海岸线)
    - 27_sierpinski(谢尔宾斯基三角 / 分形几何 / 数据结构)
    - 28_great-circle(球面大圆 / 球面几何 / GPS)
    - 29_mobius-strip(莫比乌斯带 / 拓扑几何 / 3D)
    - 30_crystal-lattice(晶体格 / 材料结构)
  - 创建: 2026-08-25
  - 依赖: 无
  - 发现者: **用户对话**(对话驱动 PLAN 框架首次启用)

### P1 · 重要

- [~] **MATH-003** · 19 个场景补 `getLesson()` 教学要点
  - 描述: v0.6.4 已示范 1 个(simple-harmonic),剩 19 个。教学要点喂给 LLM,提升 AI 助手质量
  - 验收: 每个 scene 文件导出 `getLesson()`,`_buildSceneContext` 拼进 prompt
  - 创建: 2026-08-24
  - 依赖: v0.6.4 getLesson 框架(已落地)
  - 进度(2026-08-25 v0.6.9 → v0.6.10 → v0.6.16 → v0.6.17): 8/19 — 01/04/06/11/12/14/15/18/20 已加 getLesson
  - 优先级子项(教学价值排序,✅ = 已加):
    - ✅ 01_catenary-arch · 悬链线 cosh 倒置成拱(本轮 v0.6.17)
    - ✅ 04_population-dynamics · Lotka-Volterra 双物种
    - ✅ 06_simple-harmonic · 阻尼振动 + 受迫(原版 v0.6.4)
    - ✅ 11_lissajous · 频率比 + 相位
    - ✅ 12_clt · 中心极限定理(本轮 v0.6.17)
    - ✅ 14_bayesian · Beta-Binomial 共轭(本轮 v0.6.16)
    - ✅ 15_lsystem · 字符串重写 + turtle(本轮 v0.6.16)
    - ✅ 18_lagrange · 切点几何(第三批 v0.6.10)
    - ✅ 20_neural-net · 决策边界演化(第三批 v0.6.10)
    - 剩余 11 个按用户反馈优先级,下一批 09_double-pendulum + 03_fourier-synth

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

### 用户反馈

> 等用户首次发反馈后由 01_Owner 写入这里,P0 优先级。

---

## 元数据

- **最后更新**: 2026-08-25 · v0.6.14
- **更新者**: math-advisor(对话驱动框架启用)
- **配套 cron**: math-advisor-daily-wake(每天 10:30)
- **配套反馈收件箱**: `D:\Mac\Mac\Mac\Consultant\.Shared\feedback_inbox.json`
