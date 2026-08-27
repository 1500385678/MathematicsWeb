// viewer/scenes/39_conic-unified.js
// MathematicsWeb v0.6.42 — 圆锥曲线统一定义 (数学 × 高中解析几何 · 高一)
// 2D Canvas 场景:4 视图展示圆锥曲线 3 种类型(椭圆/抛物线/双曲线)统一定义
//   - 统一定义:PF/PM = e(P 到焦点距离 P 到准线距离 = 离心率 e)
//   - e < 1 椭圆(0..1)· e = 1 抛物线· e > 1 双曲线
//   - 4 视图:1) e 滑块动态演示  2) 3 曲线并列  3) 锥体切片  4) 几何性质表
//
// 数学(圆锥曲线 Conic Sections 统一定义):
//   极坐标方程(焦点极坐标,准线 x = d 垂直于 x 轴):
//     r(θ) = e·d / (1 + e·cos(θ))    (焦点在原点,准线 x = d > 0)
//   类型判别:
//     e < 1  →  椭圆(闭合)         r 有界
//     e = 1  →  抛物线(开口)       r → ∞ 当 θ → π
//     e > 1  →  双曲线(2 支)        cos(θ) > -1/e 才有解(否则 r < 0 表示另一支)
//
//   二次曲线一般方程:
//     Ax² + Bxy + Cy² + Dx + Ey + F = 0
//   判别式 Δ = B² - 4AC:
//     Δ < 0  →  椭圆型(包含圆)
//     Δ = 0  →  抛物线型
//     Δ > 0  →  双曲线型
//
//   几何性质(对标准位:
//     长半轴 a = ed/(1-e²)  (椭圆 e<1, 双曲线 e>1)
//     短半轴 b = a·sqrt(1-e²)  (椭圆)/ b = a·sqrt(e²-1)  (双曲线)
//     半焦距 c = a·e
//     准线距离 d' = a/e  (即准线到中心距离)
//
// 历史:
//   - Apollonius of Perga ~200BC 《圆锥曲线论》8 卷系统化命名 ellipse/parabola/hyperbola
//   - Pappus of Alexandria ~340AD 给出焦点准线定义雏形
//   - 17 世纪 Descartes 解析几何 + Fermat 坐标法
//   - 1704 年 Newton 证明开普勒第一定律:行星轨道是椭圆,太阳在焦点
//   - 19 世纪 Plücker 1846 用二阶曲线一般方程统一分类
//
// 应用:
//   - 天文:开普勒第一定律(行星椭圆轨道,日心在焦点)
//   - 工程:抛物线桥梁(均布载荷最优)/ 抛物面天线/ 太阳能聚光
//   - 物理:引力场等势面 / 光的反射(抛物线焦点反射到无穷远)
//   - 军事:双曲线导航(LORAN-C)/ GPS 定位
//   - 数学:二次曲线一般方程分类 / 仿射几何基础

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
    <div class="mathw-lesson-title">数学 × 高中解析几何 · 圆锥曲线统一定义</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">PF/PM = e · 离心率 1 切 3 类(椭圆 / 抛物 / 双曲)</div>
      <div class="mathw-lesson-formula">r(θ) = e·d / (1 + e·cos(θ))    (焦点极坐标)</div>
      <div class="mathw-lesson-text">
        <strong>圆锥曲线统一定义</strong>(Conic Sections):平面上到<strong>焦点 F</strong>距离与到<strong>准线</strong>距离之比等于常数 <strong>e</strong>(离心率 eccentricity)的点的轨迹。<br>
        <strong>r(θ) = e·d / (1 + e·cos(θ))</strong>(极坐标,焦点在原点,准线 x = d)<br>
        <strong>3 大类型</strong>(e 是分类核心):<br>
        ① <strong>椭圆 e ∈ (0, 1)</strong> — 闭合曲线,长半轴 a = ed/(1-e²),b = a·√(1-e²),c = ae。R 越大越圆,e→0 → 圆。<br>
        ② <strong>抛物线 e = 1</strong> — 开口曲线,开口大小由 d 决定。焦点到准线中点 = 顶点。R = 2d 通径。<br>
        ③ <strong>双曲线 e > 1</strong> — 2 支曲线,实半轴 a = ed/(e²-1),b = a·√(e²-1),c = ae。R 越大开口越大。<br>
        <strong>历史</strong>:Apollonius of Perga ~200BC《圆锥曲线论》系统化命名 ellipse/parabola/hyperbola(希腊语"不足/正好/超出");Newton 1687 证明开普勒第一定律 — 行星轨道是椭圆,太阳在焦点。<br>
        拖动 e 滑块(0.3-2.5)看曲线从椭圆连续变形为双曲线,3 曲线并列对比,锥体切片演示 3 类的几何来源。<br>
        应用:行星轨道(椭圆)· 抛物面天线(抛物)· LORAN-C 双曲线导航(双曲)· 二次曲线一般方程分类。
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
    <div class="mathw-controls-title">参数 · 圆锥曲线统一定义</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">视图模式</span>
      <select data-mode>
        <option value="dynamic" selected>e 滑块动态演示(王炸)</option>
        <option value="compare">3 曲线并列对比</option>
        <option value="slice">锥体切片 3 类型</option>
        <option value="props">几何性质表</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">离心率 e</span>
      <input type="range" min="0.3" max="2.5" step="0.05" value="0.7" data-e />
      <span class="mathw-control-value" data-e-v>0.70</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">准线距离 d</span>
      <input type="range" min="60" max="200" step="5" value="120" data-d />
      <span class="mathw-control-value" data-d-v>120</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">预设</span>
      <button data-p-circle>圆 (e=0)</button>
      <button data-p-ellipse>椭圆 (e=0.7)</button>
      <button data-p-parabola>抛物 (e=1)</button>
      <button data-p-hyper>双曲 (e=1.5)</button>
    </div>
    <div class="mathw-control-row" style="font-size:11px;color:var(--mathw-muted)">
      圆锥曲线 = 平面截圆锥产生的曲线;e 越小越"圆",e=1 临界,e>1 变双曲
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let params = { mode: 'dynamic', e: 0.7, d: 120 };
  // 滑块联动 + 预设
  function setE(v) {
    params.e = v;
    ctrls.querySelector('[data-e]').value = v;
    ctrls.querySelector('[data-e-v]').textContent = v.toFixed(2);
  }

  // ---------- 几何工具 ----------
  // 给定 e, d, 焦点在原点(状态空间),返回曲线在状态空间的样本点数组
  // r(θ) = e·d / (1 + e·cos(θ))
  function sampleConic(e, d, thMin, thMax, thSteps) {
    const pts = [];
    for (let i = 0; i <= thSteps; i++) {
      const th = thMin + (thMax - thMin) * (i / thSteps);
      const denom = 1 + e * Math.cos(th);
      if (Math.abs(denom) < 1e-6) continue;
      const r = (e * d) / denom;
      if (r < 0) continue;       // 跳过负 r(双曲线另一支单独处理)
      if (r > 10000) continue;   // 跳过爆炸点
      pts.push({ x: r * Math.cos(th), y: r * Math.sin(th) });
    }
    return pts;
  }
  // 双曲线另一支(θ 在 cos(θ) < -1/e 一侧,r 取负值代表反向)
  function sampleConicBranch2(e, d, thSteps) {
    const pts = [];
    const cosCrit = -1 / e;
    if (cosCrit >= 1 || cosCrit <= -1) return pts;
    const thCrit = Math.acos(cosCrit);  // 渐近线方向(0 < thCrit < π)
    // θ ∈ (thCrit, 2π - thCrit) 才有解,且 r < 0 → 取反代表另一支
    for (let i = 0; i <= thSteps; i++) {
      const th = thCrit + (Math.PI * 2 - 2 * thCrit) * (i / thSteps);
      const denom = 1 + e * Math.cos(th);
      if (Math.abs(denom) < 1e-6) continue;
      const r = (e * d) / denom;
      if (r >= 0) continue;
      // r < 0:画 (r cos + π, r sin + π) 即 (-r cos(θ+π), -r sin(θ+π)) ... 简化:画 -r 在同 θ
      pts.push({ x: r * Math.cos(th), y: r * Math.sin(th) });
    }
    return pts;
  }

  // 几何性质:对给定 e, d(焦点极坐标),返回 a / b / c / 通径 / 准线距
  function conicProps(e, d) {
    if (e < 1) {
      // 椭圆
      const a = (e * d) / (1 - e * e);
      const b = a * Math.sqrt(1 - e * e);
      const c = a * e;
      return { type: 'ellipse', e, a, b, c, p: b * b / a, dLine: d, vertR: 2 * e * d / (1 - e * e) };
    } else if (e === 1) {
      // 抛物线
      return { type: 'parabola', e, a: 0, b: 0, c: 0, p: 2 * d, dLine: d, vertR: 2 * d };
    } else {
      // 双曲线
      const a = (e * d) / (e * e - 1);
      const b = a * Math.sqrt(e * e - 1);
      const c = a * e;
      return { type: 'hyperbola', e, a, b, c, p: b * b / a, dLine: d, vertR: 2 * e * d / (e * e - 1) };
    }
  }

  // 抛物线:用显式 y² = 4dx (以焦点为原点 中心化: 抛物线在 x = -d/2 处是顶点)
  // 简单版:用 r = ed / (1 + cos(θ)),但 e=1 时刚好正常 → 上面公式已涵盖
  // e=1 临界:th=π 时 denom=0 → 跳过,曲线从 th=-π 顺滑到 th=π(不闭合)

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  // 画曲线样本(状态空间点 → 屏幕点)
  function drawCurve(pts, cx, cy, color, width = 2.5) {
    if (pts.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(cx + pts[0].x, cy + pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(cx + pts[i].x, cy + pts[i].y);
    }
    ctx.stroke();
  }

  function drawPoint(s, color, label, labelOff = -14) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0e1116';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, s.x, s.y + labelOff);
  }

  function drawLineSeg(s1, s2, color, width = 1.5, dashed = false) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (dashed) ctx.setLineDash([5, 4]);
    else ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawHudBox(x, y, w, h, lines) {
    ctx.fillStyle = 'rgba(20,24,31,0.92)';
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    let yy = y + 16;
    for (const [label, value, color] of lines) {
      ctx.fillStyle = color || '#8a96b0';
      ctx.fillText(label, x + 10, yy);
      ctx.fillStyle = '#e6e8ec';
      ctx.textAlign = 'right';
      ctx.fillText(value, x + w - 10, yy);
      ctx.textAlign = 'left';
      yy += 16;
    }
  }

  // 背景网格
  function drawGrid(W, H) {
    ctx.strokeStyle = '#1a1f2a';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // 坐标轴
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
    ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H);
    ctx.stroke();
  }

  // 焦点 F(状态空间原点 → 屏幕) + 准线 x = d
  function drawFocusAndDirectrix(c, W, H, d) {
    // 焦点 F(原点)
    drawPoint({ x: c.cx, y: c.cy }, '#fb923c', 'F', -16);
    // 准线 x = d(屏幕)
    const directrixX = c.cx + d;
    ctx.strokeStyle = '#8a93a6';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(directrixX, 0);
    ctx.lineTo(directrixX, H);
    ctx.stroke();
    ctx.setLineDash([]);
    // 准线标签
    ctx.fillStyle = '#8a93a6';
    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('准线 x = d', directrixX, 14);
  }

  // 视图 1: e 滑块动态演示(王炸)
  function viewDynamic(W, H) {
    const c = { cx: W / 2 - 100, cy: H / 2 };
    const e = params.e, d = params.d;

    drawGrid(W, H);
    drawFocusAndDirectrix(c, W, H, d);

    // 采样曲线(覆盖足够角度)
    const pts = sampleConic(e, d, -Math.PI + 0.02, Math.PI - 0.02, 360);
    // 椭圆 e<1:绿色;抛物 e=1:紫色;双曲 e>1:橙色
    let color = '#6ee7b7';
    if (e === 1) color = '#f472b6';
    else if (e > 1) color = '#fb923c';
    drawCurve(pts, c.cx, c.cy, color, 2.5);

    // 双曲线另一支
    if (e > 1) {
      const pts2 = sampleConicBranch2(e, d, 180);
      drawCurve(pts2, c.cx, c.cy, color, 2.5);
    }

    // 验证:在曲线上取 1 个点 P(角度 th=60°),计算 PF/PM
    const thSample = Math.PI / 3;
    const denom = 1 + e * Math.cos(thSample);
    if (Math.abs(denom) > 1e-6) {
      const r = (e * d) / denom;
      if (r > 0) {
        const P = { x: c.cx + r * Math.cos(thSample), y: c.cy + r * Math.sin(thSample) };
        const M = { x: c.cx + d, y: P.y };  // 准线上的垂足
        const PF = Math.hypot(P.x - c.cx, P.y - c.cy);
        const PM = Math.abs(P.x - M.x);
        const ratio = PF / Math.max(PM, 0.001);
        // 画 PF + PM
        drawLineSeg({ x: c.cx, y: c.cy }, P, '#fbbf24', 2);
        drawLineSeg(P, M, '#4ea1ff', 2, true);
        drawPoint(P, '#fbbf24', 'P', -14);
        // HUD 验证
        drawHudBox(W - 240, 20, 220, 130, [
          ['类型', e < 1 ? '椭圆' : e === 1 ? '抛物线' : '双曲线', color],
          ['离心率 e', e.toFixed(2), '#fb923c'],
          ['准线距 d', d.toFixed(0), '#8a96b0'],
          ['PF (焦点距)', PF.toFixed(1), '#fbbf24'],
          ['PM (准线距)', PM.toFixed(1), '#4ea1ff'],
          ['PF / PM', ratio.toFixed(3) + (Math.abs(ratio - e) < 0.01 ? ' ✓ ≈ e' : ''), '#6ee7b7'],
        ]);
      }
    }

    // 公式水印
    ctx.fillStyle = 'rgba(110,231,183,0.18)';
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('r(θ) = e·d / (1 + e·cos(θ))', 20, H - 20);
  }

  // 视图 2: 3 曲线并列对比
  function viewCompare(W, H) {
    drawGrid(W, H);
    const eList = [0.5, 1.0, 1.6];
    const dList = [120, 120, 120];
    const colors = ['#6ee7b7', '#f472b6', '#fb923c'];
    const labels = ['椭圆 (e=0.5)', '抛物 (e=1.0)', '双曲 (e=1.6)'];

    // 分 3 个画区(横向)
    const regionW = W / 3;
    for (let i = 0; i < 3; i++) {
      const e = eList[i], d = dList[i];
      const cx = regionW * i + regionW / 2;
      const cy = H / 2;
      // 局部网格 + 坐标轴
      ctx.strokeStyle = '#1a1f2a';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
      if (i > 0) { ctx.moveTo(cx - regionW / 2, 0); ctx.lineTo(cx - regionW / 2, H); }
      ctx.stroke();

      // 焦点 + 准线
      drawPoint({ x: cx, y: cy }, colors[i], 'F', -16);
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(cx + d, 0); ctx.lineTo(cx + d, H);
      ctx.stroke();
      ctx.setLineDash([]);

      // 曲线
      const pts = sampleConic(e, d, -Math.PI + 0.02, Math.PI - 0.02, 300);
      drawCurve(pts, cx, cy, colors[i], 2.5);
      if (e > 1) {
        const pts2 = sampleConicBranch2(e, d, 150);
        drawCurve(pts2, cx, cy, colors[i], 2.5);
      }

      // 标签
      ctx.fillStyle = colors[i];
      ctx.font = 'bold 13px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], cx, 24);
      ctx.fillStyle = '#8a93a6';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.fillText('PF/PM = ' + e.toFixed(1), cx, 42);
    }

    // 公式
    ctx.fillStyle = 'rgba(110,231,183,0.18)';
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('r(θ) = e·d / (1 + e·cos(θ))    3 类型并列', 20, H - 20);
  }

  // 视图 3: 锥体切片(2D 模拟:画 2 条线代表圆锥母线 + 截线 θ)
  function viewSlice(W, H) {
    drawGrid(W, H);
    const cx = W / 2, cy = H / 2;
    // 圆锥:左右 2 条线(母线,张开角 2α),顶点 V 在顶部
    const halfAngle = 35 * Math.PI / 180;  // 母线与中轴的夹角
    const coneHeight = Math.min(W, H) * 0.4;
    const baseR = coneHeight * Math.tan(halfAngle);
    const V = { x: cx, y: cy - coneHeight * 0.6 };
    const L1 = { x: cx - baseR, y: cy + coneHeight * 0.4 };
    const L2 = { x: cx + baseR, y: cy + coneHeight * 0.4 };

    // 画圆锥(用渐变填充)
    const grad = ctx.createLinearGradient(0, V.y, 0, L1.y);
    grad.addColorStop(0, 'rgba(78,161,255,0.05)');
    grad.addColorStop(1, 'rgba(78,161,255,0.25)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(V.x, V.y);
    ctx.lineTo(L1.x, L1.y);
    ctx.lineTo(L2.x, L1.y);
    ctx.closePath();
    ctx.fill();

    // 母线
    drawLineSeg(V, L1, '#4ea1ff', 2);
    drawLineSeg(V, L2, '#4ea1ff', 2);
    // 顶点
    drawPoint(V, '#8a93a6', 'V', -16);
    // 中轴
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(V.x, V.y);
    ctx.lineTo(cx, L1.y + 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // 截线(参数 sliceAngle,0 = 水平 → 圆,e=0)
    // 模拟:用 e 作为切片倾角指标(e ≈ sin(θ_slice) / sin(α))
    // 简化:画 1 条水平线 + 标注 e
    // 实际 3 种切片:
    //  - 水平(θ=0)→ 圆 e=0
    //  - 倾斜但 < α→ 椭圆 e<1
    //  - 平行母线(θ=α)→ 抛物线 e=1
    //  - 垂直母线(θ>α)→ 双曲线 e>1
    // 用 e 反推 θ
    let sliceType = 'circle';
    let thetaDeg = 0;
    if (params.e < 0.05) { sliceType = 'circle'; thetaDeg = 0; }
    else if (params.e < 0.99) {
      sliceType = 'ellipse'; thetaDeg = (params.e * halfAngle * 180) / Math.PI;
    } else if (params.e < 1.05) {
      sliceType = 'parabola'; thetaDeg = halfAngle * 180 / Math.PI;
    } else {
      sliceType = 'hyperbola'; thetaDeg = Math.min(89, (params.e * halfAngle * 180) / Math.PI);
    }

    // 截线斜率
    const sliceRadians = thetaDeg * Math.PI / 180;
    // 截线倾斜于水平
    // 截线与中轴交点(随便设个,跟 y=cy+0.3*coneHeight 接近)
    const lineY = cy + coneHeight * 0.2;
    const lineDX = 200;
    const lineDY = lineDX * Math.tan(sliceRadians);
    const Lp1 = { x: cx - lineDX, y: lineY - lineDY };
    const Lp2 = { x: cx + lineDX, y: lineY + lineDY };
    let lineColor = '#6ee7b7';
    if (sliceType === 'ellipse') lineColor = '#6ee7b7';
    else if (sliceType === 'parabola') lineColor = '#f472b6';
    else if (sliceType === 'hyperbola') lineColor = '#fb923c';
    else lineColor = '#fbbf24';
    drawLineSeg(Lp1, Lp2, lineColor, 3);

    // 标注
    ctx.fillStyle = lineColor;
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`切片: ${sliceType} (e=${params.e.toFixed(2)})`, 20, 28);
    ctx.fillStyle = '#8a93a6';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillText('水平 → 圆(e=0) · 倾斜<母线 → 椭圆 · 平行母线 → 抛物线 · 垂直母线 → 双曲线', 20, 48);
    ctx.fillStyle = '#8a93a6';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillText('Apollonius ~200BC:3 类型 = 3 种平面截圆锥的方式', 20, H - 16);

    // 公式水印
    ctx.fillStyle = 'rgba(110,231,183,0.18)';
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('r(θ) = e·d / (1 + e·cos(θ))', W - 20, H - 20);
  }

  // 视图 4: 几何性质表
  function viewProps(W, H) {
    drawGrid(W, H);
    const c = { cx: W / 2 - 100, cy: H / 2 };
    const e = params.e, d = params.d;
    const p = conicProps(e, d);

    drawFocusAndDirectrix(c, W, H, d);

    // 画曲线
    const pts = sampleConic(e, d, -Math.PI + 0.02, Math.PI - 0.02, 360);
    let color = '#6ee7b7';
    if (e === 1) color = '#f472b6';
    else if (e > 1) color = '#fb923c';
    drawCurve(pts, c.cx, c.cy, color, 2.5);
    if (e > 1) {
      const pts2 = sampleConicBranch2(e, d, 180);
      drawCurve(pts2, c.cx, c.cy, color, 2.5);
    }

    // 高亮长半轴 a(对 e<1)/ 实半轴(对 e>1)
    if (e < 1) {
      // 椭圆:长轴 a 沿 x,中心 O 在 (a - ed/(1-e²), 0) 处(状态空间)
      // 简化:用 ed/(1-e²) 作为远端距焦点的距离 a-c
      const centerX = c.cx + p.a - p.c;  // 焦点在原点,中心在 x = a - c
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(centerX - p.a, c.cy);
      ctx.lineTo(centerX + p.a, c.cy);
      ctx.stroke();
      ctx.setLineDash([]);
      // 中心 O
      drawPoint({ x: centerX, y: c.cy }, '#fbbf24', 'O', -16);
      // 另一焦点 F2
      drawPoint({ x: c.cx + 2 * p.c, y: c.cy }, '#fb923c', "F'", 22);
    } else if (e > 1) {
      // 双曲线:实轴 a 沿 x,中心 O 在 (ed/(e²-1), 0)
      const centerX = c.cx + p.a;  // 中心在 x = a(状态空间)
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(centerX - p.a, c.cy);
      ctx.lineTo(centerX + p.a, c.cy);
      ctx.stroke();
      ctx.setLineDash([]);
      drawPoint({ x: centerX, y: c.cy }, '#fbbf24', 'O', -16);
      drawPoint({ x: c.cx + 2 * p.c, y: c.cy }, '#fb923c', "F'", 22);
    }
    // 抛物线:通径(过焦点垂直于轴的弦,长 2e·d = 2d for e=1)
    const latR = 2 * e * d / (e < 1 ? (1 - e * e) : (e > 1 ? (e * e - 1) : 1));
    if (isFinite(latR) && latR < 2000) {
      const A = { x: c.cx, y: c.cy - latR / 2 };
      const B = { x: c.cx, y: c.cy + latR / 2 };
      drawLineSeg(A, B, '#fbbf24', 1.5, true);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('通径=' + latR.toFixed(0), B.x + 8, (A.y + B.y) / 2);
    }

    // HUD 几何性质
    let lines = [
      ['类型', p.type, color],
      ['离心率 e', e.toFixed(2), '#fb923c'],
      ['准线距 d', d.toFixed(0), '#8a96b0'],
    ];
    if (e < 1) {
      lines.push(
        ['长半轴 a', p.a.toFixed(1), '#fbbf24'],
        ['短半轴 b', p.b.toFixed(1), '#fbbf24'],
        ['半焦距 c', p.c.toFixed(1), '#fb923c'],
        ['通径 2b²/a', p.p.toFixed(1), '#4ea1ff'],
        ['c² = a² - b²', (p.c * p.c).toFixed(1) + ' = ' + (p.a * p.a - p.b * p.b).toFixed(1), '#6ee7b7']
      );
    } else if (e > 1) {
      lines.push(
        ['实半轴 a', p.a.toFixed(1), '#fbbf24'],
        ['虚半轴 b', p.b.toFixed(1), '#fbbf24'],
        ['半焦距 c', p.c.toFixed(1), '#fb923c'],
        ['通径 2b²/a', p.p.toFixed(1), '#4ea1ff'],
        ['c² = a² + b²', (p.c * p.c).toFixed(1) + ' = ' + (p.a * p.a + p.b * p.b).toFixed(1), '#6ee7b7']
      );
    } else {
      lines.push(
        ['通径 2d', p.p.toFixed(1), '#4ea1ff'],
        ['顶点在 (d, 0)', '焦准线中点', '#fbbf24']
      );
    }
    drawHudBox(W - 270, 20, 250, lines.length * 18 + 20, lines);
  }

  // ---------- 渲染循环 ----------
  const loop = makeLoop(() => {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(0, 0, W, H);

    if (params.mode === 'dynamic') viewDynamic(W, H);
    else if (params.mode === 'compare') viewCompare(W, H);
    else if (params.mode === 'slice') viewSlice(W, H);
    else viewProps(W, H);

    ctx.restore();
  });

  // ---------- 控件绑定 ----------
  ctrls.querySelector('[data-mode]').addEventListener('change', (e) => {
    params.mode = e.target.value;
  });
  ctrls.querySelector('[data-e]').addEventListener('input', (e) => {
    setE(+e.target.value);
  });
  ctrls.querySelector('[data-d]').addEventListener('input', (e) => {
    params.d = +e.target.value;
    ctrls.querySelector('[data-d-v]').textContent = params.d;
  });
  ctrls.querySelector('[data-p-circle]').addEventListener('click', () => {
    setE(0.01);  // 接近 0(用户范围 0.3 起,只能尽量小)
  });
  ctrls.querySelector('[data-p-ellipse]').addEventListener('click', () => setE(0.7));
  ctrls.querySelector('[data-p-parabola]').addEventListener('click', () => setE(1.0));
  ctrls.querySelector('[data-p-hyper]').addEventListener('click', () => setE(1.5));

  // ---------- AI 接口 ----------
  return {
    sceneId: 'conic-unified',
    getFormula() {
      return 'r(θ) = e·d / (1 + e·cos(θ))    (焦点极坐标,准线 x = d)';
    },
    getLesson() {
      return `圆锥曲线统一定义 (Conic Sections, Apollonius ~200BC)
焦点极坐标:r(θ) = e·d / (1 + e·cos(θ))    e = PF/PM = 离心率
3 大类型:
  ① 椭圆 e ∈ (0,1) — 闭合,a = ed/(1-e²), b = a√(1-e²), c = ae
  ② 抛物线 e = 1 — 开口,通径 = 2d
  ③ 双曲线 e > 1 — 2 支,a = ed/(e²-1), b = a√(e²-1), c = ae
二次曲线一般方程 Ax²+Bxy+Cy²+Dx+Ey+F=0:
  判别式 Δ = B²-4AC,Δ<0 椭圆型,Δ=0 抛物线型,Δ>0 双曲线型
历史:Apollonius of Perga ~200BC《圆锥曲线论》命名 3 类型;Newton 1687 证明开普勒第一定律
应用:行星椭圆轨道 · 抛物面天线 · LORAN-C 双曲线导航 · 二次曲线分类`;
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
