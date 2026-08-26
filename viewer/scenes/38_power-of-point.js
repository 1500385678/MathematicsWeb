// viewer/scenes/38_power-of-point.js
// MathematicsWeb v0.6.40 — 圆幂定理 (数学 × 初中几何 · 8 年级)
// 2D Canvas 场景:圆 O + 圆外/圆内点 P,演示 圆幂 ρ = d² - R² 的几何意义
//   - 模式 1:外点 + 切线 + 割线 验证 PT² = PA·PB
//   - 模式 2:外点 + 双割线 验证 PA·PB = PC·PD
//   - 模式 3:内点 + 相交弦 验证 PA·PB = PC·PD
//   - 模式 4:径向扫描 沿径向滑 P,看 ρ 符号变化(外正/上零/内负)
//
// 数学(圆幂定理 Power of a Point):
//   定义:点 P 对圆 O 的幂 ρ(P) = |PO|² - R² = d² - R²
//     - 圆外 P (d > R):ρ > 0,切线长 |PT| = √ρ
//     - 圆上 P (d = R):ρ = 0
//     - 圆内 P (d < R):ρ < 0
//   定理:
//     ① 外点 · 切线² = 割线积:PT² = PA·PB (P 圆外,过 P 切线 PT + 割线 PAB)
//     ② 外点 · 双割线积相等:PA·PB = PC·PD (P 圆外,2 条割线 PAB 和 PCD)
//     ③ 内点 · 相交弦积相等:PA·PB = PC·PD (P 圆内,2 弦 AB 和 CD 交于 P)
//     ④ 通用 |PA·PB| = |ρ|  → |ρ| 为不变量
//
// 历史:
//   - Apollonius of Perga ~200BC 《圆锥曲线论》最早提出 power of a point
//   - 17 世纪 Descartes / Fermat 坐标法证明
//   - 19 世纪 Steiner 系统化命名「幂」(power)
//
// 应用:
//   - 测距:雷达/声呐/激光测距(用切线长求距离)
//   - 工程:齿轮啮合 / 凸轮设计 / 共切线
//   - 物理:引力场/电场的等势面分析
//   - 几何:三圆公共幂(根轴) + 切线长作图
//   - 反演变换(inversion)基础

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
    <div class="mathw-lesson-title">数学 × 初中几何 · 圆幂定理</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">PT² = PA·PB · 圆外 P · 切线² = 割线积</div>
      <div class="mathw-lesson-formula">ρ(P) = d² - R² &nbsp;|&nbsp; PT² = PA·PB = PC·PD = |ρ|</div>
      <div class="mathw-lesson-text">
        <strong>圆幂</strong>(Power of a Point):点 P 对圆 O 的幂定义为<strong>ρ(P) = |PO|² - R² = d² - R²</strong>。<br>
        <strong>3 大情形</strong>:<br>
        ① <strong>外点 P</strong>(d > R):ρ > 0,过 P 作切线 PT + 割线 PAB → <strong>PT² = PA·PB</strong>(王炸,Apollonius ~200BC)。<br>
        ② <strong>外点 P + 双割线</strong> PAB 和 PCD → <strong>PA·PB = PC·PD</strong>(外点等积定理)。<br>
        ③ <strong>内点 P</strong>(d < R):ρ < 0,过 P 作 2 弦 AB 和 CD → <strong>PA·PB = PC·PD</strong>(相交弦定理,Euclid III.35)。<br>
        <strong>不变量</strong>:<strong>|PA·PB| = |ρ|</strong>,跟过 P 的直线选哪条无关,只看 P 和圆的位置。<br>
        拖动 P(沿径向或圆周)/ A / B / C / D,看 PT² / PA·PB / PC·PD 实时相等。<br>
        应用:雷达测距(切线长)· 齿轮啮合 · 引力场等势面 · 反演变换基础。
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
    <div class="mathw-controls-title">参数 · 圆幂定理</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">视图模式</span>
      <select data-mode>
        <option value="tangent" selected>外点 · 切线 + 割线(王炸)</option>
        <option value="secant">外点 · 双割线等积</option>
        <option value="chord">内点 · 相交弦</option>
        <option value="scan">径向扫描 · ρ 符号变化</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">圆半径 R</span>
      <input type="range" min="80" max="180" step="5" value="120" data-r />
      <span class="mathw-control-value" data-r-v>120</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">圆心 O 偏移</span>
      <input type="range" min="0" max="60" step="5" value="0" data-ox />
      <span class="mathw-control-value" data-ox-v>0</span>
    </div>
    <div class="mathw-control-row" style="font-size:11px;color:var(--mathw-muted)">
      切线模式:拖 P(橙)/ T(青)/ A 或 B(黄);双割线:拖 P/A/B/C/D;相交弦:拖 P/弦端;扫描:拖 P 沿径向
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  // 圆心 O 位置(canvas 中心 + 横向偏移);R 半径
  // P 点位置(根据模式不同含义不同)
  // 切线模式:P 在圆外 + 切点 T(自动计算)+ 割线 AB(拖动)
  // 双割线模式:P 在圆外 + A,B 弦端 + C,D 弦端
  // 相交弦模式:P 在圆内 + A,B 弦端 + C,D 弦端
  // 扫描模式:P 沿径向滑动(自动)
  let params = { mode: 'tangent', R: 120, ox: 0 };
  // 用 (x, y) 坐标存点(相对 canvas 中心的偏移,后归一)
  let pts = {
    P:  { x: 200, y: -100 },  // 切线/割线模式:P 圆外右上
    T:  { x: 0,   y: 0 },     // 切点(切线模式,自动算)
    A:  { x: -50, y: 60 },    // 第 1 弦近端
    B:  { x: 80,  y: 90 },    // 第 1 弦远端
    C:  { x: -90, y: -40 },   // 第 2 弦近端
    D:  { x: 100, y: -70 },   // 第 2 弦远端
  };
  // 切线/相交弦模式额外用 t(切点参数 ∈ [0, 2π])/ chordRot(弦旋转角)
  let extra = { chordRot1: 0.3, chordRot2: -0.5 };

  // ---------- 几何工具 ----------
  // 圆 + 中心
  function getCircle(W, H) {
    const cx = W * 0.5 + params.ox;
    const cy = H * 0.5;
    return { cx, cy, R: Math.min(params.R, W * 0.32, H * 0.42) };
  }
  // 屏幕坐标 = canvas 中心 + 状态点
  function toScreen(p, c) {
    return { x: c.cx + p.x, y: c.cy + p.y };
  }
  // 屏幕 → 状态(反向)
  function fromScreen(s, c) {
    return { x: s.x - c.cx, y: s.y - c.cy };
  }
  // 点 P 到圆心距离
  function dist2P(P) { return P.x * P.x + P.y * P.y; }
  // 圆幂 ρ
  function power(c, P) { return dist2P(P) - c.R * c.R; }
  // 由圆外点 P 求切点 T(返回 2 个切点,选 P→P+T 向量顺时针)
  function tangentPoints(c, P) {
    const d = Math.sqrt(dist2P(P));
    if (d <= c.R) return null;
    // OP 单位向量
    const ux = P.x / d, uy = P.y / d;
    // 垂直 OP 的单位向量
    const vx = -uy, vy = ux;
    // |OT| = R,PT = sqrt(d² - R²),切点 T = O + R*u*cos(α) + R*v*sin(α),其中 cos(α) = R/d
    const cosA = c.R / d, sinA = Math.sqrt(1 - cosA * cosA);
    return {
      T1: { x: c.R * (ux * cosA + vx * sinA), y: c.R * (uy * cosA + vy * sinA) },
      T2: { x: c.R * (ux * cosA - vx * sinA), y: c.R * (uy * cosA - vy * sinA) },
    };
  }
  // 求过 P 沿方向 dir 的直线与圆交点(2 个,按距 P 由近到远)
  // 简化:直接给"方向角 θ",返回 A(近)+ B(远)
  function secantEnds(c, P, theta) {
    const dx = Math.cos(theta), dy = Math.sin(theta);
    // 联立 |O + t*dir - P|² = R²,P 在状态空间是 (P.x, P.y),圆心在 (0,0)
    // 即 (P.x + t*dx)² + (P.y + t*dy)² = R²
    // t² + 2(P.x dx + P.y dy)t + (P.x² + P.y² - R²) = 0
    const b = P.x * dx + P.y * dy;
    const disc = b * b - (dist2P(P) - c.R * c.R);
    if (disc < 0) return null;
    const sq = Math.sqrt(disc);
    const t1 = -b - sq, t2 = -b + sq;
    return {
      A: { x: P.x + t1 * dx, y: P.y + t1 * dy },
      B: { x: P.x + t2 * dx, y: P.y + t2 * dy },
      PA: Math.abs(t1), PB: Math.abs(t2),
    };
  }
  // 过内点 P 的弦:方向 θ → 2 端点(A, B)
  function chordEnds(c, P, theta) {
    return secantEnds(c, P, theta);
  }

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  function drawCircle(c, color = '#2a3140', width = 1.5) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, c.R, 0, Math.PI * 2);
    ctx.stroke();
  }
  function drawCenter(c) {
    ctx.fillStyle = '#e6e8ec';
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a93a6';
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('O', c.cx, c.cy + 22);
  }
  function drawPoint(s, color, label, labelOff = -14) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0e1116';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, s.x, s.y + labelOff);
  }
  // 段标注(线段中点 + 距离)
  function drawSegmentLabel(s1, s2, color, text, offsetY = -8) {
    const mx = (s1.x + s2.x) / 2;
    const my = (s1.y + s2.y) / 2;
    ctx.fillStyle = color;
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, mx, my + offsetY);
  }
  // 画线段
  function drawLineSeg(s1, s2, color, width = 2.5, dashed = false) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (dashed) ctx.setLineDash([6, 4]);
    else ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // 画框(框选一组点)
  function drawHudBox(x, y, w, h, lines) {
    ctx.fillStyle = 'rgba(20,24,31,0.92)';
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    let yy = y + 18;
    for (const [label, value, color] of lines) {
      ctx.fillStyle = color || '#8a96b0';
      ctx.fillText(label, x + 10, yy);
      ctx.fillStyle = '#e6e8ec';
      ctx.textAlign = 'right';
      ctx.fillText(value, x + w - 10, yy);
      ctx.textAlign = 'left';
      yy += 18;
    }
  }
  // 距离(屏幕坐标)
  function distScreen(s1, s2) {
    const dx = s1.x - s2.x, dy = s1.y - s2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  // 鼠标交互 hit 检测(屏幕坐标 → 状态坐标)
  function hitPoint(mx, my, c, candidates) {
    let best = null, bestD2 = 14 * 14;
    for (const [key, sp] of candidates) {
      const s = toScreen(sp, c);
      const d2 = (s.x - mx) ** 2 + (s.y - my) ** 2;
      if (d2 < bestD2) { bestD2 = d2; best = key; }
    }
    return best;
  }

  // ---------- 视图 1: 切线 + 割线(外点) ----------
  function viewTangent(c, W, H) {
    const Ps = toScreen(pts.P, c);
    // 用 pts.A 决定割线方向 θ(过 P 的射线),再算过 P 同一直线的 2 个圆交点 A(近)+ B(远)
    // 这样不管用户怎么拖 A,都自动保持 A/B/P 共线
    const thetaA = Math.atan2(pts.A.y - pts.P.y, pts.A.x - pts.P.x);
    const sec = secantEnds(c, pts.P, thetaA);
    const As = sec ? toScreen(sec.A, c) : toScreen(pts.A, c);
    const Bs = sec ? toScreen(sec.B, c) : toScreen(pts.B, c);
    const PA = sec ? sec.PA : distScreen(Ps, As);
    const PB = sec ? sec.PB : distScreen(Ps, Bs);
    // 实际割线积(用 secantEnds 算的精确值)
    const PApB = PA * PB;

    // 圆 + 圆心
    drawCircle(c);
    drawCenter(c);

    // 圆外 P
    drawPoint(Ps, '#fb923c', 'P', -16);

    // 切点 T(自动算 P 到圆的切线)
    const tps = tangentPoints(c, pts.P);
    if (tps) {
      // 默认显示靠近 A 边的切点(简单取 T1)
      const Ts = toScreen(tps.T1, c);
      drawPoint(Ts, '#6ee7b7', 'T', 18);
      // PT 线 + 标注
      drawLineSeg(Ps, Ts, '#6ee7b7', 2.5);
      const PT = distScreen(Ps, Ts);
      drawSegmentLabel(Ps, Ts, '#6ee7b7', 'PT=' + PT.toFixed(0));
      // PT² 单独强调
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 11px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('PT² = ' + (PT * PT).toFixed(0), c.cx + c.R + 14, c.cy - c.R * 0.5);
    }

    // 割线 PAB(画 PA + AB + PB 整条线)
    drawLineSeg(Ps, As, '#4ea1ff', 2.5, true);
    drawLineSeg(As, Bs, '#4ea1ff', 3.5);
    drawLineSeg(Ps, Bs, '#4ea1ff', 2.5, true);
    drawPoint(As, '#fbbf24', 'A', -14);
    drawPoint(Bs, '#fbbf24', 'B', 18);
    // PA / PB 标注
    drawSegmentLabel(Ps, As, '#4ea1ff', 'PA=' + PA.toFixed(0), -10);
    drawSegmentLabel(Ps, Bs, '#4ea1ff', 'PB=' + PB.toFixed(0), 18);

    // HUD 验证 PT² ≈ PA·PB
    if (tps) {
      const PT2 = (distScreen(Ps, toScreen(tps.T1, c))) ** 2;
      const diff = Math.abs(PT2 - PApB);
      const ok = diff < Math.max(1, PT2 * 0.01);
      drawHudBox(20, 20, 230, 110, [
        ['ρ(P) = d² - R²', power(c, pts.P).toFixed(0), '#fb923c'],
        ['PT² (切线²)', PT2.toFixed(0), '#6ee7b7'],
        ['PA·PB (割线积)', PApB.toFixed(0), '#4ea1ff'],
        ['|PT² - PA·PB|', diff.toFixed(1), ok ? '#6ee7b7' : '#fbbf24'],
        ['验证', ok ? '✓ 相等' : '✗ 不等', ok ? '#6ee7b7' : '#ef4444'],
      ]);
    }
  }

  // ---------- 视图 2: 双割线等积(外点) ----------
  function viewSecant(c, W, H) {
    const Ps = toScreen(pts.P, c);
    // 割线 1:方向 θ1 = atan2(A - P)
    const theta1 = Math.atan2(pts.A.y - pts.P.y, pts.A.x - pts.P.x);
    const sec1 = secantEnds(c, pts.P, theta1);
    // 割线 2:方向 θ2 = atan2(C - P)
    const theta2 = Math.atan2(pts.C.y - pts.P.y, pts.C.x - pts.P.x);
    const sec2 = secantEnds(c, pts.P, theta2);
    if (!sec1 || !sec2) return;
    const As = toScreen(sec1.A, c), Bs = toScreen(sec1.B, c);
    const Cs = toScreen(sec2.A, c), Ds = toScreen(sec2.B, c);
    const PA = sec1.PA, PB = sec1.PB, PC = sec2.PA, PD = sec2.PB;

    drawCircle(c);
    drawCenter(c);

    drawPoint(Ps, '#fb923c', 'P', -16);
    // 2 条割线
    drawLineSeg(Ps, As, '#4ea1ff', 2, true);
    drawLineSeg(As, Bs, '#4ea1ff', 3.5);
    drawLineSeg(Ps, Bs, '#4ea1ff', 2, true);
    drawLineSeg(Ps, Cs, '#f472b6', 2, true);
    drawLineSeg(Cs, Ds, '#f472b6', 3.5);
    drawLineSeg(Ps, Ds, '#f472b6', 2, true);
    // 端点
    drawPoint(As, '#fbbf24', 'A', -14);
    drawPoint(Bs, '#fbbf24', 'B', 18);
    drawPoint(Cs, '#fbbf24', 'C', -14);
    drawPoint(Ds, '#fbbf24', 'D', 18);

    // 标注 PA/PB/PC/PD
    drawSegmentLabel(Ps, As, '#4ea1ff', 'PA=' + PA.toFixed(0), -8);
    drawSegmentLabel(Ps, Bs, '#4ea1ff', 'PB=' + PB.toFixed(0), 16);
    drawSegmentLabel(Ps, Cs, '#f472b6', 'PC=' + PC.toFixed(0), -8);
    drawSegmentLabel(Ps, Ds, '#f472b6', 'PD=' + PD.toFixed(0), 16);
    const prod1 = PA * PB, prod2 = PC * PD;
    // HUD
    const diff = Math.abs(prod1 - prod2);
    const ok = diff < Math.max(1, prod1 * 0.01);
    drawHudBox(20, 20, 230, 110, [
      ['ρ(P) = d² - R²', power(c, pts.P).toFixed(0), '#fb923c'],
      ['PA·PB (割线 1)', prod1.toFixed(0), '#4ea1ff'],
      ['PC·PD (割线 2)', prod2.toFixed(0), '#f472b6'],
      ['|差|', diff.toFixed(1), ok ? '#6ee7b7' : '#fbbf24'],
      ['验证', ok ? '✓ PA·PB = PC·PD' : '✗ 不等', ok ? '#6ee7b7' : '#ef4444'],
    ]);
  }

  // ---------- 视图 3: 相交弦(内点) ----------
  function viewChord(c, W, H) {
    // P 强制在圆内(若在外则夹回)
    const d2p = dist2P(pts.P);
    if (d2p >= c.R * c.R * 0.85) {
      const d = Math.sqrt(d2p);
      pts.P.x *= (c.R * 0.8) / d;
      pts.P.y *= (c.R * 0.8) / d;
    }
    const Ps = toScreen(pts.P, c);
    // 弦 1:方向 θ1 = atan2(A - P),P 在内点会出 2 个交点
    const theta1 = Math.atan2(pts.A.y - pts.P.y, pts.A.x - pts.P.x);
    const ch1 = chordEnds(c, pts.P, theta1);
    // 弦 2
    const theta2 = Math.atan2(pts.C.y - pts.P.y, pts.C.x - pts.P.x);
    const ch2 = chordEnds(c, pts.P, theta2);
    if (!ch1 || !ch2) return;
    const As = toScreen(ch1.A, c), Bs = toScreen(ch1.B, c);
    const Cs = toScreen(ch2.A, c), Ds = toScreen(ch2.B, c);
    const PA = ch1.PA, PB = ch1.PB, PC = ch2.PA, PD = ch2.PB;

    drawCircle(c);
    drawCenter(c);

    drawPoint(Ps, '#fb923c', 'P', -16);
    // 2 条弦(实线,实穿过 P)
    drawLineSeg(As, Bs, '#4ea1ff', 2.5);
    drawLineSeg(Cs, Ds, '#f472b6', 2.5);
    // 端点
    drawPoint(As, '#fbbf24', 'A', -14);
    drawPoint(Bs, '#fbbf24', 'B', 18);
    drawPoint(Cs, '#fbbf24', 'C', -14);
    drawPoint(Ds, '#fbbf24', 'D', 18);
    // P 标记在线段交点处(强调)
    ctx.strokeStyle = '#0e1116';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(Ps.x, Ps.y, 9, 0, Math.PI * 2);
    ctx.stroke();

    // 标注 PA/PB/PC/PD
    drawSegmentLabel(Ps, As, '#4ea1ff', 'PA=' + PA.toFixed(0), -8);
    drawSegmentLabel(Ps, Bs, '#4ea1ff', 'PB=' + PB.toFixed(0), 16);
    drawSegmentLabel(Ps, Cs, '#f472b6', 'PC=' + PC.toFixed(0), -8);
    drawSegmentLabel(Ps, Ds, '#f472b6', 'PD=' + PD.toFixed(0), 16);
    const prod1 = PA * PB, prod2 = PC * PD;
    // HUD:内点 ρ < 0
    const diff = Math.abs(prod1 - prod2);
    const ok = diff < Math.max(1, prod1 * 0.01);
    drawHudBox(20, 20, 230, 110, [
      ['ρ(P) = d² - R²', power(c, pts.P).toFixed(0), '#fb923c'],
      ['|ρ| (圆幂绝对值)', Math.abs(power(c, pts.P)).toFixed(0), '#fbbf24'],
      ['PA·PB (弦 1)', prod1.toFixed(0), '#4ea1ff'],
      ['PC·PD (弦 2)', prod2.toFixed(0), '#f472b6'],
      ['验证', ok ? '✓ PA·PB = PC·PD' : '✗ 不等', ok ? '#6ee7b7' : '#ef4444'],
    ]);
  }

  // ---------- 视图 4: 径向扫描(滑 P 沿径向)----------
  // P 沿径向(0° 方向)滑动,展示 ρ 符号变化
  // P.x 范围:[-c.R * 1.4, c.R * 1.4]
  function viewScan(c, W, H) {
    // 径向轴(水平过圆心)
    const axisY = c.cy;
    drawCircle(c);
    drawCenter(c);

    // 径向参考线
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(c.cx - c.R * 1.6, axisY);
    ctx.lineTo(c.cx + c.R * 1.6, axisY);
    ctx.stroke();
    ctx.setLineDash([]);

    const Ps = { x: c.cx + pts.P.x * 1.0, y: c.cy };  // 强制 y=0 径向
    // 重新覆盖(用户可拖 y,这里强制 y=cy)
    pts.P.y = 0;
    const d2 = dist2P(pts.P);
    const d = Math.sqrt(d2);
    const rho = d * d - c.R * c.R;

    // P 点
    drawPoint(Ps, '#fb923c', 'P', -16);
    // |PO| 距离
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(c.cx, c.cy);
    ctx.lineTo(Ps.x, Ps.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3 个区域染色
    // 外点区 ρ > 0(浅橙)
    ctx.fillStyle = 'rgba(251,146,60,0.06)';
    ctx.fillRect(c.cx + c.R, c.cy - c.R * 0.7, c.R * 0.6, c.R * 1.4);
    // 圆内区 ρ < 0(浅蓝)
    ctx.fillStyle = 'rgba(78,161,255,0.06)';
    ctx.fillRect(c.cx - c.R, c.cy - c.R * 0.7, 2 * c.R, c.R * 1.4);
    // 圆外左区
    ctx.fillStyle = 'rgba(251,146,60,0.06)';
    ctx.fillRect(c.cx - c.R * 1.6, c.cy - c.R * 0.7, c.R * 0.6, c.R * 1.4);

    // 边界标(2 个切点)
    const inLeft = c.cx - c.R, inRight = c.cx + c.R;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(inLeft, c.cy - c.R * 0.7); ctx.lineTo(inLeft, c.cy + c.R * 0.7);
    ctx.moveTo(inRight, c.cy - c.R * 0.7); ctx.lineTo(inRight, c.cy + c.R * 0.7);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('圆上 ρ=0', inLeft, c.cy - c.R * 0.78);
    ctx.fillText('圆上 ρ=0', inRight, c.cy - c.R * 0.78);

    // 在 P 处画切线(若 P 在圆外,画 2 切线)
    if (d > c.R + 0.5) {
      const tps = tangentPoints(c, pts.P);
      if (tps) {
        const T1s = toScreen(tps.T1, c);
        const T2s = toScreen(tps.T2, c);
        drawLineSeg(Ps, T1s, '#6ee7b7', 2);
        drawLineSeg(Ps, T2s, '#6ee7b7', 2);
        const PT = distScreen(Ps, T1s);
        drawPoint(T1s, '#6ee7b7', 'T', 18);
        drawPoint(T2s, '#6ee7b7', 'T', 18);
        // HUD 显示 PT²
        drawHudBox(20, 20, 240, 150, [
          ['P 位置', (pts.P.x >= 0 ? '右侧' : '左侧') + ' 外点', '#fb923c'],
          ['d = |PO|', d.toFixed(0), '#fbbf24'],
          ['R', c.R.toFixed(0), '#8a96b0'],
          ['ρ = d² - R²', rho.toFixed(0), rho > 0 ? '#6ee7b7' : '#ef4444'],
          ['|ρ| = 圆幂绝对值', Math.abs(rho).toFixed(0), '#fbbf24'],
          ['切线长 PT', PT.toFixed(0), '#6ee7b7'],
          ['验证 PT² = ρ', Math.abs(PT * PT - Math.abs(rho)) < 1 ? '✓ 相等' : '✗ 不等', '#6ee7b7'],
        ]);
      }
    } else if (d < c.R - 0.5) {
      // 圆内:画 1 弦过 P
      const chordRes = chordEnds(c, pts.P, 0.7);  // 0.7 rad 方向
      if (chordRes) {
        const As = toScreen(chordRes.A, c);
        const Bs = toScreen(chordRes.B, c);
        drawLineSeg(As, Bs, '#4ea1ff', 2.5);
        drawPoint(As, '#fbbf24', 'A', -14);
        drawPoint(Bs, '#fbbf24', 'B', 18);
        const PA = distScreen(Ps, As), PB = distScreen(Ps, Bs);
        drawHudBox(20, 20, 240, 130, [
          ['P 位置', '圆内点', '#4ea1ff'],
          ['d = |PO|', d.toFixed(0), '#fbbf24'],
          ['ρ = d² - R²', rho.toFixed(0), '#ef4444'],
          ['|ρ| = 圆幂绝对值', Math.abs(rho).toFixed(0), '#fbbf24'],
          ['PA·PB (相交弦)', (PA * PB).toFixed(0), '#4ea1ff'],
          ['验证 PA·PB = |ρ|', Math.abs(PA * PB - Math.abs(rho)) < 2 ? '✓ 相等' : '✗ 不等', '#6ee7b7'],
        ]);
      }
    } else {
      // 圆上
      drawHudBox(20, 20, 240, 100, [
        ['P 位置', '圆上点', '#fbbf24'],
        ['d = |PO|', d.toFixed(0), '#fbbf24'],
        ['R', c.R.toFixed(0), '#8a96b0'],
        ['ρ = d² - R²', '0', '#fbbf24'],
        ['切线长 PT', '0 (P=T)', '#8a96b0'],
      ]);
    }
  }

  // ---------- 渲染循环(fitCanvas 内置,自动跟 host 尺寸) ----------
  const loop = makeLoop(() => {
    const { w, h } = fitCanvas(canvas, host);
    const W = w * (window.devicePixelRatio || 1);
    const H = h * (window.devicePixelRatio || 1);
    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(0, 0, W, H);

    const c = getCircle(W, H);
    // 网格
    ctx.strokeStyle = '#1a1f2a';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // 视图选择
    if (params.mode === 'tangent') viewTangent(c, W, H);
    else if (params.mode === 'secant') viewSecant(c, W, H);
    else if (params.mode === 'chord') viewChord(c, W, H);
    else viewScan(c, W, H);

    // 公式水印
    ctx.fillStyle = 'rgba(110,231,183,0.18)';
    ctx.font = 'bold 18px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    const formula = params.mode === 'scan' ? 'ρ = d² - R²' : 'PT² = PA·PB';
    ctx.fillText(formula, W - 20, H - 20);
  });

  // ---------- 交互 ----------
  let drag = null;
  function onDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const c = getCircle(canvas.width, canvas.height);
    if (params.mode === 'tangent') {
      drag = hitPoint(mx, my, c, [
        ['P', pts.P], ['A', pts.A], ['B', pts.B],
      ]);
    } else if (params.mode === 'secant') {
      drag = hitPoint(mx, my, c, [
        ['P', pts.P], ['A', pts.A], ['B', pts.B], ['C', pts.C], ['D', pts.D],
      ]);
    } else if (params.mode === 'chord') {
      drag = hitPoint(mx, my, c, [
        ['P', pts.P], ['A', pts.A], ['B', pts.B], ['C', pts.C], ['D', pts.D],
      ]);
    } else {
      // scan:只拖 P 沿径向
      const Ps = toScreen(pts.P, c);
      const d2 = (Ps.x - mx) ** 2 + (Ps.y - my) ** 2;
      if (d2 < 14 * 14) drag = 'P';
    }
  }
  function onMove(e) {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const c = getCircle(canvas.width, canvas.height);
    const newPt = fromScreen({ x: mx, y: my }, c);
    if (params.mode === 'tangent') {
      // P 强制圆外(|PO| > R)
      if (drag === 'P') {
        const d2 = dist2P(newPt);
        if (d2 < c.R * c.R * 1.2) {
          const d = Math.sqrt(d2);
          if (d < 0.1) { newPt.x = c.R * 1.5; newPt.y = 0; }
          else { newPt.x *= (c.R * 1.3) / d; newPt.y *= (c.R * 1.3) / d; }
        }
        pts.P = newPt;
      } else {
        pts[drag] = newPt;
      }
    } else if (params.mode === 'secant') {
      if (drag === 'P') {
        // P 强制圆外
        const d2 = dist2P(newPt);
        if (d2 < c.R * c.R * 1.2) {
          const d = Math.sqrt(d2);
          if (d < 0.1) { newPt.x = c.R * 1.5; newPt.y = 0; }
          else { newPt.x *= (c.R * 1.3) / d; newPt.y *= (c.R * 1.3) / d; }
        }
        pts.P = newPt;
      } else {
        pts[drag] = newPt;
      }
    } else if (params.mode === 'chord') {
      // P 在圆内|A/B/C/D| 在圆周
      if (drag === 'P') {
        const d2 = dist2P(newPt);
        if (d2 > c.R * c.R * 0.85) {
          const d = Math.sqrt(d2);
          newPt.x *= (c.R * 0.7) / d;
          newPt.y *= (c.R * 0.7) / d;
        }
        pts.P = newPt;
      } else {
        // A/B/C/D 吸附到圆周
        const d = Math.sqrt(dist2P(newPt));
        if (d > 0.1) {
          pts[drag] = { x: newPt.x * c.R / d, y: newPt.y * c.R / d };
        }
      }
    } else {
      // scan: P 沿径向
      pts.P = { x: newPt.x, y: 0 };
      // 限制范围
      if (pts.P.x < -c.R * 1.5) pts.P.x = -c.R * 1.5;
      if (pts.P.x > c.R * 1.5) pts.P.x = c.R * 1.5;
    }
  }
  function onUp() { drag = null; }
  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(e.touches[0]); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); onMove(e.touches[0]); }, { passive: false });
  canvas.addEventListener('touchend', onUp);

  // ---------- 控件绑定 ----------
  ctrls.querySelector('[data-mode]').addEventListener('change', (e) => {
    params.mode = e.target.value;
    // 模式切换时重置 P 到合适位置
    if (params.mode === 'chord') {
      pts.P = { x: 0, y: 0 };  // 圆心
    } else if (params.mode === 'scan') {
      pts.P = { x: 220, y: 0 };  // 圆外
    } else if (params.mode === 'tangent') {
      pts.P = { x: 200, y: -100 };
    } else {
      pts.P = { x: 220, y: -60 };
    }
  });
  ctrls.querySelector('[data-r]').addEventListener('input', (e) => {
    params.R = +e.target.value;
    ctrls.querySelector('[data-r-v]').textContent = params.R;
  });
  ctrls.querySelector('[data-ox]').addEventListener('input', (e) => {
    params.ox = +e.target.value;
    ctrls.querySelector('[data-ox-v]').textContent = params.ox;
  });

  // ---------- AI 接口 ----------
  return {
    sceneId: 'power-of-point',
    getFormula() {
      return 'ρ(P) = d² - R²;  PT² = PA·PB = PC·PD = |ρ|';
    },
    getLesson() {
      return `圆幂定理 (Power of a Point, Apollonius ~200BC)
定义:点 P 对圆 O 的幂 ρ(P) = |PO|² - R² = d² - R²
3 大情形:
  ① 外点 P (d > R):ρ > 0,切线² = 割线积 PT² = PA·PB(王炸)
  ② 外点 P + 双割线:PA·PB = PC·PD(外点等积)
  ③ 内点 P (d < R):ρ < 0,相交弦 PA·PB = PC·PD(Euclid III.35)
不变量:|PA·PB| = |ρ|,跟过 P 的直线选哪条无关
应用:雷达/声呐测距(切线长)· 齿轮啮合 · 引力场等势面 · 反演变换基础 · 三圆根轴
Apollonius of Perga ~200BC《圆锥曲线论》最早提出;19 世纪 Steiner 命名为 "幂"`;
    },
    destroy() {
      loop.stop();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('touchstart', (e) => { e.preventDefault(); onDown(e.touches[0]); }, { passive: false });
      canvas.removeEventListener('touchmove', (e) => { e.preventDefault(); onMove(e.touches[0]); }, { passive: false });
      canvas.removeEventListener('touchend', onUp);
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
