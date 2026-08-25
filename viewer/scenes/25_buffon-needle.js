// viewer/scenes/25_buffon-needle.js
// MathematicsWeb v0.6.23 — 布丰投针 (数学 × 几何概率)
// 2D Canvas 场景:平面上间距 d 的平行线,投长 L 的针,统计穿线次数 → 算 π
//   - 平行线 + 已投的针(黄=穿线,绿=不穿线)
//   - 实时显示 π 估计 + 误差百分比 + 穿线比例 vs 理论概率
//   - 投 50 / 投 500 按钮,大数定律 → 投得越多 π 越准
//
// 数学:Georges-Louis Leclerc, Comte de Buffon 1733
//   设:针中心到最近线距离 x ∈ [0, d/2],针角度 θ ∈ [0, π]
//   穿线条件:x ≤ (L/2)·sinθ
//   积分:P = (1/(d/2 · π)) · ∫₀^{π} ∫₀^{(L/2)sinθ} dx dθ
//     = (1/(d/2 · π)) · (L/2) · ∫₀^π sinθ dθ
//     = (2L) / (πd)
//   反解:π = 2LN / (k·d)  其中 N=总投数, k=穿线次数
//
// 应用:第一个用蒙特卡洛方法算 π(蒙特卡洛祖师爷)
//   几何概率奠基 · 现代 MCMC 思想鼻祖 · Laplace 1812 首次实验验证

import { makeLoop, fitCanvas } from '../../kernel/02_animation.js';

