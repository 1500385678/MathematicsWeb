// kernel/01_math-core.js
// MathematicsWeb v0.1.0 — 纯数学原语(跟 three.js 无关,场景内可独立使用)
// 提供:Complex(复数)、Vector2/3(2D/3D 向量)、Matrix2x2(2D 矩阵)、
//      easing(缓动)、rng(种子随机)、stats(基础统计)、Fourier(DFT 简化版)
//
// 设计原则:
//   - 全部 immutable-friendly(函数返回新对象)
//   - 零依赖,不依赖 three.js
//   - 数值稳定优先

// ============================================================
// 复数(曼德尔布罗 + 傅里叶用)
// ============================================================
export class Complex {
  constructor(re = 0, im = 0) { this.re = re; this.im = im; }
  static from(z) { return new Complex(z.re ?? 0, z.im ?? 0); }
  add(z) { return new Complex(this.re + z.re, this.im + z.im); }
  sub(z) { return new Complex(this.re - z.re, this.im - z.im); }
  mul(z) { return new Complex(this.re * z.re - this.im * z.im, this.re * z.im + this.im * z.re); }
  scale(s) { return new Complex(this.re * s, this.im * s); }
  abs2() { return this.re * this.re + this.im * this.im; }
  abs() { return Math.sqrt(this.abs2()); }
  arg() { return Math.atan2(this.im, this.re); }
  toString() { return `${this.re.toFixed(3)} ${this.im >= 0 ? '+' : '-'} ${Math.abs(this.im).toFixed(3)}i`; }
}

// ============================================================
// 向量(轻量版,够场景用,不需要背 three.js Vector3)
// ============================================================
export class Vec2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  static from(v) { return new Vec2(v.x ?? 0, v.y ?? 0); }
  add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
  scale(s) { return new Vec2(this.x * s, this.y * s); }
  dot(v) { return this.x * v.x + this.y * v.y; }
  length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  normalize() { const l = this.length(); return l > 0 ? this.scale(1 / l) : new Vec2(); }
}

// ============================================================
// 2x2 矩阵(矩阵变换场景用)
// [[a, b], [c, d]] · [x, y] = [ax + by, cx + dy]
// ============================================================
export class Mat2x2 {
  constructor(a = 1, b = 0, c = 0, d = 1) { this.a = a; this.b = b; this.c = c; this.d = d; }
  static rotation(theta) { return new Mat2x2(Math.cos(theta), -Math.sin(theta), Math.sin(theta), Math.cos(theta)); }
  static scale(sx, sy) { return new Mat2x2(sx, 0, 0, sy ?? sx); }
  static shear(k) { return new Mat2x2(1, k, 0, 1); }
  static reflection() { return new Mat2x2(1, 0, 0, -1); }
  mul(m) { return new Mat2x2(this.a * m.a + this.b * m.c, this.a * m.b + this.b * m.d, this.c * m.a + this.d * m.c, this.c * m.b + this.d * m.d); }
  apply(v) { return new Vec2(this.a * v.x + this.b * v.y, this.c * v.x + this.d * v.y); }
  det() { return this.a * this.d - this.b * this.c; }
  toString() { return `[${this.a.toFixed(2)} ${this.b.toFixed(2)}; ${this.c.toFixed(2)} ${this.d.toFixed(2)}]`; }
}

// ============================================================
// 缓动函数(rAF 动画用)
// ============================================================
export const easing = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => 1 - (1 - t) * (1 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeOutCubic: t => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  // 弹簧(过冲,适合"自然"感)
  spring: (t) => {
    if (t === 0 || t === 1) return t;
    const c = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c) + 1;
  },
};

// ============================================================
// 种子随机(可复现的动画/蒙特卡洛)
// ============================================================
export function makeRng(seed = 1) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ============================================================
// 基础统计
// ============================================================
export function mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
export function stddev(arr) {
  const m = mean(arr);
  if (arr.length < 2) return 0;
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) * (b - m), 0) / (arr.length - 1));
}

// ============================================================
// 悬链线 y = a · cosh(x/a) - 建筑场景核心
// ============================================================
export function catenary(x, a) {
  return a * Math.cosh(x / a);
}

// ============================================================
// 洛特卡-沃尔泰拉(种群动力学)的解析初值(欧拉积分用)
//   dx/dt = αx - βxy   (猎物)
//   dy/dt = δxy - γy   (捕食者)
// ============================================================
export function lotkaVolterraStep(state, params, dt) {
  const { alpha, beta, delta, gamma } = params;
  const [x, y] = state;
  const dx = (alpha * x - beta * x * y) * dt;
  const dy = (delta * x * y - gamma * y) * dt;
  return [Math.max(0, x + dx), Math.max(0, y + dy)];
}

// ============================================================
// DFT 离散傅里叶变换(简化版,N 个采样点 → 频率域)
// 输入:实数数组 reals[N] / 输出:复数数组 coeffs[N/2+1]
// ============================================================
export function dft(reals) {
  const N = reals.length;
  const out = [];
  for (let k = 0; k < N / 2 + 1; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const phi = (2 * Math.PI * k * n) / N;
      re += reals[n] * Math.cos(phi);
      im -= reals[n] * Math.sin(phi);
    }
    out.push(new Complex(re / N, im / N));
  }
  return out;
}

// ============================================================
// 曼德尔布罗迭代(z = z² + c,迭代 maxIter 次,|z| > 2 提前退出)
// 返回:逃逸迭代次数(0..maxIter,等于 maxIter 表示不逃逸)
// ============================================================
export function mandelbrot(cRe, cIm, maxIter = 100) {
  let zr = 0, zi = 0;
  for (let i = 0; i < maxIter; i++) {
    const zr2 = zr * zr, zi2 = zi * zi;
    if (zr2 + zi2 > 4) return i;
    const newZr = zr2 - zi2 + cRe;
    zi = 2 * zr * zi + cIm;
    zr = newZr;
  }
  return maxIter;
}
