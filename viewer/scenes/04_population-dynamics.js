// viewer/scenes/04_population-dynamics.js
// MathematicsWeb v0.1.0 — 种群动力学 (数学 × 生物)
// 2D Canvas 场景:实时模拟 Lotka-Volterra 捕食者-猎物模型
//   - 上面两条曲线:猎物(兔)x(t) + 捕食者(狐)y(t) 随时间
//   - 下面相图:相位平面 (x, y) 看周期性震荡
// 调参数 α β δ γ 看生态平衡
//
// 数学:Lotka-Volterra 方程
//   dx/dt = αx - βxy   (猎物:没狐→指数涨,有狐→被吃)
//   dy/dt = δxy - γy   (捕食者:有兔→繁殖,没兔→饿死)
// 用 RK4 数值积分(比欧拉稳)
//
// 守恒量:H(x, y) = δx - γ·ln(x) + βy - α·ln(y) 沿轨道守恒
// → 相图轨道是闭合曲线(理论上)

import { makeLoop, fitCanvas } from '../../kernel/02_animation.js';
import { lotkaVolterraStep } from '../../kernel/01_math-core.js';

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
    <div class="mathw-lesson-title">数学 × 生物 · 洛特卡-沃尔泰拉</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">兔子和狐狸的永恒拉锯</div>
      <div class="mathw-lesson-formula">dx/dt = αx − βxy;  dy/dt = δxy − γy</div>
      <div class="mathw-lesson-text">
        兔子(猎物)多 → 狐狸(捕食者)有吃的 → 狐狸多 → 兔子被吃光 → 狐狸饿死 → 兔子又涨。
        调 <strong>α(兔子繁殖率)</strong>、<strong>β(捕食率)</strong>、<strong>δ(狐狸繁殖率)</strong>、<strong>γ(狐狸死亡率)</strong>
        看生态平衡怎么打破。<br>
        <strong>上面</strong>:数量随时间变化;<strong>下面</strong>:相图(兔子数 vs 狐狸数),闭合曲线。
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
    <div class="mathw-controls-title">参数 · 洛特卡-沃尔泰拉</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">α 猎物增</span>
      <input type="range" min="0.5" max="2" step="0.05" value="1.0" data-alpha />
      <span class="mathw-control-value" data-alpha-v>1.00</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">β 捕食率</span>
      <input type="range" min="0.1" max="1" step="0.05" value="0.4" data-beta />
      <span class="mathw-control-value" data-beta-v>0.40</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">δ 捕食者增</span>
      <input type="range" min="0.1" max="1" step="0.05" value="0.3" data-delta />
      <span class="mathw-control-value" data-delta-v>0.30</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">γ 捕食者亡</span>
      <input type="range" min="0.1" max="1" step="0.05" value="0.4" data-gamma />
      <span class="mathw-control-value" data-gamma-v>0.40</span>
    </div>
    <div class="mathw-control-row">
      <button data-reset>重置</button>
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let params = { alpha: 1.0, beta: 0.4, delta: 0.3, gamma: 0.4 };
  let state = [10, 5];          // [prey, predator]
  const history = [];           // [{t, x, y}, ...]
  const MAX_HIST = 800;
  const phaseTrail = [];        // [{x, y}, ...] 相图轨迹
  const MAX_PHASE = 600;
  let simT = 0;
  const SIM_DT = 0.02;          // 模拟步长

  function reset() {
    state = [10, 5];
    history.length = 0;
    phaseTrail.length = 0;
    simT = 0;
  }

  // RK4 积分
  function rk4Step(s, p, dt) {
    const f = (s) => lotkaVolterraStep(s, p, dt);
    const k1 = [p.alpha * s[0] - p.beta * s[0] * s[1], p.delta * s[0] * s[1] - p.gamma * s[1]];
    const s1 = [s[0] + 0.5 * dt * k1[0], s[1] + 0.5 * dt * k1[1]];
    const k2 = [p.alpha * s1[0] - p.beta * s1[0] * s1[1], p.delta * s1[0] * s1[1] - p.gamma * s1[1]];
    const s2 = [s[0] + 0.5 * dt * k2[0], s[1] + 0.5 * dt * k2[1]];
    const k3 = [p.alpha * s2[0] - p.beta * s2[0] * s2[1], p.delta * s2[0] * s2[1] - p.gamma * s2[1]];
    const s3 = [s[0] + dt * k3[0], s[1] + dt * k3[1]];
    const k4 = [p.alpha * s3[0] - p.beta * s3[0] * s3[1], p.delta * s3[0] * s3[1] - p.gamma * s3[1]];
    return [
      Math.max(0.001, s[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])),
      Math.max(0.001, s[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])),
    ];
  }

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  function draw(elapsed, dt) {
    // 推进模拟(每帧多步,让动画快)
    const STEPS_PER_FRAME = 4;
    for (let i = 0; i < STEPS_PER_FRAME; i++) {
      state = rk4Step(state, params, SIM_DT);
      simT += SIM_DT;
      history.push({ t: simT, x: state[0], y: state[1] });
      if (history.length > MAX_HIST) history.shift();
      phaseTrail.push({ x: state[0], y: state[1] });
      if (phaseTrail.length > MAX_PHASE) phaseTrail.shift();
    }

    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);

    // 背景
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    // 上半屏:时间序列
    const upperH = H * 0.55;
    const lowerH = H * 0.4;
    const margin = 50;

    // 网格(上半)
    ctx.strokeStyle = '#1c2230';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = margin + (upperH - margin * 2) * (i / 4);
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(W - margin, y);
      ctx.stroke();
    }

    // 标题
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('数量随时间', margin, 20);
    ctx.fillText('🟢 猎物(兔)', margin + 100, 20);
    ctx.fillText('🔴 捕食者(狐)', margin + 200, 20);

    // Y 轴范围(动态)
    const maxVal = Math.max(20, ...history.map(h => Math.max(h.x, h.y))) * 1.1;
    const yScale = (upperH - margin * 2) / maxVal;

    // 时间 X 范围:最近 60 时间单位
    const T_WINDOW = 60;
    const tNow = history.length > 0 ? history[history.length - 1].t : 0;
    const tMin = Math.max(0, tNow - T_WINDOW);
    const xScale = (W - margin * 2) / T_WINDOW;

    // 画 prey 曲线
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    for (const p of history) {
      if (p.t < tMin) continue;
      const px = margin + (p.t - tMin) * xScale;
      const py = upperH - margin - p.x * yScale;
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 画 predator 曲线
    ctx.strokeStyle = '#ff6b6b';
    ctx.beginPath();
    started = false;
    for (const p of history) {
      if (p.t < tMin) continue;
      const px = margin + (p.t - tMin) * xScale;
      const py = upperH - margin - p.y * yScale;
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 当前值
    ctx.fillStyle = '#6ee7b7';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('x = ' + state[0].toFixed(2), W - margin, 20);
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText('y = ' + state[1].toFixed(2), W - margin, 38);

    // 分隔
    ctx.strokeStyle = '#2a3140';
    ctx.beginPath();
    ctx.moveTo(0, upperH + 4);
    ctx.lineTo(W, upperH + 4);
    ctx.stroke();

    // 下半屏:相图
    const phaseY0 = upperH + 24;
    const phaseH = H - phaseY0 - 20;
    const phaseW = W - margin * 2;
    const phaseX0 = margin;

    // 网格
    ctx.strokeStyle = '#1c2230';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const yy = phaseY0 + phaseH * (i / 4);
      ctx.beginPath();
      ctx.moveTo(phaseX0, yy);
      ctx.lineTo(phaseX0 + phaseW, yy);
      ctx.stroke();
      const xx = phaseX0 + phaseW * (i / 4);
      ctx.beginPath();
      ctx.moveTo(xx, phaseY0);
      ctx.lineTo(xx, phaseY0 + phaseH);
      ctx.stroke();
    }

    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('相图(猎物 vs 捕食者)', phaseX0, phaseY0 - 6);
    ctx.fillText('x', phaseX0 + phaseW - 12, phaseY0 + phaseH - 6);
    ctx.fillText('y', phaseX0 + 4, phaseY0 + 12);

    // 找相图边界
    const xMax = Math.max(20, ...phaseTrail.map(p => p.x)) * 1.2;
    const yMax = Math.max(15, ...phaseTrail.map(p => p.y)) * 1.2;
    const pxScale = phaseW / xMax;
    const pyScale = phaseH / yMax;

    // 画相图轨迹
    ctx.strokeStyle = '#4ea1ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < phaseTrail.length; i++) {
      const p = phaseTrail[i];
      const px = phaseX0 + p.x * pxScale;
      const py = phaseY0 + phaseH - p.y * pyScale;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 当前点
    const cx = phaseX0 + state[0] * pxScale;
    const cy = phaseY0 + phaseH - state[1] * pyScale;
    ctx.fillStyle = '#f0c040';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // 平衡点(理论)
    // 平衡点:dx/dt=dy/dt=0 → x=γ/δ, y=α/β
    const eqX = params.gamma / params.delta;
    const eqY = params.alpha / params.beta;
    if (eqX < xMax && eqY < yMax) {
      const ex = phaseX0 + eqX * pxScale;
      const ey = phaseY0 + phaseH - eqY * pyScale;
      ctx.strokeStyle = 'rgba(240, 192, 64, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ex - 8, ey); ctx.lineTo(ex + 8, ey);
      ctx.moveTo(ex, ey - 8); ctx.lineTo(ex, ey + 8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(240, 192, 64, 0.7)';
      ctx.font = '10px monospace';
      ctx.fillText(`平衡 (${eqX.toFixed(1)}, ${eqY.toFixed(1)})`, ex + 10, ey - 6);
    }

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 60 });

  // ---------- 交互 ----------
  const updateCoeffs = () => {} // 参数改完不会破坏轨迹(只是相图形状变)
  ctrls.querySelectorAll('input[type="range"]').forEach(inp => {
    const vEl = ctrls.querySelector(`[data-${inp.dataset.alpha || inp.dataset.beta || inp.dataset.delta || inp.dataset.gamma}-v]`);
    inp.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      params[inp.dataset.alpha ? 'alpha' : inp.dataset.beta ? 'beta' : inp.dataset.delta ? 'delta' : 'gamma'] = v;
      if (vEl) vEl.textContent = v.toFixed(2);
    });
  });
  ctrls.querySelector('[data-reset]').addEventListener('click', () => reset());

  // 缓存控件引用给 setState 用
  const _aInp = ctrls.querySelector('[data-alpha]');
  const _aV = ctrls.querySelector('[data-alpha-v]');
  const _bInp = ctrls.querySelector('[data-beta]');
  const _bV = ctrls.querySelector('[data-beta-v]');
  const _dInp = ctrls.querySelector('[data-delta]');
  const _dV = ctrls.querySelector('[data-delta-v]');
  const _gInp = ctrls.querySelector('[data-gamma]');
  const _gV = ctrls.querySelector('[data-gamma-v]');

  return {
    sceneId: 'population-dynamics',
    getFormula() { return 'dx/dt = αx − βxy;  dy/dt = δxy − γy'; },
    // v0.6.9: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { alpha: params.alpha, beta: params.beta, delta: params.delta, gamma: params.gamma }; },
    setState(s) {
      if (!s) return;
      if (typeof s.alpha === 'number') { params.alpha = s.alpha; _aInp.value = s.alpha; _aV.textContent = s.alpha.toFixed(2); }
      if (typeof s.beta === 'number') { params.beta = s.beta; _bInp.value = s.beta; _bV.textContent = s.beta.toFixed(2); }
      if (typeof s.delta === 'number') { params.delta = s.delta; _dInp.value = s.delta; _dV.textContent = s.delta.toFixed(2); }
      if (typeof s.gamma === 'number') { params.gamma = s.gamma; _gInp.value = s.gamma; _gV.textContent = s.gamma.toFixed(2); }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
