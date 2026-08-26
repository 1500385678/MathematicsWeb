// viewer/scenes/31_triangle-congruence.js
// MathematicsWeb v0.6.36 — 三角形全等判定 (数学 × 初中几何 · 7 年级)
// 2D Canvas 场景:左右两个三角形 ABC / DEF,5 种判定法高亮对应边/角,拖动控制点验证
//   - SSS (边边边):3 条边分别相等
//   - SAS (边角边):两边 + 夹角相等
//   - ASA (角边角):两角 + 夹边相等
//   - AAS (角角边):两角 + 一对对应边相等
//   - HL  (斜边直角边):直角三角形专用
//
// 数学(全等判定定理):
//   SSS  ΔABC ≅ ΔDEF  if |AB|=|DE| ∧ |BC|=|EF| ∧ |CA|=|FD|
//   SAS  ΔABC ≅ ΔDEF  if |AB|=|DE| ∧ ∠A=∠D ∧ |AC|=|DF|     (角是夹角)
//   ASA  ΔABC ≅ ΔDEF  if ∠A=∠D ∧ |AB|=|DE| ∧ ∠B=∠E         (边是夹边)
//   AAS  ΔABC ≅ ΔDEF  if ∠A=∠D ∧ ∠B=∠E ∧ |AB|=|DE|         (非夹边)
//   HL   ΔABC ≅ ΔDEF  if ∠C=∠F=90° ∧ |AB|=|DE| ∧ |AC|=|DF|  (斜边 + 一条直角边)
//
// 应用:
//   - 工程测量:钢架结构件检验
//   - 测绘:三角网控制点坐标
//   - 物理:力的合成与分解(平行四边形法则)
//   - 航测:三角形定位(类 GPS 三角测距)

import { makeLoop, fitCanvas } from '../../kernel/02_animation.js';

// ---------- 几何工具 ----------

// 2 点距离
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

// 顶点 C 处的内角(以 A→C→B 角)
function angleAt(c, a, b) {
  const v1x = a.x - c.x, v1y = a.y - c.y;
  const v2x = b.x - c.x, v2y = b.y - c.y;
  const dot = v1x * v2x + v1y * v2y;
  const cos = dot / (Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y) + 1e-9);
  return Math.acos(Math.max(-1, Math.min(1, cos)));
}

