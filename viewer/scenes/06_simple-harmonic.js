// viewer/scenes/06_simple-harmonic.js
// MathematicsWeb v0.2.0 — 简谐振动 (数学 × 物理)· 阻尼 + 强迫振动版
// 2D Canvas 场景:三种简谐系统(弹簧 / 单摆 / LC 电路)· v0.2.0 加阻尼 + 强迫振动
//   - 上方画系统 + 阻尼可视化(能量条往下)
//   - 下方画 x(t) 位置 + 包络线 ±A·e^(-γt) + v(t) 速度
//   - 调 ω(频率)、γ(阻尼)、F0(外力幅值)、ωF(外力频率) 看衰减 / 共振
//
// 数学:
//   无阻尼:x¨ + ω²x = 0                       → x(t) = A·cos(ωt+φ)
//   有阻尼:x¨ + 2γx˙ + ω²x = 0                → 衰减振荡,包络 A·e^(-γt)
//   强迫振:x¨ + 2γx˙ + ω²x = F0·cos(ωF·t)    → 共振(ωF = ω 时幅值最大)
//
// 数值:RK4 积分(代替解析式,支持任意阻尼和外力)
//
// 三个系统 ω:
//   弹簧 ω = √(k/m)
//   单摆 ω = √(g/L)(小角度近似)
//   LC 电路 ω = 1/√(LC)

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
    <div class="mathw-lesson-title">数学 × 物理 · 简谐振动 · 阻尼 + 共振</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">三个系统,一条方程</div>
      <div class="mathw-lesson-formula">x¨ + 2γx˙ + ω²x = F₀·cos(ωF·t)</div>
      <div class="mathw-lesson-text">
        <strong>无阻尼</strong>(γ=0):永不停。<strong>有阻尼</strong>(γ>0):振幅 <strong>指数衰减</strong> A·e^(-γt)。
        <strong>强迫振动</strong>(F₀>0):外部推一下。<strong>共振</strong> = 外力频率 ωF 接近固有频率 ω 时,振幅暴涨。
        调 γ(阻尼)和 F₀(外力)看效果,设 ωF ≈ ω 触发共振。<br>
        调<strong>重置</strong>按钮让 x 回到初始 A=1。
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
    <div class="mathw-controls-title">参数 · 简谐振动 · v0.2.0</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">系统</span>
      <select data-system>
        <option value="spring" selected>弹簧</option>
        <option value="pendulum">单摆</option>
        <option value="lc">LC 电路</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">频率 ω</span>
      <input type="range" min="0.3" max="3" step="0.1" value="1.5" data-w />
      <span class="mathw-control-value" data-w-v>1.50</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">阻尼 γ</span>
      <input type="range" min="0" max="0.5" step="0.01" value="0" data-gamma />
      <span class="mathw-control-value" data-gamma-v>0.00</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">外力 F₀</span>
      <input type="range" min="0" max="2" step="0.05" value="0" data-F0 />
      <span class="mathw-control-value" data-F0-v>0.00</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">外力 ωF</span>
      <input type="range" min="0.3" max="3" step="0.1" value="1.5" data-wF />
      <span class="mathw-control-value" data-wF-v>1.50</span>
    </div>
    <div class="mathw-control-row">
      <button data-reset>重置</button>
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let params = { w: 1.5, gamma: 0, F0: 0, wF: 1.5, system: 'spring' };
  // 用数值积分,不用解析式
  let simT = 0;
  let x = 1.0, v = 0.0;       // 初值: x=1, v=0
  const history = [];
  const MAX_HIST = 800;
  const SIM_DT = 0.016;

  function reset() {
    simT = 0;
    x = 1.0;
    v = 0.0;
    history.length = 0;
  }

  // 阻尼强迫振的 RK4
  // dx/dt = v
  // dv/dt = -2γv - ω²x + F₀·cos(ωF·t)
  function derivs(s, p, t) {
    return [s[1], -2 * p.gamma * s[1] - p.w * p.w * s[0] + p.F0 * Math.cos(p.wF * t)];
  }
  function rk4Step(x, v, p, t, dt) {
    const s = [x, v];
    const k1 = derivs(s, p, t);
    const s2 = [s[0] + 0.5 * dt * k1[0], s[1] + 0.5 * dt * k1[1]];
    const k2 = derivs(s2, p, t + 0.5 * dt);
    const s3 = [s[0] + 0.5 * dt * k2[0], s[1] + 0.5 * dt * k2[1]];
    const k3 = derivs(s3, p, t + 0.5 * dt);
    const s4 = [s[0] + dt * k3[0], s[1] + dt * k3[1]];
    const k4 = derivs(s4, p, t + dt);
    return [
      s[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
      s[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    ];
  }

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  function draw(elapsed, dt) {
    // 推进
    [x, v] = rk4Step(x, v, params, simT, SIM_DT);
    simT += SIM_DT;
    history.push({ t: simT, x, v });
    if (history.length > MAX_HIST) history.shift();

    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    const upperH = H * 0.45;
    drawSystem(ctx, W, upperH, x, v, params);

    ctx.strokeStyle = '#2a3140';
    ctx.beginPath();
    ctx.moveTo(0, upperH);
    ctx.lineTo(W, upperH);
    ctx.stroke();

    drawChart(ctx, 0, upperH, W, H - upperH, history, params);
    drawHUD(ctx, W, upperH);

    ctx.restore();
  }

  function drawSystem(c, W, H, x, v, system) {
    if (system === 'spring') drawSpring(c, W, H, x);
    else if (system === 'pendulum') drawPendulum(c, W, H, x);
    else if (system === 'lc') drawLC(c, W, H, x, v);
  }

  function drawSpring(c, W, H, x) {
    const cx = W / 2, cy = H * 0.7;
    c.fillStyle = '#8a93a6';
    c.fillRect(20, cy - 50, 8, 100);
    const springX = cx + x * 100;
    c.strokeStyle = '#6ee7b7';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(28, cy);
    const coils = 12;
    const len = springX - 28;
    for (let i = 0; i <= coils * 8; i++) {
      const t = i / (coils * 8);
      const px = 28 + len * t;
      const py = cy + (i % 2 === 0 ? 0 : (i % 8 < 4 ? 1 : -1) * 8);
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.stroke();
    c.fillStyle = '#4ea1ff';
    c.fillRect(springX - 15, cy - 25, 30, 50);
    c.strokeStyle = '#0e1116';
    c.lineWidth = 1;
    c.strokeRect(springX - 15, cy - 25, 30, 50);
    c.strokeStyle = '#2a3140';
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(cx, 10);
    c.lineTo(cx, H - 10);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = '#8a93a6';
    c.font = '12px monospace';
    c.textAlign = 'left';
    c.fillText(`x = ${x.toFixed(3)}`, 50, 30);
    c.fillText(`ω = √(k/m) = ${params.w.toFixed(2)}`, 50, 50);
    c.fillText(`γ = ${params.gamma.toFixed(2)} (阻尼)`, 50, 70);
    // 阻尼箭头(从质量块往下,长度 = 阻尼 × 速度)
    if (params.gamma > 0) {
      const dampLen = Math.min(40, Math.abs(v) * params.gamma * 30);
      c.strokeStyle = '#ff6b6b';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(springX, cy + 30);
      c.lineTo(springX, cy + 30 + dampLen * Math.sign(v));
      c.stroke();
      c.fillStyle = '#ff6b6b';
      c.beginPath();
      c.moveTo(springX - 4, cy + 30 + dampLen * Math.sign(v));
      c.lineTo(springX + 4, cy + 30 + dampLen * Math.sign(v));
      c.lineTo(springX, cy + 30 + dampLen * Math.sign(v) + (v > 0 ? 6 : -6));
      c.closePath();
      c.fill();
    }
  }

  function drawPendulum(c, W, H, x) {
    const angle = x * 0.6;
    const topX = W / 2, topY = 20;
    const L = Math.min(H * 0.7, 220);
    const bobX = topX + L * Math.sin(angle);
    const bobY = topY + L * Math.cos(angle);
    c.strokeStyle = '#6ee7b7';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(topX, topY);
    c.lineTo(bobX, bobY);
    c.stroke();
    c.fillStyle = '#8a93a6';
    c.beginPath();
    c.arc(topX, topY, 4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#4ea1ff';
    c.beginPath();
    c.arc(bobX, bobY, 18, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#0e1116';
    c.lineWidth = 2;
    c.stroke();
    c.strokeStyle = '#2a3140';
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(topX, topY);
    c.lineTo(topX, topY + L + 30);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = '#8a93a6';
    c.font = '12px monospace';
    c.textAlign = 'right';
    c.fillText(`θ ≈ ${(angle * 180 / Math.PI).toFixed(1)}°`, W - 20, 30);
    c.fillText(`ω = √(g/L) = ${params.w.toFixed(2)}`, W - 20, 50);
  }

  function drawLC(c, W, H, x, v) {
    const cx = W / 2, cy = H * 0.4;
    const r = 80;
    c.strokeStyle = '#6ee7b7';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = '#4ea1ff';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(cx - 12, cy + r);
    c.lineTo(cx - 12, cy + r + 12);
    c.moveTo(cx + 12, cy + r);
    c.lineTo(cx + 12, cy + r + 12);
    c.stroke();
    c.strokeStyle = '#f0c040';
    c.lineWidth = 2;
    c.beginPath();
    for (let i = -3; i <= 3; i++) {
      c.arc(cx + i * 8, cy - r, 5, 0, Math.PI);
    }
    c.stroke();
    const chargeBarW = x * 60;
    c.fillStyle = x > 0 ? 'rgba(78, 161, 255, 0.7)' : 'rgba(255, 107, 107, 0.7)';
    c.fillRect(cx - Math.abs(chargeBarW) / 2, cy + r + 16, Math.abs(chargeBarW), 8);
    const I = v;
    const arrowLen = Math.min(40, Math.abs(I) * 30);
    c.strokeStyle = '#f0c040';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx, cy - r - 20);
    c.lineTo(cx, cy - r - 20 - arrowLen);
    c.stroke();
    c.fillStyle = '#f0c040';
    c.beginPath();
    c.moveTo(cx, cy - r - 20 - arrowLen);
    c.lineTo(cx - 4, cy - r - 20 - arrowLen + 6);
    c.lineTo(cx + 4, cy - r - 20 - arrowLen + 6);
    c.closePath();
    c.fill();
    c.fillStyle = '#8a93a6';
    c.font = '12px monospace';
    c.textAlign = 'left';
    c.fillText(`Q = ${x.toFixed(3)}`, 30, 30);
    c.fillText(`I = ${v.toFixed(3)}`, 30, 50);
    c.fillText(`ω = 1/√(LC) = ${params.w.toFixed(2)}`, 30, 70);
  }

  function drawChart(c, x0, y0, W, H, hist, p) {
    c.strokeStyle = '#1c2230';
    c.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const yy = y0 + H * (i / 4);
      c.beginPath();
      c.moveTo(x0, yy);
      c.lineTo(x0 + W, yy);
      c.stroke();
    }
    const midY = y0 + H / 2;
    c.strokeStyle = '#2a3140';
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(x0, midY);
    c.lineTo(x0 + W, midY);
    c.stroke();
    c.setLineDash([]);

    const T_WIN = 30;
    const tNow = hist.length > 0 ? hist[hist.length - 1].t : 0;
    const tMin = Math.max(0, tNow - T_WIN);
    const margin = 30;
    const innerW = W - margin * 2;
    const innerH = H - 20;
    // 振幅范围 — 强迫共振时可达很大,动态
    const maxAbs = Math.max(2, ...hist.map(h => Math.abs(h.x))) * 1.1;
    const scaleX = innerW / T_WIN;
    const scaleY = innerH / 2 / maxAbs;

    // 理论包络线(只在阻尼非零时画):±A·e^(-γt)
    if (p.gamma > 0 && !p.F0) {
      c.strokeStyle = 'rgba(110, 231, 183, 0.3)';
      c.lineWidth = 1;
      c.setLineDash([3, 3]);
      c.beginPath();
      for (let i = 0; i < 200; i++) {
        const t = tMin + (i / 200) * T_WIN;
        const env = Math.exp(-p.gamma * t);
        const px = x0 + margin + (t - tMin) * scaleX;
        const py = midY - env * scaleY;
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke();
      c.beginPath();
      for (let i = 0; i < 200; i++) {
        const t = tMin + (i / 200) * T_WIN;
        const env = -Math.exp(-p.gamma * t);
        const px = x0 + margin + (t - tMin) * scaleX;
        const py = midY - env * scaleY;
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke();
      c.setLineDash([]);
    }

    // x(t)
    c.strokeStyle = '#6ee7b7';
    c.lineWidth = 2;
    c.beginPath();
    let started = false;
    for (const h of hist) {
      if (h.t < tMin) continue;
      const px = x0 + margin + (h.t - tMin) * scaleX;
      const py = midY - h.x * scaleY;
      if (!started) { c.moveTo(px, py); started = true; }
      else c.lineTo(px, py);
    }
    c.stroke();
    // v(t)
    c.strokeStyle = '#f0c040';
    c.lineWidth = 1.5;
    c.beginPath();
    started = false;
    for (const h of hist) {
      if (h.t < tMin) continue;
      const px = x0 + margin + (h.t - tMin) * scaleX;
      const py = midY - h.v / Math.max(0.5, p.w) * scaleY * 0.5;
      if (!started) { c.moveTo(px, py); started = true; }
      else c.lineTo(px, py);
    }
    c.stroke();

    c.fillStyle = '#8a93a6';
    c.font = '12px -apple-system, sans-serif';
    c.textAlign = 'left';
    c.fillText('x(t) 绿 · v(t) 黄 · 虚线=包络', x0 + margin, y0 + 16);
  }

  // HUD 状态(右上)
  function drawHUD(c, W, H) {
    // 共振警告
    if (params.F0 > 0 && Math.abs(params.wF - params.w) < 0.1) {
      c.fillStyle = 'rgba(255, 107, 107, 0.85)';
      c.fillRect(W - 160, 8, 150, 24);
      c.fillStyle = '#fff';
      c.font = 'bold 11px -apple-system, sans-serif';
      c.textAlign = 'center';
      c.fillText('⚠️ 共振(ωF ≈ ω)', W - 85, 24);
    }
  }

  const loop = makeLoop(draw, { maxFps: 60 });

  // ---------- 交互 ----------
  const wIn = ctrls.querySelector('[data-w]');
  const wV = ctrls.querySelector('[data-w-v]');
  const gIn = ctrls.querySelector('[data-gamma]');
  const gV = ctrls.querySelector('[data-gamma-v]');
  const fIn = ctrls.querySelector('[data-F0]');
  const fV = ctrls.querySelector('[data-F0-v]');
  const wfIn = ctrls.querySelector('[data-wF]');
  const wfV = ctrls.querySelector('[data-wF-v]');
  const sysSel = ctrls.querySelector('[data-system]');
  wIn.addEventListener('input', (e) => { params.w = parseFloat(e.target.value); wV.textContent = params.w.toFixed(2); });
  gIn.addEventListener('input', (e) => { params.gamma = parseFloat(e.target.value); gV.textContent = params.gamma.toFixed(2); });
  fIn.addEventListener('input', (e) => { params.F0 = parseFloat(e.target.value); fV.textContent = params.F0.toFixed(2); });
  wfIn.addEventListener('input', (e) => { params.wF = parseFloat(e.target.value); wfV.textContent = params.wF.toFixed(2); });
  sysSel.addEventListener('change', (e) => { params.system = e.target.value; });
  ctrls.querySelector('[data-reset]').addEventListener('click', () => reset());

  return {
    sceneId: 'simple-harmonic',
    getFormula() { return 'x¨ + 2γx˙ + ω²x = F₀·cos(ωF·t)'; },
    // v0.6.4: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      // 去 HTML 标签、合并空白,得到干净的描述文字
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { w: params.w, gamma: params.gamma, F0: params.F0, wF: params.wF, system: params.system }; },
    setState(s) {
      if (!s) return;
      if (typeof s.w === 'number') { params.w = s.w; wIn.value = s.w; wV.textContent = s.w.toFixed(2); }
      if (typeof s.gamma === 'number') { params.gamma = s.gamma; gIn.value = s.gamma; gV.textContent = s.gamma.toFixed(2); }
      if (typeof s.F0 === 'number') { params.F0 = s.F0; fIn.value = s.F0; fV.textContent = s.F0.toFixed(2); }
      if (typeof s.wF === 'number') { params.wF = s.wF; wfIn.value = s.wF; wfV.textContent = s.wF.toFixed(2); }
      if (s.system) { params.system = s.system; sysSel.value = s.system; }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
