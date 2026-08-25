// viewer/scenes/09_double-pendulum.js
// MathematicsWeb v0.2.0 — 双摆混沌 (数学 × 物理)
// 2D Canvas 场景:两个摆串起来,混沌对初始条件极其敏感
//   - 上方:实时双摆动画,留下拖尾(展示轨迹发散)
//   - 下方:同时跑 8 条几乎相同初始条件的轨道,看它们怎么分道扬镳
//   - 调初始角 θ1/θ2 触发不同区域(规则 vs 混沌)
//
// 数学:双摆方程(无解析解,只能用数值积分)
//   Lagrangian L = T - V → Euler-Lagrange → 两个二阶 ODE
//   dθ1/dt = ω1
//   dω1/dt = (-g(2m1+m2)sin(θ1) - m2·g·sin(θ1-2θ2) - 2sin(θ1-θ2)·m2(ω2²L2 + ω1²L1·cos(θ1-θ2))) / (L1·(2m1+m2-m2cos(2θ1-2θ2)))
//   dθ2/dt = ω2
//   dω2/dt = (2sin(θ1-θ2)·(ω1²L1(m1+m2) + g(m1+m2)cos(θ1) + ω2²L2·m2·cos(θ1-θ2))) / (L2·(2m1+m2-m2cos(2θ1-2θ2)))
//   混沌:初值差 0.001 rad → 几秒后轨迹完全不同
//
// 应用:天气预测(蝴蝶效应)· 化学反应 · 经济学 · 心跳节律

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
    <div class="mathw-lesson-title">数学 × 物理 · 双摆混沌</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">初值差 0.001,几秒后轨迹完全不一样</div>
      <div class="mathw-lesson-formula">L = T − V → Euler-Lagrange → 两个非线性 ODE</div>
      <div class="mathw-lesson-text">
        双摆的方程<strong>没有解析解</strong>,只能用数值积分。看起来简单,但对初始条件<strong>极其敏感</strong>。
        下方面板的 8 条曲线初值只差 0.001 弧度,几秒后就分道扬镳 — 这就是<strong>蝴蝶效应</strong>。<br>
        调 θ1/θ2 触发不同区域(规则 vs 混沌)。
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
    <div class="mathw-controls-title">参数 · 双摆</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">θ₁ 初始</span>
      <input type="range" min="0" max="3.14" step="0.01" value="2.0" data-theta1 />
      <span class="mathw-control-value" data-theta1-v>2.00</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">θ₂ 初始</span>
      <input type="range" min="0" max="3.14" step="0.01" value="2.0" data-theta2 />
      <span class="mathw-control-value" data-theta2-v>2.00</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">时间倍率</span>
      <input type="range" min="0.2" max="2" step="0.1" value="1" data-speed />
      <span class="mathw-control-value" data-speed-v>1.0×</span>
    </div>
    <div class="mathw-control-row">
      <button data-reset>重置</button>
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let params = { theta1: 2.0, theta2: 2.0, speed: 1.0 };
  // g/L1/L2/m1/m2 用归一化
  const g = 9.81, L1 = 1.0, L2 = 1.0, m1 = 1.0, m2 = 1.0;
  const dt = 0.002;          // 数值步长(秒)

  // 主双摆
  let main = { t1: params.theta1, w1: 0, t2: params.theta2, w2: 0 };
  // 相空间轨迹(θ1, ω1)
  const phaseTrail = [];      // 主摆
  const ghostPhase = [];      // 8 个对照摆的相空间
  const mainTrail = [];
  const MAX_TRAIL = 400;
  // 8 个"对照"摆,初值差 0.001
  const N_GHOST = 8;
  const ghosts = [];
  const ghostTrails = [];
  for (let i = 0; i < N_GHOST; i++) {
    const eps = (i - N_GHOST / 2) * 0.001;
    ghosts.push({ t1: params.theta1 + eps, w1: 0, t2: params.theta2 + eps, w2: 0 });
    ghostTrails.push([]);
    ghostPhase.push([]);
  }
  let simT = 0;

  function reset() {
    main = { t1: params.theta1, w1: 0, t2: params.theta2, w2: 0 };
    mainTrail.length = 0;
    phaseTrail.length = 0;
    for (let i = 0; i < N_GHOST; i++) {
      const eps = (i - N_GHOST / 2) * 0.001;
      ghosts[i] = { t1: params.theta1 + eps, w1: 0, t2: params.theta2 + eps, w2: 0 };
      ghostTrails[i].length = 0;
      ghostPhase[i].length = 0;
    }
    simT = 0;
  }

  // 双摆的 1 步导数
  function derivs(s) {
    const dt1 = s.w1;
    const dt2 = s.w2;
    const d = 2 * m1 + m2 - m2 * Math.cos(2 * s.t1 - 2 * s.t2);
    const dw1 = (-g * (2 * m1 + m2) * Math.sin(s.t1)
      - m2 * g * Math.sin(s.t1 - 2 * s.t2)
      - 2 * Math.sin(s.t1 - s.t2) * m2 * (s.w2 * s.w2 * L2 + s.w1 * s.w1 * L1 * Math.cos(s.t1 - s.t2))
    ) / (L1 * d);
    const dw2 = (2 * Math.sin(s.t1 - s.t2) * (s.w1 * s.w1 * L1 * (m1 + m2)
      + g * (m1 + m2) * Math.cos(s.t1)
      + s.w2 * s.w2 * L2 * m2 * Math.cos(s.t1 - s.t2))
    ) / (L2 * d);
    return { dt1, dw1, dt2, dw2 };
  }
  // RK4
  function stepRK4(s, dt) {
    const k1 = derivs(s);
    const s2 = { t1: s.t1 + 0.5 * dt * k1.dt1, w1: s.w1 + 0.5 * dt * k1.dw1, t2: s.t2 + 0.5 * dt * k1.dt2, w2: s.w2 + 0.5 * dt * k1.dw2 };
    const k2 = derivs(s2);
    const s3 = { t1: s.t1 + 0.5 * dt * k2.dt1, w1: s.w1 + 0.5 * dt * k2.dw1, t2: s.t2 + 0.5 * dt * k2.dt2, w2: s.w2 + 0.5 * dt * k2.dw2 };
    const k3 = derivs(s3);
    const s4 = { t1: s.t1 + dt * k3.dt1, w1: s.w1 + dt * k3.dw1, t2: s.t2 + dt * k3.dt2, w2: s.w2 + dt * k3.dw2 };
    const k4 = derivs(s4);
    return {
      t1: s.t1 + (dt / 6) * (k1.dt1 + 2 * k2.dt1 + 2 * k3.dt1 + k4.dt1),
      w1: s.w1 + (dt / 6) * (k1.dw1 + 2 * k2.dw1 + 2 * k3.dw1 + k4.dw1),
      t2: s.t2 + (dt / 6) * (k1.dt2 + 2 * k2.dt2 + 2 * k3.dt2 + k4.dt2),
      w2: s.w2 + (dt / 6) * (k1.dw2 + 2 * k2.dw2 + 2 * k3.dw2 + k4.dw2),
    };
  }
  function posOf(s) {
    const x1 = L1 * Math.sin(s.t1);
    const y1 = L1 * Math.cos(s.t1);
    const x2 = x1 + L2 * Math.sin(s.t2);
    const y2 = y1 + L2 * Math.cos(s.t2);
    return { x1, y1, x2, y2 };
  }

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  function draw(elapsed, dtFrame) {
    // 每帧多步积分
    const STEPS = Math.max(1, Math.floor(params.speed * 4));
    for (let i = 0; i < STEPS; i++) {
      main = stepRK4(main, dt);
      mainTrail.push(posOf(main));
      if (mainTrail.length > MAX_TRAIL) mainTrail.shift();
      phaseTrail.push({ t1: main.t1, w1: main.w1 });
      if (phaseTrail.length > MAX_TRAIL) phaseTrail.shift();
      for (let g = 0; g < N_GHOST; g++) {
        ghosts[g] = stepRK4(ghosts[g], dt);
        ghostTrails[g].push(posOf(ghosts[g]));
        if (ghostTrails[g].length > MAX_TRAIL) ghostTrails[g].shift();
        ghostPhase[g].push({ t1: ghosts[g].t1, w1: ghosts[g].w1 });
        if (ghostPhase[g].length > MAX_TRAIL) ghostPhase[g].shift();
      }
      simT += dt;
    }

    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    const upperH = H * 0.55;
    const lowerH = H - upperH;
    const lowerLeftW = W * 0.65;
    const lowerRightW = W - lowerLeftW;
    drawMainPendulum(ctx, 0, 0, W, upperH);
    drawGhostTrails(ctx, 0, upperH, lowerLeftW, lowerH);
    drawPhaseSpace(ctx, lowerLeftW, upperH, lowerRightW, lowerH);

    ctx.restore();
  }

  function drawMainPendulum(c, x0, y0, W, H) {
    // 中心
    const cx = W / 2, cy = H * 0.35;
    const scale = Math.min(W, H) * 0.18;
    const top = { x: cx, y: cy };
    const p1 = posOf(main);
    const bob1 = { x: cx + p1.x1 * scale, y: cy + p1.y1 * scale };
    const bob2 = { x: cx + p1.x2 * scale, y: cy + p1.y2 * scale };

    // 拖尾
    c.strokeStyle = 'rgba(110, 231, 183, 0.4)';
    c.lineWidth = 1.5;
    c.beginPath();
    for (let i = 0; i < mainTrail.length; i++) {
      const p = mainTrail[i];
      const x = cx + p.x2 * scale;
      const y = cy + p.y2 * scale;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();

    // 摆线
    c.strokeStyle = '#8a93a6';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(top.x, top.y);
    c.lineTo(bob1.x, bob1.y);
    c.lineTo(bob2.x, bob2.y);
    c.stroke();

    // 支点
    c.fillStyle = '#8a93a6';
    c.beginPath();
    c.arc(top.x, top.y, 4, 0, Math.PI * 2);
    c.fill();

    // 摆球 1
    c.fillStyle = '#4ea1ff';
    c.beginPath();
    c.arc(bob1.x, bob1.y, 10, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#0e1116';
    c.lineWidth = 1;
    c.stroke();

    // 摆球 2
    c.fillStyle = '#6ee7b7';
    c.beginPath();
    c.arc(bob2.x, bob2.y, 10, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#0e1116';
    c.lineWidth = 1;
    c.stroke();

    // 信息
    c.fillStyle = '#8a93a6';
    c.font = '12px -apple-system, sans-serif';
    c.textAlign = 'left';
    c.fillText(`t = ${simT.toFixed(1)}s · θ₁=${main.t1.toFixed(2)} θ₂=${main.t2.toFixed(2)}`, 20, 24);
    c.fillStyle = '#6ee7b7';
    c.fillText('主摆(θ₁, θ₂ 实时)', 20, 42);
  }

  function drawGhostTrails(c, x0, y0, W, H) {
    // 8 条对照摆轨迹,画在下方
    c.fillStyle = '#0e1116';
    c.fillRect(x0, y0, W, H);

    // 分割
    c.strokeStyle = '#2a3140';
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x0 + W, y0);
    c.stroke();

    // 标题
    c.fillStyle = '#8a93a6';
    c.font = '12px -apple-system, sans-serif';
    c.textAlign = 'left';
    c.fillText('8 条对照摆(初值差 0.001 弧度)', 20, y0 + 18);
    c.fillText('混沌 → 几秒内轨迹分道扬镳', 20, y0 + 36);

    // 画 8 条 θ1 随时间曲线
    const cTop = y0 + 50;
    const cH = H - 70;
    const cW = W - 40;
    const cX = 20;
    c.strokeStyle = '#1c2230';
    c.lineWidth = 1;
    c.strokeRect(cX, cTop, cW, cH);

    // 0 度中线
    c.strokeStyle = '#2a3140';
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(cX, cTop + cH * 0.5);
    c.lineTo(cX + cW, cTop + cH * 0.5);
    c.stroke();
    c.setLineDash([]);

    // 横轴时间窗口
    const T_WIN = 30;  // 显示最近 30s
    const tMin = Math.max(0, simT - T_WIN);
    const xScale = cW / T_WIN;
    const yScale = cH / 6.28;  // 角度 -π 到 π

    // 每条摆:用不同颜色画 θ1 曲线
    const ghostColors = ['#ff6b6b', '#f0c040', '#6ee7b7', '#4ea1ff', '#a78bfa', '#fb7185', '#34d399', '#fbbf24'];
    ghosts.forEach((g, idx) => {
      c.strokeStyle = ghostColors[idx];
      c.lineWidth = 1.5;
      c.beginPath();
      const trail = ghostTrails[idx];
      for (let i = 0; i < trail.length - 1; i++) {
        const t1 = trail[i + 1].x1;  // 用 x1 当时间标? 不对,x1 是位置
        // 我们需要时间戳:每条 trail 是 STEP 步的快照,但没存时间。用 simT - (len-1-i) * dt 估算
        const t = simT - (trail.length - 1 - i) * dt;
        if (t < tMin) continue;
        const px = cX + (t - tMin) * xScale;
        const py = cTop + cH * 0.5 - trail[i + 1].x1 / 1.5 * (cH * 0.4);
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke();
    });
  }

  // 相空间图(θ1 vs ω1)— 直观展示混沌(分形-like 的相空间填充)
  function drawPhaseSpace(c, x0, y0, W, H) {
    // 标题
    c.fillStyle = '#8a93a6';
    c.font = '12px -apple-system, sans-serif';
    c.textAlign = 'left';
    c.fillText('相空间(θ₁ vs ω₁)', x0 + 20, y0 + 18);
    c.fillText('主摆(粗) + 8 对照', x0 + 20, y0 + 36);

    // 画框
    const cTop = y0 + 50;
    const cH = H - 70;
    const cW = W - 40;
    const cX = x0 + 20;
    c.strokeStyle = '#1c2230';
    c.lineWidth = 1;
    c.strokeRect(cX, cTop, cW, cH);

    // 0 度中线(竖直)
    const midX = cX + cW * 0.5;  // θ1 = 0
    const midY = cTop + cH * 0.5;  // ω1 = 0
    c.strokeStyle = '#2a3140';
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(midX, cTop);
    c.lineTo(midX, cTop + cH);
    c.moveTo(cX, midY);
    c.lineTo(cX + cW, midY);
    c.stroke();
    c.setLineDash([]);

    // 坐标范围
    const θRange = 3.14;  // -π ~ π
    const ωRange = 8;     // 经验值
    const xScale = (cW / 2) / θRange;
    const yScale = (cH / 2) / ωRange;

    const ghostColors = ['#ff6b6b', '#f0c040', '#6ee7b7', '#4ea1ff', '#a78bfa', '#fb7185', '#34d399', '#fbbf24'];
    // 8 个对照摆
    ghostPhase.forEach((tr, idx) => {
      if (tr.length < 2) return;
      c.strokeStyle = ghostColors[idx];
      c.globalAlpha = 0.4;
      c.lineWidth = 1;
      c.beginPath();
      for (let i = 0; i < tr.length; i++) {
        const px = midX + tr[i].t1 * xScale;
        const py = midY - tr[i].w1 * yScale;
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke();
    });
    c.globalAlpha = 1;
    // 主摆(粗)
    c.strokeStyle = '#6ee7b7';
    c.lineWidth = 2;
    c.beginPath();
    for (let i = 0; i < phaseTrail.length; i++) {
      const px = midX + phaseTrail[i].t1 * xScale;
      const py = midY - phaseTrail[i].w1 * yScale;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.stroke();
    // 主摆当前点
    if (phaseTrail.length > 0) {
      const last = phaseTrail[phaseTrail.length - 1];
      const px = midX + last.t1 * xScale;
      const py = midY - last.w1 * yScale;
      c.fillStyle = '#f0c040';
      c.beginPath();
      c.arc(px, py, 4, 0, Math.PI * 2);
      c.fill();
    }

    // 轴标签
    c.fillStyle = '#8a93a6';
    c.font = '10px monospace';
    c.textAlign = 'right';
    c.fillText('θ₁ →', cX + cW - 4, cTop + cH - 4);
    c.textAlign = 'left';
    c.fillText('ω₁ ↑', cX + 4, cTop + 12);
  }

  const loop = makeLoop(draw, { maxFps: 60 });

  // ---------- 交互 ----------
  const _t1Inp = ctrls.querySelector('[data-theta1]');
  const _t1V = ctrls.querySelector('[data-theta1-v]');
  const _t2Inp = ctrls.querySelector('[data-theta2]');
  const _t2V = ctrls.querySelector('[data-theta2-v]');
  const _sInp = ctrls.querySelector('[data-speed]');
  const _sV = ctrls.querySelector('[data-speed-v]');
  _t1Inp.addEventListener('input', (e) => {
    params.theta1 = parseFloat(e.target.value);
    _t1V.textContent = params.theta1.toFixed(2);
  });
  _t2Inp.addEventListener('input', (e) => {
    params.theta2 = parseFloat(e.target.value);
    _t2V.textContent = params.theta2.toFixed(2);
  });
  _sInp.addEventListener('input', (e) => {
    params.speed = parseFloat(e.target.value);
    _sV.textContent = params.speed.toFixed(1) + '×';
  });
  ctrls.querySelector('[data-reset]').addEventListener('click', () => reset());

  return {
    sceneId: 'double-pendulum',
    getFormula() { return 'θ¨ = f(θ₁, θ₂, ω₁, ω₂)  (无解析解)'; },
    // v0.6.21: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { theta1: params.theta1, theta2: params.theta2, speed: params.speed }; },
    setState(s) {
      if (!s) return;
      if (typeof s.theta1 === 'number') { params.theta1 = s.theta1; _t1Inp.value = s.theta1; _t1V.textContent = s.theta1.toFixed(2); }
      if (typeof s.theta2 === 'number') { params.theta2 = s.theta2; _t2Inp.value = s.theta2; _t2V.textContent = s.theta2.toFixed(2); }
      if (typeof s.speed === 'number') { params.speed = s.speed; _sInp.value = s.speed; _sV.textContent = s.speed.toFixed(1) + '×'; }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
