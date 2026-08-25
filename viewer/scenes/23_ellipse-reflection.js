// viewer/scenes/23_ellipse-reflection.js
// MathematicsWeb v0.6.22 — 椭圆光学反射 (数学 × 物理)
// 2D Canvas 场景:从一焦点发出的光经椭圆反射后必过另一焦点
//   - 椭圆 x²/a² + y²/b² = 1,焦点 F1(-c,0), F2(c,0), c = √(a²-b²)
//   - 拖鼠标在椭圆上加反射点;从 F1 发射→反射→过 F2
//   - 数学:法线 = ∇f = (2x/a², 2y/b²);入射角 = 反射角
//
// 数学证明:
//   椭圆参数:点 P(acosθ, bsinθ),法线 P 方向 = (bcosθ/a, sinθ/b)
//   入射方向 P-F1,反射方向 P-F2;因 F1/F2 相对 P 法线对称(共轭径),角相等
//
// 应用:天文望远镜(反射式)· 椭圆聚光灯 · 回声室 · 体外冲击波碎石

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
    <div class="mathw-lesson-title">数学 × 物理 · 椭圆光学反射</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">一焦点发光 → 反射 → 必过另一焦点</div>
      <div class="mathw-lesson-formula">x²/a² + y²/b² = 1, c = √(a²-b²)</div>
      <div class="mathw-lesson-text">
        椭圆有 2 个焦点 F₁(-c,0) 和 F₂(c,0)。从 F₁ 发出一束光打到椭圆上,
        反射后<strong>必过 F₂</strong>。这是椭圆的<strong>光学反射性质</strong>。<br>
        拖鼠标在椭圆上加反射点,看黄线(入射)+ 绿线(反射)汇聚到 F₂。<br>
        应用:天文望远镜(反射式)· 椭圆聚光灯 · 回声室 · 体外冲击波碎石。
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
    <div class="mathw-controls-title">参数 · 椭圆</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">长轴 a</span>
      <input type="range" min="0.5" max="0.48" step="0.02" value="0.4" data-a />
      <span class="mathw-control-value" data-a-v>0.40</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">短轴 b</span>
      <input type="range" min="0.1" max="0.42" step="0.02" value="0.25" data-b />
      <span class="mathw-control-value" data-b-v>0.25</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">发射焦点</span>
      <select data-focus>
        <option value="F1" selected>F₁(左)</option>
        <option value="F2">F₂(右)</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <button data-reset>清反射点</button>
    </div>
    <div class="mathw-control-row" style="font-size:11px;color:var(--mathw-muted)">
      提示:点击椭圆上加反射点
    </div>
  `;
  ctrls.className = 'mathw-controls';
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let params = { a: 0.4, b: 0.25, focus: 'F1' };
  let reflectPoints = [];   // 椭圆上的反射点(归一化)

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  function draw(elapsed, dt) {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    const cx = W / 2, cy = H / 2;
    const a = params.a * Math.min(W, H);
    const b = params.b * Math.min(W, H);
    const c = Math.sqrt(Math.max(0, a * a - b * b));
    const F1 = { x: cx - c, y: cy };
    const F2 = { x: cx + c, y: cy };
    const fromFocus = params.focus === 'F1' ? F1 : F2;
    const toFocus = params.focus === 'F1' ? F2 : F1;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    // 椭圆
    ctx.strokeStyle = '#4ea1ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, a, b, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 中心轴
    ctx.strokeStyle = '#2a3140';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx - a - 30, cy);
    ctx.lineTo(cx + a + 30, cy);
    ctx.moveTo(cx, cy - b - 30);
    ctx.lineTo(cx, cy + b + 30);
    ctx.stroke();
    ctx.setLineDash([]);

    // 焦点
    [F1, F2].forEach((F, i) => {
      ctx.fillStyle = i === 0 ? '#fbbf24' : '#34d399';
      ctx.beginPath();
      ctx.arc(F.x, F.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0e1116';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#e6e8ec';
      ctx.font = '14px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(i === 0 ? 'F₁' : 'F₂', F.x, F.y - 14);
    });

    // 反射光线:fromFocus → P → toFocus
    reflectPoints.forEach(p => {
      const P = { x: cx + p.x * a, y: cy + p.y * b };  // p 是归一化椭圆坐标
      // 法线方向(向外):∇f = (2x/a², 2y/b²),归一化
      const nx = 2 * p.x / (a * a), ny = 2 * p.y / (b * b);
      const nLen = Math.hypot(nx, ny) || 1;
      const nux = nx / nLen, nuy = ny / nLen;
      // 入射方向:fromFocus → P(归一化)
      const ix = P.x - fromFocus.x, iy = P.y - fromFocus.y;
      const iLen = Math.hypot(ix, iy) || 1;
      // 反射方向 = i - 2(i·n)n
      const dot = (ix * nux + iy * nuy) / iLen;
      const rx = ix - 2 * dot * nux * iLen;
      const ry = iy - 2 * dot * nuy * iLen;
      // 入射线
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fromFocus.x, fromFocus.y);
      ctx.lineTo(P.x, P.y);
      ctx.stroke();
      // 反射线
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
      ctx.beginPath();
      ctx.moveTo(P.x, P.y);
      ctx.lineTo(P.x + rx, P.y + ry);
      ctx.stroke();
      // 法线
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.5)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(P.x, P.y);
      ctx.lineTo(P.x + nux * 40, P.y + nuy * 40);
      ctx.stroke();
      ctx.setLineDash([]);
      // P 点
      ctx.fillStyle = '#a78bfa';
      ctx.beginPath();
      ctx.arc(P.x, P.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // 信息
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`椭圆 a=${params.a.toFixed(2)} b=${params.b.toFixed(2)} · c=√(a²-b²)=${(c / Math.min(W, H)).toFixed(3)}`, 20, 24);
    ctx.fillText(`反射点: ${reflectPoints.length} · 黄=入射 · 绿=反射 · 紫虚线=法线`, 20, 44);
    ctx.fillText('黄线(从 F₁)→椭圆→绿线(必过 F₂)', 20, 64);

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // ---------- 交互 ----------
  const _aInp = ctrls.querySelector('[data-a]');
  const _aV = ctrls.querySelector('[data-a-v]');
  const _bInp = ctrls.querySelector('[data-b]');
  const _bV = ctrls.querySelector('[data-b-v]');
  const _fSel = ctrls.querySelector('[data-focus]');
  _aInp.addEventListener('input', (e) => { params.a = parseFloat(e.target.value); _aV.textContent = params.a.toFixed(2); });
  _bInp.addEventListener('input', (e) => { params.b = parseFloat(e.target.value); _bV.textContent = params.b.toFixed(2); });
  _fSel.addEventListener('change', (e) => { params.focus = e.target.value; });
  ctrls.querySelector('[data-reset]').addEventListener('click', () => { reflectPoints = []; });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const W = rect.width, H = rect.height;
    const cx = W / 2, cy = H / 2;
    const a = params.a * Math.min(W, H), b = params.b * Math.min(W, H);
    const dx = (x - cx) / a, dy = (y - cy) / b;
    // 椭圆方程 dx² + dy² = 1,允许误差 0.1
    if (Math.abs(dx * dx + dy * dy - 1) < 0.1) {
      reflectPoints.push({ x: dx, y: dy });
    }
  });

  return {
    sceneId: 'ellipse-reflection',
    getFormula() { return 'x²/a² + y²/b² = 1, 反射: r = i - 2(i·n̂)n̂'; },
    getLesson() {
      const c = lesson.querySelector('.mathw-lesson-content');
      return c ? c.textContent.replace(/\s+/g, ' ').trim() : '';
    },
    getState() { return { a: params.a, b: params.b, focus: params.focus, reflectPoints: reflectPoints.slice() }; },
    setState(s) {
      if (!s) return;
      if (typeof s.a === 'number') { params.a = s.a; _aInp.value = s.a; _aV.textContent = s.a.toFixed(2); }
      if (typeof s.b === 'number') { params.b = s.b; _bInp.value = s.b; _bV.textContent = s.b.toFixed(2); }
      if (s.focus) { params.focus = s.focus; _fSel.value = s.focus; }
      if (Array.isArray(s.reflectPoints)) reflectPoints = s.reflectPoints.slice();
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
