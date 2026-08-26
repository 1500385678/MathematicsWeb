// viewer/scenes/36_quadrilateral-family.js
// MathematicsWeb v0.6.38 — 四边形家族 (数学 × 初中几何 · 7 年级)
// 2D Canvas 场景:8 种四边形分类 + 韦恩图
//   - 视图 1:韦恩图 — 集合嵌套 平行四边形族(平行/矩形/菱形/正方形) + 梯形族(梯形/等腰/直角)
//   - 视图 2:变形演示 — 选一种基准四边形,拖动顶点,实时检测命中的所有家族
//   - 视图 3:8 形状对比画廊(2x4 网格,各画一种 + 关键性质)
//
// 数学(四边形家族 Quadrilateral Family):
//   8 种四边形 + 集合嵌套:
//     一般四边形(general)
//       梯形(trapezoid, 一组对边平行)
//         等腰梯形(isosceles, 两腰等)
//         直角梯形(right, 一腰⊥底)
//       平行四边形(parallelogram, 对边平行)
//         矩形(rectangle, 4 角 90°)
//           正方形(square, 矩形 ∩ 菱形)
//         菱形(rhombus, 4 边等)
//           正方形(square, 矩形 ∩ 菱形)
//   关键判定:
//     ① 平行四边形:AB∥CD ∧ AD∥BC(对边平行)
//     ② 矩形:平行四边形 + 4 角 90°
//     ③ 菱形:平行四边形 + 4 边等
//     ④ 正方形:矩形 ∧ 菱形(4 角 90° + 4 边等)
//     ⑤ 梯形:AB∥CD ∨ AD∥BC(只一组对边平行)
//     ⑥ 等腰梯形:梯形 + |AD|=|BC|(两腰等)
//     ⑦ 直角梯形:梯形 + ∠A=∠B=90° 或 ∠C=∠D=90°
//
// 历史:
//   - Euclid《几何原本》I.34 ~300BC 证明平行四边形对边等
//   - Proclus 410-485 引入"矩形""菱形""正方形"名字(从希腊文 rhombos/orthogōnion)
//   - 现代韦恩图分类源自 John Venn 1880(集合论语言)
//
// 应用:
//   - 建筑设计:窗/门/地板瓷砖(矩形/正方形最常见)
//   - 包装:纸盒(矩形+菱形结构)
//   - 装饰:菱形/正方形瓷砖拼花(伊斯兰图案)
//   - 工程:钢架(平行四边形稳定/梯形桥墩)

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
    <div class="mathw-lesson-title">数学 × 初中几何 · 四边形家族</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">8 种四边形 + 平行四边形族(平行/矩/菱/方) + 梯形族(梯/等腰/直角)</div>
      <div class="mathw-lesson-formula">平行四边形 ⊃ {矩形, 菱形}  ·  矩形 ∩ 菱形 = 正方形  ·  梯形 ⊃ {等腰梯, 直角梯}</div>
      <div class="mathw-lesson-text">
        <strong>四边形家族</strong>(集合论嵌套):<br>
        ① <strong>一般四边形</strong>(General):4 边不要求任何特殊关系。<br>
        ② <strong>梯形</strong>(Trapezoid):<strong>一组对边平行</strong>。<br>
        &nbsp;&nbsp;· <strong>等腰梯形</strong>(Isosceles):梯形 + <strong>两腰等</strong>。<br>
        &nbsp;&nbsp;· <strong>直角梯形</strong>(Right):梯形 + <strong>一腰⊥底</strong>。<br>
        ③ <strong>平行四边形</strong>(Parallelogram):<strong>两组对边都平行</strong>。<br>
        &nbsp;&nbsp;· <strong>矩形</strong>(Rectangle):平行四边形 + <strong>4 角 90°</strong>。<br>
        &nbsp;&nbsp;· <strong>菱形</strong>(Rhombus):平行四边形 + <strong>4 边等</strong>。<br>
        &nbsp;&nbsp;· <strong>正方形</strong>(Square):<strong>矩形 ∩ 菱形</strong>(4 角 90° + 4 边等)。<br>
        <strong>历史</strong>:Euclid《几何原本》I.34 ~300BC 证明平行四边形对边等;Proclus 410-485 命名矩形/菱形/正方形;Venn 1880 集合论语言现代化分类。<br>
        切"变形"选基准,拖动顶点实时判别;切"对比"看 8 形状画廊。<br>
        应用:建筑门窗 · 包装纸盒 · 瓷砖拼花 · 钢架结构(平行四边形稳定)。
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
    <div class="mathw-controls-title">参数 · 四边形家族</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">视图模式</span>
      <select data-mode>
        <option value="venn" selected>韦恩图(集合嵌套)</option>
        <option value="morph">变形演示(拖顶点判别)</option>
        <option value="gallery">8 形状对比画廊</option>
      </select>
    </div>
    <div class="mathw-control-row" data-row-morph>
      <span class="mathw-control-label">基准四边形</span>
      <select data-base>
        <option value="general" selected>一般四边形</option>
        <option value="trapezoid">梯形</option>
        <option value="parallelogram">平行四边形</option>
        <option value="rectangle">矩形</option>
        <option value="rhombus">菱形</option>
      </select>
    </div>
    <div class="mathw-control-row" style="font-size:11px;color:var(--mathw-muted)">
      切"变形"拖动四边形顶点,实时显示命中的家族;切"画廊"看 8 种形状并排
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let params = { mode: 'venn', base: 'general' };
  // 变形演示:4 顶点可拖
  let morphQuad = [];
  let morphInit = false;
  let dragIdx = -1;

  // ---------- 工具 ----------
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function vec(a, b) { return { x: b.x - a.x, y: b.y - a.y }; }
  function cross(v1, v2) { return v1.x * v2.y - v1.y * v2.x; }
  function dot(v1, v2) { return v1.x * v2.x + v1.y * v2.y; }
  function angleAt(c, a, b) {
    const v1 = vec(c, a), v2 = vec(c, b);
    const cos = dot(v1, v2) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) + 1e-9);
    return Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
  }
  function isParallel(a, b, c, d, tol = 0.05) {
    const v1 = vec(a, b), v2 = vec(c, d);
    const l1 = Math.hypot(v1.x, v1.y), l2 = Math.hypot(v2.x, v2.y);
    if (l1 < 1 || l2 < 1) return false;
    // 平行 = 叉积 ≈ 0 + dot < 0(同向或反向,都平行)
    const n1 = { x: v1.x / l1, y: v1.y / l1 };
    const n2 = { x: v2.x / l2, y: v2.y / l2 };
    return Math.abs(cross(n1, n2)) < tol;
  }

  // 4 顶点 A B C D(逆时针)判别
  function classify(pts) {
    const [A, B, C, D] = pts;
    const dAB = dist(A, B), dBC = dist(B, C), dCD = dist(C, D), dDA = dist(D, A);
    const angA = angleAt(A, D, B), angB = angleAt(B, A, C), angC = angleAt(C, B, D), angD = angleAt(D, C, A);

    // 平行
    const ABpCD = isParallel(A, B, C, D);
    const ADpBC = isParallel(A, D, B, C);
    const isParall = ABpCD && ADpBC;
    // 矩形: 4 角 90°
    const allRight = Math.abs(angA - 90) < 5 && Math.abs(angB - 90) < 5 && Math.abs(angC - 90) < 5 && Math.abs(angD - 90) < 5;
    // 菱形: 4 边等
    const allEqual = Math.abs(dAB - dBC) < 5 && Math.abs(dBC - dCD) < 5 && Math.abs(dCD - dDA) < 5;

    const hits = [];
    hits.push({ name: '一般四边形', desc: '4 边,不要求任何特殊关系' });
    if (ABpCD || ADpBC) {
      hits.push({ name: '梯形', desc: '一组对边平行' });
      if (Math.abs(dAD - dBC) < 5) hits.push({ name: '等腰梯形', desc: '梯形 + 两腰等' });
      if (allRight && !isParall) hits.push({ name: '直角梯形', desc: '梯形 + 一腰⊥底' });
    }
    if (isParall) {
      hits.push({ name: '平行四边形', desc: '两组对边都平行' });
      if (allRight) hits.push({ name: '矩形', desc: '平行四边形 + 4 角 90°' });
      if (allEqual) hits.push({ name: '菱形', desc: '平行四边形 + 4 边等' });
      if (allRight && allEqual) hits.push({ name: '正方形', desc: '矩形 ∩ 菱形' });
    }
    return { hits, dAB, dBC, dCD, dDA, angA, angB, angC, angD, isParall, allRight, allEqual };
  }

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  function drawQuad(pts, opts) {
    const { stroke = '#4ea1ff', fill = 'rgba(78,161,255,0.10)', lw = 2, dashed = false, vertexR = 5, labelPrefix = '', center = null } = opts || {};
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
      if (labelPrefix) {
        ctx.fillStyle = stroke;
        ctx.font = 'bold 12px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labelPrefix + 'ABCD'[i], pts[i].x, pts[i].y - 10);
      }
    }
  }

  // 视图 1:韦恩图
  function viewVenn(W, H) {
    // 嵌套结构 文字 + 边界
    // 大盒子: 一般四边形
    const pad = 30;
    const bx = pad, by = 50, bw = W - pad * 2, bh = H - by - 50;
    ctx.strokeStyle = '#8a93a6';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(bx, by, bw, bh);
    ctx.setLineDash([]);
    ctx.fillStyle = '#8a93a6';
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('「一般四边形」集合 (最外层)', bx + 6, by - 8);

    // 左侧:平行四边形族
    const plX = bx + 20, plY = by + 30, plW = (bw - 50) * 0.5, plH = bh - 60;
    ctx.strokeStyle = '#4ea1ff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(plX, plY, plW, plH);
    ctx.setLineDash([]);
    ctx.fillStyle = '#4ea1ff';
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('「平行四边形族」 AB∥CD ∧ AD∥BC', plX + 6, plY + 18);

    // 矩形 (左下)
    const rtX = plX + 15, rtY = plY + 30, rtW = plW * 0.45, rtH = plH * 0.45;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(rtX, rtY, rtW, rtH);
    ctx.setLineDash([]);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('「矩形」4 角 = 90°', rtX + 6, rtY + 16);

    // 菱形 (右上)
    const rhX = plX + plW * 0.5, rhY = plY + 30, rhW = plW * 0.45, rhH = plH * 0.45;
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(rhX, rhY, rhW, rhH);
    ctx.setLineDash([]);
    ctx.fillStyle = '#34d399';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('「菱形」4 边等', rhX + 6, rhY + 16);

    // 正方形 (中央交集)
    const sqX = plX + plW * 0.25, sqY = plY + plH * 0.5, sqW = plW * 0.45, sqH = plH * 0.4;
    ctx.fillStyle = 'rgba(244, 114, 182, 0.18)';
    ctx.fillRect(sqX, sqY, sqW, sqH);
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sqX, sqY, sqW, sqH);
    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('「正方形」', sqX + sqW / 2, sqY + 22);
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillText('= 矩形 ∩ 菱形', sqX + sqW / 2, sqY + 38);
    ctx.fillText('4 角 90° + 4 边等', sqX + sqW / 2, sqY + 52);

    // 右侧:梯形族
    const tzX = bx + bw * 0.55, tzY = by + 30, tzW = (bw - 50) * 0.45, tzH = bh - 60;
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(tzX, tzY, tzW, tzH);
    ctx.setLineDash([]);
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('「梯形族」 一组对边平行', tzX + 6, tzY + 18);

    // 等腰梯形 (左上)
    const istX = tzX + 10, istY = tzY + 30, istW = tzW * 0.45, istH = tzH * 0.45;
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(istX, istY, istW, istH);
    ctx.setLineDash([]);
    ctx.fillStyle = '#fb923c';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('「等腰梯形」', istX + 6, istY + 16);
    ctx.fillText('两腰等', istX + 6, istY + 30);

    // 直角梯形 (右上)
    const rttX = tzX + tzW * 0.5, rttY = tzY + 30, rttW = tzW * 0.45, rttH = tzH * 0.45;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(rttX, rttY, rttW, rttH);
    ctx.setLineDash([]);
    ctx.fillStyle = '#22d3ee';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('「直角梯形」', rttX + 6, rttY + 16);
    ctx.fillText('一腰⊥底', rttX + 6, rttY + 30);

    // 互斥提示
    ctx.fillStyle = '#f472b6';
    ctx.font = 'italic 11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('↑ 平行四边形族 与 梯形族 互斥(不能同时成立) ↑', W / 2, H - 30);
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('切"变形"拖顶点实时判别 · 切"画廊"看 8 形状实例', W / 2, H - 12);
  }

  // 视图 2:变形演示
  function initMorphQuad(W, H) {
    const cx = W * 0.45, cy = H * 0.5;
    // 默认:一般四边形
    morphQuad = [
      { x: cx - 130, y: cy + 80 },
      { x: cx + 90, y: cy + 100 },
      { x: cx + 150, y: cy - 80 },
      { x: cx - 110, y: cy - 90 },
    ];
    morphInit = true;
  }

  function setBaseQuad(W, H, base) {
    const cx = W * 0.45, cy = H * 0.5;
    if (base === 'general') {
      morphQuad = [
        { x: cx - 130, y: cy + 80 },
        { x: cx + 90, y: cy + 100 },
        { x: cx + 150, y: cy - 80 },
        { x: cx - 110, y: cy - 90 },
      ];
    } else if (base === 'trapezoid') {
      // AD∥BC,BC 水平底
      morphQuad = [
        { x: cx - 100, y: cy - 80 },  // A
        { x: cx - 100, y: cy + 80 },  // D
        { x: cx + 100, y: cy + 80 },  // C
        { x: cx + 100, y: cy - 80 },  // B (梯形 AB∥CD)
      ];
      // 调整为 AB∥CD
      morphQuad = [
        { x: cx - 120, y: cy - 60 },
        { x: cx + 120, y: cy - 60 },
        { x: cx + 80, y: cy + 80 },
        { x: cx - 80, y: cy + 80 },
      ];
    } else if (base === 'parallelogram') {
      // 平行四边形
      morphQuad = [
        { x: cx - 100, y: cy + 60 },
        { x: cx, y: cy + 60 },
        { x: cx + 100, y: cy - 60 },
        { x: cx, y: cy - 60 },
      ];
    } else if (base === 'rectangle') {
      morphQuad = [
        { x: cx - 100, y: cy - 70 },
        { x: cx + 100, y: cy - 70 },
        { x: cx + 100, y: cy + 70 },
        { x: cx - 100, y: cy + 70 },
      ];
    } else if (base === 'rhombus') {
      morphQuad = [
        { x: cx, y: cy - 100 },
        { x: cx + 90, y: cy },
        { x: cx, y: cy + 100 },
        { x: cx - 90, y: cy },
      ];
    }
  }

  function viewMorph(W, H) {
    if (!morphInit) initMorphQuad(W, H);
    drawQuad(morphQuad, { stroke: '#4ea1ff', fill: 'rgba(78,161,255,0.10)', labelPrefix: '' });
    // 顶点标签
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = '#4ea1ff';
      ctx.font = 'bold 13px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ABCD'[i], morphQuad[i].x, morphQuad[i].y - 12);
    }

    const r = classify(morphQuad);
    // 边长与角度
    const A = morphQuad[0], B = morphQuad[1], C = morphQuad[2], D = morphQuad[3];
    const sides = [r.dAB, r.dBC, r.dCD, r.dDA];
    const angs = [r.angA, r.angB, r.angC, r.angD];

    // 右栏:判定结果
    const px = W * 0.72;
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('命中的家族', px, 50);
    ctx.font = '11px monospace';
    let yy = 72;
    for (const h of r.hits) {
      ctx.fillStyle = h.name === '正方形' ? '#f472b6' :
                      h.name === '矩形' || h.name === '菱形' ? '#fbbf24' :
                      h.name === '平行四边形' ? '#4ea1ff' :
                      h.name === '梯形' ? '#a78bfa' :
                      h.name === '等腰梯形' ? '#fb923c' :
                      h.name === '直角梯形' ? '#22d3ee' : '#8a93a6';
      ctx.fillText('▸ ' + h.name, px, yy);
      ctx.fillStyle = '#8a93a6';
      ctx.fillText('  ' + h.desc, px, yy + 13);
      yy += 30;
    }

    // 底部:边长 + 角度
    ctx.fillStyle = '#8a93a6';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`边长 |AB|=${sides[0].toFixed(0)}  |BC|=${sides[1].toFixed(0)}  |CD|=${sides[2].toFixed(0)}  |DA|=${sides[3].toFixed(0)}`, 30, H - 64);
    ctx.fillText(`角度 ∠A=${angs[0].toFixed(0)}°  ∠B=${angs[1].toFixed(0)}°  ∠C=${angs[2].toFixed(0)}°  ∠D=${angs[3].toFixed(0)}°`, 30, H - 44);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`AB∥CD: ${isParallel(A, B, C, D) ? '✓' : '✗'}   AD∥BC: ${isParallel(A, D, B, C) ? '✓' : '✗'}   4 直角: ${r.allRight ? '✓' : '✗'}   4 边等: ${r.allEqual ? '✓' : '✗'}`, 30, H - 22);
  }

  // 视图 3:8 形状对比画廊
  function viewGallery(W, H) {
    // 2 行 × 4 列 = 8 形状,每格约 W*0.22 宽
    const cellW = (W - 60) / 4;
    const cellH = (H - 100) / 2;
    const shapes = [
      { name: '一般四边形', desc: '无特殊关系', drawer: (cx, cy) => [{ x: cx - 50, y: cy + 30 }, { x: cx + 35, y: cy + 35 }, { x: cx + 50, y: cy - 35 }, { x: cx - 45, y: cy - 30 }], color: '#8a93a6' },
      { name: '梯形', desc: 'AB∥CD 一组对边平行', drawer: (cx, cy) => [{ x: cx - 50, y: cy - 30 }, { x: cx + 50, y: cy - 30 }, { x: cx + 30, y: cy + 30 }, { x: cx - 30, y: cy + 30 }], color: '#a78bfa' },
      { name: '等腰梯形', desc: '梯形 + 两腰等', drawer: (cx, cy) => [{ x: cx - 50, y: cy - 30 }, { x: cx + 50, y: cy - 30 }, { x: cx + 25, y: cy + 30 }, { x: cx - 25, y: cy + 30 }], color: '#fb923c' },
      { name: '直角梯形', desc: '梯形 + 一腰⊥底', drawer: (cx, cy) => [{ x: cx - 50, y: cy - 30 }, { x: cx + 50, y: cy - 30 }, { x: cx + 50, y: cy + 30 }, { x: cx - 30, y: cy + 30 }], color: '#22d3ee' },
      { name: '平行四边形', desc: '两组对边平行', drawer: (cx, cy) => [{ x: cx - 50, y: cy + 25 }, { x: cx, y: cy + 25 }, { x: cx + 50, y: cy - 25 }, { x: cx, y: cy - 25 }], color: '#4ea1ff' },
      { name: '矩形', desc: '平行 + 4 直角', drawer: (cx, cy) => [{ x: cx - 55, y: cy - 25 }, { x: cx + 55, y: cy - 25 }, { x: cx + 55, y: cy + 25 }, { x: cx - 55, y: cy + 25 }], color: '#fbbf24' },
      { name: '菱形', desc: '平行 + 4 边等', drawer: (cx, cy) => [{ x: cx, y: cy - 35 }, { x: cx + 50, y: cy }, { x: cx, y: cy + 35 }, { x: cx - 50, y: cy }], color: '#34d399' },
      { name: '正方形', desc: '矩形 ∩ 菱形', drawer: (cx, cy) => [{ x: cx - 32, y: cy - 32 }, { x: cx + 32, y: cy - 32 }, { x: cx + 32, y: cy + 32 }, { x: cx - 32, y: cy + 32 }], color: '#f472b6' },
    ];
    const startX = 30, startY = 50;
    for (let i = 0; i < 8; i++) {
      const col = i % 4, row = Math.floor(i / 4);
      const cx = startX + col * cellW + cellW / 2;
      const cy = startY + row * cellH + cellH / 2;
      // 边框
      ctx.strokeStyle = 'rgba(138,147,166,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(startX + col * cellW + 4, startY + row * cellH + 4, cellW - 8, cellH - 8);
      // 形状
      const pts = shapes[i].drawer(cx, cy - 10);
      drawQuad(pts, { stroke: shapes[i].color, fill: shapes[i].color + '22', lw: 2, vertexR: 4, labelPrefix: '' });
      // 名称
      ctx.fillStyle = shapes[i].color;
      ctx.font = 'bold 13px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(shapes[i].name, cx, startY + row * cellH + cellH - 28);
      ctx.fillStyle = '#8a93a6';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.fillText(shapes[i].desc, cx, startY + row * cellH + cellH - 12);
    }
    // 标题
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('8 种四边形 · 上排:梯形族 · 下排:平行四边形族', W / 2, 32);
  }

  // ---------- 事件 ----------
  function bindEvents() {
    ctrls.querySelector('[data-mode]').addEventListener('change', e => {
      params.mode = e.target.value;
      ctrls.querySelector('[data-row-morph]').style.display = params.mode === 'morph' ? '' : 'none';
      if (params.mode === 'morph') {
        setBaseQuad(canvas.width / devicePixelRatio, canvas.height / devicePixelRatio, params.base);
      }
    });
    ctrls.querySelector('[data-base]').addEventListener('change', e => {
      params.base = e.target.value;
      setBaseQuad(canvas.width / devicePixelRatio, canvas.height / devicePixelRatio, params.base);
    });
  }
  bindEvents();

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  canvas.addEventListener('mousedown', e => {
    if (params.mode !== 'morph') return;
    const p = getMousePos(e);
    for (let i = 0; i < morphQuad.length; i++) {
      if (Math.hypot(morphQuad[i].x - p.x, morphQuad[i].y - p.y) < 14) {
        dragIdx = i;
        break;
      }
    }
  });
  window.addEventListener('mousemove', e => {
    if (dragIdx < 0) return;
    const p = getMousePos(e);
    morphQuad[dragIdx] = { x: p.x, y: p.y };
  });
  window.addEventListener('mouseup', () => { dragIdx = -1; });

  // ---------- 主循环 ----------
  const loop = makeLoop((t) => {
    fitCanvas(canvas, wrap);
    const W = canvas.width / devicePixelRatio;
    const H = canvas.height / devicePixelRatio;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(20, 24, 33, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (params.mode === 'venn') viewVenn(W, H);
    else if (params.mode === 'morph') viewMorph(W, H);
    else if (params.mode === 'gallery') viewGallery(W, H);
  });
  loop.start();

  return {
    sceneId: 'quadrilateral-family',
    getFormula() {
      return `平行四边形:AB∥CD ∧ AD∥BC\n矩形:平行四边形 + 4 直角\n菱形:平行四边形 + 4 边等\n正方形:矩形 ∩ 菱形\n梯形:一组对边平行\n等腰梯形:梯形 + 两腰等\n直角梯形:梯形 + 一腰⊥底`;
    },
    getLesson() {
      return '四边形家族:8 种 + 集合嵌套。平行四边形族(平行/矩形/菱形/正方形,正方形=矩形∩菱形)+ 梯形族(梯形/等腰/直角,两族互斥)。判定:对边平行(平行/梯形)、4 直角(矩形)、4 边等(菱形)、两腰等(等腰梯)、一腰⊥底(直角梯)。应用:建筑门窗(矩/方)、瓷砖拼花(菱/方)、包装纸盒、钢架结构。';
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
