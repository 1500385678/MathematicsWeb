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

_(无 — MATH-014 收尾完成 v0.6.25)_

### P1 · 重要

- [~] **MATH-003** · 19 个场景补 `getLesson()` 教学要点
  - **预计 commit 数: 7**(剩 7 个场景,每批 2 场景 1 commit,每批 10-20 分钟)
  - 描述: v0.6.4 已示范 1 个(simple-harmonic),剩 19 个。教学要点喂给 LLM,提升 AI 助手质量
  - 验收: 每个 scene 文件导出 `getLesson()`,`_buildSceneContext` 拼进 prompt
  - 创建: 2026-08-24
  - 依赖: v0.6.4 getLesson 框架(已落地)
  - 进度(2026-08-25 v0.6.9 → v0.6.10 → v0.6.16 → v0.6.17 → v0.6.21 → v0.6.25 → v0.6.26): 12/19 — 01/02/03/04/06/09/11/12/13/14/15/18/20 已加 getLesson
  - 优先级子项(教学价值排序,✅ = 已加):
    - ✅ 01_catenary-arch · 悬链线 cosh 倒置成拱(第五批 v0.6.17)
    - ✅ 02_planetary-orbits · 开普勒第三定律 T²∝a³(第七批 v0.6.26)
    - ✅ 03_fourier-synth · 傅里叶箭头 + Gibbs 现象(第六批 v0.6.21)
    - ✅ 04_population-dynamics · Lotka-Volterra 双物种(第二批 v0.6.9)
    - ✅ 06_simple-harmonic · 阻尼振动 + 受迫(原版 v0.6.4)
    - ✅ 09_double-pendulum · Lagrangian + 蝴蝶效应(第六批 v0.6.21)
    - ✅ 11_lissajous · 频率比 + 相位(第二批 v0.6.9)
    - ✅ 12_clt · 中心极限定理(第五批 v0.6.17)
    - ✅ 13_riemann-sum · 左/右/中/梯形/Simpson 收敛阶(第七批 v0.6.26)
    - ✅ 14_bayesian · Beta-Binomial 共轭(第四批 v0.6.16)
    - ✅ 15_lsystem · 字符串重写 + turtle(第四批 v0.6.16)
    - ✅ 18_lagrange · 切点几何(第三批 v0.6.10)
    - ✅ 20_neural-net · 决策边界演化(第三批 v0.6.10)
    - 剩余 7 个按教学价值排序,下一批 05_mandelbrot + 16_wave-interference(数学+物理)

- [ ] **MATH-004** · 确认 3D 场景在低 WebGL 环境的友好降级
  - **预计 commit 数: 2**(feature detection + 2D fallback 各 1 commit,每个 10 分钟)
  - 描述: CHANGELOG v0.1.0 已知问题 #1。是否要加 feature detection + 2D fallback?
  - 验收: 无 GPU / 旧 WebGL 时显示"请用现代浏览器"提示,而非 silent 报错
  - 创建: 2026-08-24
  - 依赖: 无

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

- **最后更新**: 2026-08-25 · v0.6.25
- **更新者**: math-advisor(对话驱动框架启用)
- **配套 cron**: math-advisor-daily-wake(每天 10:30)
- **配套反馈收件箱**: `D:\Mac\Mac\Mac\Consultant\.Shared\feedback_inbox.json`
