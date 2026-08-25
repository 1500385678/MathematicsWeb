// viewer/scenes/22_delaunay.js
// MathematicsWeb v0.6.22 — 德劳内三角剖分 (数学 × 计算几何)
// 2D Canvas 场景:把散点切成三角形,最大化最小角
//   - 散点 + 拖动 + 加点 + 三角剖分
//   - 空圆性质:每三角外接圆(虚线)不含其他散点
//   - 跟 Voronoi 21 对偶
//
// 数学:
//   最大化最小角:在所有可能的三角剖分中,Delaunay 让最瘦的三角尽量胖
//   空圆性质:D(p,q,r) ∈ Delaunay  ⟺  p,q,r 外接圆里无其他点
//   Bowyer-Watson 算法:逐点插入,移除违空圆三角,用边界 + 新点组成新三角
//
// 应用:地形建模(TIN)· 有限元网格 · 3D 重建 · 路径规划

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
    <div class="mathw-lesson-title">数学 × 计算几何 · 德劳内三角剖分</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">最胖的三角,最瘦的不会太瘦</div>
      <div class="mathw-lesson-formula">最大化最小角 + 空圆性质</div>
      <div class="mathw-lesson-text">
        给一堆散点,把平面切成三角形。<strong>Delaunay 三角剖分</strong>选最胖的剖分 —
        所有方案里<strong>最小内角</strong>最大的那个。<br>
        判定:<strong>空圆性质</strong>— 每个三角的外接圆里都不能有其他点(虚线圆可视化)。<br>
        拖动点重新剖分,点空白处加点。跟 Voronoi 21 <strong>对偶</strong>。
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
    <div class="mathw-controls-title">参数 · Delaunay</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">散点数 N</span>
      <input type="range" min="4" max="30" step="1" value="10" data-n />
      <span class="mathw-control-value" data-n-v>10</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">显示</span>
      <select data-show>
        <option value="tri" selected>三角剖分</option>
        <option value="circle">外接圆</option>
        <option value="both">三角 + 圆</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <button data-reset>重置(随机)</button>
    </div>
    <div class="mathw-control-row" style="font-size:11px;color:var(--mathw-muted)">
      拖动点移动 · 点空白处加新点
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let params = { n: 10, show: 'tri' };
  let points = [];
  let tris = [];
  let dragIdx = -1;

  function reset() {
    points = [];
    for (let i = 0; i < params.n; i++) {
      points.push({ x: 0.1 + Math.random() * 0.8, y: 0.1 + Math.random() * 0.8 });
    }
    recompute();
  }
  reset();

  function circumcircle(a, b, c) {
    const ax = b.x - a.x, ay = b.y - a.y;
    const bx = c.x - a.x, by = c.y - a.y;
    const d = 2 * (ax * by - ay * bx);
    if (Math.abs(d) < 1e-10) return null;
    const ux = (by * (ax * ax + ay * ay) - ay * (bx * bx + by * by)) / d;
    const uy = (ax * (bx * bx + by * by) - bx * (ax * ax + ay * ay)) / d;
    return { x: a.x + ux, y: a.y + uy, r: Math.sqrt(ux * ux + uy * uy) };
  }

  function inCircumcircle(p, a, b, c) {
    const cc = circumcircle(a, b, c);
    if (!cc) return false;
    const dx = p.x - cc.x, dy = p.y - cc.y;
    return (dx * dx + dy * dy) < cc.r * cc.r;
  }

  function recompute() {
    // Bowyer-Watson
    if (points.length < 2) { tris = []; return; }
    const W = 1000, H = 1000;  // 单位坐标系下也用虚拟包围三角
    const superA = { x: -10, y: -10 };
    const superB = { x: 11, y: -10 };
    const superC = { x: 0.5, y: 11 };
    const all = [...points, superA, superB, superC];
    const si = points.length;
    let triList = [[si, si + 1, si + 2]];
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const bad = [];
      for (const t of triList) {
        if (inCircumcircle(p, all[t[0]], all[t[1]], all[t[2]])) bad.push(t);
      }
      const edges = [];
      for (const t of bad) {
        for (let e = 0; e < 3; e++) {
          const a = t[e], b = t[(e + 1) % 3];
          const shared = bad.some(t2 => t2 !== t && (
            (t2[0] === a && t2[1] === b) || (t2[1] === a && t2[2] === b) ||
            (t2[2] === a && t2[0] === b) || (t2[1] === a && t2[0] === b) ||
            (t2[2] === a && t2[1] === b) || (t2[0] === a && t2[2] === b)
          ));
          if (!shared) edges.push([a, b]);
        }
      }
      triList = triList.filter(t => !bad.includes(t));
      for (const e of edges) triList.push([e[0], e[1], i]);
    }
    tris = triList
      .filter(t => t[0] < points.length && t[1] < points.length && t[2] < points.length);
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

    if (params.show === 'tri' || params.show === 'both') {
      ctx.strokeStyle = params.show === 'both' ? 'rgba(110, 231, 183, 0.4)' : 'rgba(110, 231, 183, 0.7)';
      ctx.lineWidth = 1.2;
      tris.forEach(t => {
        ctx.beginPath();
        ctx.moveTo(points[t[0]].x * W, points[t[0]].y * H);
        ctx.lineTo(points[t[1]].x * W, points[t[1]].y * H);
        ctx.lineTo(points[t[2]].x * W, points[t[2]].y * H);
        ctx.closePath();
        ctx.stroke();
      });
    }

    if (params.show === 'circle' || params.show === 'both') {
      ctx.strokeStyle = 'rgba(240, 192, 64, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      tris.forEach(t => {
        const cc = circumcircle(points[t[0]], points[t[1]], points[t[2]]);
        if (!cc) return;
        ctx.beginPath();
        ctx.arc(cc.x * W, cc.y * H, cc.r * Math.max(W, H), 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    // 散点
    points.forEach((p, i) => {
      ctx.fillStyle = i === dragIdx ? '#f0c040' : '#6ee7b7';
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, i === dragIdx ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0e1116';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 统计
    const minAngle = tris.length ? Math.min(...tris.map(t => {
      const a = points[t[0]], b = points[t[1]], c = points[t[2]];
      const A = Math.hypot(b.x - c.x, b.y - c.y);
      const B = Math.hypot(a.x - c.x, a.y - c.y);
      const C = Math.hypot(a.x - b.x, a.y - b.y);
      const angA = Math.acos(Math.max(-1, Math.min(1, (B * B + C * C - A * A) / (2 * B * C))));
      return angA;
    })) : 0;

    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Delaunay · N=${points.length} · 三角 ${tris.length}`, 20, 24);
    ctx.fillText(`最小内角 = ${(minAngle * 180 / Math.PI).toFixed(1)}° (Delaunay 最大化这个)`, 20, 44);

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // ---------- 交互 ----------
  const _nInp = ctrls.querySelector('[data-n]');
  const _nV = ctrls.querySelector('[data-n-v]');
  const _sSel = ctrls.querySelector('[data-show]');
  _nInp.addEventListener('input', (e) => {
    params.n = parseInt(e.target.value);
    _nV.textContent = params.n;
    reset();
  });
  _sSel.addEventListener('change', (e) => { params.show = e.target.value; });
  ctrls.querySelector('[data-reset]').addEventListener('click', () => reset());

  function pointAt(px, py) {
    const { w, h } = fitCanvas(canvas, host);
    return { x: px / w, y: py / h };
  }
  function pxOf(p) {
    const { w, h } = fitCanvas(canvas, host);
    return { x: p.x * w, y: p.y * h };
  }

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    // 找最近点
    let best = -1, bestD = 20 * 20;
    points.forEach((p, i) => {
      const pp = pxOf(p);
      const d = (pp.x - x) ** 2 + (pp.y - y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best >= 0) dragIdx = best;
    else { points.push(pointAt(x, y)); params.n = points.length; _nInp.value = params.n; _nV.textContent = params.n; recompute(); }
  });
  canvas.addEventListener('mousemove', (e) => {
    if (dragIdx < 0) return;
    const rect = canvas.getBoundingClientRect();
    points[dragIdx] = pointAt(e.clientX - rect.left, e.clientY - rect.top);
    recompute();
  });
  canvas.addEventListener('mouseup', () => { dragIdx = -1; });
  canvas.addEventListener('mouseleave', () => { dragIdx = -1; });

  return {
    sceneId: 'delaunay',
    getFormula() { return 'Delaunay: max(最小内角) + 空圆性质'; },
    getLesson() {
      const c = lesson.querySelector('.mathw-lesson-content');
      return c ? c.textContent.replace(/\s+/g, ' ').trim() : '';
    },
    getState() { return { n: params.n, show: params.show, points: points.slice() }; },
    setState(s) {
      if (!s) return;
      if (typeof s.n === 'number') { params.n = s.n; _nInp.value = s.n; _nV.textContent = s.n; }
      if (s.show) { params.show = s.show; _sSel.value = s.show; }
      if (Array.isArray(s.points) && s.points.length) { points = s.points.slice(); recompute(); }
      else reset();
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