// 全等判定检查(根据 criterion 返回 { pass, msg, highlights:{sides,angles} })
function checkCongruence(t1, t2, criterion) {
  // t1 = [A, B, C], t2 = [D, E, F];对应关系 A↔D, B↔E, C↔F
  const sides1 = [dist(t1[0], t1[1]), dist(t1[1], t1[2]), dist(t1[2], t1[0])];
  const sides2 = [dist(t2[0], t2[1]), dist(t2[1], t2[2]), dist(t2[2], t2[0])];
  const angs1 = [angleAt(t1[0], t1[1], t1[2]), angleAt(t1[1], t1[0], t1[2]), angleAt(t1[2], t1[0], t1[1])];
  const angs2 = [angleAt(t2[0], t2[1], t2[2]), angleAt(t2[1], t2[0], t2[2]), angleAt(t2[2], t2[0], t2[1])];
  const TOL_S = 6;   // 边长容差(px)
  const TOL_A = 0.05; // 角度容差(rad, ≈3°)

  // sides1 = [AB, BC, CA], sides2 = [DE, EF, FD]
  // angs1  = [∠A,  ∠B, ∠C],  angs2  = [∠D,  ∠E, ∠F]

  switch (criterion) {
    case 'SSS': {
      const sOK = sides1.every((s, i) => Math.abs(s - sides2[i]) < TOL_S);
      return { pass: sOK, msg: '3 条边分别相等', sides: [0, 1, 2], angles: [] };
    }
    case 'SAS': {
      // 边 AB, AC + 角 A
      const sAB = Math.abs(sides1[0] - sides2[0]) < TOL_S;
      const sAC = Math.abs(sides1[2] - sides2[2]) < TOL_S;
      const aA = Math.abs(angs1[0] - angs2[0]) < TOL_A;
      return { pass: sAB && sAC && aA, msg: '两边 + 夹角 (AB=DE, ∠A=∠D, AC=DF)', sides: [0, 2], angles: [0] };
    }
    case 'ASA': {
      // 角 A, 角 B + 边 AB
      const aA = Math.abs(angs1[0] - angs2[0]) < TOL_A;
      const aB = Math.abs(angs1[1] - angs2[1]) < TOL_A;
      const sAB = Math.abs(sides1[0] - sides2[0]) < TOL_S;
      return { pass: aA && aB && sAB, msg: '两角 + 夹边 (∠A=∠D, AB=DE, ∠B=∠E)', sides: [0], angles: [0, 1] };
    }
    case 'AAS': {
      // 角 A, 角 B + 边 BC
      const aA = Math.abs(angs1[0] - angs2[0]) < TOL_A;
      const aB = Math.abs(angs1[1] - angs2[1]) < TOL_A;
      const sBC = Math.abs(sides1[1] - sides2[1]) < TOL_S;
      return { pass: aA && aB && sBC, msg: '两角 + 一对应边 (∠A=∠D, ∠B=∠E, BC=EF)', sides: [1], angles: [0, 1] };
    }
    case 'HL': {
      // 直角 C/F + 斜边 AB/DE + 直角边 AC/DF
      const isRight1 = Math.abs(angs1[2] - Math.PI / 2) < TOL_A;
      const isRight2 = Math.abs(angs2[2] - Math.PI / 2) < TOL_A;
      const sHyp = Math.abs(sides1[0] - sides2[0]) < TOL_S;
      const sLeg = Math.abs(sides1[2] - sides2[2]) < TOL_S;
      const rightOK = isRight1 && isRight2;
      return {
        pass: rightOK && sHyp && sLeg,
        msg: '斜边 + 直角边 (∠C=∠F=90°, AB=DE, AC=DF)',
        sides: [0, 2], angles: [2],
        requireRight: true,
      };
    }
  }
  return { pass: false, msg: '', sides: [], angles: [] };
}

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
    <div class="mathw-lesson-title">数学 × 初中几何 · 三角形全等判定</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">5 种判定法 · 拖动右侧顶点验证</div>
      <div class="mathw-lesson-formula">SSS · SAS · ASA · AAS · HL(直角三角形专用)</div>
      <div class="mathw-lesson-text">
        <strong>三角形全等</strong>(ΔABC ≅ ΔDEF) = 经旋转/平移/翻转后能完全重合。<br>
        <strong>5 种判定法</strong>(只要满足任一,两三角形必全等):<br>
        <strong>SSS</strong>(边边边):3 条边分别相等。<br>
        <strong>SAS</strong>(边角边):<strong>两边 + 夹角</strong>相等 — 角必须是夹角。<br>
        <strong>ASA</strong>(角边角):<strong>两角 + 夹边</strong>相等 — 边必须是夹边。<br>
        <strong>AAS</strong>(角角边):两角 + 一对对应边相等 — 边不要求是夹边。<br>
        <strong>HL</strong>(斜边直角边):<strong>直角三角形专用</strong>,斜边 + 一条直角边相等。<br>
        <strong>注意</strong>:SSA(边边角,角非夹角)<strong>不</strong>保证全等(反例:钝角 / 锐角歧义)。<br>
        选判定法,拖右侧 DEF 顶点,使对应边/角匹配,看到 ✓ 即全等。<br>
        应用:工程测量 · 测绘 · 力的分解 · 航测三角定位。
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
    <div class="mathw-controls-title">参数 · 三角形全等</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">判定法</span>
      <select data-crit>
        <option value="SSS" selected>SSS (边边边)</option>
        <option value="SAS">SAS (边角边)</option>
        <option value="ASA">ASA (角边角)</option>
        <option value="AAS">AAS (角角边)</option>
        <option value="HL">HL  (斜边直角边)</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">左侧 ABC</span>
      <button data-rand1>🎲 随机</button>
      <button data-rst1>↺ 重置</button>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">右侧 DEF</span>
      <button data-rand2>🎲 随机</button>
      <button data-cp>📋 复制 ABC → DEF</button>
    </div>
    <div class="mathw-control-row" style="font-size:11px;color:var(--mathw-muted)">
      拖右侧 DEF 顶点调形状(左侧 ABC 固定 / 随机后固定)
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  // 左侧 ABC 固定(基准), 右侧 DEF 可拖动
  let tri1 = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }]; // 初始化在 resize 时设
  let tri2 = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
  let params = { crit: 'SSS' };
  // 拖动状态
  let drag = null; // { idx: 0|1|2 }   ← DEF 的 D/E/F

  function initTriangles(W, H) {
    const cxL = W * 0.25, cxR = W * 0.75, cy = H * 0.5;
    // 左侧:3-4-5 直角三角
    tri1 = [
      { x: cxL - 80, y: cy + 60 },  // A 左下
      { x: cxL + 80, y: cy + 60 },  // B 右下
      { x: cxL - 80, y: cy - 60 },  // C 左上  ∠A=90°
    ];
    // 右侧:稍错开(不重合)
    tri2 = [
      { x: cxR - 90, y: cy + 50 },
      { x: cxR + 70, y: cy + 50 },
      { x: cxR - 90, y: cy - 70 },
    ];
  }

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  // 画单个三角形
  function drawTri(t, labels, sideColor, angColor, highlightSides, highlightAngs, requireRight) {
    ctx.lineWidth = 2;
    // 边:先画非高亮(暗),再画高亮(亮)
    for (let i = 0; i < 3; i++) {
      const a = t[i], b = t[(i + 1) % 3];
      ctx.strokeStyle = highlightSides && highlightSides.has(i) ? sideColor : '#2a3140';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    // 顶点
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#e6e8ec';
      ctx.beginPath();
      ctx.arc(t[i].x, t[i].y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e6e8ec';
      ctx.font = 'bold 13px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], t[i].x, t[i].y - 12);
    }
    // 边长标签
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i < 3; i++) {
      const a = t[i], b = t[(i + 1) % 3];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const d = dist(a, b);
      const color = highlightSides && highlightSides.has(i) ? sideColor : '#8a93a6';
      ctx.fillStyle = color;
      // 偏移避免压线
      const nx = -(b.y - a.y) / (d + 1e-6) * 12;
      const ny = (b.x - a.x) / (d + 1e-6) * 12;
      ctx.fillText(d.toFixed(0), mx + nx, my + ny);
    }
    // 角度弧(在角顶点处画弧 + 数字)
    ctx.font = '10px -apple-system, sans-serif';
    for (let i = 0; i < 3; i++) {
      const a = t[(i + 2) % 3], c = t[i], b = t[(i + 1) % 3];
      const a1 = Math.atan2(a.y - c.y, a.x - c.x);
      const a2 = Math.atan2(b.y - c.y, b.x - c.x);
      let dA = a2 - a1;
      while (dA < 0) dA += Math.PI * 2;
      const ang = dA;
      const r = 18;
      ctx.strokeStyle = highlightAngs && highlightAngs.has(i) ? angColor : 'rgba(138,147,166,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, a1, a2);
      ctx.stroke();
      ctx.fillStyle = highlightAngs && highlightAngs.has(i) ? angColor : '#8a93a6';
      const midA = a1 + ang / 2;
      ctx.fillText((ang * 180 / Math.PI).toFixed(0) + '°', c.x + (r + 8) * Math.cos(midA), c.y + (r + 8) * Math.sin(midA));
      // HL 判定时,∠C=90° 用红色方块标记
      if (requireRight && Math.abs(ang - Math.PI / 2) < 0.05) {
        ctx.strokeStyle = angColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(c.x + 8, c.y - 8, 8, 8);
      }
    }
  }

  // 标题
  function drawLabel(W, H, info) {
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(info.pass ? '✓ 全等 ΔABC ≅ ΔDEF' : `✗ ${info.msg}`, W / 2, 28);
    ctx.fillStyle = '#8a93a6';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillText(`当前判定法: ${params.crit}  ·  ${info.pass ? '满足条件' : '调整 DEF 使对应边/角匹配'}`, W / 2, 46);
  }

  function draw() {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    if (tri1[0].x === 0 && tri1[0].y === 0) initTriangles(W, H);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    // 中线分割
    ctx.strokeStyle = '#1c2230';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 60);
    ctx.lineTo(W / 2, H - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // 区域标签
    ctx.fillStyle = '#8a93a6';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ABC · 基准三角形(固定)', W / 4, H - 8);
    ctx.fillText('DEF · 拖动顶点调形状', (3 * W) / 4, H - 8);

    // 全等检查
    const info = checkCongruence(tri1, tri2, params.crit);
    const hSide = info.pass || info.sides.length > 0 ? new Set(info.sides) : null;
    const hAng = info.pass || info.angles.length > 0 ? new Set(info.angles) : null;

    // 左侧 ABC
    drawTri(tri1, ['A', 'B', 'C'], '#6ee7b7', '#4ea1ff', hSide, hAng, info.requireRight);
    // 右侧 DEF
    drawTri(tri2, ['D', 'E', 'F'], '#fbbf24', '#f472b6', hSide, hAng, info.requireRight);

    drawLabel(W, H, info);

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // ---------- 交互 ----------
  // 拖动 DEF 顶点
  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function hitTest(p) {
    for (let i = 0; i < 3; i++) {
      if (Math.hypot(tri2[i].x - p.x, tri2[i].y - p.y) < 14) return i;
    }
    return -1;
  }
  canvas.addEventListener('mousedown', (e) => {
    const p = getMousePos(e);
    const idx = hitTest(p);
    if (idx >= 0) drag = { idx };
  });
  window.addEventListener('mousemove', (e) => {
    if (!drag) return;
    const p = getMousePos(e);
    tri2[drag.idx] = p;
  });
  window.addEventListener('mouseup', () => { drag = null; });

  const critSel = ctrls.querySelector('[data-crit]');
  critSel.addEventListener('change', (e) => { params.crit = e.target.value; });

  function randomTri(target) {
    const { w, h } = { w: canvas.clientWidth, h: canvas.clientHeight };
    // 随机三角形(保证不共线,合理大小)
    const cx = target === tri1 ? w * 0.25 : w * 0.75;
    const cy = h * 0.5;
    const r = () => 0.3 + Math.random() * 0.7;
    target[0] = { x: cx + (Math.random() - 0.5) * 200, y: cy + (Math.random() - 0.5) * 150 };
    target[1] = { x: cx + (Math.random() - 0.5) * 200, y: cy + (Math.random() - 0.5) * 150 };
    target[2] = { x: cx + (Math.random() - 0.5) * 200, y: cy + (Math.random() - 0.5) * 150 };
  }
  function resetTri1() {
    const { w, h } = { w: canvas.clientWidth, h: canvas.clientHeight };
    initTriangles(w, h);
  }
  function copyT1toT2() {
    const dx = (canvas.clientWidth / 2);
    const dy = 0;
    tri2 = [
      { x: tri1[0].x + dx, y: tri1[0].y + dy },
      { x: tri1[1].x + dx, y: tri1[1].y + dy },
      { x: tri1[2].x + dx, y: tri1[2].y + dy },
    ];
  }

  ctrls.querySelector('[data-rand1]').addEventListener('click', () => randomTri(tri1));
  ctrls.querySelector('[data-rand2]').addEventListener('click', () => randomTri(tri2));
  ctrls.querySelector('[data-rst1]').addEventListener('click', () => resetTri1());
  ctrls.querySelector('[data-cp]').addEventListener('click', () => copyT1toT2());

  return {
    sceneId: 'triangle-congruence',
    getFormula() { return 'ΔABC ≅ ΔDEF via SSS / SAS / ASA / AAS / HL'; },
    getLesson() {
      const c = lesson.querySelector('.mathw-lesson-content');
      return c ? c.textContent.replace(/\s+/g, ' ').trim() : '';
    },
    getState() { return { crit: params.crit }; },
    setState(s) {
      if (!s) return;
      if (s.crit) { params.crit = s.crit; critSel.value = s.crit; }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
