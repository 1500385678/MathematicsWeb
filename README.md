# MathematicsWeb · 跨学科数学可视化教学平台

> **38 场景 · 2D + 3D 双模 · AI 教学助手 · 零构建 · 断网能跑**
> 项目门面 · 跟 `AGENTS.md` 状态速览段同步更新(非主要文件)

---

## 启动

```powershell
# Windows PowerShell(PowerShell 5.1 解析 start.ps1 有 UTF-8 bug,绕开用 Python)
cd "D:\Mac\Mac\Mac\Consultant\14-数学-Mathematics\_MathematicsLib\MathematicsWeb"
python server.py
# 浏览器:http://localhost:8765
```

```bash
# macOS / Linux
python3 server.py
# 浏览器:http://localhost:8765
```

## URL 参数

| 参数 | 作用 | 默认 |
|---|---|---|
| `?scene=<id>` | 初始场景 | `catenary-arch` |
| `?noai=1` | 关闭 AI 面板 | 开 |
| `?force=mock` | 强制 mock LLM | 试真 LLM(无 key 降级 mock) |

## 38 场景速览

| 主题 | 场景 |
|---|---|
| 数学 × 物理 | 行星轨道 · 简谐振动 · 双摆混沌 · 波叠加/干涉 · 电场可视化 · 椭圆光学反射 |
| 数学 × 艺术 | 曼德尔布罗 · 黄金螺旋 · 朱利亚集 |
| 数学 × 概率 | 蒙特卡洛 · 中心极限定理 · 贝叶斯推断 · 布丰投针 |
| 数学 × 音乐 | 傅里叶合成器 · Lissajous 曲线 |
| 数学 × 生物 | 种群动力学 · L-系统植物 |
| 数学 × 机器学习 | 梯度下降 · 神经网络 2D 分类 |
| 数学 × 建筑 | 悬链拱顶 |
| 数学 × 工程 | 黎曼和 |
| 数学 × 优化 | 拉格朗日乘子法 |
| 数学 × 计算几何 | 沃罗诺伊图 · 德劳内三角剖分 · 双纽线 |
| 数学 × 球面几何 | 球面大圆 |
| 数学 × 拓扑几何 | 莫比乌斯带 |
| 数学 × 分形几何 | Koch 雪花 · 谢尔宾斯基三角 |
| 数学 × 材料科学 | 晶体格 / Bravais(SC / BCC / FCC / HCP) |
| 数学 × 初中几何 | 三角形全等判定(SSS/SAS/ASA/AAS/HL) · 勾股定理(a²+b²=c²) · 圆周角定理(∠APB=½∠AOB) · 相似三角形(ΔABC~ΔA'B'C',面积比=k²) · 多边形内角和((N-2)×180° + 外角 360°) · 四边形家族(平行/矩/菱/方 + 梯/等腰/直角) · 立体几何三视图(主 V/俯 H/左 W,中国第一角投影) · 圆幂定理(PT²=PA·PB,外点/双割线/相交弦/径向扫描) |
| 数学 × 高中解析几何 | _MATH-017 启动中:圆锥曲线统一 R=ed · 椭圆解析 · 双曲线解析 · 抛物线解析 · 参数方程(摆线/星形线/渐开线) · 极坐标曲线(玫瑰/心形/阿基米德螺线)_ _(人教版选择性必修第一册)_ |

> 详细数学原理 + 实现要点见 `viewer/scenes/XX_*.js` 源码注释 + AGENTS.md"## 项目已具备的能力"段。

## 关联

- **`AGENTS.md`** — 项目铁律 + 架构 + 能力库 + 项目状态速览(主要文件)
- **`PLAN.md`** — 活跃任务队列(主要文件)
- 仓库:<https://github.com/1500385678/MathematicsWeb> + Gitee 镜像

## LLM 接入(可选)

复制 `_llm_config.example.json` → `_llm_config.json`,填 `api_key` 和 `base_url`(支持任何 OpenAI 兼容协议,本地 LLM 也行)。`api_key` 已在 `.gitignore`,不进版本控制。

> 详细步骤见 server.py 注释 + M3 后端代理走 `M3_API_KEY` 环境变量。
