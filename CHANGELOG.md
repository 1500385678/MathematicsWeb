# CHANGELOG · MathematicsWeb

## v0.6.6 · 2026-08-24 · 搭建 PLAN/AGENTS/MEMORY 自动化框架(MATH-008)

**3 文件职责明确,任务完成自动归档,项目知识累积到 AGENTS**

### 改动

- `AGENTS.md`
  - 新增段 **"项目已具备的能力(append-only)"**(放在"## 0. 项目是什么"之后,无数字编号免重排)
  - 列出 5 条已具备能力:场景参数序列化(v0.5.0) · 收藏+进度 UI(v0.5.0) · getLesson AI 教学要点(v0.6.4) · 20 跨学科场景(v0.6.0) · 3 文件自动化框架(本版本 v0.6.6)
  - "## 7. 已知 TODO" 段删 2 条已修:场景参数序列化(已迁能力段)+ 场景收藏/进度 UI(已迁能力段)
- `PLAN.md`
  - 顶部说明加 v0.6.6 框架规则:**完成的任务从 PLAN 删除**(不保留 [x]),功能 append 到 AGENTS 能力段,审计留 CHANGELOG
  - 删除 MATH-008 条目(按新规则)
- cron `math-advisor-daily-wake`
  - schedule `0 9 * * *` → `30 10 * * *`(改到 10:30)
  - prompt 加 5 步归档流程(改代码 → commit + push → CHANGELOG → AGENTS append → PLAN 删除 + MEMORY 简记)
  - 优先级明确:PLAN.md P0 [~]/[ ] > feedback > PLAN P1/P2 > MEMORY 临时 TODO

### 关闭

- ✅ MATH-008 · 搭建 PLAN/AGENTS/MEMORY 自动化框架(本条按新规则从 PLAN 删除,功能描述已 append 到 AGENTS)

---

## v0.6.5 · 2026-08-24 · 仓库清理(MATH-002)

**关闭 8 个 untracked 文件的归宿问题**

### 改动

- `.gitignore` 加 5 行 ignore 规则
  - 根目录 4 个测试脚本副本(`_cdp_test.js`/`_shot.js`/`_test_all.ps1`/`_test_one.ps1`)—— 跟 `_test/` 内文件 SHA256 完全相同,作开发便利副本不入仓
  - `/docs/knowledge_graph.json` —— `tools/md_to_json.py` 生成产物,可重跑不入仓
- `tools/` 整个目录纳入 git 跟踪
  - `md_to_json.py` · 10KB 知识图谱生成器(纯 Python 3 标准库,无依赖)
  - `README.md` · 工具说明(含 frontmatter 约定 + 容错 + 后续 Phase 路线)

### 未处理(留 untracked)

- 2 个中文 .md 规划(`数学顾问开发架构与计划.md` / `项目开发计划.md`)—— 主题是上层"数学顾问"(MathAdvisor)产品立项方案,跟当前 MathematicsWeb 项目 scope 不匹配;用户后续决定是否移到 `_MathematicsLib/` 上层目录

### 验证

- `git status -s` 干净:只剩 `tools/`(M)+ 2 个 .md 留 untracked
- `git check-ignore` 确认 4 个根目录文件 + `docs/knowledge_graph.json` 都被忽略
- `_test/` 内 4 个 tracked 文件未受影响(`.gitignore` 不影响 tracked)

### 关闭

- ✅ MATH-002 · 清理 untracked 文件,决定归宿

---

## v0.6.4 · 2026-08-24 · AI 上下文接 getLesson(教学要点通道)

**关闭 CHANGELOG v0.1.0 已知问题 #3:`getLesson` 未用**

### 改动

- `viewer/02_ai-panel.js`
  - `_buildSceneContext()` 读 `instance.getLesson()`(typeof 守卫,旧场景不实现就跳过)
  - `_callLLM()` 拼 prompt 时新增 `[教学要点: ...]` 行(只有 lesson 非空才出现)
- `mock/01_llm-mock.js`
  - 6 场景 `SCENE_REPLIES` 各加 `lesson` 字段(教学卡片纯文本简化版)
  - `chat()` 场景命中时多回 `lesson: reply.lesson || ''`
- `viewer/scenes/06_simple-harmonic.js`
  - 第一个实现 `getLesson()` 的场景样板:读 `.mathw-lesson-content` textContent
  - 其他 19 个场景不动 — 留作后续按需补,接口已开通道

### 验证

- `node --check` 3 个文件语法全过
- node 动态 import LLMMock,simple-harmonic prompt 返回 lesson 字段正确
- `_cdp_test.js simple-harmonic` 0 错误,场景加载 + 教学卡片渲染正常

### 已知问题清理

- ✅ v0.1.0 #3 `AI 上下文未充分利用(getFormula 已实现,getLesson 未用)` — **本版本关闭**
- ✅ v0.1.0 #1 `场景参数未序列化(刷新后参数重置,v0.5 修)` — **v0.5.0 已落地,本条确认**(Workspace + IDB + viewer 三层已正确 save/restore)

