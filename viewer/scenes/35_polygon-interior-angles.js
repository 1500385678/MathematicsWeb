// viewer/scenes/35_polygon-interior-angles.js
// MathematicsWeb v0.6.38 — 多边形内角和 (数学 × 初中几何 · 7 年级)
// 2D Canvas 场景:正 N 边形(可调 N=3-12) + 自由多边形(拖顶点)
//   - 视图 1:正 N 边形 — 调 N 滑块,实时显示每个内角 + 总和 = (N-2)×180°
//   - 视图 2:三角形分解 — 内部 N-2 个三角形拼成,内角和 = (N-2)×180°
//   - 视图 3:外角 360° — 画外角箭头,验证外角和恒 360°(与边数无关)
//
// 数学(多边形内角和 Polygon Interior Angle Sum):
//   凸 N 边形内角和 = (N-2) × 180°
//   N=3 三角形:1×180=180°
//   N=4 四边形:2×180=360°
//   N=5 五边形:3×180=540°
//   N=6 六边形:4×180=720°
//   凹多边形:某内角 > 180°,但仍可按顶点遍历得同一公式(凹顶需特殊处理)
//   外角和恒 360°(凸 + 凹 + 星形,只要单连通且每顶点外角取 360-内角)
//   推论:
//     ① 等边等角正 N 边形,每个内角 = (N-2)×180/N
//     ② 多边形外角和与边数无关(拓扑不变量的 1D 投影)
//     ③ 欧拉示性数 χ = V - E + F = 2(简单多边形)
//
// 历史:
//   - Euclid《几何原本》I.32 ~300BC 证明三角形内角和 = 180°(平行线法)
//   - Proclus 410-485 推广到任意凸多边形
//   - Descartes 1637 推广到凹多边形
//
// 应用:
//   - 建筑设计:屋顶斜面/地板瓷砖铺设(等边等角 4/6 边最常见)
//   - 三角测距:多边形闭合 → 内角和校验
//   - 机器人:多边形路径规划,转弯外角和 = 360°
//   - 地理:多边形地块面积(用内角判定凹凸)

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
    <div class="mathw-lesson-title">数学 × 初中几何 · 多边形内角和</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">凸 N 边形内角和 = (N-2)×180° · 外角和恒 360°</div>
      <div class="mathw-lesson-formula">Σ(内角) = (N-2) × 180°     ·     Σ(外角) = 360°(N 无关)</div>
      <div class="mathw-lesson-text">
        <strong>多边形内角和定理</strong>:<br>
        ① <strong>凸 N 边形</strong>内角和 = <strong>(N-2) × 180°</strong>(最常用)。<br>
        ② <strong>凹多边形</strong>某内角 &gt; 180°,但遍历求和仍同公式。<br>
        <strong>外角和定理</strong>:任一简单多边形(凸/凹/星形)<strong>外角和恒 360°</strong>(与边数无关)。<br>
        <strong>正 N 边形每个内角</strong> = (N-2)×180° / N:<br>
        ① N=3 三角=60° &nbsp; ② N=4 正方=90° &nbsp; ③ N=5 五边=108° &nbsp; ④ N=6 六边=120°<br>
        <strong>历史</strong>:Euclid《几何原本》I.32 ~300BC 证明三角内角和(平行线法);Proclus 410-485 推广到任意凸多边形;Descartes 1637 推广到凹多边形。<br>
        拖动 N 滑块看内角和;切"分解"看 N-2 个三角拼成;切"外角"看总和恒 360°。<br>
        应用:屋顶斜面设计 · 瓷砖铺设 · 路径规划 · 地理多边形面积校验。
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
    <div class="mathw-controls-title">参数 · 多边形内角和</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">视图模式</span>
      <select data-mode>
        <option value="regular" selected>正 N 边形(调 N)</option>
        <option value="free">自由多边形(拖顶点)</option>
        <option value="decompose">三角形分解(N-2 块)</option>
        <option value="exterior">外角和 360°</option>
      </select>
    </div>
    <div class="mathw-control-row" data-row-n>
      <span class="mathw-control-label">边数 N</span>
      <input type="range" min="3" max="12" step="1" value="5" data-n />
      <span class="mathw-control-value" data-n-v>5</span>
    </div>
    <div class="mathw-control-row" data-row-size>
      <span class="mathw-control-label">尺寸 R</span>
      <input type="range" min="80" max="200" step="5" value="140" data-size />
      <span class="mathw-control-value" data-size-v>140</span>
    </div>
    <div class="mathw-control-row" style="font-size:11px;color:var(--mathw-muted)">
      切"自由"可拖任意顶点(3-12 边);切"分解"看内部 N-2 个三角形拼成;切"外角"看外角和恒 360°
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let params = { mode: 'regular', N: 5, R: 140 };
  // 自由多边形顶点(N 由用户拖动确定;预设 N=5 凸多边形)
  let freePoly = [];
  let freeInit = false;
  let dragIdx = -1;

  // ---------- 工具 ----------
  function makeRegularPoly(cx, cy, N, R) {
    const pts = [];
    for (let i = 0; i < N; i++) {
      // 从顶部开始(角度 -π/2),顺时针
      const a = -Math.PI / 2 + i * 2 * Math.PI / N;
      pts.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
    }
    return pts;
  }

  function initFreePoly(W, H) {
    const cx = W * 0.5, cy = H * 0.5;
    // 凸 5 边形
    freePoly = makeRegularPoly(cx, cy, 5, 130);
    freeInit = true;
  }

  function polyArea(pts) {
    let a = 0;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    }
    return Math.abs(a) / 2;
  }

  function interiorAngles(pts) {
    // 返回每个内角(度),逆时针遍历
    const n = pts.length;
    const angs = [];
    for (let i = 0; i < n; i++) {
      const prev = pts[(i - 1 + n) % n];
      const cur = pts[i];
      const next = pts[(i + 1) % n];
      const v1x = prev.x - cur.x, v1y = prev.y - cur.y;
      const v2x = next.x - cur.x, v2y = next.y - cur.y;
      const cos = (v1x * v2x + v1y * v2y) / (Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y) + 1e-9);
      // 顶点方向(用叉积判定凸/凹)
      const cross = v1x * v2y - v1y * v2x;
      let ang = Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
      // 凹角时,内角 = 360° - 计算角
      if (cross < 0) ang = 360 - ang;
      angs.push(ang);
    }
    return angs;
  }

  function exteriorAngles(pts) {
    // 外角 = 180° - 内角(凸);凹 = 内角 - 180°;总和恒 360°
    return interiorAngles(pts).map(a => 180 - a);
  }

  function isConvex(pts) {
    const n = pts.length;
    let sign = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n], c = pts[(i + 2) % n];
      const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
      if (cross !== 0) {
        const s = cross > 0 ? 1 : -1;
        if (sign === 0) sign = s;
        else if (s !== sign) return false;
      }
    }
    return true;
  }

  function centroid(pts) {
    return {
      x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
      y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
    };
  }

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  function drawPoly(pts, opts) {
    const { stroke = '#4ea1ff', fill = 'rgba(78,161,255,0.10)', lw = 2, dashed = false, vertexR = 5, labelPrefix = '', showLabels = true } = opts || {};
    ctx.lineWidth = lw;
    if (dashed) ctx.setLineDash([5, 4]); else ctx.setLineDash([]);
    ctx.strokeStyle = stroke;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    // 顶点
    for (let i = 0; i < pts.length; i++) {
      ctx.fillStyle = stroke;
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, vertexR, 0, Math.PI * 2);
      ctx.fill();
      if (showLabels) {
        ctx.fillStyle = stroke;
        ctx.font = 'bold 13px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labelPrefix + 'P' + (i + 1), pts[i].x, pts[i].y - 12);
      }
    }
  }

  function drawInteriorArcs(pts, color) {
    // 在每个顶点画内角弧
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const prev = pts[(i - 1 + n) % n];
      const cur = pts[i];
      const next = pts[(i + 1) % n];
      const a1 = Math.atan2(prev.y - cur.y, prev.x - cur.x);
      const a2 = Math.atan2(next.y - cur.y, next.x - cur.x);
      // 选短弧(凸顶点;凹顶点走长弧)
      let dA = a2 - a1;
      while (dA > Math.PI) dA -= 2 * Math.PI;
      while (dA < -Math.PI) dA += 2 * Math.PI;
      const cross = (prev.x - cur.x) * (next.y - cur.y) - (prev.y - cur.y) * (next.x - cur.x);
      const useLong = cross < 0;
      const r = 22;
      const startA = useLong ? a1 + (dA > 0 ? Math.PI * 2 : 0) : a1;
      const endA = useLong ? a2 + (dA > 0 ? Math.PI * 2 : 0) : a2;
      ctx.strokeStyle = color || 'rgba(244, 114, 182, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cur.x, cur.y, r, startA, endA);
      ctx.stroke();
      // 数值
      const angs = interiorAngles(pts);
      const midA = (startA + endA) / 2;
      const labelR = r + 14;
      ctx.fillStyle = '#f472b6';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(angs[i].toFixed(0) + '°', cur.x + labelR * Math.cos(midA), cur.y + labelR * Math.sin(midA) + 4);
    }
  }

  function drawExteriorArrows(pts) {
    // 在每个顶点画外角弧(外角 = 180° - 内角,沿前进方向外侧)
    const n = pts.length;
    const ext = exteriorAngles(pts);
    for (let i = 0; i < n; i++) {
      const cur = pts[i];
      const next = pts[(i + 1) % n];
      // 沿边方向
      const dx = next.x - cur.x, dy = next.y - cur.y;
      const edgeA = Math.atan2(dy, dx);
      // 内角弧:从 prev 到 next(短弧)
      const prev = pts[(i - 1 + n) % n];
      const a1 = Math.atan2(prev.y - cur.y, prev.x - cur.x);
      const a2 = edgeA;
      // 外角 = a2 - a1 - π(方向),取最短外角(对凸 = 内角补充,可能 < 0)
      let dExt = a2 - a1 - Math.PI;
      while (dExt > Math.PI) dExt -= 2 * Math.PI;
      while (dExt < -Math.PI) dExt += 2 * Math.PI;
      const r = 32;
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cur.x, cur.y, r, a2, a2 - dExt);
      ctx.stroke();
      // 箭头
      const aEnd = a2 - dExt;
      const ax = cur.x + r * Math.cos(aEnd);
      const ay = cur.y + r * Math.sin(aEnd);
      const ah = aEnd - Math.PI / 2;
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + 6 * Math.cos(ah - 0.3), ay + 6 * Math.sin(ah - 0.3));
      ctx.lineTo(ax + 6 * Math.cos(ah + 0.3), ay + 6 * Math.sin(ah + 0.3));
      ctx.closePath();
      ctx.fill();
      // 数值
      const labelR = r + 16;
      const labelA = a2 - dExt / 2;
      ctx.fillStyle = '#34d399';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ext[i].toFixed(0) + '°', cur.x + labelR * Math.cos(labelA), cur.y + labelR * Math.sin(labelA) + 4);
    }
  }

  // 视图 1:正 N 边形
  function viewRegular(W, H) {
    const cx = W * 0.5, cy = H * 0.5;
    const pts = makeRegularPoly(cx, cy, params.N, params.R);
    drawPoly(pts, { stroke: '#4ea1ff', fill: 'rgba(78,161,255,0.10)' });
    drawInteriorArcs(pts);

    // 数值
    const sum = (params.N - 2) * 180;
    const each = sum / params.N;
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`N = ${params.N}  边`, W / 2, 36);
    ctx.fillText(`内角和 = (${params.N}-2) × 180° = ${sum}°`, W / 2, H - 64);
    ctx.fillStyle = '#f472b6';
    ctx.fillText(`每个内角 = ${sum}°/${params.N} = ${each.toFixed(2)}°`, W / 2, H - 42);
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('调 N 滑块看内角和随边数线性增长 / 调 R 改尺寸', W / 2, H - 18);
  }

  // 视图 2:自由多边形
  function viewFree(W, H) {
    if (!freeInit || freePoly.length < 3) initFreePoly(W, H);
    drawPoly(freePoly, { stroke: '#4ea1ff', fill: 'rgba(78,161,255,0.10)' });
    drawInteriorArcs(freePoly);

    const sum = interiorAngles(freePoly).reduce((s, a) => s + a, 0);
    const expect = (freePoly.length - 2) * 180;
    const conv = isConvex(freePoly);
    const ok = Math.abs(sum - expect) < 1.5;

    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`N = ${freePoly.length}  顶点  ·  凸 = ${conv ? '是' : '否'}  ·  内角和 Σ = ${sum.toFixed(1)}°`, W / 2, 36);
    ctx.fillStyle = ok ? '#34d399' : '#f472b6';
    ctx.fillText(`理论 = (N-2) × 180° = ${expect}°  ${ok ? '✓ 一致' : '✗ 误差 ' + (sum - expect).toFixed(1) + '°'}`, W / 2, H - 60);
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('拖动任意顶点(产生凹多边形也成立)', W / 2, H - 36);
    ctx.fillText('提示:让某顶点内角 > 180° 变凹多边形,内角和仍 (N-2)×180°', W / 2, H - 18);
  }

  // 视图 3:三角形分解
  function viewDecompose(W, H) {
    const cx = W * 0.5, cy = H * 0.5;
    const pts = makeRegularPoly(cx, cy, params.N, params.R);
    drawPoly(pts, { stroke: '#4ea1ff', fill: 'rgba(78,161,255,0.06)' });
    drawInteriorArcs(pts);

    // 从 P1 拉 N-2 条对角线 → N-2 个三角
    const triangles = [];
    for (let i = 1; i < params.N - 1; i++) {
      triangles.push([pts[0], pts[i], pts[i + 1]]);
    }
    for (let k = 0; k < triangles.length; k++) {
      const t = triangles[k];
      const colors = ['rgba(244,114,182,0.18)', 'rgba(251,191,36,0.18)', 'rgba(52,211,153,0.18)', 'rgba(78,161,255,0.18)'];
      const strokeC = ['#f472b6', '#fbbf24', '#34d399', '#4ea1ff'];
      const c = colors[k % 4];
      const sc = strokeC[k % 4];
      ctx.fillStyle = c;
      ctx.strokeStyle = sc;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(t[0].x, t[0].y);
      ctx.lineTo(t[1].x, t[1].y);
      ctx.lineTo(t[2].x, t[2].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 三角数量
    const N = params.N;
    const sum = (N - 2) * 180;
    const area = polyArea(pts);
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`N = ${N} 边形  →  内部 ${N - 2} 个三角形`, W / 2, 36);
    ctx.fillText(`每个三角内角和 = 180°`, W / 2, H - 90);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`总内角和 = ${N - 2} × 180° = ${sum}°`, W / 2, H - 66);
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText(`面积 = ${area.toFixed(0)} px²  ·  对角线 = N-3 = ${N - 3} 条`, W / 2, H - 36);
    ctx.fillText('调 N 滑块看三角数量线性增长', W / 2, H - 18);
  }

  // 视图 4:外角和 360°
  function viewExterior(W, H) {
    if (!freeInit || freePoly.length < 3) initFreePoly(W, H);
    drawPoly(freePoly, { stroke: '#4ea1ff', fill: 'rgba(78,161,255,0.10)' });
    drawExteriorArrows(freePoly);

    const ext = exteriorAngles(freePoly);
    const sum = ext.reduce((s, a) => s + a, 0);

    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`N = ${freePoly.length} 顶点  ·  外角和 Σ_ext = ${sum.toFixed(1)}°`, W / 2, 36);
    ctx.fillStyle = Math.abs(sum - 360) < 1.5 ? '#34d399' : '#f472b6';
    ctx.fillText(`理论 360°  ${Math.abs(sum - 360) < 1.5 ? '✓ 恒成立' : '✗ 误差 ' + (sum - 360).toFixed(1) + '°'}`, W / 2, H - 60);
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('绿色箭头 = 外角(沿前进方向外侧,360° 转一圈)', W / 2, H - 36);
    ctx.fillText('无论凸 / 凹 / 多少边,外角和恒 = 360°(拓扑不变量)', W / 2, H - 18);
  }

  // ---------- 事件 ----------
  function bindEvents() {
    const ctrls_ = ctrls;
    ctrls_.querySelector('[data-mode]').addEventListener('change', e => {
      params.mode = e.target.value;
      // 行显隐
      ctrls_.querySelector('[data-row-n]').style.display = (params.mode === 'regular' || params.mode === 'decompose') ? '' : 'none';
      ctrls_.querySelector('[data-row-size]').style.display = (params.mode === 'regular' || params.mode === 'decompose') ? '' : 'none';
    });
    ctrls_.querySelector('[data-n]').addEventListener('input', e => {
      params.N = parseInt(e.target.value);
      ctrls_.querySelector('[data-n-v]').textContent = params.N;
    });
    ctrls_.querySelector('[data-size]').addEventListener('input', e => {
      params.R = parseInt(e.target.value);
      ctrls_.querySelector('[data-size-v]').textContent = params.R;
    });
  }
  bindEvents();

  // 拖动
  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  canvas.addEventListener('mousedown', e => {
    if (params.mode !== 'free' && params.mode !== 'exterior') return;
    const p = getMousePos(e);
    for (let i = 0; i < freePoly.length; i++) {
      if (Math.hypot(freePoly[i].x - p.x, freePoly[i].y - p.y) < 12) {
        dragIdx = i;
        break;
      }
    }
  });
  window.addEventListener('mousemove', e => {
    if (dragIdx < 0) return;
    const p = getMousePos(e);
    freePoly[dragIdx] = { x: p.x, y: p.y };
  });
  window.addEventListener('mouseup', () => { dragIdx = -1; });

  // ---------- 主循环 ----------
  const loop = makeLoop((t) => {
    fitCanvas(canvas, wrap);
    const W = canvas.width / devicePixelRatio;
    const H = canvas.height / devicePixelRatio;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 背景
    ctx.fillStyle = 'rgba(20, 24, 33, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (params.mode === 'regular') viewRegular(W, H);
    else if (params.mode === 'free') viewFree(W, H);
    else if (params.mode === 'decompose') viewDecompose(W, H);
    else if (params.mode === 'exterior') viewExterior(W, H);
  });
  loop.start();

  return {
    sceneId: 'polygon-interior-angles',
    getFormula() {
      return `凸 N 边形内角和 = (N-2)×180°\n外角和 = 360°(N 无关)\n正 N 边形每个内角 = (N-2)×180°/N`;
    },
    getLesson() {
      return '多边形内角和 = (N-2)×180°(Euclid 推广自三角 180°)。外角和恒 360°(拓扑不变量,凸凹皆成立)。正 N 边形每个内角 = (N-2)×180°/N。应用:屋顶斜面、瓷砖铺设、路径规划转角校验。';
    },
    destroy() {
      loop.stop();
      window.removeEventListener('mousemove', null);
      window.removeEventListener('mouseup', null);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      if (lesson.parentNode) lesson.parentNode.removeChild(lesson);
      if (ctrls.parentNode) ctrls.parentNode.removeChild(ctrls);
    },
  };
}
