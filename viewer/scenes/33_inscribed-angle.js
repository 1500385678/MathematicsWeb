// viewer/scenes/33_inscribed-angle.js
// MathematicsWeb v0.6.37 — 圆周角定理 (数学 × 初中几何 · 8 年级)
// 2D Canvas 场景:圆 O + 弦 AB + 圆周上点 P(可拖动)
//   - 同弧所对圆周角 = 1/2 圆心角
//   - 4 个视图:同弧一般 / Thales 半圆(直径) / 同弧多点验证 / 圆内接四边形
//
// 数学(圆周角定理 Inscribed Angle Theorem):
//   同弧所对的圆周角 = 1/2 × 同弧所对的圆心角
//     ∠APB = (1/2) × ∠AOB      (P 在优弧 AB 上,∠AOB < π)
//     ∠APB = π - (1/2) × ∠AOB  (P 在劣弧 AB 上,∠AOB < π)
//   推论:
//     ① 同弧/等弧所对的圆周角相等
//     ② 半圆所对的圆周角 = 90° (Thales 定理, ~600BC)
//     ③ 圆内接四边形对角互补 (Cyclic Quadrilateral Opposite Angles Sum to π)
//
// 历史:
//   - Thales of Miletus ~600BC 发现半圆角定理(Thales 定理)
//   - Euclid 《几何原本》III.20 ~300BC 证明圆周角定理
//   - 20 世纪前的初等几何必学定理
//
// 应用:
//   - 测量:测距 / 高度 / 角度(经纬仪)
//   - 航海:方位角 / 三角测量
//   - 工程:桥梁拱 / 圆形屋顶应力分析
//   - 物理:向心加速度方向沿径向(垂直速度方向)
//   - 艺术:圆形构图

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
    <div class="mathw-lesson-title">数学 × 初中几何 · 圆周角定理</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">同弧圆周角 = 1/2 圆心角 · 拖 P 验证</div>
      <div class="mathw-lesson-formula">∠APB = (1/2) × ∠AOB  (P 在优弧 AB 上)</div>
      <div class="mathw-lesson-text">
        <strong>圆周角定理</strong>(Inscribed Angle Theorem):同弧所对的<strong>圆周角</strong>等于同弧所对的<strong>圆心角</strong>的 <strong>1/2</strong>。<br>
        <strong>∠APB = (1/2) × ∠AOB</strong>(P 在优弧 AB 上)。<br>
        <strong>4 大推论</strong>:<br>
        ① <strong>同弧/等弧所对的圆周角相等</strong> — 拖 P 在弧上滑动,角度不变。<br>
        ② <strong>半圆所对的圆周角 = 90°</strong>(<strong>Thales 定理</strong>, ~600BC 最早发现) — 切"半圆"模式验证。<br>
        ③ <strong>直径所对的圆周角 = 90°</strong>(Thales 定理的推论)。<br>
        ④ <strong>圆内接四边形对角互补</strong> — ∠A + ∠C = 180°,∠B + ∠D = 180°。<br>
        <strong>历史</strong>:Thales of Miletus ~600BC 发现半圆角定理,Euclid《几何原本》III.20 ~300BC 证明圆周角定理。<br>
        拖动 A / B / P(都沿圆周),看 ∠APB / ∠AOB 实时比例始终 ≈ 1/2。<br>
        应用:测量测距 · 航海方位角 · 三角测量 · 桥梁拱形应力分析。
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
    <div class="mathw-controls-title">参数 · 圆周角定理</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">视图模式</span>
      <select data-mode>
        <option value="basic" selected>同弧 · 圆周角 vs 圆心角</option>
        <option value="thales">Thales 半圆(直径)</option>
        <option value="multi">同弧多点验证</option>
        <option value="cyclic">圆内接四边形</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">圆心角 ∠AOB</span>
      <input type="range" min="20" max="180" step="5" value="80" data-central />
      <span class="mathw-control-value" data-central-v>80°</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">半径 R</span>
      <input type="range" min="100" max="220" step="5" value="160" data-r />
      <span class="mathw-control-value" data-r-v>160</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">预设</span>
      <button data-p60>60° (等边)</button>
      <button data-p90>90° (Thales)</button>
      <button data-p120>120°</button>
    </div>
    <div class="mathw-control-row" style="font-size:11px;color:var(--mathw-muted)">
      拖动 A / B / P(都沿圆周滑动,鼠标按住橙/青/黄点)
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  // 用极角表示 A/B/P 在圆周上的位置(从 +x 轴起,逆时针)
  let angles = {
    A: -40 * Math.PI / 180,  // 弦 AB 一端
    B:  40 * Math.PI / 180,  // 弦 AB 另一端(默认 ∠AOB = 80°)
    P: 110 * Math.PI / 180,  // 圆周上任意点
  };
  let params = { mode: 'basic', centralDeg: 80, R: 160 };

  // 圆心 / 半径响应式
  function getCircle(W, H) {
    return { cx: W * 0.5, cy: H * 0.5, R: Math.min(params.R, W * 0.36, H * 0.4) };
  }

  function pointAt(theta, cx, cy, R) {
    return { x: cx + R * Math.cos(theta), y: cy + R * Math.sin(theta) };
  }

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  // 画角弧(从 a1 到 a2 顺时针或逆时针,半径 r,中心 c)
  function drawAngleArc(c, a1, a2, r, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    let dA = a2 - a1;
    while (dA > Math.PI) dA -= Math.PI * 2;
    while (dA < -Math.PI) dA += Math.PI * 2;
    ctx.arc(c.x, c.y, r, a1, a2, dA < 0);
    ctx.stroke();
  }

  // 角度数字
  function drawAngleLabel(c, a1, a2, r, deg, color) {
    let dA = a2 - a1;
    while (dA > Math.PI) dA -= Math.PI * 2;
    while (dA < -Math.PI) dA += Math.PI * 2;
    const midA = a1 + dA / 2;
    const x = c.x + (r + 14) * Math.cos(midA);
    const y = c.y + (r + 14) * Math.sin(midA);
    ctx.fillStyle = color;
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(deg.toFixed(1) + '°', x, y);
  }

  // 画圆 + 弦 + 中心
  function drawCircleAndChord(c, A, B, O) {
    // 圆
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, c.R, 0, Math.PI * 2);
    ctx.stroke();

    // 弦 AB
    ctx.strokeStyle = '#4ea1ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();

    // 圆心 O
    ctx.fillStyle = '#e6e8ec';
    ctx.beginPath();
    ctx.arc(O.x, O.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a93a6';
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('O', O.x, O.y + 22);
  }

  // 画可拖动顶点(圆周上的 A / B / P)
  function drawPoint(p, color, label) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0e1116';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, p.x, p.y - 14);
  }

  // 视图 1: 同弧 · 圆周角 vs 圆心角
  function viewBasic(W, H) {
    const c = getCircle(W, H);
    const A = pointAt(angles.A, c.cx, c.cy, c.R);
    const B = pointAt(angles.B, c.cx, c.cy, c.R);
    const P = pointAt(angles.P, c.cx, c.cy, c.R);
    const O = { x: c.cx, y: c.cy };

    drawCircleAndChord(c, A, B, O);

    // 圆心角 ∠AOB 弧(在 O 处,半径 30)
    drawAngleArc(O, angles.A, angles.B, 30, '#6ee7b7', 2);
    const centralDeg = Math.abs(((angles.B - angles.A) * 180 / Math.PI)) % 360;
    const centralDegShow = centralDeg > 180 ? 360 - centralDeg : centralDeg;
    drawAngleLabel(O, angles.A, angles.B, 30, centralDegShow, '#6ee7b7');

    // PA / PB 弦
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(P.x, P.y);
    ctx.lineTo(A.x, A.y);
    ctx.moveTo(P.x, P.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();

    // 圆周角 ∠APB 弧(在 P 处,半径 25,沿 AP→PB)
    const paAng = Math.atan2(A.y - P.y, A.x - P.x);
    const pbAng = Math.atan2(B.y - P.y, B.x - P.x);
    drawAngleArc(P, paAng, pbAng, 25, '#f472b6', 2);
    let dPaPb = pbAng - paAng;
    while (dPaPb < 0) dPaPb += Math.PI * 2;
    while (dPaPb > Math.PI * 2) dPaPb -= Math.PI * 2;
    const inscribedDeg = dPaPb * 180 / Math.PI;
    const inscribedDegShow = inscribedDeg > 180 ? 360 - inscribedDeg : inscribedDeg;
    drawAngleLabel(P, paAng, pbAng, 25, inscribedDegShow, '#f472b6');

    // 顶点
    drawPoint(A, '#4ea1ff', 'A');
    drawPoint(B, '#4ea1ff', 'B');
    drawPoint(P, '#fbbf24', 'P');

    // 等式
    const ratio = inscribedDegShow / (centralDegShow || 1);
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `圆周角 ∠APB = ${inscribedDegShow.toFixed(1)}°   圆心角 ∠AOB = ${centralDegShow.toFixed(1)}°   比值 = ${ratio.toFixed(3)}  ≈ 1/2  ${Math.abs(ratio - 0.5) < 0.02 ? '✓' : ''}`,
      W / 2, H - 28
    );
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('同弧所对的圆周角 = (1/2) × 同弧所对的圆心角', W / 2, H - 10);
  }

  // 视图 2: Thales 半圆 — AB 是直径
  function viewThales(W, H) {
    const c = getCircle(W, H);
    // 半圆: A 在 -90°,B 在 +90°(让 AB 水平且过 O),P 在上半圆
    angles.A = -Math.PI / 2;
    angles.B = Math.PI / 2;
    const A = pointAt(angles.A, c.cx, c.cy, c.R);
    const B = pointAt(angles.B, c.cx, c.cy, c.R);
    const P = pointAt(angles.P, c.cx, c.cy, c.R);
    const O = { x: c.cx, y: c.cy };

    drawCircleAndChord(c, A, B, O);

    // 高亮直径
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();

    // PA / PB
    ctx.strokeStyle = '#4ea1ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(P.x, P.y);
    ctx.lineTo(A.x, A.y);
    ctx.moveTo(P.x, P.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();

    // 圆周角 ∠APB(在 P 处)
    const paAng = Math.atan2(A.y - P.y, A.x - P.x);
    const pbAng = Math.atan2(B.y - P.y, B.x - P.x);
    drawAngleArc(P, paAng, pbAng, 30, '#6ee7b7', 2.5);
    let dPaPb = pbAng - paAng;
    while (dPaPb < 0) dPaPb += Math.PI * 2;
    const inscribedDeg = dPaPb * 180 / Math.PI;
    drawAngleLabel(P, paAng, pbAng, 30, inscribedDeg, '#6ee7b7');

    // 半圆弧
    ctx.strokeStyle = 'rgba(110, 231, 183, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, c.R, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    // 顶点
    drawPoint(A, '#4ea1ff', 'A');
    drawPoint(B, '#4ea1ff', 'B');
    drawPoint(P, '#fbbf24', 'P');

    // 等式
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `∠APB = ${inscribedDeg.toFixed(1)}°  ${Math.abs(inscribedDeg - 90) < 1 ? '≈ 90°  ✓  Thales 定理' : ''}`,
      W / 2, H - 28
    );
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('直径所对的圆周角 = 90°(Thales ~600BC 最早发现)', W / 2, H - 10);
  }

  // 视图 3: 同弧多点验证
  function viewMulti(W, H) {
    const c = getCircle(W, H);
    const A = pointAt(angles.A, c.cx, c.cy, c.R);
    const B = pointAt(angles.B, c.cx, c.cy, c.R);
    const O = { x: c.cx, y: c.cy };

    drawCircleAndChord(c, A, B, O);

    // 圆心角
    drawAngleArc(O, angles.A, angles.B, 30, '#6ee7b7', 2);
    const centralDeg = Math.abs(((angles.B - angles.A) * 180 / Math.PI)) % 360;
    const centralDegShow = centralDeg > 180 ? 360 - centralDeg : centralDeg;
    drawAngleLabel(O, angles.A, angles.B, 30, centralDegShow, '#6ee7b7');

    // 在优弧上画 4 个点(均匀分布)
    // 优弧中点角 = (angles.A + angles.B) / 2 + π(取决于方向,简化为 mid + π)
    // 这里简单:在弧外均匀 4 个点
    const midAngle = (angles.A + angles.B) / 2;
    const centralSpan = ((angles.B - angles.A) + Math.PI * 2) % (Math.PI * 2);
    // 4 个点均匀分布在优弧(midAngle + π 一侧)
    const farArcStart = midAngle + Math.PI / 2;
    const farArcSpan = Math.PI;  // 半圆覆盖
    const Ps = [];
    for (let i = 0; i < 4; i++) {
      const t = farArcStart + (i / 3 - 0.5) * 1.2 * Math.PI;  // 限制在一定范围内
      const p = pointAt(t, c.cx, c.cy, c.R);
      Ps.push({ p, t });
      // 画 PA / PB
      ctx.strokeStyle = i === 0 ? '#fbbf24' : 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = i === 0 ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(A.x, A.y);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();
      // 圆周角弧
      const paAng = Math.atan2(A.y - p.y, A.x - p.x);
      const pbAng = Math.atan2(B.y - p.y, B.x - p.x);
      drawAngleArc(p, paAng, pbAng, 22, i === 0 ? '#f472b6' : 'rgba(244, 114, 182, 0.5)', i === 0 ? 2 : 1);
      // 角度
      let dPaPb = pbAng - paAng;
      while (dPaPb < 0) dPaPb += Math.PI * 2;
      const deg = dPaPb * 180 / Math.PI;
      const mid = (paAng + pbAng) / 2;
      if (dPaPb > Math.PI) {
        // 圆周角过大,显示在另一侧
        const mid2 = mid + Math.PI;
        ctx.fillStyle = i === 0 ? '#f472b6' : 'rgba(244, 114, 182, 0.7)';
        ctx.font = i === 0 ? 'bold 12px monospace' : '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(deg.toFixed(0) + '°', p.x + 32 * Math.cos(mid2), p.y + 32 * Math.sin(mid2));
      } else {
        ctx.fillStyle = i === 0 ? '#f472b6' : 'rgba(244, 114, 182, 0.7)';
        ctx.font = i === 0 ? 'bold 12px monospace' : '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(deg.toFixed(0) + '°', p.x + 32 * Math.cos(mid), p.y + 32 * Math.sin(mid));
      }
      // 画点
      ctx.fillStyle = i === 0 ? '#fbbf24' : 'rgba(251, 191, 36, 0.5)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, i === 0 ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 顶点
    drawPoint(A, '#4ea1ff', 'A');
    drawPoint(B, '#4ea1ff', 'B');

    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('4 个 P 点都在优弧 AB 上,各自的圆周角应都相等', W / 2, H - 46);
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText(`圆心角 ∠AOB = ${centralDegShow.toFixed(1)}°   1/2 圆心角 = ${(centralDegShow / 2).toFixed(1)}°`, W / 2, H - 24);
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('推论:同弧所对的圆周角都相等', W / 2, H - 8);
  }

  // 视图 4: 圆内接四边形
  function viewCyclic(W, H) {
    const c = getCircle(W, H);
    const A = pointAt(angles.A, c.cx, c.cy, c.R);
    const B = pointAt(angles.B, c.cx, c.cy, c.R);
    const P = pointAt(angles.P, c.cx, c.cy, c.R);
    // Q 是 P 的对角点(关于 O 中心对称 + 偏移)
    const Q = pointAt(angles.P + Math.PI + 0.4, c.cx, c.cy, c.R);
    const O = { x: c.cx, y: c.cy };

    drawCircleAndChord(c, A, B, O);

    // 画四边形 A B P Q
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(P.x, P.y);
    ctx.lineTo(Q.x, Q.y);
    ctx.closePath();
    ctx.stroke();

    // 对角线
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(P.x, P.y);
    ctx.moveTo(B.x, B.y);
    ctx.lineTo(Q.x, Q.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 圆周角 ∠A 和 ∠P(对角)
    const angleAt = (c, a, b) => {
      const v1x = a.x - c.x, v1y = a.y - c.y;
      const v2x = b.x - c.x, v2y = b.y - c.y;
      const cos = (v1x * v2x + v1y * v2y) / (Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y) + 1e-9);
      return Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
    };
    const angA = angleAt(A, B, Q);
    const angB = angleAt(B, A, P);
    const angP = angleAt(P, B, Q);
    const angQ = angleAt(Q, A, P);

    // 标 ∠A
    const aBAng = Math.atan2(B.y - A.y, B.x - A.x);
    const aQAng = Math.atan2(Q.y - A.y, Q.x - A.x);
    drawAngleArc(A, aBAng, aQAng, 22, '#4ea1ff', 2);
    drawAngleLabel(A, aBAng, aQAng, 22, angA, '#4ea1ff');
    // 标 ∠P(对角)
    const pBAng = Math.atan2(B.y - P.y, B.x - P.x);
    const pQAng = Math.atan2(Q.y - P.y, Q.x - P.x);
    drawAngleArc(P, pBAng, pQAng, 22, '#fbbf24', 2);
    drawAngleLabel(P, pBAng, pQAng, 22, angP, '#fbbf24');
    // 标 ∠B
    const bAAng = Math.atan2(A.y - B.y, A.x - B.x);
    const bPAng = Math.atan2(P.y - B.y, P.x - B.x);
    drawAngleArc(B, bAAng, bPAng, 18, '#8a93a6', 1.5);
    drawAngleLabel(B, bAAng, bPAng, 18, angB, '#8a93a6');
    // 标 ∠Q
    const qAAng = Math.atan2(A.y - Q.y, A.x - Q.x);
    const qPAng = Math.atan2(P.y - Q.y, P.x - Q.x);
    drawAngleArc(Q, qAAng, qPAng, 18, '#8a93a6', 1.5);
    drawAngleLabel(Q, qAAng, qPAng, 18, angQ, '#8a93a6');

    // 顶点
    drawPoint(A, '#4ea1ff', 'A');
    drawPoint(B, '#4ea1ff', 'B');
    drawPoint(P, '#fbbf24', 'P');
    drawPoint(Q, '#6ee7b7', 'Q');

    // 对角互补
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`∠A + ∠P = ${(angA + angP).toFixed(1)}°   ∠B + ∠Q = ${(angB + angQ).toFixed(1)}°`,
      W / 2, H - 46);
    ctx.fillStyle = '#6ee7b7';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText(
      `对角互补 ${Math.abs(angA + angP - 180) < 1 && Math.abs(angB + angQ - 180) < 1 ? '✓ (180°)' : '(误差 < 1°)'}`,
      W / 2, H - 28
    );
    ctx.fillStyle = '#8a93a6';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillText('推论 ④:圆内接四边形对角互补 (Cyclic Quadrilateral)', W / 2, H - 10);
  }

  function draw() {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    if (params.mode === 'basic') viewBasic(W, H);
    else if (params.mode === 'thales') viewThales(W, H);
    else if (params.mode === 'multi') viewMulti(W, H);
    else if (params.mode === 'cyclic') viewCyclic(W, H);

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // ---------- 交互 ----------
  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  // 鼠标 → 圆周角度
  function mouseToAngle(c, mouse) {
    return Math.atan2(mouse.y - c.cy, mouse.x - c.cx);
  }
  function hitTest(c, mouse) {
    const cands = [
      { name: 'A', theta: angles.A },
      { name: 'B', theta: angles.B },
      { name: 'P', theta: angles.P },
    ];
    let best = null, bestD = 14;
    for (const k of cands) {
      const p = pointAt(k.theta, c.cx, c.cy, c.R);
      const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      if (d < bestD) { bestD = d; best = k.name; }
    }
    return best;
  }
  let drag = null;
  canvas.addEventListener('mousedown', (e) => {
    if (params.mode === 'thales') return;  // Thales 模式 A/B 固定
    const mouse = getMousePos(e);
    const c = getCircle(canvas.clientWidth, canvas.clientHeight);
    const name = hitTest(c, mouse);
    if (name) drag = { name };
  });
  window.addEventListener('mousemove', (e) => {
    if (!drag) return;
    const mouse = getMousePos(e);
    const W = canvas.clientWidth, H = canvas.clientHeight;
    const c = getCircle(W, H);
    // 强制锁在圆周上:沿鼠标方向投到圆
    const dx = mouse.x - c.cx, dy = mouse.y - c.cy;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      angles[drag.name] = Math.atan2(dy, dx);
      // A 和 B 联动限制:让 |A - B| ≈ centralDeg 范围内;但放开让 user 自由调
    }
  });
  window.addEventListener('mouseup', () => { drag = null; });

  // 控件
  const modeSel = ctrls.querySelector('[data-mode]');
  modeSel.addEventListener('change', (e) => {
    params.mode = e.target.value;
    if (params.mode === 'thales') {
      // 强制 AB 直径
      angles.A = -Math.PI / 2;
      angles.B = Math.PI / 2;
      ctrls.querySelector('[data-central]').value = 180;
      params.centralDeg = 180;
      ctrls.querySelector('[data-central-v]').textContent = '180°';
    }
  });
  const centralInput = ctrls.querySelector('[data-central]');
  const centralV = ctrls.querySelector('[data-central-v]');
  centralInput.addEventListener('input', (e) => {
    params.centralDeg = parseFloat(e.target.value);
    centralV.textContent = params.centralDeg + '°';
    // 重置 A 在 -deg/2,B 在 +deg/2(让 A/B 弧中点在 +x 方向)
    if (params.mode !== 'thales') {
      const half = params.centralDeg / 2 * Math.PI / 180;
      angles.A = -half;
      angles.B = +half;
    }
  });
  const rInput = ctrls.querySelector('[data-r]');
  const rV = ctrls.querySelector('[data-r-v]');
  rInput.addEventListener('input', (e) => {
    params.R = parseFloat(e.target.value);
    rV.textContent = params.R;
  });
  ctrls.querySelector('[data-p60]').addEventListener('click', () => {
    centralInput.value = 60; params.centralDeg = 60; centralV.textContent = '60°';
    const half = 30 * Math.PI / 180;
    angles.A = -half; angles.B = +half;
  });
  ctrls.querySelector('[data-p90]').addEventListener('click', () => {
    modeSel.value = 'thales'; params.mode = 'thales';
    angles.A = -Math.PI / 2; angles.B = Math.PI / 2;
    centralInput.value = 180; params.centralDeg = 180; centralV.textContent = '180°';
  });
  ctrls.querySelector('[data-p120]').addEventListener('click', () => {
    centralInput.value = 120; params.centralDeg = 120; centralV.textContent = '120°';
    const half = 60 * Math.PI / 180;
    angles.A = -half; angles.B = +half;
  });

  return {
    sceneId: 'inscribed-angle',
    getFormula() { return '∠APB = (1/2) × ∠AOB  (Inscribed Angle Theorem, 同弧所对)'; },
    getLesson() {
      const c = lesson.querySelector('.mathw-lesson-content');
      return c ? c.textContent.replace(/\s+/g, ' ').trim() : '';
    },
    getState() { return { mode: params.mode, centralDeg: params.centralDeg, R: params.R }; },
    setState(s) {
      if (!s) return;
      if (s.mode) { params.mode = s.mode; modeSel.value = s.mode; }
      if (s.centralDeg) { params.centralDeg = s.centralDeg; centralInput.value = s.centralDeg; centralV.textContent = s.centralDeg + '°'; }
      if (s.R) { params.R = s.R; rInput.value = s.R; rV.textContent = s.R; }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
