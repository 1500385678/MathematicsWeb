// viewer/scenes/12_clt.js
// MathematicsWeb v0.6.0 — 中心极限定理 (数学 × 概率统计)
// 2D Canvas 场景:扔 N 个骰子,看 N 个骰子之和的分布
//   - N=1:均匀(1-6 出现概率一样)
//   - N=2:三角分布(2-12,中间高)
//   - N=3+ → 越来越接近正态分布
//   - 这是统计学最重要的定理:独立同分布随机变量之和 → 正态
//
// 数学:CLT — X = (X₁ + X₂ + ... + Xₙ) / n
//   当 n→∞,X 的分布 → N(μ, σ²/n),其中 μ 是单变量期望,σ² 是方差
//
// 调 N 看分布收敛 + 叠加理论正态曲线对比

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
    <div class="mathw-lesson-title">数学 × 概率 · 中心极限定理</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">扔 N 个骰子,N 越大越像正态</div>
      <div class="mathw-lesson-formula">(X₁+...+Xₙ)/n → N(μ, σ²/n)</div>
      <div class="mathw-lesson-text">
        这是统计学最重要的定理:<strong>独立同分布随机变量之和 → 正态分布</strong>。
        跟原变量分布无关 — 不管是骰子、coin、还是任意奇怪的分布,加多了就是正态。<br>
        调 N 看分布收敛速度。N=1 均匀,N=2 三角,N=3+ 接近正态,N≥30 几乎一样。
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
    <div class="mathw-controls-title">参数 · 中心极限定理</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">骰子数 N</span>
      <input type="range" min="1" max="20" step="1" value="2" data-n />
      <span class="mathw-control-value" data-n-v>2</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">采样/帧</span>
      <input type="range" min="100" max="2000" step="100" value="500" data-batch />
      <span class="mathw-control-value" data-batch-v>500</span>
    </div>
    <div class="mathw-control-row">
      <button data-reset>重置</button>
    </div>
  `;
  host.appendChild(ctrls);

  let params = { n: 2, batch: 500 };
  // 直方图桶数 = 骰子面数 × N
  let histogram = [];
  let totalSamples = 0;
  const MAX_HIST = 100000;

  function reset() {
    const numBuckets = 6 * params.n + 1;  // 2-12 是 11 桶(对于 N 个骰子,范围是 N..6N)
    histogram = new Array(numBuckets).fill(0);
    totalSamples = 0;
  }
  reset();

  function sample(batch) {
    for (let i = 0; i < batch; i++) {
      let sum = 0;
      for (let j = 0; j < params.n; j++) {
        sum += 1 + Math.floor(Math.random() * 6);
      }
      // sum 范围 N..6N,索引 0..6N-N
      histogram[sum - params.n] += 1;
      totalSamples++;
    }
    if (totalSamples > MAX_HIST) {
      // 缩放保持形状
      const scale = MAX_HIST / totalSamples;
      histogram = histogram.map(v => Math.floor(v * scale));
      totalSamples = MAX_HIST;
    }
  }

  const ctx = canvas.getContext('2d');

  function draw(elapsed, dt) {
    sample(params.batch);

    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    // 标题
    ctx.fillStyle = '#8a93a6';
    ctx.font = '13px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${params.n} 个骰子之和的分布 · 采样 ${totalSamples.toLocaleString()} 次`, 20, 30);

    // 画图
    const numBuckets = histogram.length;
    const minSum = params.n;
    const maxSum = 6 * params.n;
    const barW = Math.max(2, (W - 80) / numBuckets - 1);
    const chartH = H - 100;
    const maxCount = Math.max(1, ...histogram);

    // 坐标轴
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 50);
    ctx.lineTo(40, 50 + chartH);
    ctx.lineTo(W - 20, 50 + chartH);
    ctx.stroke();

    // 理论正态曲线(N≥3 时画)
    if (params.n >= 3) {
      const mu = params.n * 3.5;
      const sigma = Math.sqrt(params.n * 35 / 12);  // 6 面骰子方差 35/12
      ctx.strokeStyle = 'rgba(240, 192, 64, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      const SCALE = totalSamples * 0.05;  // 缩放使曲线覆盖直方图峰值
      for (let i = 0; i < 200; i++) {
        const x = minSum + (i / 200) * (maxSum - minSum);
        const z = (x - mu) / sigma;
        const y = Math.exp(-z * z / 2) / (sigma * Math.sqrt(2 * Math.PI));
        const px = 40 + ((x - minSum) / (maxSum - minSum)) * (W - 60);
        const py = 50 + chartH - y * SCALE * 30;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 直方图
    for (let i = 0; i < numBuckets; i++) {
      const x = 40 + (i / numBuckets) * (W - 60);
      const barH = (histogram[i] / maxCount) * chartH;
      ctx.fillStyle = params.n === 1 ? '#ff6b6b' :
                       params.n === 2 ? '#f0c040' :
                       '#6ee7b7';
      ctx.fillRect(x, 50 + chartH - barH, barW, barH);
      // 数值
      ctx.fillStyle = '#8a93a6';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      const sumLabel = (params.n + i).toString();
      ctx.fillText(sumLabel, x + barW / 2, 50 + chartH + 14);
    }

    // 统计
    const mu_emp = histogram.reduce((s, v, i) => s + v * (params.n + i), 0) / Math.max(1, totalSamples);
    const sigma_emp = Math.sqrt(histogram.reduce((s, v, i) => {
      const x = params.n + i;
      return s + v * (x - mu_emp) ** 2;
    }, 0) / Math.max(1, totalSamples));
    ctx.fillStyle = '#4ea1ff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`均值 μ ≈ ${mu_emp.toFixed(2)} (理论 ${(params.n * 3.5).toFixed(2)})`, W - 24, 28);
    ctx.fillText(`标准差 σ ≈ ${sigma_emp.toFixed(2)} (理论 ${Math.sqrt(params.n * 35 / 12).toFixed(2)})`, W - 24, 46);

    // 提示
    if (params.n >= 3) {
      ctx.fillStyle = '#f0c040';
      ctx.textAlign = 'left';
      ctx.fillText('黄虚线 = 理论正态', 50, 50 + chartH + 30);
    }

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // 交互
  const _nInp = ctrls.querySelector('[data-n]');
  const _nV = ctrls.querySelector('[data-n-v]');
  const _bInp = ctrls.querySelector('[data-batch]');
  const _bV = ctrls.querySelector('[data-batch-v]');
  _nInp.addEventListener('input', (e) => { params.n = parseInt(e.target.value); _nV.textContent = params.n; reset(); });
  _bInp.addEventListener('input', (e) => { params.batch = parseInt(e.target.value); _bV.textContent = params.batch; });
  ctrls.querySelector('[data-reset]').addEventListener('click', () => reset());

  return {
    sceneId: 'clt',
    getFormula() { return '(X₁+...+Xₙ)/n → N(μ, σ²/n)'; },
    // v0.6.17: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { n: params.n, batch: params.batch }; },
    setState(s) {
      if (!s) return;
      if (typeof s.n === 'number') { params.n = s.n; _nInp.value = s.n; _nV.textContent = s.n; reset(); }
      if (typeof s.batch === 'number') { params.batch = s.batch; _bInp.value = s.batch; _bV.textContent = s.batch; }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
