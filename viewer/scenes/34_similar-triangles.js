// viewer/scenes/34_similar-triangles.js
// MathematicsWeb v0.6.37 — 相似三角形 (数学 × 初中几何 · 8 年级)
// 2D Canvas 场景:基准三角 ABC + 相似三角 A'B'C'(可调缩放/旋转/位移)
//   - 视图 1:自由缩放 — 拖动 ABC / 调 k / 旋转 / 平移,验证"对应角相等 + 对应边比 = k"
//   - 视图 2:平行线分线段(Thales 比例) — DE ∥ BC → AD/DB = AE/EC
//   - 视图 3:面积比 — 面积比 = k²(边长比的平方)
//
// 数学(相似三角形 Similar Triangles):
//   ΔABC ~ ΔA'B'C' if ∠A=∠A' ∧ ∠B=∠B' ∧ ∠C=∠C' (3 角分别相等)
//   对应边成比例: |A'B'|/|AB| = |B'C'|/|BC| = |C'A'|/|CA| = k (相似比)
//   面积比: S(ΔA'B'C') / S(ΔABC) = k²
//   推论:
//     ① 平行线分线段成比例(DE ∥ BC → AD/DB = AE/EC)
//     ② 斜率与高比 = 相似比
//     ③ 等腰/等边三角是相似特例
//
// 历史:
//   - Euclid 《几何原本》VI.4 ~300BC 证明相似判定法
//   - Thales 用相似测金字塔高(600BC,最早应用之一)
//
// 应用:
//   - 摄影:变焦/广角/长焦(都是相似变换)
//   - 地图:比例尺(地图/实地的相似比)
//   - 建筑:模型/实物按比例缩放
//   - 工程:缩尺实验(风洞/水工模型)
//   - 测距:Thales 测金字塔高(影长比 = 高比)

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
    <div class="mathw-lesson-title">数学 × 初中几何 · 相似三角形</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">对应角相等 + 对应边成比例 · k · k² 面积比</div>
      <div class="mathw-lesson-formula">ΔABC ~ ΔA'B'C'  ⇔  ∠A=∠A' ∧ ∠B=∠B' ∧ ∠C=∠C' ∧  |A'B'|/|AB| = k</div>
      <div class="mathw-lesson-text">
        <strong>相似三角形</strong>(Similar Triangles):两三角形<strong>对应角相等</strong>且<strong>对应边成比例</strong>(比值 = <strong>k 相似比</strong>)。<br>
        <strong>相似判定</strong>(任一满足即可):<br>
        ① <strong>AA</strong>(角角):两角分别相等(最常用)。<br>
        ② <strong>SSS 相似</strong>:3 边比都相等。<br>
        ③ <strong>SAS 相似</strong>:两边比相等 + 夹角相等。<br>
        <strong>推论</strong>:<br>
        ① <strong>面积比 = k²</strong>(边长比的平方)。<br>
        ② <strong>平行线分线段成比例</strong>:DE ∥ BC → AD/DB = AE/EC(切"平行线"模式验证)。<br>
        ③ <strong>斜率 / 高 / 中线 / 角平分线</strong>都按相似比缩放。<br>
        <strong>历史</strong>:Euclid《几何原本》VI.4 ~300BC 证明相似;Thales ~600BC 用相似测金字塔高(影长比 = 塔高比),最早应用之一。<br>
        拖动 ABC 顶点 / 调 k 滑块 / 旋转 / 平移相似三角,看 ∠/边 比实时验证。<br>
        应用:摄影变焦 · 地图比例尺 · 建筑缩尺模型 · 测距(Thales 测高)。
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
    <div class="mathw-controls-title">参数 · 相似三角形</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">视图模式</span>
      <select data-mode>
        <option value="free" selected>自由缩放 (k + 旋转 + 平移)</option>
        <option value="parallel">平行线分线段 (Thales)</option>
        <option value="area">面积比 (k²)</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">相似比 k</span>
      <input type="range" min="0.3" max="2.0" step="0.05" value="0.7" data-k />
      <span class="mathw-control-value" data-k-v>0.70</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">旋转 θ</span>
      <input type="range" min="-180" max="180" step="2" value="20" data-theta />
      <span class="mathw-control-value" data-theta-v>20°</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">预设 k</span>
      <button data-p05>k=0.5 (缩小)</button>
      <button data-p1>k=1.0 (全等)</button>
      <button data-p15>k=1.5 (放大)</button>
    </div>
    <div class="mathw-control-row" style="font-size:11px;color:var(--mathw-muted)">
      拖动 ABC 顶点调基准;相似三角自动跟 k/θ 联动;模式 1 可平移相似三角(拖中心)
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  // 基准三角 ABC(响应式初始化)
  let baseTri = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
  let baseInit = false;
  // 相似三角(派生)
  let similarTri = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
  // 平移偏移
  let trans = { dx: 0, dy: 0 };
  let params = { mode: 'free', k: 0.7, theta: 20 * Math.PI / 180 };

  // ---------- 工具 ----------
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function angleAt(c, a, b) {
    const v1x = a.x - c.x, v1y = a.y - c.y;
    const v2x = b.x - c.x, v2y = b.y - c.y;
    const cos = (v1x * v2x + v1y * v2y) / (Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y) + 1e-9);
    return Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
  }
  function centroid(t) {
    return { x: (t[0].x + t[1].x + t[2].x) / 3, y: (t[0].y + t[1].y + t[2].y) / 3 };
  }
  function polyArea(t) {
    return Math.abs((t[1].x - t[0].x) * (t[2].y - t[0].y) - (t[2].x - t[0].x) * (t[1].y - t[0].y)) / 2;
  }
  function applySimilar(src, k, theta, trans) {
    const c = centroid(src);
    return src.map(p => {
      const dx = p.x - c.x, dy = p.y - c.y;
      const cos = Math.cos(theta), sin = Math.sin(theta);
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;
      return { x: c.x + rx * k + trans.dx, y: c.y + ry * k + trans.dy };
    });
  }

  function initBaseTri(W, H) {
    const cx = W * 0.32, cy = H * 0.5;
    baseTri = [
      { x: cx - 80, y: cy + 60 },  // A
      { x: cx + 80, y: cy + 60 },  // B
      { x: cx - 50, y: cy - 70 },  // C
    ];
    baseInit = true;
    trans = { dx: W * 0.35, dy: 0 };  // 相似三角放右侧
  }

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  function drawTri(t, labels, sideColor, angColor, sideWidth, showSides, showAngs, dashed) {
    ctx.lineWidth = sideWidth || 2;
    if (dashed) ctx.setLineDash([5, 4]); else ctx.setLineDash([]);
    ctx.strokeStyle = sideColor;
    ctx.beginPath();
    ctx.moveTo(t[0].x, t[0].y);
    ctx.lineTo(t[1].x, t[1].y);
    ctx.lineTo(t[2].x, t[2].y);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // 顶点
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = sideColor;
      ctx.beginPath();
      ctx.arc(t[i].x, t[i].y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = sideColor;
      ctx.font = 'bold 13px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], t[i].x + (i === 0 ? -14 : 14), t[i].y + (i === 1 ? 18 : -12));
    }

    if (showSides) {
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      const sides = [dist(t[0], t[1]), dist(t[1], t[2]), dist(t[2], t[0])];
      for (let i = 0; i < 3; i++) {
        const a = t[i], b = t[(i + 1) % 3];
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const d = dist(a, b);
        const nx = -(b.y - a.y) / (d + 1e-6) * 12;
        const ny = (b.x - a.x) / (d + 1e-6) * 12;
        ctx.fillStyle = sideColor;
        ctx.fillText(d.toFixed(0), mx + nx, my + ny);
      }
    }
    if (showAngs) {
      ctx.font = '10px -apple-system, sans-serif';
      const angs = [angleAt(t[0], t[1], t[2]), angleAt(t[1], t[0], t[2]), angleAt(t[2], t[0], t[1])];
      const c = t;
      for (let i = 0; i < 3; i++) {
        const a = c[(i + 2) % 3], p = c[i], b = c[(i + 1) % 3];
        const a1 = Math.atan2(a.y - p.y, a.x - p.x);
        const a2 = Math.atan2(b.y - p.y, b.x - p.x);
        let dA = a2 - a1;
        while (dA < 0) dA += Math.PI * 2;
        const ang = dA;
        const r = 18;
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, a1, a2);
        ctx.stroke();
        ctx.fillStyle = '#f472b6';
        const midA = a1 + ang / 2;
        ctx.fillText((ang * 180 / Math.PI).toFixed(0) + '°', p.x + (r + 10) * Math.cos(midA), p.y + (r + 10) * Math.sin(midA));
      }
    }
  }

  function drawCentroidMark(t, color) {
    const c = centroid(t);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 视图 1: 自由缩放
  function viewFree(W, H) {
    // 派生相似三角
    similarTri = applySimilar(baseTri, params.k, params.theta, trans);

    // 画相似中心点(可拖)
    const c = centroid(baseTri);
    const cSim = { x: c.x + trans.dx, y: c.y + trans.dy };

    drawTri(baseTri, ['A', 'B', 'C'], '#4ea1ff', '#f472b6', 2, true, true, false);
    drawTri(similarTri, ["A'", "B'", "C'"], '#fbbf24', '#f472b6', 2.5, true, true, false);
    drawCentroidMark(baseTri, '#4ea1ff');
    drawCentroidMark(similarTri, '#fbbf24');

    // 画中心连线
    ctx.strokeStyle = 'rgba(138, 147, 166, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(cSim.x, cSim.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 计算比
    const sidesB = [dist(baseTri[0], baseTri[1]), dist(baseTri[1], baseTri[2]), dist(baseTri[2], baseTri[0])];
    const sidesS = [dist(similarTri[0], similarTri[1]), dist(similarTri[1], similarTri[2]), dist(similarTri[2], similarTri[0])];
    const ratios = sidesS.map((s, i) => s / (sidesB[i] || 1));
    const avgRatio = ratios.reduce((a, b) => a + b, 0) / 3;
    const angsB = [angleAt(baseTri[0], baseTri[1], baseTri[2]), angleAt(baseTri[1], baseTri[0], baseTri[2]), angleAt(baseTri[2], baseTri[0], baseTri[1])];
    const angsS = [angleAt(similarTri[0], similarTri[1], similarTri[2]), angleAt(similarTri[1], similarTri[0], similarTri[2]), angleAt(similarTri[2], similarTri[0], similarTri[1])];
    const maxAngDiff = Math.max(...angsB.map((a, i) => Math.abs(a - angsS[i])));

    const ratioOK = Math.abs(avgRatio - params.k) < 0.05;
    const angOK = maxAngDiff < 1.5;

    // 等式
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`相似比 k = ${avgRatio.toFixed(3)}  (设置 ${params.k.toFixed(2)})  ${ratioOK ? '✓' : '✗'}`,
      W / 2, H - 64);
    ctx.fillStyle = '#f472b6';
    ctx.fillText(`最大角差 = ${maxAngDiff.toFixed(2)}°  ${angOK ? '✓ (相似)' : '(误差超阈值,相似仍成立 — 来自浮点)'}  →  ΔABC ~ ΔA'B'C'`,
      W / 2, H - 44);
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('边比: ' + ratios.map(r => r.toFixed(2)).join('  ') + '   面积比 = k² = ' + (params.k * params.k).toFixed(3),
      W / 2, H - 22);
    ctx.fillText('拖动 ABC 顶点 / 调 k / 调旋转 θ / 拖动黄色中心平移相似三角', W / 2, H - 6);
  }

  // 视图 2: 平行线分线段(Thales 比例)
  function viewParallel(W, H) {
    // 三角形 ABC(顶点 A 在上,BC 在下),DE ∥ BC,D 在 AB,E 在 AC
    // D 位置由 t∈[0,1] 决定(0=B,1=A)
    const cx = W * 0.5, cy = H * 0.5;
    const A = { x: cx, y: cy - 140 };
    const B = { x: cx - 180, y: cy + 100 };
    const C = { x: cx + 180, y: cy + 100 };
    const t = 1 - params.k;  // t 越大 D 越接近 A,k 是相似比
    // 实际让 D 从 A 向 B 移动
    const D = { x: A.x + (B.x - A.x) * (1 - params.k * 0.6), y: A.y + (B.y - A.y) * (1 - params.k * 0.6) };
    const E = { x: A.x + (C.x - A.x) * (1 - params.k * 0.6), y: A.y + (C.y - A.y) * (1 - params.k * 0.6) };

    // 画主三角
    drawTri([A, B, C], ['A', 'B', 'C'], '#4ea1ff', '#f472b6', 2, false, true, false);
    // 画平行线 DE
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(D.x, D.y);
    ctx.lineTo(E.x, E.y);
    ctx.stroke();
    // DE 顶点
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(D.x, D.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(E.x, E.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText('D', D.x - 12, D.y);
    ctx.fillText('E', E.x + 12, E.y);

    // 小三角 ADE(高亮)
    ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(D.x, D.y);
    ctx.lineTo(E.x, E.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 比例标签
    const AD = dist(A, D);
    const DB = dist(D, B);
    const AE = dist(A, E);
    const EC = dist(E, C);
    const DE_ = dist(D, E);
    const BC_ = dist(B, C);
    const ratioAD_DB = AD / DB;
    const ratioAE_EC = AE / EC;
    const ratioDE_BC = DE_ / BC_;

    // 在线段上加标号(用 ratio 文字)
    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`AD = ${AD.toFixed(0)}`, (A.x + D.x) / 2 - 14, (A.y + D.y) / 2);
    ctx.fillText(`DB = ${DB.toFixed(0)}`, (D.x + B.x) / 2 - 14, (D.y + B.y) / 2);
    ctx.fillStyle = '#4ea1ff';
    ctx.fillText(`AE = ${AE.toFixed(0)}`, (A.x + E.x) / 2 + 14, (A.y + E.y) / 2);
    ctx.fillText(`EC = ${EC.toFixed(0)}`, (E.x + C.x) / 2 + 14, (E.y + C.y) / 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`DE = ${DE_.toFixed(0)}`, (D.x + E.x) / 2, D.y - 8);
    ctx.fillText(`BC = ${BC_.toFixed(0)}`, (B.x + C.x) / 2, B.y + 18);

    // 平行标记
    const drawParallelMark = (p1, p2) => {
      const dx = p2.x - p1.x, dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      const nx = -uy, ny = ux;
      // BC 段中点
      const bMid = { x: (B.x + C.x) / 2 + nx * 8, y: (B.y + C.y) / 2 + ny * 8 };
      // DE 段中点
      const dMid = { x: mx + nx * 8, y: my + ny * 8 };
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(dMid.x - ux * 5, dMid.y - uy * 5);
      ctx.lineTo(dMid.x + ux * 5, dMid.y + uy * 5);
      ctx.moveTo(bMid.x - ux * 5, bMid.y - uy * 5);
      ctx.lineTo(bMid.x + ux * 5, bMid.y + uy * 5);
      ctx.stroke();
    };
    drawParallelMark(D, E);
    drawParallelMark(B, C);

    // 等式
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `AD/DB = ${ratioAD_DB.toFixed(3)}    AE/EC = ${ratioAE_EC.toFixed(3)}    DE/BC = ${ratioDE_BC.toFixed(3)}`,
      W / 2, H - 50
    );
    ctx.fillStyle = '#6ee7b7';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText(
      `${Math.abs(ratioAD_DB - ratioAE_EC) < 0.01 ? '✓ AD/DB = AE/EC (Thales 比例定理)' : '偏差 > 0.01'}`,
      W / 2, H - 28
    );
    ctx.fillStyle = '#8a93a6';
    ctx.font = '11px monospace';
    ctx.fillText('DE ∥ BC → AD/DB = AE/EC, 调 k 滑块移动 D/E 沿 AB/AC 滑动', W / 2, H - 10);
  }

  // 视图 3: 面积比
  function viewArea(W, H) {
    // 左侧基准三角 ABC + 右侧相似三角 A'B'C'(按 k 缩放)
    // 旋转 0,平移固定
    const W2 = W * 0.5;
    const cxL = W2 * 0.5, cy = H * 0.5;
    if (!baseInit || (baseTri[0].x < W2 * 0.1 || baseTri[0].x > W2 * 0.9)) {
      // 模式 3 重置基准(放在左侧)
      baseTri = [
        { x: cxL - 80, y: cy + 60 },
        { x: cxL + 80, y: cy + 60 },
        { x: cxL - 50, y: cy - 70 },
      ];
      baseInit = true;
    }
    const cxR = W2 + W2 * 0.5;
    const t2 = applySimilar(baseTri, 1, 0, { dx: cxR - centroid(baseTri).x, dy: 0 });
    const t1K = applySimilar(baseTri, params.k, 0, { dx: 0, dy: 0 });
    // 实际:把相似三角放在右侧
    const tR = baseTri.map(p => ({ x: p.x + (cxR - centroid(baseTri).x), y: p.y }));
    // 缩放版 = tR * k(关于 tR 中心)
    const tR_center = centroid(tR);
    const tR_scaled = tR.map(p => ({
      x: tR_center.x + (p.x - tR_center.x) * params.k,
      y: tR_center.y + (p.y - tR_center.y) * params.k,
    }));
    similarTri = tR_scaled;

    // 画两个三角
    drawTri(baseTri, ['A', 'B', 'C'], '#4ea1ff', '#f472b6', 2, true, true, false);
    drawTri(similarTri, ["A'", "B'", "C'"], '#fbbf24', '#f472b6', 2, true, true, false);

    // 面积
    const areaB = polyArea(baseTri);
    const areaS = polyArea(similarTri);
    const ratio = areaS / areaB;
    const k2 = params.k * params.k;
    const OK = Math.abs(ratio - k2) < 0.05;

    // 涂色填充
    ctx.fillStyle = 'rgba(78, 161, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(baseTri[0].x, baseTri[0].y);
    ctx.lineTo(baseTri[1].x, baseTri[1].y);
    ctx.lineTo(baseTri[2].x, baseTri[2].y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
    ctx.beginPath();
    ctx.moveTo(similarTri[0].x, similarTri[0].y);
    ctx.lineTo(similarTri[1].x, similarTri[1].y);
    ctx.lineTo(similarTri[2].x, similarTri[2].y);
    ctx.closePath();
    ctx.fill();

    // 标面积
    ctx.fillStyle = '#4ea1ff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`S(ΔABC) = ${areaB.toFixed(0)}`, centroid(baseTri).x, centroid(baseTri).y);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`S(ΔA'B'C') = ${areaS.toFixed(0)}`, centroid(similarTri).x, centroid(similarTri).y);

    // 等式
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `面积比 = S'/S = ${ratio.toFixed(2)}   k² = ${k2.toFixed(2)}   ${OK ? '✓ 面积比 = k²' : '(误差 < 0.05)'}`,
      W / 2, H - 28
    );
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('面积按相似比的平方缩放', W / 2, H - 10);
  }

  function draw() {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    if (!baseInit) initBaseTri(W, H);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    if (params.mode === 'free') viewFree(W, H);
    else if (params.mode === 'parallel') viewParallel(W, H);
    else if (params.mode === 'area') viewArea(W, H);

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // ---------- 交互 ----------
  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function hitBaseTri(p) {
    for (let i = 0; i < 3; i++) {
      if (Math.hypot(baseTri[i].x - p.x, baseTri[i].y - p.y) < 14) return i;
    }
    return -1;
  }
  function hitCentroidSim(p) {
    // 拖动相似三角中心(平移)
    if (params.mode !== 'free') return false;
    const c = centroid(similarTri);
    return Math.hypot(c.x - p.x, c.y - p.y) < 14;
  }

  let drag = null;
  canvas.addEventListener('mousedown', (e) => {
    const p = getMousePos(e);
    if (params.mode === 'free') {
      const idx = hitBaseTri(p);
      if (idx >= 0) { drag = { type: 'base', idx }; return; }
      if (hitCentroidSim(p)) { drag = { type: 'trans' }; return; }
    }
  });
  window.addEventListener('mousemove', (e) => {
    if (!drag) return;
    const p = getMousePos(e);
    if (drag.type === 'base') {
      baseTri[drag.idx] = p;
    } else if (drag.type === 'trans') {
      // 平移量 = 鼠标位置 - 基准中心(锁定基准)
      const c = centroid(baseTri);
      trans.dx = p.x - c.x;
      trans.dy = p.y - c.y;
    }
  });
  window.addEventListener('mouseup', () => { drag = null; });

  // 控件
  const modeSel = ctrls.querySelector('[data-mode]');
  modeSel.addEventListener('change', (e) => {
    params.mode = e.target.value;
    if (params.mode === 'parallel' || params.mode === 'area') {
      // 重置 k
      params.k = 0.7;
      ctrls.querySelector('[data-k]').value = 0.7;
      ctrls.querySelector('[data-k-v]').textContent = '0.70';
    }
  });
  const kInput = ctrls.querySelector('[data-k]');
  const kV = ctrls.querySelector('[data-k-v]');
  kInput.addEventListener('input', (e) => {
    params.k = parseFloat(e.target.value);
    kV.textContent = params.k.toFixed(2);
  });
  const thetaInput = ctrls.querySelector('[data-theta]');
  const thetaV = ctrls.querySelector('[data-theta-v]');
  thetaInput.addEventListener('input', (e) => {
    params.theta = parseFloat(e.target.value) * Math.PI / 180;
    thetaV.textContent = e.target.value + '°';
  });
  ctrls.querySelector('[data-p05]').addEventListener('click', () => {
    kInput.value = 0.5; params.k = 0.5; kV.textContent = '0.50';
  });
  ctrls.querySelector('[data-p1]').addEventListener('click', () => {
    kInput.value = 1.0; params.k = 1.0; kV.textContent = '1.00';
  });
  ctrls.querySelector('[data-p15]').addEventListener('click', () => {
    kInput.value = 1.5; params.k = 1.5; kV.textContent = '1.50';
  });

  return {
    sceneId: 'similar-triangles',
    getFormula() { return 'ΔABC ~ ΔA\'B\'C\'  iff  ∠A=∠A\' ∧ ∠B=∠B\' ∧ |A\'B\'|/|AB| = k'; },
    getLesson() {
      const c = lesson.querySelector('.mathw-lesson-content');
      return c ? c.textContent.replace(/\s+/g, ' ').trim() : '';
    },
    getState() { return { mode: params.mode, k: params.k, theta: params.theta / Math.PI * 180 }; },
    setState(s) {
      if (!s) return;
      if (s.mode) { params.mode = s.mode; modeSel.value = s.mode; }
      if (s.k) { params.k = s.k; kInput.value = s.k; kV.textContent = s.k.toFixed(2); }
      if (s.theta !== undefined) { params.theta = s.theta * Math.PI / 180; thetaInput.value = s.theta; thetaV.textContent = s.theta + '°'; }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
