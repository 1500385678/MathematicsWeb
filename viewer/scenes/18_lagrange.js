// viewer/scenes/18_lagrange.js
// MathematicsWeb v0.6.0 — 拉格朗日乘子法 (数学 × 优化)
// 2D Canvas 场景:约束优化 min f(x,y) s.t. g(x,y) = c
//   - 画目标函数 f 的等高线(同心圆/椭圆)
//   - 画约束 g = c 的曲线
//   - 切点(两者相切)就是最优解
//   - 调 f 和 g 的参数看不同形状
//   - 经典例子:用固定周长围最大面积(→ 圆)
//
// 数学:
//   L(x,y,λ) = f(x,y) − λ·(g(x,y) − c)
//   ∇L = 0 → ∇f = λ·∇g(梯度平行,反向)
//   几何:∇f 和 ∇g 都垂直于各自曲线,所以在切点处都垂直于切线
//
// 应用:经济学效用最大化 · 物理拉格朗日力学 · SVM · 资源分配

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
    <div class="mathw-lesson-title">数学 × 优化 · 拉格朗日乘子法</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">约束优化的几何:∇f 平行 ∇g</div>
      <div class="mathw-lesson-formula">∇f = λ·∇g   (切点)</div>
      <div class="mathw-lesson-text">
        <strong>无约束</strong>:沿 ∇f 反方向走,直到梯度 = 0。<br>
        <strong>有约束 g=c</strong>:走不了最速下降方向,只能沿着约束曲线走 → 在切点停下。<br>
        经典例子:固定周长 L,围最大面积 → 圆(等周不等式)。<br>
        调 f 中心 + g 中心 + g 半径看不同形态。
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
    <div class="mathw-controls-title">参数 · 拉格朗日</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">f 中心</span>
      <select data-fc>
        <option value="origin" selected>原点</option>
        <option value="right">右侧</option>
        <option value="upper">上方</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">g 中心</span>
      <input type="range" min="-1" max="1" step="0.1" value="0" data-gcx />
      <span class="mathw-control-value" data-gcx-v>0.0</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">g 半径</span>
      <input type="range" min="0.5" max="2" step="0.1" value="1.5" data-gr />
      <span class="mathw-control-value" data-gr-v>1.5</span>
    </div>
  `;
  host.appendChild(ctrls);

  let params = { fc: 'origin', gcx: 0, gr: 1.5 };
  // 视口固定 [-3..3, -2..2]
  const X_MIN = -3, X_MAX = 3, Y_MIN = -2, Y_MAX = 2;

  // f 函数中心
  function fCenter() {
    if (params.fc === 'origin') return { x: 0, y: 0 };
    if (params.fc === 'right') return { x: 1.5, y: 0 };
    if (params.fc === 'upper') return { x: 0, y: 1.5 };
    return { x: 0, y: 0 };
  }
  // f(x,y) = (x-fx)² + (y-fy)²(简单 bowl)
  function f(x, y) {
    const fc = fCenter();
    return (x - fc.x) ** 2 + (y - fc.y) ** 2;
  }
  // g(x,y) = (x-gcx)² + y² - r² = 0(圆约束)
  function g(x, y) { return (x - params.gcx) ** 2 + y * y - params.gr * params.gr; }
  // 梯度
  function gradF(x, y) { const fc = fCenter(); return { gx: 2 * (x - fc.x), gy: 2 * (y - fc.y) }; }
  function gradG(x, y) { return { gx: 2 * (x - params.gcx), gy: 2 * y }; }

  // 数值找最优点(在约束圆上)
  function findOptimum() {
    // 解析:min (x-fx)² + (y-fy)² s.t. (x-gcx)² + y² = r²
    // 圆参数化 x = gcx + r·cosθ, y = r·sinθ
    // 代入 f 关于 θ 求导 = 0
    // d/dθ f = 2(x-fx)(-r·sinθ) + 2(y-fy)(r·cosθ) = 0
    // (x-fx)·sinθ = (y-fy)·cosθ
    // (gcx+r·cosθ-fx)·sinθ = (r·sinθ-fy)·cosθ
    // 展开整理...
    // 直接数值搜
    const fc = fCenter();
    let best = { theta: 0, val: Infinity };
    for (let i = 0; i < 1000; i++) {
      const theta = (i / 1000) * 2 * Math.PI;
      const x = params.gcx + params.gr * Math.cos(theta);
      const y = params.gr * Math.sin(theta);
      const val = (x - fc.x) ** 2 + (y - fc.y) ** 2;
      if (val < best.val) best = { theta, val, x, y };
    }
    return best;
  }

  const ctx = canvas.getContext('2d');

  function draw(elapsed, dt) {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const sx = W / (X_MAX - X_MIN);
    const sy = H / (Y_MAX - Y_MIN);
    const toCanvas = (x, y) => ({ x: cx + x * sx, y: cy - y * sy });

    // 网格
    ctx.strokeStyle = '#1c2230';
    ctx.lineWidth = 1;
    for (let i = X_MIN; i <= X_MAX; i++) {
      const p = toCanvas(i, 0);
      ctx.beginPath(); ctx.moveTo(p.x, 0); ctx.lineTo(p.x, H); ctx.stroke();
    }
    for (let i = Y_MIN; i <= Y_MAX; i++) {
      const p = toCanvas(0, i);
      ctx.beginPath(); ctx.moveTo(0, p.y); ctx.lineTo(W, p.y); ctx.stroke();
    }
    // 坐标轴
    ctx.strokeStyle = '#2a3140';
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(W, cy);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
    ctx.stroke();

    // f 等高线(bowl)
    const fc = fCenter();
    const fcCanvas = toCanvas(fc.x, fc.y);
    ctx.strokeStyle = 'rgba(78, 161, 255, 0.4)';
    ctx.lineWidth = 1;
    for (let r = 0.3; r < 5; r += 0.3) {
      ctx.beginPath();
      for (let theta = 0; theta <= 2 * Math.PI; theta += 0.05) {
        const x = fc.x + r * Math.cos(theta);
        const y = fc.y + r * Math.sin(theta);
        const p = toCanvas(x, y);
        if (theta === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    // f 中心
    ctx.fillStyle = '#4ea1ff';
    ctx.beginPath(); ctx.arc(fcCanvas.x, fcCanvas.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a93a6';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('f 中心', fcCanvas.x + 8, fcCanvas.y - 6);

    // 约束圆
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let theta = 0; theta <= 2 * Math.PI + 0.1; theta += 0.02) {
      const x = params.gcx + params.gr * Math.cos(theta);
      const y = params.gr * Math.sin(theta);
      const p = toCanvas(x, y);
      if (theta === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    const gcCanvas = toCanvas(params.gcx, 0);
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText('g 约束(圆)', gcCanvas.x + 6, gcCanvas.y - params.gr * sy - 6);

    // 找最优点
    const opt = findOptimum();
    const optCanvas = toCanvas(opt.x, opt.y);
    // 切线
    const gf = gradF(opt.x, opt.y);
    const gg = gradG(opt.x, opt.y);
    // ∇f 反方向(向最小)
    const gradLen = Math.hypot(gf.gx, gf.gy) || 1;
    const tangentDir = { x: -gf.gy / gradLen, y: gf.gx / gradLen };  // 垂直 ∇f
    const tLine = 0.8;
    ctx.strokeStyle = 'rgba(240, 192, 64, 0.7)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(optCanvas.x - tangentDir.x * tLine * sx, optCanvas.y + tangentDir.y * tLine * sy);
    ctx.lineTo(optCanvas.x + tangentDir.x * tLine * sx, optCanvas.y - tangentDir.y * tLine * sy);
    ctx.stroke();
    ctx.setLineDash([]);

    // 梯度箭头
    function drawArrow(from, dx, dy, color) {
      const to = { x: from.x + dx, y: from.y - dy };
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
      // 箭头头
      const ang = Math.atan2(-dy, dx);
      ctx.beginPath();
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(to.x - 8 * Math.cos(ang - 0.3), to.y - 8 * Math.sin(ang - 0.3));
      ctx.lineTo(to.x - 8 * Math.cos(ang + 0.3), to.y - 8 * Math.sin(ang + 0.3));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }
    drawArrow(optCanvas, gf.gx * 5, gf.gy * 5, '#4ea1ff');  // ∇f
    drawArrow(optCanvas, gg.gx * 5, gg.gy * 5, '#ff6b6b');  // ∇g

    // 最优点
    ctx.fillStyle = '#f0c040';
    ctx.beginPath(); ctx.arc(optCanvas.x, optCanvas.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f0c040';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`最优点 (${opt.x.toFixed(2)}, ${opt.y.toFixed(2)})`, optCanvas.x + 8, optCanvas.y - 8);

    // 标题
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('f = (x-fx)² + (y-fy)²(蓝等高线)· g = (x-gcx)² + y² = r²(红圆)', 20, 30);
    ctx.fillText('黄点 = 切点(最优)· 虚线 = 切线· 蓝/红箭头 = ∇f / ∇g(切点处平行反向)', 20, 48);

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // 交互
  const _fcSel = ctrls.querySelector('[data-fc]');
  const _gcxInp = ctrls.querySelector('[data-gcx]');
  const _gcxV = ctrls.querySelector('[data-gcx-v]');
  const _grInp = ctrls.querySelector('[data-gr]');
  const _grV = ctrls.querySelector('[data-gr-v]');
  _fcSel.addEventListener('change', (e) => params.fc = e.target.value);
  _gcxInp.addEventListener('input', (e) => { params.gcx = parseFloat(e.target.value); _gcxV.textContent = params.gcx.toFixed(1); });
  _grInp.addEventListener('input', (e) => { params.gr = parseFloat(e.target.value); _grV.textContent = params.gr.toFixed(1); });

  return {
    sceneId: 'lagrange',
    getFormula() { return '∇f = λ·∇g  (切点处)'; },
    // v0.6.10: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { ...params }; },
    setState(s) {
      if (!s) return;
      if (s.fc) { params.fc = s.fc; _fcSel.value = s.fc; }
      if (typeof s.gcx === 'number') { params.gcx = s.gcx; _gcxInp.value = s.gcx; _gcxV.textContent = s.gcx.toFixed(1); }
      if (typeof s.gr === 'number') { params.gr = s.gr; _grInp.value = s.gr; _grV.textContent = s.gr.toFixed(1); }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
