# AGENTS.md · MathematicsWeb v0.1.0 · 跨学科数学可视化

> 任何 AI 改这个项目前,先读完本文件 + `docs/` 下的架构/清单。
> 这是项目元数据 + 操作约束的单一事实源。

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

## 1. 改前必读(顺序)

1. **本文件** · 架构 + 约束 + 跟兄弟项目的关系
2. `docs/02_项目架构.md` · 模块依赖、数据流、范式细节
3. `docs/03_场景清单.md` · 6 个场景的数学原理 + 实现要点
4. `docs/04_开发纪要.md` · 踩过的坑(本批)

## 2. 架构

### 目录结构(v0.1.0 实际)

```
MathematicsWeb/
├── index.html                  # 入口 + 动态 import + 水印
├── viewer/
│   ├── viewer.js               # 主壳 + 场景切换 + AI 面板宿主
│   ├── viewer.css              # 全部样式(tokens 体系)
│   ├── 02_ai-panel.js          # AI 助手 UI(对话/建议/状态)
│   └── scenes/                 # 6 个独立场景
│       ├── 01_catenary-arch.js         # 悬链拱顶(3D)
│       ├── 02_planetary-orbits.js      # 行星轨道(3D)
│       ├── 03_fourier-synth.js         # 傅里叶合成器(2D)
│       ├── 04_population-dynamics.js   # 种群动力学(2D)
│       ├── 05_mandelbrot.js            # 曼德尔布罗(2D)
│       └── 06_simple-harmonic.js       # 简谐振动(2D)
├── kernel/
│   ├── 01_math-core.js         # 数学原语(Complex/Vec2/Mat2x2/catenary/DFT/Mandelbrot/LV)
│   ├── 02_animation.js         # rAF 循环 + Canvas 尺寸自适应
│   └── 03_llm-client.js        # LLM API 客户端(OpenAI 兼容)
├── mock/
│   └── 01_llm-mock.js          # 本地 mock(无 key 时用)
├── db/
│   ├── 01_indexeddb.js         # IndexedDB 封装
│   └── 02_workspace.js         # 工作区(轻量版,只存 last scene + fav)
├── vendor/three/               # three.js r160 本地(从 three.jsWeb 复制)
├── docs/                       # 02_项目架构 / 03_场景清单 / 04_开发纪要
├── _llm_config.example.json    # LLM 配置模板
├── start.ps1 / start.bat       # 启动脚本
├── AGENTS.md                   # 本文件
├── README.md                   # 用户文档
└── CHANGELOG.md                # 变更记录
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
- [ ] 场景参数序列化(每场景调好的 a/ω/N 存 IndexedDB,刷新恢复)
- [ ] 场景收藏 / 进度跟踪 UI
- [ ] GitHub 仓库 + 自动化 release(沿用 canvasweb 范式)

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
