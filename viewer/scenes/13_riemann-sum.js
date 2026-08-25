// viewer/scenes/13_riemann-sum.js
// MathematicsWeb v0.6.0 — 黎曼和 (数学 × 工程)
// 2D Canvas 场景:数值积分估算
//   - 4 种方法:左矩形 / 右矩形 / 梯形 / Simpson
//   - 实时画函数曲线 + 矩形/梯形/抛物线拟合
//   - 调 N 看精度收敛 + 跟真实值对比
//
// 数学:∫ₐᵇ f(x) dx
//   左矩形:L = Σ f(xᵢ) · Δx
//   右矩形:R = Σ f(xᵢ₊₁) · Δx
//   梯形:T = (L + R) / 2
//   Simpson:S = (2·T + (2/3)·(L+R-2M)) / 3, M 是中点法(O(h⁴) 收敛,精度高)
//
// 应用:定积分难求 → 数值逼近;有限元;蒙特卡洛;信号处理

import { makeLoop, fitCanvas } from '../../kernel/02_animation.js';

export function createScene(host, opts = {}) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;inset:0;';
  host.appendChild(wrap);

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;';
  wrap.appendChild(canvas);

  const lesson = document.createElement('div');
  lesson.className = 'mathw-lesson';
  lesson.innerHTML = `
    <button class="mathw-lesson-toggle" data-toggle>−</button>
    <div class="mathw-lesson-title">数学 × 工程 · 黎曼和 / 数值积分</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">∫ 算不出来,就用矩形 / 梯形 / 抛物线堆出来</div>
      <div class="mathw-lesson-formula">∫ₐᵇ f(x)dx ≈ Σ f(xᵢ)·Δx</div>
      <div class="mathw-lesson-text">
        工程上很多积分没有解析解(<code>erf</code>、<code>si</code> 等特殊函数),只能数值逼近。<br>
        <strong>左/右矩形</strong>:O(1/N) 收敛(慢);<strong>梯形</strong>:O(1/N²);<strong>Simpson 抛物线</strong>:O(1/N⁴),精度爆炸。<br>
        选函数,选 N,选方法,看实时误差。
      </div>
    </div>
  `;
  host.appendChild(lesson);
  lesson.querySelector('[data-toggle]').addEventListener('click', () => {
    lesson.classList.toggle('collapsed');
    lesson.querySelector('[data-toggle]').textContent = lesson.classList.contains('collapsed') ? '+' : '−';
  });

  const ctrls = document.createElement('div');
  ctrls.className = 'mathw-controls';
  ctrls.innerHTML = `
    <div class="mathw-controls-title">参数 · 黎曼和</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">函数</span>
      <select data-fn>
        <option value="sinx" selected>sin(x) on [0, π]</option>
        <option value="x2">x² on [0, 1]</option>
        <option value="exp">e^(-x²) on [0, 3]</option>
        <option value="gauss">1/(1+x²) on [0, 5]</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">方法</span>
      <select data-method>
        <option value="left" selected>左矩形</option>
        <option value="right">右矩形</option>
        <option value="mid">中点矩形</option>
        <option value="trapezoid">梯形</option>
        <option value="simpson">Simpson 抛物线</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">分段 N</span>
      <input type="range" min="2" max="60" step="1" value="10" data-n />
      <span class="mathw-control-value" data-n-v>10</span>
    </div>
  `;
  host.appendChild(ctrls);

  let fnKind = 'sinx';
  let method = 'left';
  let params = { n: 10 };

  // 各种函数及其真实积分
  const FUNCS = {
    sinx: { f: x => Math.sin(x), a: 0, b: Math.PI, exact: 2 },
    x2:   { f: x => x * x, a: 0, b: 1, exact: 1/3 },
    exp:  { f: x => Math.exp(-x * x), a: 0, b: 3, exact: 0.886207 },
    gauss:{ f: x => 1 / (1 + x * x), a: 0, b: 5, exact: Math.atan(5) },
  };

  function integrate(f, a, b, n, method) {
    const dx = (b - a) / n;
    let sum = 0;
    if (method === 'left') {
      for (let i = 0; i < n; i++) sum += f(a + i * dx);
      return sum * dx;
    } else if (method === 'right') {
      for (let i = 0; i < n; i++) sum += f(a + (i + 1) * dx);
      return sum * dx;
    } else if (method === 'mid') {
      for (let i = 0; i < n; i++) sum += f(a + (i + 0.5) * dx);
      return sum * dx;
    } else if (method === 'trapezoid') {
      for (let i = 0; i < n; i++) {
        sum += (f(a + i * dx) + f(a + (i + 1) * dx)) / 2;
      }
      return sum * dx;
    } else if (method === 'simpson') {
      // Simpson 1/3 规则(要求 n 是偶数)
      const n2 = n % 2 === 0 ? n : n + 1;
      const dx2 = (b - a) / n2;
      sum = f(a) + f(b);
      for (let i = 1; i < n2; i++) {
        sum += (i % 2 === 0 ? 2 : 4) * f(a + i * dx2);
      }
      return sum * dx2 / 3;
    }
    return 0;
  }

  const ctx = canvas.getContext('2d');

  function draw(elapsed, dt) {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    const conf = FUNCS[fnKind];
    const margin = 60;
    const chartX = margin, chartY = 60;
    const chartW = W - margin * 2;
    const chartH = H - 120;
    const n = params.n;
    const dx = (conf.b - conf.a) / n;
    const f = conf.f;

    // 找最大 y
    let maxY = 0;
    for (let i = 0; i <= 200; i++) {
      const x = conf.a + (i / 200) * (conf.b - conf.a);
      maxY = Math.max(maxY, f(x));
    }
    const yScale = chartH / (maxY * 1.1);
    const xScale = chartW / (conf.b - conf.a);
    function toCanvas(x, y) {
      return {
        x: chartX + (x - conf.a) * xScale,
        y: chartY + chartH - y * yScale,
      };
    }

    // 画矩形/梯形/抛物线
    ctx.globalAlpha = 0.3;
    if (method === 'left' || method === 'right' || method === 'mid') {
      ctx.fillStyle = method === 'mid' ? '#6ee7b7' : (method === 'left' ? '#4ea1ff' : '#ff6b6b');
      for (let i = 0; i < n; i++) {
        const xL = conf.a + i * dx;
        const xR = conf.a + (i + 1) * dx;
        const xM = (xL + xR) / 2;
        const xEval = method === 'left' ? xL : (method === 'right' ? xR : xM);
        const yEval = f(xEval);
        const p1 = toCanvas(xL, 0);
        const p2 = toCanvas(xL, yEval);
        const p3 = toCanvas(xR, yEval);
        const p4 = toCanvas(xR, 0);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fill();
      }
    } else if (method === 'trapezoid') {
      ctx.fillStyle = '#6ee7b7';
      for (let i = 0; i < n; i++) {
        const xL = conf.a + i * dx;
        const xR = conf.a + (i + 1) * dx;
        const yL = f(xL), yR = f(xR);
        const p1 = toCanvas(xL, 0);
        const p2 = toCanvas(xL, yL);
        const p3 = toCanvas(xR, yR);
        const p4 = toCanvas(xR, 0);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fill();
      }
    } else if (method === 'simpson') {
      // 抛物线段(每 2 段一组)
      ctx.fillStyle = '#6ee7b7';
      const n2 = n % 2 === 0 ? n : n + 1;
      const dx2 = (conf.b - conf.a) / n2;
      for (let i = 0; i < n2; i += 2) {
        const xL = conf.a + i * dx2;
        const xM = conf.a + (i + 1) * dx2;
        const xR = conf.a + (i + 2) * dx2;
        const yL = f(xL), yM = f(xM), yR = f(xR);
        // 二次贝塞尔近似抛物线段
        const pL = toCanvas(xL, 0), pL2 = toCanvas(xL, yL);
        const pM = toCanvas(xM, 0), pM2 = toCanvas(xM, yM);
        const pR = toCanvas(xR, 0), pR2 = toCanvas(xR, yR);
        ctx.beginPath();
        ctx.moveTo(pL.x, pL.y);
        ctx.lineTo(pL2.x, pL2.y);
        ctx.quadraticCurveTo(pM2.x - (pM2.x - pM2.x) * 0, pM2.y, pR2.x, pR2.y);
        ctx.lineTo(pR.x, pR.y);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // 函数曲线
    ctx.strokeStyle = '#f0c040';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = conf.a + (i / 200) * (conf.b - conf.a);
      const y = f(x);
      const p = toCanvas(x, y);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // x 轴
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY + chartH);
    ctx.lineTo(chartX + chartW, chartY + chartH);
    ctx.stroke();

    // 数值
    const est = integrate(f, conf.a, conf.b, n, method);
    const err = Math.abs(est - conf.exact);
    ctx.fillStyle = '#6ee7b7';
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`∫ ≈ ${est.toFixed(6)}`, chartX, 30);
    ctx.fillStyle = '#f0c040';
    ctx.fillText(`真实 = ${conf.exact.toFixed(6)}`, chartX + 180, 30);
    ctx.fillStyle = err < 0.001 ? '#6ee7b7' : (err < 0.01 ? '#f0c040' : '#ff6b6b');
    ctx.fillText(`误差 = ${err.toExponential(3)}`, chartX + 380, 30);

    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${method} · N=${n} · ${err < 0.001 ? '✓ 收敛' : '... 继续细分'}`, chartX, 50);

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // 交互
  const _fnSel = ctrls.querySelector('[data-fn]');
  const _mSel = ctrls.querySelector('[data-method]');
  const _nInp = ctrls.querySelector('[data-n]');
  const _nV = ctrls.querySelector('[data-n-v]');
  _fnSel.addEventListener('change', (e) => fnKind = e.target.value);
  _mSel.addEventListener('change', (e) => method = e.target.value);
  _nInp.addEventListener('input', (e) => { params.n = parseInt(e.target.value); _nV.textContent = params.n; });

  return {
    sceneId: 'riemann-sum',
    getFormula() { return '∫ₐᵇ f(x)dx ≈ Σ f(xᵢ)·Δx'; },
    // v0.6.26: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { fn: fnKind, method, n: params.n }; },
    setState(s) {
      if (!s) return;
      if (s.fn) { fnKind = s.fn; _fnSel.value = s.fn; }
      if (s.method) { method = s.method; _mSel.value = s.method; }
      if (typeof s.n === 'number') { params.n = s.n; _nInp.value = s.n; _nV.textContent = s.n; }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
