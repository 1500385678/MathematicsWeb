// viewer/scenes/40_ellipse-analytic.js
// MathematicsWeb v0.6.42 — 椭圆解析几何 (数学 × 高中解析几何 · 高一)
// 2D Canvas 场景:标准方程 x²/a² + y²/b² = 1 + 4 视图
//   - 标准方程 + 焦点/准线
//   - 焦半径验证 r1 + r2 = 2a(王炸)
//   - 光学反射 F1 → P → F2 角度相等
//   - 参数方程 x=a·cos(θ), y=b·sin(θ) + 辅助圆
//
// 数学(椭圆解析几何 Ellipse Analytic Geometry):
//   标准方程(焦点在 x 轴,中心在原点):x²/a² + y²/b² = 1    (a > b > 0)
//   离心率:e = c/a ∈ (0, 1)
//   半焦距:c² = a² - b²
//   焦点:F1(-c, 0), F2(c, 0)
//   准线:x = ±a/e
//   焦半径(点 P(x, y) 在椭圆上):
//     r1 = PF1 = a + ex   (e ∈ (0,1) 时,右半 e<0 → r1<2a)
//     r2 = PF2 = a - ex
//     重要恒等式:r1 + r2 = 2a  (椭圆定义:到两焦点距离之和 = 2a = 长轴长)
//   光学性质:从 F1 出发的光线经椭圆反射后必过 F2(法线平分 ∠F1PF2 的外角)
//   几何性质:
//     通径(过焦点垂直于长轴的弦):2b²/a
//     面积:πab
//     周长:近似 2π√((a²+b²)/2)  精确:4a·E(e)  E 为第二类完全椭圆积分
//
// 历史:
//   - Apollonius of Perga ~200BC《圆锥曲线论》最早研究椭圆(希腊语 elleipsis 意为"不足")
//   - Kepler 1609 第一定律:行星轨道是椭圆,太阳在焦点
//   - Descartes 1637 解析几何证明椭圆可表为二次方程
//   - Newton 1687 用万有引力 + 离心力证明开普勒定律
//   - 19 世纪 Steiner / Plücker 综合几何 + 二次曲线理论
//
// 应用:
//   - 天文:行星/彗星轨道(开普勒第一定律,e=0.0167 地球,e=0.967 哈雷彗星)
//   - 工程:椭圆拱(受力最优)/ 椭圆桌(声音聚焦)/ 椭圆齿轮(凸轮)
//   - 医学:体外碎石术(ESWL,冲击波聚焦到肾结石)
//   - 物理:简谐振动投影(THAT's why Lissajous 用椭圆!)/ 光的反射
//   - 数学:椭圆积分(自然对数底 e 的来源!) / 黎曼面 / 椭圆曲线密码学

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
    <div class="mathw-lesson-title">数学 × 高中解析几何 · 椭圆解析</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">x²/a² + y²/b² = 1 · r1 + r2 = 2a · F1↔F2 反射</div>
      <div class="mathw-lesson-formula">r1 = a + ex,  r2 = a - ex,  r1 + r2 = 2a</div>
      <div class="mathw-lesson-text">
        <strong>椭圆标准方程</strong>(焦点在 x 轴):<strong>x²/a² + y²/b² = 1</strong>(a > b > 0)。<br>
        <strong>关键参数</strong>:<br>
        ① <strong>离心率 e = c/a ∈ (0, 1)</strong> — e 越接近 0 越圆,e→0 退化为圆,e→1 极限压扁为线段。<br>
        ② <strong>半焦距 c² = a² - b²</strong> — 焦点 F1(-c, 0) / F2(c, 0)。<br>
        ③ <strong>准线 x = ±a/e</strong> — 椭圆外 2 条竖直准线(R 越扁越远)。<br>
        ④ <strong>焦半径</strong>:P(x, y) 在椭圆上 → <strong>r1 = PF1 = a + ex, r2 = PF2 = a - ex</strong>。<br>
        <strong>王炸恒等式</strong>:<strong>r1 + r2 = 2a</strong>(到两焦点距离之和 = 长轴长) — 椭圆的定义本身。<br>
        <strong>光学反射</strong>:从 F1 出发的光经椭圆反射后必过 F2 — 法线平分 ∠F1PF2 的外角,这也是为什么椭圆桌能聚焦声音 / 椭圆反射镜能聚焦光线。<br>
        <strong>历史</strong>:Apollonius ~200BC 命名;Kepler 1609 第一定律(行星椭圆轨道);Newton 1687 推导开普勒定律。<br>
        拖动 a / b 滑块,实时看 e/c 变化,拖 P 验证 r1 + r2 = 2a 和光学反射性质。<br>
        应用:行星轨道 · 椭圆拱/碎石术 · 简谐振动投影 · 椭圆曲线密码学(ECC)。
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
    <div class="mathw-controls-title">参数 · 椭圆解析</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">视图模式</span>
      <select data-mode>
        <option value="standard" selected>标准方程 + 焦点/准线</option>
        <option value="radii">焦半径验证(王炸)</option>
        <option value="reflect">光学反射 F1↔F2</option>
        <option value="param">参数方程 + 辅助圆</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">长半轴 a</span>
      <input type="range" min="100" max="280" step="5" value="200" data-a />
      <span class="mathw-control-value" data-a-v>200</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">短半轴 b</span>
      <input type="range" min="50" max="220" step="5" value="140" data-b />
      <span class="mathw-control-value" data-b-v>140</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">预设</span>
      <button data-p-circ>圆 (b=a)</button>
      <button data-p-e05>e=0.5</button>
      <button data-p-e08>e=0.8</button>
      <button data-p-earth>地球轨道 (e=0.017)</button>
    </div>
    <div class="mathw-control-row" style="font-size:11px;color:var(--mathw-muted)">
      焦半径/反射/参数视图:拖动椭圆上的 P 点(黄)
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let params = { mode: 'standard', a: 200, b: 140 };
  // P 在椭圆上的角度参数 θ(0 到 2π)
  let theta = Math.PI / 4;  // 默认 45°

  function setAB(a, b) {
    params.a = Math.max(b + 10, a);  // 确保 a > b
    params.b = Math.min(params.a - 10, b);
    ctrls.querySelector('[data-a]').value = params.a;
    ctrls.querySelector('[data-b]').value = params.b;
    ctrls.querySelector('[data-a-v]').textContent = params.a;
    ctrls.querySelector('[data-b-v]').textContent = params.b;
  }

  // ---------- 几何工具 ----------
  // 半焦距 c = sqrt(a² - b²), 离心率 e = c/a
  function getE() { return Math.sqrt(1 - (params.b * params.b) / (params.a * params.a)); }
  function getC() { return Math.sqrt(params.a * params.a - params.b * params.b); }
  // 椭圆上参数 θ 对应的点
  function ellipsePoint(theta) {
    return { x: params.a * Math.cos(theta), y: params.b * Math.sin(theta) };
  }
  // 焦半径
  function radii(p) {
    // F1 = (-c, 0), F2 = (c, 0)
    const c = getC();
    const r1 = Math.hypot(p.x + c, p.y);
    const r2 = Math.hypot(p.x - c, p.y);
    return { r1, r2, F1: { x: -c, y: 0 }, F2: { x: c, y: 0 } };
  }

  // 屏幕坐标 = 状态空间(中心原点) + 屏幕中心
  function stateToScreen(p, c) {
    return { x: c.cx + p.x, y: c.cy - p.y };  // y 翻转(数学 y↑,屏幕 y↓)
  }
  function screenToState(s, c) {
    return { x: s.x - c.cx, y: -(s.y - c.cy) };
  }

  // 椭圆 → 屏幕坐标(用于画椭圆线)
  function drawEllipse(c, color, width = 2.5) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    // 椭圆参数方程:canvas 用 ellipse() 即可(中心 cx,cy,半径 a,b)
    ctx.ellipse(c.cx, c.cy, params.a, params.b, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

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

  // 画焦点 F1, F2 + 准线 x = ±a/e(在标准/焦半径/反射/参数视图通用)
  function drawFociAndDirectrices(c, W, H) {
    const cc = getC(), e = getE();
    const F1s = stateToScreen({ x: -cc, y: 0 }, c);
    const F2s = stateToScreen({ x: cc, y: 0 }, c);
    drawPoint(F1s, '#fb923c', 'F1', -16);
    drawPoint(F2s, '#fb923c', 'F2', 22);

    // 准线
    if (e > 0.05) {
      const dLine = params.a / e;
      const dl1s = { x: c.cx - dLine, y: 0 };
      const dl2s = { x: c.cx + dLine, y: 0 };
      ctx.strokeStyle = '#8a93a6';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(dl1s.x, 0); ctx.lineTo(dl1s.x, H);
      ctx.moveTo(dl2s.x, 0); ctx.lineTo(dl2s.x, H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#8a93a6';
      ctx.font = 'bold 10px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('x=-a/e', dl1s.x, 14);
      ctx.fillText('x=+a/e', dl2s.x, 14);
    }
  }

  // 视图 1: 标准方程 + 焦点/准线
  function viewStandard(W, H) {
    const c = { cx: W / 2, cy: H / 2 };
    const e = getE(), cc = getC();

    drawGrid(W, H);
    drawEllipse(c, '#6ee7b7', 2.5);
    drawFociAndDirectrices(c, W, H);

    // 标 a, b
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('a=' + params.a, c.cx + params.a * 0.5, c.cy - 8);
    ctx.fillText('-a', c.cx - params.a, c.cy + 18);
    ctx.fillText('+a', c.cx + params.a, c.cy + 18);
    ctx.save();
    ctx.translate(c.cx + 8, c.cy - params.b * 0.5);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('b=' + params.b, 0, 0);
    ctx.restore();

    // HUD 关键参数
    drawHudBox(20, 20, 240, 130, [
      ['标准方程', 'x²/' + params.a + '² + y²/' + params.b + '² = 1', '#6ee7b7'],
      ['长半轴 a', params.a.toFixed(0), '#fbbf24'],
      ['短半轴 b', params.b.toFixed(0), '#fbbf24'],
      ['半焦距 c', cc.toFixed(1), '#fb923c'],
      ['离心率 e', e.toFixed(3), '#fb923c'],
      ['c² = a²-b²', (cc * cc).toFixed(0) + ' = ' + (params.a * params.a - params.b * params.b).toFixed(0), '#8a96b0'],
      ['面积 πab', (Math.PI * params.a * params.b).toFixed(0), '#4ea1ff'],
    ]);
  }

  // 视图 2: 焦半径验证(王炸)
  function viewRadii(W, H) {
    const c = { cx: W / 2, cy: H / 2 };
    const e = getE(), cc = getC();

    drawGrid(W, H);
    drawEllipse(c, '#6ee7b7', 2.5);

    // P 点
    const P_state = ellipsePoint(theta);
    const Ps = stateToScreen(P_state, c);
    drawPoint(Ps, '#fbbf24', 'P', -16);

    // 焦点
    const F1s = stateToScreen({ x: -cc, y: 0 }, c);
    const F2s = stateToScreen({ x: cc, y: 0 }, c);
    drawPoint(F1s, '#fb923c', 'F1', -16);
    drawPoint(F2s, '#fb923c', 'F2', 22);

    // 焦半径 r1 (PF1), r2 (PF2)
    const { r1, r2 } = radii(P_state);
    drawLineSeg(Ps, F1s, '#f472b6', 2.5);
    drawLineSeg(Ps, F2s, '#4ea1ff', 2.5);
    // 标注 r1, r2
    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    const mid1 = { x: (Ps.x + F1s.x) / 2, y: (Ps.y + F1s.y) / 2 - 8 };
    ctx.fillText('r1=' + r1.toFixed(1), mid1.x, mid1.y);
    ctx.fillStyle = '#4ea1ff';
    const mid2 = { x: (Ps.x + F2s.x) / 2 + 30, y: (Ps.y + F2s.y) / 2 - 8 };
    ctx.fillText('r2=' + r2.toFixed(1), mid2.x, mid2.y);

    // 验证
    const sum = r1 + r2;
    const expected = 2 * params.a;
    const diff = Math.abs(sum - expected);
    const ok = diff < 0.5;

    drawHudBox(20, 20, 260, 150, [
      ['参数 θ', (theta * 180 / Math.PI).toFixed(0) + '°', '#fbbf24'],
      ['P 坐标', '(' + P_state.x.toFixed(1) + ', ' + P_state.y.toFixed(1) + ')', '#fbbf24'],
      ['r1 = PF1', r1.toFixed(2), '#f472b6'],
      ['r2 = PF2', r2.toFixed(2), '#4ea1ff'],
      ['r1 + r2', sum.toFixed(2), '#6ee7b7'],
      ['2a(期望)', expected.toFixed(2), '#fbbf24'],
      ['|差|', diff.toFixed(3), ok ? '#6ee7b7' : '#ef4444'],
      ['验证', ok ? '✓ r1 + r2 = 2a' : '✗ 不等', ok ? '#6ee7b7' : '#ef4444'],
    ]);

    // 公式水印
    ctx.fillStyle = 'rgba(110,231,183,0.18)';
    ctx.font = 'bold 18px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('r1 + r2 = 2a', W - 20, H - 20);
  }

  // 视图 3: 光学反射 F1 → P → F2
  function viewReflect(W, H) {
    const c = { cx: W / 2, cy: H / 2 };
    const e = getE(), cc = getC();

    drawGrid(W, H);
    drawEllipse(c, '#6ee7b7', 2.5);

    // P
    const P_state = ellipsePoint(theta);
    const Ps = stateToScreen(P_state, c);
    drawPoint(Ps, '#fbbf24', 'P', -16);

    // 焦点
    const F1s = stateToScreen({ x: -cc, y: 0 }, c);
    const F2s = stateToScreen({ x: cc, y: 0 }, c);
    drawPoint(F1s, '#fb923c', 'F1', -16);
    drawPoint(F2s, '#fb923c', 'F2', 22);

    // 反射线:F1 → P → F2
    // F1→P 入射(蓝),P→F2 反射(绿)
    drawLineSeg(F1s, Ps, '#4ea1ff', 2.5);
    drawLineSeg(Ps, F2s, '#6ee7b7', 2.5);

    // 椭圆在 P 处的法线(连接 F1 和 F2 的角平分线) — 反射定律
    // 入射角:PF1 与法线的夹角;反射角:PF2 与法线的夹角 — 相等
    // 实际:法线沿 PF1 + PF2 方向
    // 画法线(从 P 向外延伸)
    const normDx = (F1s.x - Ps.x) / Math.hypot(F1s.x - Ps.x, F1s.y - Ps.y)
                 + (F2s.x - Ps.x) / Math.hypot(F2s.x - Ps.x, F2s.y - Ps.y);
    const normDy = (F1s.y - Ps.y) / Math.hypot(F1s.x - Ps.x, F1s.y - Ps.y)
                 + (F2s.y - Ps.y) / Math.hypot(F2s.x - Ps.x, F2s.y - Ps.y);
    const normLen = Math.hypot(normDx, normDy);
    if (normLen > 0.01) {
      const nx = normDx / normLen, ny = normDy / normLen;
      const Nend = { x: Ps.x + nx * 60, y: Ps.y + ny * 60 };
      drawLineSeg(Ps, Nend, '#fbbf24', 1.5, true);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('法线', Nend.x + 4, Nend.y);
    }

    // 入射角 / 反射角标注(用 arc 弧)
    const ang1 = Math.atan2(F1s.y - Ps.y, F1s.x - Ps.x);
    const ang2 = Math.atan2(F2s.y - Ps.y, F2s.x - Ps.x);
    const angN = Math.atan2(normDy, normDx);
    function arcBetween(a, b, r, color) {
      let dA = b - a;
      while (dA > Math.PI) dA -= Math.PI * 2;
      while (dA < -Math.PI) dA += Math.PI * 2;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(Ps.x, Ps.y, r, a, b, dA < 0);
      ctx.stroke();
    }
    arcBetween(angN, ang1, 28, '#4ea7f4');
    arcBetween(angN, ang2, 38, '#6ee7b7');
    // 标角度
    const incAng = Math.abs(((ang1 - angN) * 180 / Math.PI + 540) % 360 - 180);
    const refAng = Math.abs(((ang2 - angN) * 180 / Math.PI + 540) % 360 - 180);
    const minInc = Math.min(incAng, 360 - incAng);
    const minRef = Math.min(refAng, 360 - refAng);
    const ok = Math.abs(minInc - minRef) < 0.5;

    drawHudBox(20, 20, 280, 130, [
      ['参数 θ', (theta * 180 / Math.PI).toFixed(0) + '°', '#fbbf24'],
      ['入射角(蓝弧)', minInc.toFixed(1) + '°', '#4ea1ff'],
      ['反射角(绿弧)', minRef.toFixed(1) + '°', '#6ee7b7'],
      ['|入射-反射|', Math.abs(minInc - minRef).toFixed(2) + '°', ok ? '#6ee7b7' : '#ef4444'],
      ['光学验证', ok ? '✓ 反射定律(法线平分 F1PF2)' : '✗', ok ? '#6ee7b7' : '#ef4444'],
      ['几何解释', '法线 = F1P + F2P 角平分线', '#8a96b0'],
    ]);

    // 公式水印
    ctx.fillStyle = 'rgba(110,231,183,0.18)';
    ctx.font = 'bold 18px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('F1 → P → F2  · 反射定律', W - 20, H - 20);
  }

  // 视图 4: 参数方程 + 辅助圆
  function viewParam(W, H) {
    const c = { cx: W / 2, cy: H / 2 };
    const e = getE(), cc = getC();

    drawGrid(W, H);

    // 辅助圆 x² + y² = a²
    ctx.strokeStyle = '#8a93a6';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, params.a, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#8a93a6';
    ctx.font = 'bold 10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('辅助圆 x²+y²=a²', c.cx, c.cy - params.a - 8);

    // 椭圆
    drawEllipse(c, '#6ee7b7', 2.5);

    // 当前 θ 对应的辅助点 Q = (a cos θ, a sin θ) 在辅助圆上
    const Q_state = { x: params.a * Math.cos(theta), y: params.a * Math.sin(theta) };
    const Qs = stateToScreen(Q_state, c);
    // P 椭圆上的点
    const P_state = ellipsePoint(theta);
    const Ps = stateToScreen(P_state, c);

    // 画 Q + 投影线 Q → P(垂直方向):Q.y 投影到 P.y = b sin θ
    drawPoint(Qs, '#8a93a6', 'Q', -16);
    drawPoint(Ps, '#fbbf24', 'P', -16);
    // Q 垂直向下投影到 y = P.y(水平线),再水平移到 P.x
    const projH = { x: Qs.x, y: Ps.y };
    drawLineSeg(Qs, projH, '#4ea1ff', 1.5, true);
    drawLineSeg(projH, Ps, '#4ea1ff', 1.5, true);

    // 焦点
    const F1s = stateToScreen({ x: -cc, y: 0 }, c);
    const F2s = stateToScreen({ x: cc, y: 0 }, c);
    drawPoint(F1s, '#fb923c', 'F1', -16);
    drawPoint(F2s, '#fb923c', 'F2', 22);

    // θ 角度弧(在原点处)
    const aR = 30;
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, aR, 0, -theta, theta > 0);
    ctx.stroke();
    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    const labelR = aR + 14;
    const labelTheta = -theta / 2;
    ctx.fillText('θ=' + (theta * 180 / Math.PI).toFixed(0) + '°',
      c.cx + labelR * Math.cos(labelTheta),
      c.cy - labelR * Math.sin(labelTheta));

    // HUD
    drawHudBox(20, 20, 260, 150, [
      ['参数 θ', (theta * 180 / Math.PI).toFixed(1) + '°', '#f472b6'],
      ['P = (a·cos θ, b·sin θ)', '(' + P_state.x.toFixed(1) + ', ' + P_state.y.toFixed(1) + ')', '#fbbf24'],
      ['Q = (a·cos θ, a·sin θ)', '(' + Q_state.x.toFixed(1) + ', ' + Q_state.y.toFixed(1) + ')', '#8a93a6'],
      ['a·cos θ', (params.a * Math.cos(theta)).toFixed(1), '#fbbf24'],
      ['b·sin θ', (params.b * Math.sin(theta)).toFixed(1), '#fbbf24'],
      ['P 满足 x²/a²+y²/b²', ((P_state.x * P_state.x) / (params.a * params.a) + (P_state.y * P_state.y) / (params.b * params.b)).toFixed(3) + ' ≈ 1', '#6ee7b7'],
    ]);
  }

  // ---------- 渲染循环 ----------
  const loop = makeLoop(() => {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(0, 0, W, H);

    if (params.mode === 'standard') viewStandard(W, H);
    else if (params.mode === 'radii') viewRadii(W, H);
    else if (params.mode === 'reflect') viewReflect(W, H);
    else viewParam(W, H);

    ctx.restore();
  });

  // ---------- 交互 ----------
  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  // 鼠标点 → 椭圆上最近点(用极角 θ 离散搜索)
  function screenToTheta(s, c) {
    const state = screenToState(s, c);
    // 椭圆参数: x = a cos θ, y = b sin θ → 椭圆上每点 (x, y) 对应一个 θ
    // 反推:cos θ = x/a, sin θ = y/b
    let t = Math.atan2(state.y / params.b, state.x / params.a);
    if (t < 0) t += Math.PI * 2;
    return t;
  }
  function isOnEllipse(s, c) {
    const state = screenToState(s, c);
    const v = (state.x * state.x) / (params.a * params.a) + (state.y * state.y) / (params.b * params.b);
    return Math.abs(v - 1) < 0.12;  // 容差(允许附近点击吸附)
  }

  let drag = false;
  function onDown(e) {
    const s = getMousePos(e);
    const c = { cx: canvas.width / 2 / (window.devicePixelRatio || 1), cy: canvas.height / 2 / (window.devicePixelRatio || 1) };
    if (params.mode !== 'standard' && isOnEllipse(s, c)) {
      drag = true;
      theta = screenToTheta(s, c);
    }
  }
  function onMove(e) {
    if (!drag) return;
    const s = getMousePos(e);
    const c = { cx: canvas.width / 2 / (window.devicePixelRatio || 1), cy: canvas.height / 2 / (window.devicePixelRatio || 1) };
    theta = screenToTheta(s, c);
  }
  function onUp() { drag = false; }
  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(e.touches[0]); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); onMove(e.touches[0]); }, { passive: false });
  canvas.addEventListener('touchend', onUp);

  // ---------- 控件绑定 ----------
  ctrls.querySelector('[data-mode]').addEventListener('change', (e) => {
    params.mode = e.target.value;
  });
  ctrls.querySelector('[data-a]').addEventListener('input', (e) => {
    setAB(+e.target.value, params.b);
  });
  ctrls.querySelector('[data-b]').addEventListener('input', (e) => {
    setAB(params.a, +e.target.value);
  });
  ctrls.querySelector('[data-p-circ]').addEventListener('click', () => setAB(180, 180));
  ctrls.querySelector('[data-p-e05]').addEventListener('click', () => setAB(200, 173));  // e=0.5 → b = a√(0.75) ≈ 173
  ctrls.querySelector('[data-p-e08]').addEventListener('click', () => setAB(200, 120));  // e=0.8 → b = 120
  ctrls.querySelector('[data-p-earth]').addEventListener('click', () => setAB(200, 199.86));  // e=0.017

  // ---------- AI 接口 ----------
  return {
    sceneId: 'ellipse-analytic',
    getFormula() {
      return 'x²/a² + y²/b² = 1;  e = c/a, c² = a² - b²;  r1 = a + ex, r2 = a - ex, r1 + r2 = 2a';
    },
    getLesson() {
      return `椭圆解析几何 (Ellipse Analytic Geometry)
标准方程:x²/a² + y²/b² = 1    (a > b > 0)
离心率:e = c/a ∈ (0, 1)    e → 0 圆,e → 1 压扁
半焦距:c² = a² - b²
焦点:F1(-c, 0), F2(c, 0)
准线:x = ±a/e
焦半径:P(x, y) 在椭圆上 → r1 = a + ex, r2 = a - ex
王炸恒等式:r1 + r2 = 2a(到两焦点距离之和 = 长轴长)
光学反射:F1 出发的光经椭圆反射后必过 F2(法线平分 ∠F1PF2 的外角)
参数方程:x = a·cos θ, y = b·sin θ
面积:πab
历史:Apollonius ~200BC 命名;Kepler 1609 第一定律;Newton 1687 推导
应用:行星轨道(地球 e=0.017,哈雷彗星 e=0.967)· 椭圆拱 / 碎石术 · 椭圆曲线密码学(ECC)`;
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
