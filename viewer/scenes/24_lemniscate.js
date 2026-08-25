// viewer/scenes/24_lemniscate.js
// MathematicsWeb v0.6.23 — 双纽线 (数学 × 计算几何)
// 2D Canvas 场景:伯努利双纽线 r² = a²·cos(2θ)
//   - 上方:8 字形曲线 + 极坐标网格(同心圆 + 径向线)
//   - 下方:r(θ) 极坐标函数图
//   - 调 a 看 8 字胖瘦,调采样数 N 看平滑度
//
// 数学:r² = a²·cos(2θ)  (Jacob Bernoulli 1694)
//   cos(2θ) ≥ 0 → θ ∈ [-π/4, π/4] ∪ [3π/4, 5π/4]
//   两条"叶子"关于原点和 x 轴对称,在原点处自身相交
//   曲线下面积 = a²
//
// 应用:
//   - 场论:电偶极子等势线(r² = a²·cos(2θ) 同形)
//   - 光学:双曲面透镜设计
//   - 复分析:典型代数曲线(2 次)
//
// 推导:cos(2θ) ≥ 0 是因为 r² 必须非负。两段 8 字分别为右叶 θ∈[-π/4,π/4] 和左叶 θ∈[3π/4,5π/4]

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
    <div class="mathw-lesson-title">数学 × 计算几何 · 双纽线</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">极坐标的 8 字形 · 伯努利 1694</div>
      <div class="mathw-lesson-formula">r² = a²·cos(2θ)</div>
      <div class="mathw-lesson-text">
        <strong>双纽线</strong>(Lemniscate) 是<strong>雅各布·伯努利</strong> 1694 年发现的一条<strong>8 字形</strong>曲线。<br>
        极坐标方程:<strong>r² = a²·cos(2θ)</strong>,要求 cos(2θ) ≥ 0 → θ ∈ [-π/4, π/4] ∪ [3π/4, 5π/4]。<br>
        两条"叶子"关于<strong>原点和 x 轴对称</strong>,在<strong>原点处自身相交</strong>。<br>
        调 a 看胖瘦,下方是 r(θ) 极坐标函数图(蓝色)。<br>
        应用:电偶极子<strong>等势线</strong>(同形)· 双曲面透镜 · 复分析代数曲线。
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
    <div class="mathw-controls-title">参数 · 双纽线</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">参数 a</span>
      <input type="range" min="0.1" max="0.45" step="0.01" value="0.35" data-a />
      <span class="mathw-control-value" data-a-v>0.35</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">采样 N</span>
      <input type="range" min="100" max="2000" step="100" value="800" data-n />
      <span class="mathw-control-value" data-n-v>800</span>
    </div>
    <div class="mathw-control-row">
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--mathw-muted)">
        <input type="checkbox" data-grid checked /> 极坐标网格
      </label>
    </div>
    <div class="mathw-control-row" style="font-size:11px;color:var(--mathw-muted)">
      提示:调 a 看 8 字胖瘦
    </div>
  `;
  ctrls.className = 'mathw-controls';
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let params = { a: 0.35, n: 800, grid: true };

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  function draw(elapsed, dt) {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    const topH = H * 0.65;
    const cx = W / 2, cy = topH / 2;
    const a = params.a * Math.min(W, topH);
    const N = params.n;

    // === 上方:8 字形 + 极坐标网格 ===
    if (params.grid) {
      ctx.strokeStyle = 'rgba(138, 147, 166, 0.18)';
      ctx.lineWidth = 1;
      const maxR = Math.min(W, topH) * 0.5;
      // 同心圆
      for (let r = 0.1; r <= 0.5; r += 0.1) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * maxR * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      // 径向线(每 30°)
      for (let ang = 0; ang < 360; ang += 30) {
        const rad = (ang * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(rad) * maxR * 1.1, cy - Math.sin(rad) * maxR * 1.1);
        ctx.stroke();
      }
    }

    // 中心轴
    ctx.strokeStyle = '#2a3140';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(W, cy);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, topH);
    ctx.stroke();
    ctx.setLineDash([]);

    // 双纽线:右叶 θ ∈ [-π/4, π/4] + 左叶 θ ∈ [3π/4, 5π/4]
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // 右叶
    let started = false;
    for (let i = 0; i <= N; i++) {
      const theta = -Math.PI / 4 + (i / N) * (Math.PI / 2);
      const r = a * Math.sqrt(Math.max(0, Math.cos(2 * theta)));
      const x = cx + r * Math.cos(theta);
      const y = cy - r * Math.sin(theta);
      if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
    }
    // 左叶
    for (let i = 0; i <= N; i++) {
      const theta = 3 * Math.PI / 4 + (i / N) * (Math.PI / 2);
      const r = a * Math.sqrt(Math.max(0, Math.cos(2 * theta)));
      const x = cx + r * Math.cos(theta);
      const y = cy - r * Math.sin(theta);
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 原点交点标记
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a93a6';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('自身相交点', cx + 8, cy - 6);

    // 顶部信息
    ctx.fillStyle = '#e6e8ec';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`r² = a²·cos(2θ)  ·  a=${params.a.toFixed(2)}  ·  N=${params.n} 采样点`, 20, 24);
    ctx.fillStyle = '#8a93a6';
    ctx.fillText('cos(2θ)≥0 → θ ∈ [-π/4, π/4] ∪ [3π/4, 5π/4]', 20, 44);
    ctx.fillText('两叶关于原点和 x 轴对称 · 在原点处自身相交 · 曲线下面积 = a²', 20, 64);

    // 分割线
    const botStart = topH;
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, botStart);
    ctx.lineTo(W, botStart);
    ctx.stroke();

    // === 下方:r(θ) 函数图 ===
    const botH = H - topH;
    const bx0 = 60, bx1 = W - 20;
    const by0 = botStart + 30, by1 = H - 20;
    const bw = bx1 - bx0, bh = by1 - by0;
    const rmax = a * 1.2;
    // 坐标轴
    ctx.strokeStyle = '#2a3140';
    ctx.beginPath();
    ctx.moveTo(bx0, by0 + bh / 2); ctx.lineTo(bx1, by0 + bh / 2);
    ctx.moveTo(bx0, by0); ctx.lineTo(bx0, by1);
    ctx.stroke();
    // θ 轴标签
    ctx.fillStyle = '#8a93a6';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    [-Math.PI, -Math.PI / 2, 0, Math.PI / 2, Math.PI].forEach((t) => {
      const x = bx0 + ((t + Math.PI) / (2 * Math.PI)) * bw;
      ctx.fillText(`${(t / Math.PI).toFixed(2)}π`, x, by0 + bh / 2 + 14);
      ctx.beginPath();
      ctx.moveTo(x, by0 + bh / 2 - 3);
      ctx.lineTo(x, by0 + bh / 2 + 3);
      ctx.strokeStyle = '#2a3140';
      ctx.stroke();
    });
    // r(θ) 曲线
    ctx.strokeStyle = '#4ea1ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 400; i++) {
      const t = -Math.PI + (i / 400) * 2 * Math.PI;
      const r = a * Math.sqrt(Math.max(0, Math.cos(2 * t)));
      const px = bx0 + (i / 400) * bw;
      const py = by0 + bh / 2 - (r / rmax) * (bh / 2);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // r(θ) 标签
    ctx.fillStyle = '#4ea1ff';
    ctx.textAlign = 'left';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillText('r(θ) 极坐标函数图', bx0 + 4, by0 + 14);
    ctx.fillStyle = '#8a93a6';
    ctx.fillText('cos(2θ)<0 区间 r=0(对应 8 字外侧空白)', bx0 + 4, by0 + bh - 6);

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // ---------- 交互 ----------
  const _aInp = ctrls.querySelector('[data-a]');
  const _aV = ctrls.querySelector('[data-a-v]');
  const _nInp = ctrls.querySelector('[data-n]');
  const _nV = ctrls.querySelector('[data-n-v]');
  const _grid = ctrls.querySelector('[data-grid]');
  _aInp.addEventListener('input', (e) => { params.a = parseFloat(e.target.value); _aV.textContent = params.a.toFixed(2); });
  _nInp.addEventListener('input', (e) => { params.n = parseInt(e.target.value); _nV.textContent = params.n; });
  _grid.addEventListener('change', (e) => { params.grid = e.target.checked; });

  return {
    sceneId: 'lemniscate',
    getFormula() { return 'r² = a²·cos(2θ)  (Bernoulli 1694)'; },
    getLesson() {
      const c = lesson.querySelector('.mathw-lesson-content');
      return c ? c.textContent.replace(/\s+/g, ' ').trim() : '';
    },
    getState() { return { a: params.a, n: params.n, grid: params.grid }; },
    setState(s) {
      if (!s) return;
      if (typeof s.a === 'number') { params.a = s.a; _aInp.value = s.a; _aV.textContent = s.a.toFixed(2); }
      if (typeof s.n === 'number') { params.n = s.n; _nInp.value = s.n; _nV.textContent = s.n; }
      if (typeof s.grid === 'boolean') { params.grid = s.grid; _grid.checked = s.grid; }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
