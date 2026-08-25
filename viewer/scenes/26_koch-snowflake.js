// viewer/scenes/26_koch-snowflake.js
// MathematicsWeb v0.6.23 — Koch 雪花 (数学 × 分形几何)
// 2D Canvas 场景:从等边三角形出发,每边三等分中段改成 2 段(凸起)
//   - N 步迭代,周长 = 3·(4/3)^N · L₀ → ∞ (无限大)
//   - 面积收敛到有限值(8√3/5 · L₀²)
//   - Hausdorff 维数 = log4/log3 ≈ 1.2619 (分数维)
//
// 数学:Helge von Koch 1904
//   起始:等边三角形 3 边,周长 3L₀
//   每步:每边 → 去中段 1/3 + 加 2 段尖角(等边三角形凸起) = 4 段
//     → 段数 × 4/3
//   N 步:3·(4/3)^N 段 → 周长 → ∞
//   面积:8√3/5 · L₀² (有上界)
//   维数:log4/log3 ≈ 1.2619(分数维,直线 1D ↔ 雪花 1.26D ↔ 平面 2D)
//
// 应用:
//   - 分形几何奠基(曼德尔布罗海岸线长度悖论)
//   - 分数维示例(从 1D 直线 → 1.26D 雪花)
//   - 数学上的"连续但处处不可微"函数
//   - 植物形态简化建模

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
    <div class="mathw-lesson-title">数学 × 分形几何 · Koch 雪花</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">周长趋无穷 · 面积有限</div>
      <div class="mathw-lesson-formula">N 步:3·(4/3)^N 段 · 维数 = log4/log3 ≈ 1.26</div>
      <div class="mathw-lesson-text">
        从<strong>等边三角形</strong>出发,每条边三等分,<strong>中间一段</strong>改成 2 段尖角(凸起等边三角形)。<br>
        每步<strong>段数 × 4/3</strong>,周长 → <strong>无穷大</strong>;但<strong>面积有上界</strong>(8√3/5 · L₀²)。<br>
        <strong>Hausdorff 维数 = log4/log3 ≈ 1.26</strong>(分数维,直线 1D ↔ 雪花 1.26D)。<br>
        调步数 N 0→5 看分形生长,橙色面积是收敛上限。<br>
        应用:<strong>海岸线长度悖论</strong>(曼德尔布罗"英国的海岸线有多长?")· 分形几何奠基 · 分数维。
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
    <div class="mathw-controls-title">参数 · Koch 雪花</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">迭代步数 N</span>
      <input type="range" min="0" max="5" step="1" value="4" data-n />
      <span class="mathw-control-value" data-n-v>4</span>
    </div>
    <div class="mathw-control-row">
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--mathw-muted)">
        <input type="checkbox" data-fill checked /> 填充面积
      </label>
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--mathw-muted)">
        <input type="checkbox" data-anim /> 动画生长
      </label>
    </div>
    <div class="mathw-control-row" style="font-size:11px;color:var(--mathw-muted)">
      提示:N 越大分形越细(N=5 已 1024 段)
    </div>
  `;
  ctrls.className = 'mathw-controls';
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let params = { n: 4, fill: true, anim: false };
  let animN = 0;   // 动画进度(连续值)

  // ---------- 数学:Koch 曲线生成 ----------
  // 起始:等边三角形 3 顶点(顶点在 +y 方向)
  function makeTriangle(cx, cy, r) {
    return [
      { x: cx, y: cy - r },
      { x: cx + r * Math.sqrt(3) / 2, y: cy + r / 2 },
      { x: cx - r * Math.sqrt(3) / 2, y: cy + r / 2 },
    ];
  }

  // 单条线段(2 顶点)→ Koch N 步
  // 核心:中段 1/3 替换成"凸起等边三角形的 2 段"(朝外旋转 60°)
  function kochSegment(p1, p2, n) {
    if (n === 0) return [p1, p2];
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    // 三等分
    const a = { x: p1.x + dx / 3, y: p1.y + dy / 3 };
    const b = { x: p1.x + 2 * dx / 3, y: p1.y + 2 * dy / 3 };
    // 凸点:c 是 (a,b) 中点 + (b-a) 旋转 60° / 2
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const vx = b.x - a.x, vy = b.y - a.y;
    // 旋转 60° (cos60=0.5, sin60=√3/2)
    const rx = 0.5 * vx - (Math.sqrt(3) / 2) * vy;
    const ry = (Math.sqrt(3) / 2) * vx + 0.5 * vy;
    const c = { x: mx + rx / 2, y: my + ry / 2 };
    return [
      ...kochSegment(p1, a, n - 1).slice(0, -1),
      ...kochSegment(a, c, n - 1).slice(0, -1),
      ...kochSegment(c, b, n - 1).slice(0, -1),
      ...kochSegment(b, p2, n - 1)
    ];
  }

  function makeKochSnowflake(cx, cy, r, n) {
    const tri = makeTriangle(cx, cy, r);
    const all = [];
    for (let i = 0; i < 3; i++) {
      const seg = kochSegment(tri[i], tri[(i + 1) % 3], n);
      // 拼接到 all(去重相邻端点)
      all.push(...(all.length === 0 ? seg : seg.slice(1)));
    }
    return all;
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

    // 动画进度
    if (params.anim) {
      animN += dt / 1500;  // 1.5s 一步
      if (animN >= params.n + 1) animN = 0;
    } else {
      animN = params.n;
    }
    const drawN = Math.min(params.n, Math.floor(animN));

    const cx = W / 2, cy = H / 2 + H * 0.05;
    const r = Math.min(W, H) * 0.42;

    const verts = makeKochSnowflake(cx, cy, r, drawN);
    const segCount = verts.length - 1;
    const theorySeg = drawN === 0 ? 3 : 3 * Math.pow(4, drawN);

    // 填充
    if (params.fill && drawN > 0) {
      ctx.fillStyle = 'rgba(240, 192, 64, 0.18)';
      ctx.beginPath();
      verts.forEach((v, i) => { if (i === 0) ctx.moveTo(v.x, v.y); else ctx.lineTo(v.x, v.y); });
      ctx.closePath();
      ctx.fill();
    }
    // 轮廓
    ctx.strokeStyle = '#f0c040';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    verts.forEach((v, i) => { if (i === 0) ctx.moveTo(v.x, v.y); else ctx.lineTo(v.x, v.y); });
    ctx.closePath();
    ctx.stroke();

    // 步数文字
    ctx.fillStyle = '#e6e8ec';
    ctx.font = '13px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Koch 雪花 · 步数 N = ${drawN} (实际 ${params.n})`, 20, 24);
    ctx.fillStyle = '#8a93a6';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillText(`段数 = ${segCount} · 理论 ${theorySeg} · 周长 ∝ (4/3)^N → 无穷大`, 20, 44);
    ctx.fillText(`Hausdorff 维数 = log4/log3 ≈ 1.2619 (分数维,1D↔2D 之间)`, 20, 64);
    ctx.fillText(`曼德尔布罗:"英国的海岸线有多长?" → 取决于测量尺度`, 20, 84);

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // ---------- 交互 ----------
  const _nInp = ctrls.querySelector('[data-n]');
  const _nV = ctrls.querySelector('[data-n-v]');
  const _fill = ctrls.querySelector('[data-fill]');
  const _anim = ctrls.querySelector('[data-anim]');
  _nInp.addEventListener('input', (e) => { params.n = parseInt(e.target.value); _nV.textContent = params.n; animN = 0; });
  _fill.addEventListener('change', (e) => { params.fill = e.target.checked; });
  _anim.addEventListener('change', (e) => { params.anim = e.target.checked; animN = 0; });

  return {
    sceneId: 'koch-snowflake',
    getFormula() { return 'N 步: 3·(4/3)^N 段,  维数 = log4/log3 ≈ 1.26  (Koch 1904)'; },
    getLesson() {
      const c = lesson.querySelector('.mathw-lesson-content');
      return c ? c.textContent.replace(/\s+/g, ' ').trim() : '';
    },
    getState() { return { n: params.n, fill: params.fill, anim: params.anim }; },
    setState(s) {
      if (!s) return;
      if (typeof s.n === 'number') { params.n = s.n; _nInp.value = s.n; _nV.textContent = s.n; }
      if (typeof s.fill === 'boolean') { params.fill = s.fill; _fill.checked = s.fill; }
      if (typeof s.anim === 'boolean') { params.anim = s.anim; _anim.checked = s.anim; }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
