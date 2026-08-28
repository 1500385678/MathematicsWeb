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

- [~] **MATH-017** · 高中解析几何场景集(6 场景)**🚀 2026-08-27 v0.6.41 启动 · v0.6.42 首批 2/6 落地**
  - **状态**:已激活,首批 2 场景落地,后续 4 场景分 2 批做
  - **进度**:2/6(首批 2: conic-unified 39 ✅ + ellipse-analytic 40 ✅)
  - **后续计划**:第二批 2 (hyperbola-analytic 41 + parabola-analytic 42,v0.6.43 预计);第三批 2 (parametric-curves 43 + polar-rose 44,v0.6.44 预计)

### P1 · 重要

- [~] **MATH-015** · 接真 M3 LLM(等 user 配 M3_API_KEY)
  - **预计 commit 数: 3**(example 改详细配置 + AGENTS 能力段 append + README 配置段各 1 commit)
  - 描述: server.py v0.6.0 已支持 M3 代理(/api/chat endpoint + M3_API_KEY env 优先),但当前 key 未设 → AI 面板走 mock 返回"假"回复。user 反馈"假"自动入队(v0.6.14 对话驱动)
  - 验收: (1) _llm_config.example.json 改详细 step-by-step 配置指南 ✅ (2) AGENTS.md 能力段 append "M3 真实 LLM 代理" (3) README.md 加 M3 配置段 (4) user 配 M3_API_KEY → server 重启 → AI 面板显示真 LLM 回复(非 mock)
  - **状态**:agent 部分完成(example/AGENTS/README 改完),**等 user 配 M3_API_KEY**
  - user 配 key 步骤: PowerShell `[Environment]::SetEnvironmentVariable('M3_API_KEY', 'sk-cp-你的key', 'User')` 永久 User-scope
  - 依赖: user 配 M3_API_KEY(等 user,8/14 安全规则 agent 不主动要 token)
  - 发现者: **用户对话**(用户提"AI 假"反馈, v0.6.14 对话驱动自动入队)

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

- **最后更新**: 2026-08-28 · v0.6.43 daily wake 巡检 + 二次唤醒(2 commit log,非 feature)
- **更新者**: math-advisor(对话驱动框架启用)
- **本轮改动**: (1) `7e74033` v0.6.43-prep daily wake 早轮(10:29)· 恢复 viewer/scenes/39_conic-unified.js(25638 字节,被 PowerShell FileSystem provider "另存副本"机制误删,走 `cmd /c "git show HEAD:<path> > <path>"` 还原)+ mavis-trash 9 个 .commit-msg-*.txt 残留(chore-plan/v0.6.37-42)+ add + commit 2 个 .Log/ 巡检 26/27(4594+5921 字节)(2) `0837499` v0.6.43 二次唤醒(11:21,cron 延迟触发)· 刷新 .Shared/status_board.json(8/24 过期 3 天,v0.6.3/20 场景 → v0.6.42/40 场景/8 维度全量)+ .Log/2026-08-28.md append 二次唤醒段(21 行)· 双平台 push 成功(GitHub + Gitee 同步 7e74033..0837499)(3) **本次补充 AGENTS/PLAN 同步**:11:52 user 反馈"为什么 PLAN/AGENTS 没更新"→ 早轮误判"冗余触发"跳过了 AGENTS/PLAN 同步 → 立即补:AGENTS §0 状态 v0.6.42→v0.6.43 + 教学要点 29/29 校正→40/40 + 远端双 commit + MATH-018 加入活跃任务 + §6.6 决策 append v0.6.43 整段 + §8 里程碑加 v0.6.43 [x] + PLAN 元数据"最后更新"刷新 + "本轮改动"重写(4) 0 场景落地 / 0 教学要点新增 / 0 任务推进 / 纯 daily wake 巡检
- **上轮改动(2026-08-27 v0.6.42)**: (1) **MATH-017 首批 2/6 完成 v0.6.42**:39_conic-unified(25638 字节,2D 王炸:R=ed + 4 视图)+ 40_ellipse-analytic(24851 字节,2D:x²/a²+y²/b²=1 + 4 视图)(2) viewer.js SCENES 数组加 2 项(38→40)(3) AGENTS §0 v0.6.41→v0.6.42 + 进度 38/38→40/40(4) AGENTS §2 目录树加 39+40(5) AGENTS §6.6 决策 append v0.6.42(6) AGENTS §8 里程碑加 v0.6.42(7) README 38→40 场景 + 速览表"数学 × 高中解析几何"行(8) PLAN MATH-017 进度 0/6→2/6 + 子项 39 + 40 ✅(9) _test/ CDP 验证 2 场景全过(10) .Log/2026-08-27.md append v0.6.42 段
- **上轮改动(2026-08-26 v0.6.37)**: (1) **MATH-016 第二批 2/8 完成 v0.6.37**:33_inscribed-angle(4 视图:同弧一般/Thales 半圆 90°/同弧多点验证/圆内接四边形对角互补)+ 34_similar-triangles(3 视图:自由缩放/平行线分线段 Thales 比例/面积比 k²)(2) viewer.js SCENES 数组加 2 项(32→34)(3) AGENTS §0 v0.6.36→v0.6.37 + 进度 32/32→34/34 + 教学要点 21/21→23/23(4) AGENTS §2 目录树加 33 + 34(5) AGENTS §6.6 决策 append v0.6.37(6) AGENTS §8 里程碑加 v0.6.37(7) README 32→34 场景 + 速览表加 2 项(8) PLAN MATH-016 进度 2/8→4/8 + 子项 33 + 34 ✅
- **上轮改动(2026-08-26 v0.6.36)**: (1) **MATH-016 首批 2/8 完成 v0.6.36**:31_triangle-congruence(5 判定法 + 拖动验证)+ 32_pythagorean-theorem(3 证法视图:3-squares / Garfield 1876 / 赵爽弦图)(2) viewer.js SCENES 数组加 2 项(30→32)(3) AGENTS §0 v0.6.35→v0.6.36 + 进度 30/30→32/32 + 教学要点 19/19→21/21(4) AGENTS §2 目录树加 31 + 32(5) AGENTS §6.6 决策 append v0.6.36(6) AGENTS §8 里程碑加 v0.6.36(7) README 30→32 场景 + 速览表加"数学 × 初中几何"行(8) PLAN MATH-016 [ ] → [~] + 子项 31 + 32 ✅ + 进度 0/8→2/8
- **配套 cron**: math-advisor-daily-wake(每天 10:30,v0.6.34 规则已嵌入)
- **配套反馈收件箱**: `D:\Mac\Mac\Mac\Consultant\.Shared\feedback_inbox.json`
- **2026-08-25 重构总结**:AGENTS.md v0.6.30 371 行 → v0.6.34 233 行(-37%),期间:① 拆 .Log/(v0.6.31)② 压扁结构(翻车 v0.6.32)③ 恢复结构(v0.6.33)④ 整合参考文档(v0.6.34,user 嫌 .Log/ 文件太多,3 份融 AGENTS,只留 .Log/YYYY-MM-DD.md 每日能力);v0.6.35 MATH-004 完成 3D WebGL 降级;v0.6.36 MATH-016 首批 2/8 落地
