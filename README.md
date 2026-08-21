# MathematicsWeb · 跨学科数学可视化

> 数学不是公式,是**看得见、摸得着**的东西。
> 这是一个把数学嵌进建筑、物理、音乐、生物、艺术场景的动态可视化平台。

![v0.5.0](https://img.shields.io/badge/version-v0.5.0-6ee7b7)
![零构建](https://img.shields.io/badge/build-零构建-4ea1ff)
![断网能跑](https://img.shields.io/badge/network-断网能跑-f0c040)
![10场景](https://img.shields.io/badge/scenes-10-f0c040)

---

## 这是什么

10 个杀手锏场景,把抽象的数学概念**可视化**到极致:

| 场景 | 学科 | 公式 | 玩法 |
|---|---|---|---|
| 🏛️ **悬链拱顶** | 数学 × 建筑 | `y = a·cosh(x/a)` | 拖 a 看拱变胖变瘦,翻转看悬链 |
| 🪐 **行星轨道** | 数学 × 物理 | `F = G·M·m/r² · T² ∝ a³` | **4 颗行星**不同 e/a 同时跑,看开普勒第三定律 |
| 🎵 **傅里叶合成器** | 数学 × 音乐 | `f(t) = Σ aₙ·sin(nωt + φₙ)` | 左边画转圈箭头,右边画函数,4 种波形可切 |
| 🦊 **种群动力学** | 数学 × 生物 | `dx/dt = αx − βxy; dy/dt = δxy − γy` | 调 4 个参数看兔子狐狸怎么拉锯,看相图闭合 |
| 🌀 **曼德尔布罗** | 数学 × 艺术 | `z_{n+1} = z_n² + c` | 拖动 / 滚轮缩放,无限自相似细节,4 种配色 |
| 🎢 **简谐振动** | 数学 × 物理 | `x¨ + 2γx˙ + ω²x = F₀·cos(ωF·t)` | **阻尼+强迫振动+共振警告**(ωF≈ω 时振幅暴涨) |
| 🌻 **黄金螺旋** | 数学 × 艺术 | `φ = (1+√5)/2 ≈ 1.618` | 费波那契矩形 → 对数螺旋,鹦鹉螺/向日葵/银河系 |
| 🎲 **蒙特卡洛** | 数学 × 概率 | `π ≈ 4·N内/N总   ∫f ≈ (b−a)·⟨f⟩` | 随机投点算 π + 蒙特卡洛积分,大数定律 |
| 🌀 **双摆混沌** | 数学 × 物理 |  8 条对照摆初值差 0.001 | RK4 积分 · 蝴蝶效应 · 几秒后轨迹分道扬镳 · **+ 相空间图(θ vs ω)** |
| ⛰️ **梯度下降** | 数学 × 机器学习 | `θ ← θ − η·∇f(θ)` | 3D 损失曲面 + 优化路径 · **GD / Momentum / Adam 三种优化器** |

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

- [x] **v0.1.0 (2026-08-21)**: 6 场景 MVP · 2D/3D 双模 · AI mock
- [x] **v0.2.0 (2026-08-21)**: 10 场景 + 真 LLM 接入 + 双平台发布
- [x] **v0.5.0 (2026-08-21)**: 收藏 + 进度 + 场景参数持久化 + 最后访问恢复 · 双摆加相空间 · 梯度下降加 Momentum/Adam
- [ ] **v0.6 (2-3 周)**: 12-15 场景 + 主题模块化
- [ ] **v1.0 (1-2 月)**: 全套主题模块 + 教师模式 + 用户系统

## v0.5.0 新增特性

- ⭐ **场景收藏**:点星星收藏喜欢的场景,过滤只看收藏
- ✓ **访问进度**:自动记录已访问场景,顶部状态栏显示 "进度 X/10"
- 💾 **场景参数持久化**:每个场景的参数自动存 IndexedDB,刷新不丢
- 📂 **最后访问恢复**:刷新页面自动跳回上次看的场景
- 🌀 **双摆相空间图**:右下角画 θ₁ vs ω₁ 主摆 + 8 对照,直观看到混沌的分形-like 填充
- ⚡ **Momentum + Adam**:梯度下降支持朴素 GD / Momentum / Adam 三种优化器,直观对比
- ⚡ **测 LLM 连通**:AI 面板新按钮,一键 ping LLM 看延迟

## 仓库

- GitHub: <https://github.com/1500385678/MathematicsWeb>
- Gitee: <https://gitee.com/architectzy/MathematicsWeb>

## 跨项目血缘

范式沿用 [`three.jsWeb`](../03_Architect/Attack/_ArchitectAttackLib/three.jsWeb) · 风格沿用 [`canvasweb`](../03_Architect/Attack/_ArchitectAttackLib/canvasweb)
