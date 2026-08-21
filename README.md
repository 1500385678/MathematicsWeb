# MathematicsWeb · 跨学科数学可视化

> 数学不是公式,是**看得见、摸得着**的东西。
> 这是一个把数学嵌进建筑、物理、音乐、生物、艺术场景的动态可视化平台。

![v0.1.0](https://img.shields.io/badge/version-v0.1.0-6ee7b7)
![零构建](https://img.shields.io/badge/build-零构建-4ea1ff)
![断网能跑](https://img.shields.io/badge/network-断网能跑-f0c040)

---

## 这是什么

6 个杀手锏场景,把抽象的数学概念**可视化**到极致:

| 场景 | 学科 | 公式 | 玩法 |
|---|---|---|---|
| 🏛️ **悬链拱顶** | 数学 × 建筑 | `y = a·cosh(x/a)` | 拖 a 看拱变胖变瘦,翻转看悬链 |
| 🪐 **行星轨道** | 数学 × 物理 | `F = G·M·m/r²` | 改偏心率 e 看椭圆变圆,加速时间看扫面积 |
| 🎵 **傅里叶合成器** | 数学 × 音乐 | `f(t) = Σ aₙ·sin(nωt + φₙ)` | 左边画转圈箭头,右边画函数,4 种波形可切 |
| 🦊 **种群动力学** | 数学 × 生物 | `dx/dt = αx − βxy; dy/dt = δxy − γy` | 调 4 个参数看兔子狐狸怎么拉锯,看相图闭合 |
| 🌀 **曼德尔布罗** | 数学 × 艺术 | `z_{n+1} = z_n² + c` | 拖动 / 滚轮缩放,无限自相似细节,4 种配色 |
| 🎢 **简谐振动** | 数学 × 物理 | `x(t) = A·cos(ωt + φ)` | 弹簧/单摆/LC 电路三选一,调 A/ω/φ |

右侧 AI 助手能**实时讲讲**当前场景的数学原理(默认本地 mock,配 key 走真 LLM)。

## 跑起来

```powershell
# Windows PowerShell
.\start.ps1

# 或者直接
python -m http.server 8765
```

浏览器开 <http://localhost:8765>

**首次运行前**确认 `vendor/three/` 目录里有文件(已经下好了,从 three.jsWeb 复制)。

## 跟其他工具的差异

| 维度 | MathematicsWeb | 教学课件 | Desmos/GeoGebra | 视频课 |
|---|---|---|---|---|
| 动态可视化 | ✅ 每个场景都是活的 | ❌ 静态截图 | ✅ 函数图 | ❌ 录播 |
| 跨学科应用 | ✅ 建筑/音乐/物理/生物/艺术 | ✅ | ❌ 纯数学 | ✅ |
| 离线运行 | ✅ 断网能跑 | ✅ | ❌ | ❌ |
| AI 解释 | ✅ v0.1 上 | ❌ | ❌ | ❌ |
| 零依赖安装 | ✅ 浏览器打开即用 | ✅ | ❌ 需联网 | ❌ 需装客户端 |
| 自定义场景 | ❌(v0.5 起) | ❌ | ✅ | ❌ |

## URL 参数

```
?scene=fourier-synth    # 初始场景(默认悬链拱顶)
?noai=1                  # 关闭 AI 面板
?force=mock              # 强制本地 mock(跳过 LLM 配置)
```

## 用真 LLM(可选)

1. 复制 `_llm_config.example.json` → `_llm_config.json`
2. 填 `api_key` 和 `base_url`(支持任何 OpenAI 兼容协议,本地 LLM 也行)
3. 刷新页面,右下角 AI 面板自动切到真模型

`api_key` 在 `_llm_config.json`,**已 gitignore**,不进版本控制。

## 项目结构

```
MathematicsWeb/
├── index.html                  入口
├── viewer/                     渲染 + UI
│   ├── viewer.js               主壳 + 场景切换
│   ├── viewer.css              暗色主题
│   ├── 02_ai-panel.js          AI 助手
│   └── scenes/                 6 个独立场景
├── kernel/                     数学 + 动画 + LLM
├── mock/                       本地 LLM 兜底
├── db/                         IndexedDB 持久化
└── vendor/three/               three.js r160(本地)
```

详细见 `AGENTS.md` 和 `docs/`。

## 路线图

- **v0.1.0 (已发)**: 6 场景 MVP · 2D/3D 双模 · AI mock
- **v0.5 (2-3 周)**: 12-15 场景 + 真 LLM + 收藏 + 进度
- **v1.0 (1-2 月)**: 全套主题模块 + 教师模式 + 用户系统

## 跨项目血缘

范式沿用 [`three.jsWeb`](../03_Architect/Attack/_ArchitectAttackLib/three.jsWeb) · 风格沿用 [`canvasweb`](../03_Architect/Attack/_ArchitectAttackLib/canvasweb)
