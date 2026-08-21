# CHANGELOG · MathematicsWeb

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
