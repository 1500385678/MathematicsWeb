// viewer/scenes/21_voronoi.js
// MathematicsWeb v0.6.22 — 沃罗诺伊图 (数学 × 计算几何)
// 2D Canvas 场景:把画布按"最近种子"切成 N 个区域
//   - 上方:沃罗诺伊图(Voronoi diagram),每个像素归最近的种子
//   - 下方:同 N 个种子的德劳内(Delaunay)对偶三角剖分
//   - 拖鼠标加新种子 / 重置按钮
//
// 数学:
//   沃罗诺伊单元 V(pᵢ) = {x : ∀j, dist(x, pᵢ) ≤ dist(x, pⱼ)}
//   Delaunay 是 Voronoi 对偶:种子 pᵢ 和 pⱼ 的 Voronoi 单元相邻
//     ⟺ (pᵢ, pⱼ) 是 Delaunay 边
//   空圆性质:任何 Delaunay 三角的外接圆不含其他种子
//
// 算法:暴力逐像素(教学用,N 小 OK;大 N 走 Fortune 算法 / Bowyer-Watson)
//
// 应用:最近邻查询 · 地图分区(医院覆盖区)· 晶体学 · 3D 建模(沃罗诺oi 碎裂)

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
    <div class="mathw-lesson-title">数学 × 计算几何 · 沃罗诺伊图</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">每个点找最近的种子</div>
      <div class="mathw-lesson-formula">V(pᵢ) = {x : ∀j, d(x,pᵢ) ≤ d(x,pⱼ)}</div>
      <div class="mathw-lesson-text">
        给平面上 N 个<strong>种子点</strong>,把每个像素归到离它最近的种子 → 沃罗诺伊图。<br>
        下面是同 N 个种子的<strong>德劳内三角剖分</strong>(沃罗诺伊对偶):<br>
        两颗种子在沃罗诺伊里相邻 ↔ 它们之间有一条 Delaunay 边。<br>
        应用:最近邻查询 · 医院覆盖区 · 晶体学 · 3D 建模。
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
    <div class="mathw-controls-title">参数 · 沃罗诺伊</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">种子数 N</span>
      <input type="range" min="3" max="40" step="1" value="12" data-n />
      <span class="mathw-control-value" data-n-v>12</span>
    </div>
    <div class="mathw-control-row">
      <button data-reset>重置(随机)</button>
    </div>
    <div class="mathw-control-row" style="font-size:11px;color:var(--mathw-muted)">
      提示:画布里点鼠标加种子
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let params = { n: 12 };
  let seeds = [];            // {x, y} 归一化 0-1
  const COLORS = ['#6ee7b7', '#4ea1ff', '#f0c040', '#ff6b6b', '#a78bfa', '#fb7185', '#34d399', '#fbbf24', '#60a5fa', '#f472b6',
                  '#22d3ee', '#fb923c', '#84cc16', '#e879f9', '#10b981', '#3b82f6', '#facc15', '#ef4444', '#8b5cf6', '#ec4899'];
  let dirty = true;          // 重新计算 voronoi 像素
  let voronoiImg = null;     // OffscreenCanvas cache

  function reset() {
    seeds = [];
    for (let i = 0; i < params.n; i++) {
      seeds.push({ x: 0.1 + Math.random() * 0.8, y: 0.1 + Math.random() * 0.8 });
    }
    dirty = true;
  }
  reset();

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  function buildVoronoi(W, H) {
    // 逐像素暴力,适合教学(N < 40 还可以)
    // 降采样到 1/4 精度加速
    const SCALE = 3;
    const w = Math.floor(W / SCALE);
    const h = Math.floor(H / SCALE);
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const oc = off.getContext('2d');
    const img = oc.createImageData(w, h);
    const data = img.data;
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const x = (px + 0.5) / w;
        const y = (py + 0.5) / h;
        // 找最近种子
        let best = 0, bestD = Infinity;
        for (let i = 0; i < seeds.length; i++) {
          const dx = x - seeds[i].x, dy = y - seeds[i].y;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = i; }
        }
        const col = hexToRgb(COLORS[best % COLORS.length]);
        const idx = (py * w + px) * 4;
        data[idx] = col[0]; data[idx + 1] = col[1]; data[idx + 2] = col[2]; data[idx + 3] = 90;
      }
    }
    oc.putImageData(img, 0, 0);
    return off;
  }

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  // Delaunay 三角剖分:用 Bowyer-Watson(空圆增量法)
  function buildDelaunay(W, H) {
    // 把种子转世界坐标
    const pts = seeds.map(s => ({ x: s.x * W, y: s.y * H }));
    if (pts.length < 2) return [];
    // 包围大三角(3 个虚拟点,远超边界)
    const superA = { x: -W, y: -H };
    const superB = { x: W * 2, y: -H };
    const superC = { x: W / 2, y: H * 2 };
    const superIdx = pts.length;
    const all = [...pts, superA, superB, superC];
    let tris = [[superIdx, superIdx + 1, superIdx + 2]];

    function inCircumcircle(p, a, b, c) {
      const ax = a.x - p.x, ay = a.y - p.y;
      const bx = b.x - p.x, by = b.y - p.y;
      const cx = c.x - p.x, cy = c.y - p.y;
      const d = ax * (by * (cx * cx + cy * cy) - cy * (bx * bx + by * by))
              - ay * (bx * (cx * cx + cy * cy) - cx * (bx * bx + by * by))
              + (ax * ax + ay * ay) * (bx * cy - by * cx);
      return d > 0;
    }
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const badTris = [];
      for (const t of tris) {
        if (inCircumcircle(p, all[t[0]], all[t[1]], all[t[2]])) badTris.push(t);
      }
      // 找边界
      const edges = [];
      for (const t of badTris) {
        for (let e = 0; e < 3; e++) {
          const a = t[e], b = t[(e + 1) % 3];
          // 共享 = badTri 中另一三角也有这条边
          const shared = badTris.some(t2 => t2 !== t && (
            (t2[0] === a && t2[1] === b) || (t2[1] === a && t2[2] === b) ||
            (t2[2] === a && t2[0] === b) || (t2[1] === a && t2[0] === b) ||
            (t2[2] === a && t2[1] === b) || (t2[0] === a && t2[2] === b)
          ));
          if (!shared) edges.push([a, b]);
        }
      }
      tris = tris.filter(t => !badTris.includes(t));
      for (const e of edges) tris.push([e[0], e[1], pts.length + 0]);  // 用 pts.length 占位
    }
    // 移除包含 super* 三角,只保留真实点组成的
    return tris
      .filter(t => t[0] < pts.length && t[1] < pts.length && t[2] < pts.length)
      .map(t => t.slice(0, 3));
  }

  function draw(elapsed, dt) {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    const halfH = H / 2;

    if (dirty) {
      voronoiImg = buildVoronoi(W, halfH);
      dirty = false;
    }

    // 上方:Voronoi
    if (voronoiImg) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(voronoiImg, 0, 0, W, halfH);
    }
    // 画种子
    seeds.forEach((s, i) => {
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * halfH, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0e1116';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Voronoi · N=${seeds.length} (每像素找最近种子)`, 20, 24);

    // 分割线
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, halfH);
    ctx.lineTo(W, halfH);
    ctx.stroke();

    // 下方:Delaunay
    const tris = buildDelaunay(W, H);
    ctx.strokeStyle = 'rgba(110, 231, 183, 0.4)';
    ctx.lineWidth = 1;
    tris.forEach(t => {
      ctx.beginPath();
      ctx.moveTo(seeds[t[0]].x * W, halfH + seeds[t[0]].y * halfH);
      ctx.lineTo(seeds[t[1]].x * W, halfH + seeds[t[1]].y * halfH);
      ctx.lineTo(seeds[t[2]].x * W, halfH + seeds[t[2]].y * halfH);
      ctx.closePath();
      ctx.stroke();
    });
    seeds.forEach((s, i) => {
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.beginPath();
      ctx.arc(s.x * W, halfH + s.y * halfH, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#8a93a6';
    ctx.fillText(`Delaunay 对偶 · 三角数 = ${tris.length} (空圆性质:外接圆不含其他种子)`, 20, halfH + 24);

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // ---------- 交互 ----------
  const _nInp = ctrls.querySelector('[data-n]');
  const _nV = ctrls.querySelector('[data-n-v]');
  _nInp.addEventListener('input', (e) => {
    params.n = parseInt(e.target.value);
    _nV.textContent = params.n;
    reset();
  });
  ctrls.querySelector('[data-reset]').addEventListener('click', () => reset());

  // 点击画布加种子
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    seeds.push({ x, y });
    params.n = seeds.length;
    _nInp.value = params.n;
    _nV.textContent = params.n;
    dirty = true;
  });

  return {
    sceneId: 'voronoi',
    getFormula() { return 'V(pᵢ) = {x : ∀j, d(x,pᵢ) ≤ d(x,pⱼ)}'; },
    getLesson() {
      const c = lesson.querySelector('.mathw-lesson-content');
      return c ? c.textContent.replace(/\s+/g, ' ').trim() : '';
    },
    getState() { return { n: params.n, seeds: seeds.slice() }; },
    setState(s) {
      if (!s) return;
      if (typeof s.n === 'number') { params.n = s.n; _nInp.value = s.n; _nV.textContent = s.n; }
      if (Array.isArray(s.seeds) && s.seeds.length) { seeds = s.seeds.slice(); dirty = true; }
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
