// mock/01_llm-mock.js
// MathematicsWeb v0.1.0 — 本地 mock LLM(无 key 时使用)
// 行为:检测 prompt 里"当前场景"前缀,返回对应预设回复 + 公式

const SCENE_REPLIES = {
  'catenary-arch': {
    text: '悬链线是均匀绳子只受重力时自然下垂的形状:y = a·cosh(x/a)。把它倒过来就是纯压拱——石块只受压力不受弯矩,零张应力,古代就能用小石块搭出大跨度。高迪把它用到了极致,圣家族大教堂很多柱子就是悬链反转体。',
    formula: 'y = a · cosh(x / a)',
    lesson: '悬链线 y = a·cosh(x/a) 是自然下垂形状。参数 a 控制胖瘦:a 越大越平,越小越尖。倒转后是纯压拱——只受压力不受弯矩,适合用石块搭建。',
  },
  'planetary-orbits': {
    text: '开普勒第一定律:行星轨道是椭圆,太阳在一个焦点上。第二定律:扫面积速度恒定(角动量守恒)。这两条都能从牛顿 F = G·M·m/r² 反平方律推出来。模拟时用欧拉/Verlet 积分,只要初速度合适就能跑出椭圆。',
    formula: 'F = G · M · m / r²   a = F/m = -G·M·r / r³',
    lesson: '完整 9 大行星(水/金/地/火/木/土/天王/海王/冥王)+ 月球绕地球。速度 Verlet 数值积分,椭圆轨道用真实相对距离 log 压缩。',
  },
  'fourier-synth': {
    text: '任何周期函数都能写成 sin 和 cos 的加权和——这就是傅里叶级数。换个视角:每个频率对应一个转圈的箭头,角速度 = 2π·f。所有箭头头尾相连,最终点的轨迹就是函数图像。方波、锯齿、任意曲线都能分解成几个箭头。',
    formula: 'f(t) = a₀/2 + Σ[aₙ·cos(nωt) + bₙ·sin(nωt)]',
    lesson: '4 种基础波形(方波/锯齿/三角/自定义)用 N 个谐波叠加合成。谐波数 N 越大越接近目标波形。',
  },
  'population-dynamics': {
    text: '洛特卡-沃尔泰拉模型:兔子(猎物)独自会指数增长,有狐狸(捕食者)就被吃;狐狸独自会饿死,有了兔子就繁殖。两条曲线会形成相位错开的震荡——生态学里的"捕食者-猎物循环"。现实里还有 logistic 修正、季节变化、迁徙,模型能玩出很多花样。',
    formula: 'dx/dt = αx − βxy;  dy/dt = δxy − γy',
    lesson: '逻辑斯蒂增长 + Lotka-Volterra 捕食模型。RK4 数值积分,时间序列 + 相图(X-Y)双视图。',
  },
  'mandelbrot': {
    text: '复数迭代 z = z² + c,有些 c 让 z 飞出去,有些让它收敛。收敛的 c 涂黑,飞出去的按速度上色——边界是无限细节的分形。放大任意一点都有自相似结构,3D 视角看像土豆,但 2D 平面上是数学最著名的图像。',
    formula: 'z_{n+1} = z_n² + c   z₀ = 0',
    lesson: '复数迭代 z = z² + c。迭代 100 次不发散 → 涂黑(集内);发散 → 按速度上色(集外)。边界 = 无限分形。4 种配色方案,鼠标拖动 + 缩放。',
  },
  'simple-harmonic': {
    text: '弹簧、单摆、LC 电路、声波——背后都是同一个微分方程:x¨ + ω²x = 0。解是 sin/cos,频率 ω 跟系统本身有关。相位 φ 决定起点,振幅 A 决定大小。这条方程之所以重要,是因为任何"在小扰动下的稳定平衡"附近都是这个形状。',
    formula: 'x(t) = A · cos(ωt + φ)',
    lesson: '三个系统(弹簧 ω=√(k/m)/ 单摆 ω=√(g/L)/ LC 电路 ω=1/√(LC))共享方程 x¨ + 2γx˙ + ω²x = F₀·cos(ωF·t)。无阻尼永不停;有阻尼按 A·e^(-γt) 衰减;强迫振动当 ωF≈ω 时共振(振幅暴涨)。',
  },
};

const GENERIC = {
  '讲讲': '看到啥我讲啥,但先选个场景哈。左侧 6 个场景随便点一个。',
  '推导': '每个场景的"教学卡片"里有核心公式,鼠标拖一下控件看参数怎么影响图形,效果比看推导直观。',
  '应用': '悬链线 = 高迪建筑 / 行星轨道 = GPS 卫星 / 傅里叶 = MP3 压缩 / 种群 = 渔业管理 / 曼德尔布罗 = 天线设计 / 简谐 = 地震仪。',
  '默认': '可以试试左侧场景库,或者直接问我"这个场景讲什么"。',
};

export class LLMMock {
  constructor() {
    this.model = 'mock';
    this.latency = 200; // 模拟延迟(ms)
  }

  async ping() {
    return { ok: true, msg: 'mock 在线', latency_ms: 0 };
  }

  async chat(prompt, opts = {}) {
    await new Promise(r => setTimeout(r, this.latency + Math.random() * 200));
    // 解析场景
    const sceneMatch = /\[当前场景:\s*([^\s\]]+)/.exec(prompt);
    if (sceneMatch) {
      const sceneId = sceneMatch[1];
      const reply = SCENE_REPLIES[sceneId];
      if (reply) return { text: reply.text, formula: reply.formula, lesson: reply.lesson || '' };
    }
    // 关键词命中
    if (/讲讲|原理/.test(prompt)) return { text: GENERIC['讲讲'] };
    if (/推导/.test(prompt)) return { text: GENERIC['推导'] };
    if (/应用|例子/.test(prompt)) return { text: GENERIC['应用'] };
    return { text: GENERIC['默认'] };
  }
}
