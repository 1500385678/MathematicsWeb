# CHANGELOG · MathematicsWeb

## v0.6.10 · 2026-08-25 · MATH-003 进度 4/19 · 教学要点通道第三批(MATH-003 partial)

**18 / 20 两个高价值场景接 getLesson,真 LLM 上下文继续扩展。**

### 改动

- `viewer/scenes/18_lagrange.js` · 加 `getLesson()`,从 `.mathw-lesson-content` 读纯文本
  - 教学要点:约束优化 min f s.t. g=c 的几何(切点 = 最优);∇f = λ·∇g(梯度平行,反向);经典等周不等式(固定周长 → 圆);调 f 中心 / g 中心 / g 半径看不同形态
- `viewer/scenes/20_neural-net.js` · 加 `getLesson()`
  - 教学要点:2 层全连接(2 → hidden → 2)2D 分类;tanh + softmax + cross-entropy;反向传播 + SGD 训练;左键/右键点空白加蓝/红样本,左键拖旧样本移动;调学习率看收敛/震荡,调隐藏神经元数看拟合能力

### 验证

- 模式:照 04/11 模板(简洁 v0.6.9 注释版),读 .mathw-lesson-content textContent,无新增 DOM、无外部依赖
- AI 面板 `_buildSceneContext` 已支持(由 v0.6.4 落地),新加的 getLesson 立即生效
- mock 路径走 SCENE_REPLIES(独立字段),本次改动不影响 mock;真 LLM 上下文化质量继续提升
- 7 步归档 dogfooding 完整走完

### 进度

- MATH-003 4/19,剩 15 个场景,优先级:15_lsystem / 14_bayesian / 12_clt / 01_catenary / 02_planetary(按用户反馈)

---

## v0.6.9 · 2026-08-25 · MATH-003 进度 2/19 · 教学要点通道第二批(MATH-003 partial)

**04 / 11 两个高价值场景接 getLesson,真 LLM 上下文现在能读到教学要点。**

### 改动

- `viewer/scenes/04_population-dynamics.js` · 加 `getLesson()`,从 `.mathw-lesson-content` 读纯文本
  - 教学要点:Lotka-Volterra 兔狐捕食模型,αβδγ 参数意义,相图闭合曲线
- `viewer/scenes/11_lissajous.js` · 加 `getLesson()`
  - 教学要点:频率比 a:b 整数比决定图形(1:1 圆/1:2 抛物/3:2 蝴蝶结),相位 δ 旋转移位,实际应用:示波器 X-Y / 立体声 / 振动分析

### 验证

- 模式:照 simple-harmonic 模板,直接读 .mathw-lesson-content textContent,无新增 DOM、无外部依赖
- AI 面板 `_buildSceneContext` 已支持(由 v0.6.4 落地),新加的 getLesson 立即生效
- mock 路径走 SCENE_REPLIES(独立字段),本次改动不影响 mock;真 LLM 上下文化质量提升

### 进度

- MATH-003 2/19,剩 17 个场景,优先级:18_lagrange / 20_neural-net / 其他 15 个按用户反馈

### 安全

- 本轮 commit 用 `.git/config` 已有 token 推送(同 7541819 token 路径),催 user 轮换双平台 token(P0 反馈 `fb-token-rotation-001`),见 MEMORY 「安全教训 · 2026-08-25」

---

## v0.6.8 · 2026-08-25 · Phase 0 知识图谱查询 CLI(MATH-010)

**配套 `md_to_json.py` 的查询 CLI,补齐 Phase 0 写读闭环。**

### 新增

- `tools/graph_query.py`
  - 7 个子命令:`list` / `get <id>` / `category <name>` / `tag <name>` / `search <keyword>` / `stats` / `paths`
  - 读 `docs/knowledge_graph.json`(schema_version=1),无第三方依赖
  - category / tag 大小写不敏感;search 走 title + 章节 + 子节标题
  - 找不到结果 exit=0(便于管道),参数错误 exit=2
- `tools/README.md` 新增第 2 节(用法表 + 约定),并在变更记录里追加 2026-08-25 一行

### 改动

- `项目开发计划.md` · Phase 0 checkbox「写图谱查询 CLI」勾选 + 补 2026-08-25 完成说明

### 验证

- `list` → 10 节点(01-10)全部列出,字符数 2,603 ~ 3,399
- `stats` → 节点 10 / 章节 56 / 子节 133 / 总字符 30,873(与 `md_to_json.py` 输出对齐)
- `tag 数学史` → 命中 3 节点(01 数学起源与演变 / 04 数学故事与传说 / 06 数学大师与学者)
- `search 欧几里得` → 命中 1 节点(01 数学起源与演变 / 欧几里得与《几何原本》)
- `get 01_数学起源与演变` → 完整 JSON 输出(中文字段不转义,Python `ensure_ascii=False`)
- `get 不存在_id` → 友好提示,exit=0

### 关闭

- ✅ MATH-010 · Phase 0 知识图谱查询 CLI 归档(本条按框架规则从 PLAN 删除)

## v0.6.7 · 2026-08-25 · AGENTS 架构 + docs/03 场景清单 同步实际项目(MATH-009)

**补完"项目文档"漂移 — AGENTS 第 2 段 + docs/03 重写到 20 场景实际状态**

### 改动

- `AGENTS.md` 第 2 段"目录结构"重写
  - 从 v0.1.0 的 6 场景 → **v0.6.6 实际的 20 场景**
  - 补:`server.py` / `tools/` / `_test/` / `_commit_push.ps1` / `Output/` / `docs/05_接真LLM指南.md` / `docs/knowledge_graph.json` / `PLAN.md` / `.gitignore`
  - 标注每个场景的渲染模式(2D/3D)、关键库(CatmullRomCurve3/RK4 等)、与 v0.6.4 起的接口变化
- `docs/03_场景清单.md` 完全重写(9096 字节,20 场景全覆盖)
  - 每场景:数学公式 + 物理/几何意义 + 应用领域 + 实现要点(关键 API 1-2 行)
  - 末尾加"渲染模式统计"(3D × 3 / 2D × 17)+ "跨学科分布"(物理 5 / 艺术 3 / 概率 3 / 音乐 2 / 生物 2 / ML 2 / 建筑 1 / 工程 1 / 优化 1)
- `AGENTS.md` 能力段 append 一条**"AGENTS 架构自动同步规则"**(从本轮发现的"严重过期 1-2 年"问题提取,作为永久规则)
- 永久规则写入 User Memory(跨项目通用,MathematicsWeb / canvasweb / OrangeSu 等所有有 AGENTS.md 范式的项目都适用)

### 关闭

- ✅ MATH-009 · AGENTS 架构段 + docs/03 场景清单 同步实际项目(本条按新规则从 PLAN 删除)

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