export function createScene(host, opts = {}) {
  // ---------- DOM ----------
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
    <div class="mathw-lesson-title">数学 × 几何概率 · 布丰投针</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">扔针算 π · 蒙特卡洛祖师爷</div>
      <div class="mathw-lesson-formula">P = 2L / (πd)  →  π ≈ 2LN / (k·d)</div>
      <div class="mathw-lesson-text">
        平面上有<strong>等距平行线</strong>(间距 d),随机扔一根长 L 的针。<br>
        针中心到最近线的距离 x ∈ [0, d/2],针角度 θ ∈ [0, π]。<br>
        <strong>穿线条件</strong>:x ≤ (L/2)·sinθ。<br>
        概率 P = 2L / (πd) → 反解 <strong>π = 2LN / (k·d)</strong> 其中 k 是穿线次数。<br>
        <strong>投得越多越准</strong>(大数定律) · <strong>1733 布丰</strong>提出,1812 拉普拉斯实验验证。<br>
        应用:第一个蒙特卡洛方法 · 几何概率奠基 · 现代 MCMC 思想鼻祖。
      </div>
    </div>
  `;
  host.appendChild(lesson);
  lesson.querySelector('[data-toggle]').addEventListener('click', () => {
    lesson.classList.toggle('collapsed');
    lesson.querySelector('[data-toggle]').textContent = lesson.classList.contains('collapsed') ? '+' : '−';
  });

  const ctrls = document.createElement('div');
  ctrls.innerHTML = `
    <div class="mathw-controls-title">参数 · 布丰投针</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">针长 L</span>
      <input type="range" min="0.1" max="0.9" step="0.05" value="0.7" data-l />
      <span class="mathw-control-value" data-l-v>0.70</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">线距 d</span>
      <input type="range" min="0.3" max="1.0" step="0.05" value="0.5" data-d />
      <span class="mathw-control-value" data-d-v>0.50</span>
    </div>
    <div class="mathw-control-row">
      <button data-throw>投 50 针</button>
      <button data-throw-many>投 500 针</button>
    </div>
    <div class="mathw-control-row">
      <button data-reset>重置</button>
    </div>
    <div class="mathw-control-row" style="font-size:11px;color:var(--mathw-muted)">
      提示:L/d 越大穿线概率越高 · 投得越多 π 越准
    </div>
  `;
  ctrls.className = 'mathw-controls';
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let params = { l: 0.7, d: 0.5 };
  let needles = [];   // {x, y, theta, hit}
  let totalN = 0, totalK = 0;

  function throwOne() {
    // x ∈ [0.05, 0.95] 留 5% 边距, y ∈ [0, 1]
    const x = 0.05 + Math.random() * 0.9;
    const y = Math.random();
    const theta = Math.random() * Math.PI;
    // 找最近线:线 y = n*d
    const n = Math.round(y / params.d);
    const lineY = n * params.d;
    // 针两端 y 坐标
    const dy = (params.l / 2) * Math.sin(theta);
    const y1 = y - dy, y2 = y + dy;
    // 穿线:两端跨不同线
    const hit = (Math.floor(y1 / params.d) !== Math.floor(y2 / params.d));
    return { x, y, theta, hit };
  }

  function throwMany(n) {
    for (let i = 0; i < n; i++) {
      const r = throwOne();
      needles.push(r);
      totalN++;
      if (r.hit) totalK++;
    }
    // 上限 2000 防止卡顿
    if (needles.length > 2000) needles.splice(0, needles.length - 2000);
  }

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  function draw(elapsed, dt) {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    const d = params.d * H;       // 像素间距
    const l = params.l * Math.min(W, H) * 0.5;  // 视觉缩放(针长)

    // 平行线
    ctx.strokeStyle = 'rgba(138, 147, 166, 0.4)';
    ctx.lineWidth = 1;
    const startN = Math.floor(-H * 0.1 / d);
    const endN = Math.ceil(H * 1.1 / d);
    for (let n = startN; n <= endN; n++) {
      const ly = n * d;
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(W, ly);
      ctx.stroke();
    }

    // 针
    needles.forEach(n => {
      const x = n.x * W;
      const y = n.y * H;
      const dx = (l / 2) * Math.cos(n.theta);
      const dy = (l / 2) * Math.sin(n.theta);
      ctx.strokeStyle = n.hit ? 'rgba(251, 191, 36, 0.78)' : 'rgba(110, 231, 183, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - dx, y - dy);
      ctx.lineTo(x + dx, y + dy);
      ctx.stroke();
      // 中心点
      ctx.fillStyle = n.hit ? '#fbbf24' : '#6ee7b7';
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 统计
    const piEst = totalK > 0 ? (2 * params.l * totalN) / (totalK * params.d) : 0;
    const piTrue = Math.PI;
    const err = totalK > 0 ? Math.abs(piEst - piTrue) / piTrue * 100 : 0;
    const ratio = totalN > 0 ? totalK / totalN : 0;
    const theory = 2 * params.l / (Math.PI * params.d);
    ctx.fillStyle = '#e6e8ec';
    ctx.font = '13px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`π 估计 = ${piEst.toFixed(4)}   ·   真实 π = ${piTrue.toFixed(4)}   ·   误差 ${err.toFixed(2)}%`, 20, 24);
    ctx.fillStyle = '#8a93a6';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillText(`总投 N = ${totalN}  ·  穿线 k = ${totalK}  ·  穿线比例 = ${ratio.toFixed(4)}  ·  理论 P = ${theory.toFixed(4)}`, 20, 44);
    ctx.fillText(`L = ${params.l.toFixed(2)}  ·  d = ${params.d.toFixed(2)}  ·  公式 π ≈ 2LN/(k·d)`, 20, 64);
    ctx.fillText('黄针 = 穿线 · 绿针 = 不穿线 · 灰线 = 平行线', 20, 84);

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // ---------- 交互 ----------
  const _lInp = ctrls.querySelector('[data-l]');
  const _lV = ctrls.querySelector('[data-l-v]');
  const _dInp = ctrls.querySelector('[data-d]');
  const _dV = ctrls.querySelector('[data-d-v]');
  _lInp.addEventListener('input', (e) => { params.l = parseFloat(e.target.value); _lV.textContent = params.l.toFixed(2); });
  _dInp.addEventListener('input', (e) => { params.d = parseFloat(e.target.value); _dV.textContent = params.d.toFixed(2); });
  ctrls.querySelector('[data-throw]').addEventListener('click', () => throwMany(50));
  ctrls.querySelector('[data-throw-many]').addEventListener('click', () => throwMany(500));
  ctrls.querySelector('[data-reset]').addEventListener('click', () => {
    needles = []; totalN = 0; totalK = 0;
  });

  return {
    sceneId: 'buffon-needle',
    getFormula() { return 'P(穿线) = 2L/(πd),  π ≈ 2LN/(k·d)  (Buffon 1733)'; },
    getLesson() {
      const c = lesson.querySelector('.mathw-lesson-content');
      return c ? c.textContent.replace(/\s+/g, ' ').trim() : '';
    },
    getState() { return { l: params.l, d: params.d, needles: needles.slice(), totalN, totalK }; },
    setState(s) {
      if (!s) return;
      if (typeof s.l === 'number') { params.l = s.l; _lInp.value = s.l; _lV.textContent = s.l.toFixed(2); }
      if (typeof s.d === 'number') { params.d = s.d; _dInp.value = s.d; _dV.textContent = s.d.toFixed(2); }
      if (Array.isArray(s.needles)) needles = s.needles.slice();
      if (typeof s.totalN === 'number') totalN = s.totalN;
      if (typeof s.totalK === 'number') totalK = s.totalK;
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
