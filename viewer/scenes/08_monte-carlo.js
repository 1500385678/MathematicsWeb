// viewer/scenes/08_monte-carlo.js
// MathematicsWeb v0.2.0 — 蒙特卡洛积分 (数学 × 概率统计)
// 2D Canvas 场景:用随机投点估算 π + 积分
//   - 上方:在 1×1 正方形内投 N 个随机点,统计落在 1/4 单位圆内的比例 × 4 ≈ π
//   - 下方:用蒙特卡洛估算 ∫₀^π sin(x) dx = 2(并跟真实值对比,看收敛)
//   - 调投点数 N 越多,估算越准(大数定律)
//
// 数学:
//   1) π 估算:
//      1/4 单位圆面积 = π/4
//      1×1 正方形面积 = 1
//      随机投点 → 落在圆内比例 ≈ 面积比 = π/4
//      π ≈ 4 × (圆内点数 / 总点数)
//   2) 蒙特卡洛积分 ∫f(x)dx ≈ (b-a) × (1/N) × Σf(xi)
//      矩形 × f 平均值 = 积分
//
// 大数定律:N → ∞, 估算 → 真值
//
// 应用:期权定价 · 物理粒子模拟 · 风险评估 · 任何高维积分

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
    <div class="mathw-lesson-title">数学 × 概率 · 蒙特卡洛</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">随机投点 → 算 π、算积分 · 收敛 O(1/√N) · 与维度无关</div>
      <div class="mathw-lesson-formula">π ≈ 4 × (圆内 / 总数)   ∫f(x)dx ≈ (b-a)·<f(x)>   误差 ~ 1/√N</div>
      <div class="mathw-lesson-text">
        <strong>π 估算原理</strong>:1×1 正方形面积 = 1,内接 1/4 单位圆面积 = π/4,随机投点落在圆内比例 ≈ 面积比 = π/4,所以 <strong>π ≈ 4 × (圆内 / 总数)</strong>。这是 1777 年 Buffon 伯爵的几何概率思路,跟场景 25 布丰投针同一思想。<br>
        <strong>蒙特卡洛积分</strong>:对 ∫ₐᵇ f(x) dx,取 N 个均匀随机 xᵢ ∈ [a, b],<strong>∫f ≈ (b-a) × (1/N) × Σf(xᵢ)</strong> = 矩形面积 × f 平均值。本场景演示 ∫₀^π sin(x) dx = 2,真实值红线,估算曲线随 N 收敛。<br>
        <strong>大数定律</strong>:N → ∞ 时估算必 → 真值;但收敛速度只有 <strong>O(1/√N)</strong>(误差 ~ σ/√N)— 想精度 10 倍要投 100 倍点,比确定性方法(黎曼和/梯形/Simpson,O(1/N²) 到 O(1/N⁴))慢得多。<br>
        <strong>关键优势:与维度无关</strong>。确定性方法(黎曼和)高维 d 维时 Nᵈ 个点指数爆(维数灾难);蒙特卡洛 N 个点无论 d 多大,误差公式还是 σ/√N。这是为什么 1950 年代核武器/航天/金融全用蒙特卡洛。<br>
        <strong>历史</strong>:Stanislaw Ulam 1946 玩单人纸牌时想到,John von Neumann 在曼哈顿计划 ENIAC 上实现并命名 Monte Carlo(摩纳哥赌场);Metropolis 1949 发表首篇论文,1953 年 Metropolis-Hastings 算法成为 MCMC 鼻祖。<br>
        <strong>关键参数</strong>:批量/帧(每帧投 10-2000 点,投越多越准,动画实时累计)+ 显示模式(算 π / 算 sin 积分)+ 重置按钮。<br>
        <strong>方差缩减技术</strong>:重要性采样(在被积函数大的地方多采)、对偶变量(f(x)+f(b+a-x) 抵消)、控制变量(用已知期望的相关变量校正)— 可把方差降 10-100 倍,弥补 O(1/√N) 慢收敛。<br>
        <strong>应用</strong>:Black-Scholes 期权定价(7 维积分)、粒子输运模拟(MCNP 中子跟踪)、贝叶斯统计 MCMC(Metropolis-Hastings / Hamiltonian MC)、LIGO 引力波信号注入检测、量子蒙特卡洛(电子结构 VASP)、气候模型集合预报、流行病传播(SEIR 模型参数估计)、自动驾驶感知激光雷达点云、电影特效全局光照(路径追踪)、围棋 AI AlphaGo 蒙特卡洛树搜索(MCTS)。
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
    <div class="mathw-controls-title">参数 · 蒙特卡洛</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">批量/帧</span>
      <input type="range" min="10" max="2000" step="10" value="200" data-batch />
      <span class="mathw-control-value" data-batch-v>200</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">显示</span>
      <select data-mode>
        <option value="pi" selected>估算 π</option>
        <option value="integral">积分 sin(x)</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <button data-reset>重置</button>
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let params = { batch: 200, mode: 'pi' };
  let state = { total: 0, inside: 0, samples: [], integralSum: 0, integralN: 0, integralEstHistory: [] };

  function reset() {
    state = { total: 0, inside: 0, samples: [], integralSum: 0, integralN: 0, integralEstHistory: [] };
  }

  function samplePi(batch) {
    for (let i = 0; i < batch; i++) {
      const x = Math.random();
      const y = Math.random();
      const inside = x * x + y * y <= 1;
      state.samples.push({ x, y, inside });
      state.total++;
      if (inside) state.inside++;
    }
    // 限制 samples 数,避免内存爆
    if (state.samples.length > 8000) state.samples = state.samples.slice(-8000);
  }
  function sampleIntegral(batch) {
    for (let i = 0; i < batch; i++) {
      const x = Math.random() * Math.PI;
      const fx = Math.sin(x);
      state.integralSum += fx;
      state.integralN++;
    }
    const est = (state.integralN ? (Math.PI * state.integralSum / state.integralN) : 0);
    if (state.integralEstHistory.length === 0 || state.integralN % 20 === 0) {
      state.integralEstHistory.push({ n: state.integralN, est });
      if (state.integralEstHistory.length > 200) state.integralEstHistory.shift();
    }
  }

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  function draw(elapsed, dt) {
    if (params.mode === 'pi') samplePi(params.batch);
    else sampleIntegral(params.batch);

    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    if (params.mode === 'pi') drawPiMode(ctx, W, H);
    else drawIntegralMode(ctx, W, H);

    ctx.restore();
  }

  function drawPiMode(c, W, H) {
    // 左侧:正方形 + 1/4 圆 + 投点
    const leftW = Math.min(W * 0.55, H * 0.95);
    const square = { x: 20, y: 50, w: leftW - 40, h: leftW - 40 };
    // 网格
    c.strokeStyle = '#1c2230';
    c.lineWidth = 1;
    c.strokeRect(square.x, square.y, square.w, square.h);
    // 1/4 圆弧
    c.strokeStyle = '#4ea1ff';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(square.x, square.y + square.h, square.w, 0, Math.PI / 2);
    c.stroke();
    // 填充 1/4 圆(半透明)
    c.fillStyle = 'rgba(78, 161, 255, 0.08)';
    c.beginPath();
    c.moveTo(square.x, square.y + square.h);
    c.arc(square.x, square.y + square.h, square.w, 0, Math.PI / 2);
    c.closePath();
    c.fill();

    // 投点
    const px0 = square.x;
    const py0 = square.y;
    state.samples.forEach(s => {
      c.fillStyle = s.inside ? 'rgba(110, 231, 183, 0.7)' : 'rgba(255, 107, 107, 0.7)';
      c.fillRect(px0 + s.x * square.w - 0.5, py0 + s.y * square.h - 0.5, 1.5, 1.5);
    });

    // 标题
    c.fillStyle = '#8a93a6';
    c.font = '12px -apple-system, sans-serif';
    c.textAlign = 'left';
    c.fillText('在 1×1 正方形投随机点,数落在 1/4 圆内的比例', 20, 28);
    c.fillText('🟢 圆内 · 🔴 圆外', square.x, square.y + square.h + 20);

    // 右侧:统计 + 估算
    const rightX = leftW + 40;
    const piEst = state.total > 0 ? 4 * state.inside / state.total : 0;
    const err = Math.abs(piEst - Math.PI);

    c.fillStyle = '#e6e8ec';
    c.font = 'bold 24px -apple-system, sans-serif';
    c.textAlign = 'left';
    c.fillText('π ≈', rightX, 80);
    c.fillStyle = '#6ee7b7';
    c.fillText(piEst.toFixed(6), rightX + 50, 80);

    c.fillStyle = '#8a93a6';
    c.font = '12px -apple-system, sans-serif';
    c.fillText('真实 π = 3.141593', rightX, 105);
    c.fillText('误差: ' + err.toFixed(5), rightX, 125);
    c.fillText('投点数: ' + state.total.toLocaleString(), rightX, 145);
    c.fillText('圆内: ' + state.inside.toLocaleString(), rightX, 165);
    c.fillText(`圆内比例: ${(state.inside / state.total * 100).toFixed(2)}%`, rightX, 185);

    // 误差条(可视化)
    c.fillStyle = '#2a3140';
    c.fillRect(rightX, 220, 280, 20);
    const errBar = Math.min(1, err * 10);  // 0.1 误差 = 满
    c.fillStyle = err > 0.1 ? '#ff6b6b' : (err > 0.01 ? '#f0c040' : '#6ee7b7');
    c.fillRect(rightX, 220, errBar * 280, 20);
    c.fillStyle = '#8a93a6';
    c.font = '10px monospace';
    c.fillText('误差(0=0%, 1=10%)', rightX, 254);
  }

  function drawIntegralMode(c, W, H) {
    // 左侧:被积函数图 + 矩形采样
    const leftW = Math.min(W * 0.5, H * 0.7);
    const margin = 30;
    const funcX = margin, funcY = 50;
    const funcW = leftW - margin * 2, funcH = H - funcY - margin * 2;

    c.strokeStyle = '#1c2230';
    c.lineWidth = 1;
    c.strokeRect(funcX, funcY, funcW, funcH);

    // sin(x) 曲线(0 到 π)
    c.strokeStyle = '#4ea1ff';
    c.lineWidth = 2;
    c.beginPath();
    for (let i = 0; i <= 200; i++) {
      const xx = (i / 200) * Math.PI;
      const yy = Math.sin(xx);
      const px = funcX + (xx / Math.PI) * funcW;
      const py = funcY + funcH - yy * funcH * 0.85;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.stroke();

    // 采样点(随机 x 的 f(x) 值)
    c.fillStyle = 'rgba(110, 231, 183, 0.6)';
    for (let i = 0; i < Math.min(500, state.integralN); i++) {
      const x = Math.random() * Math.PI;
      const fx = Math.sin(x);
      const px = funcX + (x / Math.PI) * funcW;
      const py = funcY + funcH - fx * funcH * 0.85;
      c.fillRect(px - 0.5, py - 0.5, 1.5, 1.5);
    }

    c.fillStyle = '#8a93a6';
    c.font = '11px -apple-system, sans-serif';
    c.fillText('sin(x) on [0, π] · 绿点=采样', funcX, funcY - 8);

    // 右侧:收敛曲线
    const rightX = leftW + 50;
    const rightW = W - rightX - 30;
    const rightH = H - 100;

    c.fillStyle = '#8a93a6';
    c.font = '12px -apple-system, sans-serif';
    c.fillText('收敛过程(估算值随 N 的变化)', rightX, 28);

    c.strokeStyle = '#1c2230';
    c.lineWidth = 1;
    c.strokeRect(rightX, 50, rightW, rightH);

    // 真实值线
    c.strokeStyle = 'rgba(255, 107, 107, 0.6)';
    c.lineWidth = 1;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(rightX, 50 + rightH * 0.5);
    c.lineTo(rightX + rightW, 50 + rightH * 0.5);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = '#ff6b6b';
    c.font = '10px monospace';
    c.fillText('真实值 = 2.0000', rightX + 4, 50 + 12);

    // 估算曲线
    c.strokeStyle = '#6ee7b7';
    c.lineWidth = 1.5;
    c.beginPath();
    state.integralEstHistory.forEach((p, i) => {
      const px = rightX + Math.log(p.n) / Math.log(state.integralN) * rightW;
      const py = 50 + rightH * 0.5 - (p.est - 2) * rightH * 2;  // 中心 2,放大 2x
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    });
    c.stroke();

    // 当前值
    const curEst = state.integralN > 0 ? (Math.PI * state.integralSum / state.integralN) : 0;
    c.fillStyle = '#e6e8ec';
    c.font = 'bold 22px -apple-system, sans-serif';
    c.fillText('∫sin(x) dx ≈', rightX, 50 + rightH + 40);
    c.fillStyle = '#6ee7b7';
    c.fillText(curEst.toFixed(5), rightX + 130, 50 + rightH + 40);

    c.fillStyle = '#8a93a6';
    c.font = '11px -apple-system, sans-serif';
    c.fillText('真实值 2.0000 · 误差 ' + Math.abs(curEst - 2).toFixed(5), rightX, 50 + rightH + 60);
    c.fillText('采样 N = ' + state.integralN.toLocaleString(), rightX, 50 + rightH + 78);
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // ---------- 交互 ----------
  const _bInp = ctrls.querySelector('[data-batch]');
  const _bV = ctrls.querySelector('[data-batch-v]');
  const _mSel = ctrls.querySelector('[data-mode]');
  _bInp.addEventListener('input', (e) => {
    params.batch = parseInt(e.target.value);
    _bV.textContent = params.batch;
  });
  _mSel.addEventListener('change', (e) => {
    params.mode = e.target.value;
    reset();
  });
  ctrls.querySelector('[data-reset]').addEventListener('click', () => reset());

  return {
    sceneId: 'monte-carlo',
    getFormula() { return 'π ≈ 4N内/N总   ∫f ≈ (b-a)·<f>   误差 ~ 1/√N'; },
    // v0.6.28: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { batch: params.batch, mode: params.mode }; },
    setState(s) {
      if (!s) return;
      if (typeof s.batch === 'number') { params.batch = s.batch; _bInp.value = s.batch; _bV.textContent = s.batch; }
      if (s.mode) { params.mode = s.mode; _mSel.value = s.mode; reset(); }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
