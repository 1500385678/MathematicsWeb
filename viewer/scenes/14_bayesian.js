// viewer/scenes/14_bayesian.js
// MathematicsWeb v0.6.0 — 贝叶斯推断 (数学 × 概率统计)
// 2D Canvas 场景:投硬币估计正面概率
//   - 先验 Beta(α,β) 分布(初始信念)
//   - 观测 N 次正面,k 次反面(似然)
//   - 后验 Beta(α+k, β+N-k)(贝叶斯更新)
//   - 实时画:先验曲线 / 后验曲线 / MAP / 均值
//
// 数学:贝叶斯定理
//   后验 P(θ|data) ∝ 先验 P(θ) × 似然 P(data|θ)
//   Beta-Binomial 共轭:
//     先验 Beta(α,β) + 二项似然(k/N) → 后验 Beta(α+k, β+N−k)
//
// 应用:医学诊断 / A/B 测试 / 垃圾邮件 / 任何"边观测边更新信念"的场景

import { makeLoop, fitCanvas } from '../../kernel/02_animation.js';

export function createScene(host, opts = {}) {
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
    <div class="mathw-lesson-title">数学 × 概率 · 贝叶斯推断</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">先验 + 观测 = 后验</div>
      <div class="mathw-lesson-formula">P(θ|data) ∝ P(θ) · P(data|θ)</div>
      <div class="mathw-lesson-text">
        经典频率派:概率 = 客观频率。贝叶斯派:概率 = 信念强度,观测更新信念。<br>
        这里用 <strong>Beta-Binomial 共轭</strong>(最经典的贝叶斯例子):投硬币 N 次,k 次正面。<br>
        先验 Beta(α,β) → 后验 Beta(α+k, β+N−k)。MAP = (α+k-1)/(α+β+N-2)。<br>
        试调 α/β 改"先验信念",看几次观测怎么把后验往数据方向拉。
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
    <div class="mathw-controls-title">参数 · 贝叶斯</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">先验 α</span>
      <input type="range" min="0.5" max="20" step="0.5" value="2" data-alpha />
      <span class="mathw-control-value" data-alpha-v>2.0</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">先验 β</span>
      <input type="range" min="0.5" max="20" step="0.5" value="2" data-beta />
      <span class="mathw-control-value" data-beta-v>2.0</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">正/反 观测</span>
      <input type="number" min="0" max="50" value="7" data-k style="width:50px" />
      /
      <input type="number" min="0" max="50" value="3" data-n style="width:50px" />
    </div>
    <div class="mathw-control-row">
      <button data-obs>模拟 +1 观测</button>
      <button data-reset>清观测</button>
    </div>
  `;
  host.appendChild(ctrls);

  // 状态:α,β 连续可调,但观测 k/n 是离散的(用户输入或点按钮加)
  let params = { alpha: 2, beta: 2, k: 7, n: 10 };

  // Beta 分布 PDF
  function logBeta(a, b) {
    // 简易 ln Γ
    return logGamma(a) + logGamma(b) - logGamma(a + b);
  }
  function logGamma(x) {
    // Lanczos 近似
    const g = 7;
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
    x -= 1;
    let a_ = c[0];
    const t = x + g + 0.5;
    for (let i = 1; i < g + 2; i++) a_ += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a_);
  }
  function betaPdf(x, a, b) {
    if (x <= 0 || x >= 1) return 0;
    return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - logBeta(a, b));
  }
  function betaMean(a, b) { return a / (a + b); }
  function betaMap(a, b) { return (a - 1) / (a + b - 2); }

  const ctx = canvas.getContext('2d');

  function draw(elapsed, dt) {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    const chartX = 60, chartY = 60;
    const chartW = W - 100, chartH = H - 140;
    const a0 = params.alpha, b0 = params.beta;
    const a1 = a0 + params.k;
    const b1 = b0 + (params.n - params.k);

    // 找最大 y 用于归一化
    let maxY = 0;
    for (let i = 0; i <= 200; i++) {
      const x = i / 200;
      maxY = Math.max(maxY, betaPdf(x, a0, b0), betaPdf(x, a1, b1));
    }
    const yScale = chartH / (maxY * 1.1);

    function toY(x) { return chartY + chartH - betaPdf(x, a0, b0) * yScale; }
    function toY1(x) { return chartY + chartH - betaPdf(x, a1, b1) * yScale; }

    // x 轴
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY + chartH);
    ctx.lineTo(chartX + chartW, chartY + chartH);
    ctx.stroke();
    // y 轴
    ctx.beginPath();
    ctx.moveTo(chartX, chartY);
    ctx.lineTo(chartX, chartY + chartH);
    ctx.stroke();

    // 网格
    for (let i = 1; i < 10; i++) {
      const gx = chartX + (i / 10) * chartW;
      ctx.strokeStyle = '#1c2230';
      ctx.beginPath();
      ctx.moveTo(gx, chartY);
      ctx.lineTo(gx, chartY + chartH);
      ctx.stroke();
      ctx.fillStyle = '#8a93a6';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText((i / 10).toFixed(1), gx, chartY + chartH + 14);
    }

    // 先验曲线
    ctx.strokeStyle = 'rgba(78, 161, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = i / 200;
      const y = toY(x);
      if (i === 0) ctx.moveTo(chartX + x * chartW, y); else ctx.lineTo(chartX + x * chartW, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 后验曲线
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = i / 200;
      const y = toY1(x);
      if (i === 0) ctx.moveTo(chartX + x * chartW, y); else ctx.lineTo(chartX + x * chartW, y);
    }
    ctx.stroke();

    // 先验 MAP / 均值
    if (a0 > 1 && b0 > 1) {
      const map0 = betaMap(a0, b0);
      const mapY0 = toY(map0);
      ctx.fillStyle = '#4ea1ff';
      ctx.beginPath();
      ctx.arc(chartX + map0 * chartW, mapY0, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    const mean0 = betaMean(a0, b0);
    ctx.strokeStyle = 'rgba(78, 161, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartX + mean0 * chartW, chartY);
    ctx.lineTo(chartX + mean0 * chartW, chartY + chartH);
    ctx.stroke();

    // 后验 MAP / 均值
    if (a1 > 1 && b1 > 1) {
      const map1 = betaMap(a1, b1);
      const mapY1 = toY1(map1);
      ctx.fillStyle = '#f0c040';
      ctx.beginPath();
      ctx.arc(chartX + map1 * chartW, mapY1, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    const mean1 = betaMean(a1, b1);
    ctx.strokeStyle = 'rgba(110, 231, 183, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartX + mean1 * chartW, chartY);
    ctx.lineTo(chartX + mean1 * chartW, chartY + chartH);
    ctx.stroke();

    // 标签
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('先验 Beta(' + a0 + ', ' + b0 + ') 蓝虚线', 50, 30);
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText('后验 Beta(' + a1 + ', ' + b1 + ') 绿实线', 50, 48);
    ctx.fillStyle = '#f0c040';
    ctx.fillText(`观测: ${params.k}/${params.n} 次正面 (${(params.k / Math.max(1, params.n) * 100).toFixed(0)}%)`, W - 320, 30);
    ctx.fillText(`后验均值 ≈ ${mean1.toFixed(3)} · MAP ≈ ${(a1 > 1 && b1 > 1) ? betaMap(a1, b1).toFixed(3) : 'N/A'}`, W - 320, 48);

    // 图例
    ctx.fillStyle = '#4ea1ff';
    ctx.beginPath(); ctx.arc(W - 60, 30, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f0c040';
    ctx.beginPath(); ctx.arc(W - 60, 48, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a93a6';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('先验 MAP', W - 70, 33);
    ctx.fillText('后验 MAP', W - 70, 51);

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // 交互
  const _aInp = ctrls.querySelector('[data-alpha]');
  const _aV = ctrls.querySelector('[data-alpha-v]');
  const _bInp = ctrls.querySelector('[data-beta]');
  const _bV = ctrls.querySelector('[data-beta-v]');
  const _kInp = ctrls.querySelector('[data-k]');
  const _nInp = ctrls.querySelector('[data-n]');
  _aInp.addEventListener('input', (e) => { params.alpha = parseFloat(e.target.value); _aV.textContent = params.alpha.toFixed(1); });
  _bInp.addEventListener('input', (e) => { params.beta = parseFloat(e.target.value); _bV.textContent = params.beta.toFixed(1); });
  _kInp.addEventListener('input', (e) => { params.k = parseInt(e.target.value); });
  _nInp.addEventListener('input', (e) => { params.n = parseInt(e.target.value); });
  ctrls.querySelector('[data-obs]').addEventListener('click', () => {
    // 模拟 1 次随机观测(50/50 真实)
    if (Math.random() < 0.5) params.k++;
    params.n++;
    _kInp.value = params.k;
    _nInp.value = params.n;
  });
  ctrls.querySelector('[data-reset]').addEventListener('click', () => {
    params.k = 0; params.n = 0;
    _kInp.value = 0; _nInp.value = 0;
  });

  return {
    sceneId: 'bayesian',
    getFormula() { return 'P(θ|data) ∝ P(θ)·P(data|θ)'; },
    // v0.6.16: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { ...params }; },
    setState(s) {
      if (!s) return;
      if (typeof s.alpha === 'number') { params.alpha = s.alpha; _aInp.value = s.alpha; _aV.textContent = s.alpha.toFixed(1); }
      if (typeof s.beta === 'number') { params.beta = s.beta; _bInp.value = s.beta; _bV.textContent = s.beta.toFixed(1); }
      if (typeof s.k === 'number') { params.k = s.k; _kInp.value = s.k; }
      if (typeof s.n === 'number') { params.n = s.n; _nInp.value = s.n; }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