---

## v0.6.3 · 2026-08-21 · 完整 9 大行星

**行星轨道从 6 颗扩到完整 9 颗(水/金/地/火/木/土/天王/海王/冥王)+ 月球绕地球**

### 改动

- `viewer/scenes/02_planetary-orbits.js`
  - 4 颗通用行星改为真实 9 大行星(中英文 + 真实相对距离 log 压缩)
  - 木星 / 土星 / 天王星 / 海王星 / 冥王星 全部加入
  - 月球绑地球(`earthPos + moonOrbit` 相对坐标)
  - 镜头拉远:`camera.position.set(0, 22, 38)`,`controls.maxDistance = 80`
  - 行星尺寸放大(0.4 ~ 2.0)
  - 新增"聚焦地球+月球" / "聚焦冥王" 按钮
  - 完整星空背景(1000 颗)+ 太阳光晕
  - 土星环 + Sprite 中文名标签

### 修复

- `Line.computeLineDistances()` 在空 geometry 上调用导致 `TypeError: Cannot read properties of undefined (reading 'count')`
  - 修法:从创建时移除,放到初始化椭圆循环里(那里 geometry 已填充)
- index.html 加 inline SVG favicon,消除 favicon.ico 404

### 新增

- `_test/` 目录:CDP headless 验证脚本(用 Node 24 内置 WebSocket 跑 Edge 远程调试接口)

### 验证

- 20 场景 0 错误(CDP 抓 console + 截图)
- planetary-orbits 截图确认 9 行星 + 月球 + 土星环 + 椭圆轨道 + 星空全部渲染

## v0.1.0 · 2026-08-21 · MVP 启动

**首批 6 个跨学科场景 + 2D/3D 双模 + AI 助手本地 mock**

### 新增

- 入口 `index.html` · 动态 import + 顶层 await + 窗口版本水印
- 渲染主壳 `viewer/viewer.js` · 场景切换 + AI 面板宿主 + 错误兜底
- 暗色主题 `viewer/viewer.css` · tokens 体系(沿用 three.jsWeb 字段前缀 mathw-)
- AI 助手 `viewer/02_ai-panel.js` · 对话/建议/状态指示,支持 mock + real LLM
- 6 个场景:
  - `01_catenary-arch.js` · 悬链拱顶(3D · 建筑)· 调 a 看拱变胖瘦
  - `02_planetary-orbits.js` · 行星轨道(3D · 物理)· Velocity Verlet 数值积分 + 速度矢量
  - `03_fourier-synth.js` · 傅里叶合成器(2D · 音乐)· 4 种波形 + 谐波数
  - `04_population-dynamics.js` · 种群动力学(2D · 生物)· RK4 积分 + 时间序列 + 相图
  - `05_mandelbrot.js` · 曼德尔布罗(2D · 艺术)· 拖动 + 缩放 + 4 配色
  - `06_simple-harmonic.js` · 简谐振动(2D · 物理)· 弹簧/单摆/LC 三系统
- 数学原语 `kernel/01_math-core.js` · Complex/Vec2/Mat2x2/catenary/DFT/Mandelbrot/Lotka-Volterra/easing/rng
- 动画工具 `kernel/02_animation.js` · rAF 循环 + Canvas 高 DPI 自适应
- LLM 客户端 `kernel/03_llm-client.js` · OpenAI 兼容协议 + ping 探活
- 本地 mock `mock/01_llm-mock.js` · 6 场景预设回复 + 通用兜底
- 持久化 `db/01_indexeddb.js` + `db/02_workspace.js` · 存 last scene / 收藏 / 场景参数
- `vendor/three/` · three.js r160 本地(从 three.jsWeb 复制,1.2MB)
- 启动脚本 `start.ps1` / `start.bat` · 端口 8765,自动 Python/Node 兜底
- LLM 配置模板 `_llm_config.example.json`(gitignore 真配置)
- 文档:`AGENTS.md` / `README.md` / `CHANGELOG.md`

### 验证

- ✅ Chrome headless 6/6 场景 0 运行时错误
- ✅ 数学原语 node 单测全过(cosh / Mandelbrot 集内集外 / DFT 方波 / LV 一步)
- ✅ 静态资源全 200(14 个 JS + CSS + three.js 1.2MB)
- ✅ 暗色主题 + 场景浏览器 + 教学卡片 + 控件 + AI 面板 首屏渲染正常
- ⚠️ 3D 场景需真浏览器 WebGL(headless 不可,正常)
- ⚠️ 真 LLM 未测(无 key,默认 mock 跑通)

### 已知问题

- 3D 场景在低 WebGL 环境下(无 GPU)直接报错(预期,真浏览器 OK)
- 场景参数未序列化(刷新后参数重置,v0.5 修)
- AI 上下文未充分利用(getFormula 已实现,getLesson 未用)
- 4 个滑块 change 监听代码有冗余(v0.5 收敛)
