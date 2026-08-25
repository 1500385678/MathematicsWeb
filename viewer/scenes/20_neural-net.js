// viewer/scenes/20_neural-net.js
// MathematicsWeb v0.6.0 — 神经网络 2D 分类 (数学 × 机器学习)
// 2D Canvas 场景:2 层神经网络(输入 2 / 隐藏 8 / 输出 2)做 2D 分类
//   - 实时画决策边界 + 数据点
//   - 用户点击空白:加训练样本
//   - 训练/暂停按钮
//   - 调学习率 + 隐藏层神经元数
//   - 损失曲线 + 准确率
//
// 数学:
//   前向:hidden = tanh(W1·x + b1); output = softmax(W2·h + b2)
//   损失:cross-entropy
//   反向:链式法则 + 梯度下降
//   训练:SGD 小批量,每 100 个 epoch 触发一次
//
// 直觉:2D 平面被神经网络学到的"超曲线"分成多个区域
// 蓝/红点 = 真实样本,白线 = 决策边界(50% 概率)

import { makeLoop, fitCanvas } from '../../kernel/02_animation.js';

export function createScene(host, opts = {}) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;inset:0;overflow:hidden;';
  host.appendChild(wrap);

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;';
  wrap.appendChild(canvas);

  const lesson = document.createElement('div');
  lesson.className = 'mathw-lesson';
  lesson.innerHTML = `
    <button class="mathw-lesson-toggle" data-toggle>−</button>
    <div class="mathw-lesson-title">数学 × 机器学习 · 神经网络 2D 分类</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">2D 平面上,网络学出"决策曲线"</div>
      <div class="mathw-lesson-formula">y = softmax(W₂·tanh(W₁x + b₁) + b₂)</div>
      <div class="mathw-lesson-text">
        2 层全连接网络:输入 2 维(点坐标)→ 隐藏 N(默认 8) → 输出 2 类(蓝/红)。<br>
        训练 = 反向传播 + 梯度下降,每帧若干 mini-batch。<br>
        <strong>左键</strong> 空白 = 加蓝色样本 · <strong>右键</strong> = 红色样本 · <strong>左键拖</strong> 旧样本 = 移动。<br>
        调学习率看收敛 / 震荡;调隐藏神经元数看拟合能力。
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
    <div class="mathw-controls-title">参数 · 神经网络</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">学习率</span>
      <input type="range" min="0.01" max="2" step="0.01" value="0.3" data-lr />
      <span class="mathw-control-value" data-lr-v>0.30</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">隐藏层</span>
      <input type="range" min="2" max="20" step="1" value="8" data-hidden />
      <span class="mathw-control-value" data-hidden-v>8</span>
    </div>
    <div class="mathw-control-row">
      <button data-train>训练/暂停</button>
      <button data-reset>重置数据</button>
    </div>
  `;
  host.appendChild(ctrls);

  let params = { lr: 0.3, hidden: 8 };
  let training = true;
  // 训练样本:{x, y, label}  label 0=蓝 1=红
  let samples = [
    { x: -0.6, y: 0.5, label: 0 }, { x: -0.7, y: -0.2, label: 0 },
    { x: -0.3, y: 0.7, label: 0 }, { x: -0.1, y: -0.5, label: 0 },
    { x: 0.5, y: 0.3, label: 1 }, { x: 0.7, y: -0.4, label: 1 },
    { x: 0.3, y: -0.6, label: 1 }, { x: 0.1, y: 0.6, label: 1 },
  ];
  let W1, b1, W2, b2;   // 权重(2→hidden, hidden→2)
  let lossHistory = [];
  const MAX_LOSS = 200;

  function initWeights() {
    const h = params.hidden;
    W1 = Array.from({ length: h }, () => [Math.random() * 0.6 - 0.3, Math.random() * 0.6 - 0.3]);
    b1 = new Array(h).fill(0);
    W2 = Array.from({ length: 2 }, () => Array.from({ length: h }, () => Math.random() * 0.6 - 0.3));
    b2 = [0, 0];
    lossHistory = [];
  }
  initWeights();

  function paramsFromHidden() {
    if (params.hidden !== W1.length) initWeights();
  }

  // 前向
  function forward(x, y) {
    // hidden = tanh(W1 * x + b1)
    const h = new Array(params.hidden);
    for (let i = 0; i < params.hidden; i++) {
      h[i] = Math.tanh(W1[i][0] * x + W1[i][1] * y + b1[i]);
    }
    // output = softmax(W2 * h + b2)
    const o = [0, 0];
    for (let c = 0; c < 2; c++) {
      let s = b2[c];
      for (let i = 0; i < params.hidden; i++) s += W2[c][i] * h[i];
      o[c] = s;
    }
    // softmax
    const maxO = Math.max(o[0], o[1]);
    const e0 = Math.exp(o[0] - maxO);
    const e1 = Math.exp(o[1] - maxO);
    const sum = e0 + e1;
    return { h, out: [e0 / sum, e1 / sum] };
  }

  // 训练 1 步
  function trainStep() {
    if (samples.length < 2) return;
    const s = samples[Math.floor(Math.random() * samples.length)];
    const { h, out } = forward(s.x, s.y);
    const target = s.label;
    // 梯度(output):dL/d_out = out - one_hot
    const dOut = [out[0] - (target === 0 ? 1 : 0), out[1] - (target === 1 ? 1 : 0)];
    // 梯度(W2, b2):dW2[c][i] += dOut[c] * h[i]
    const dW2 = Array.from({ length: 2 }, () => new Array(params.hidden).fill(0));
    for (let c = 0; c < 2; c++) {
      for (let i = 0; i < params.hidden; i++) dW2[c][i] = dOut[c] * h[i];
    }
    // 梯度(hidden):dH[i] = Σ_c dOut[c] * W2[c][i] * (1 - h[i]²)  (tanh 导数)
    const dH = new Array(params.hidden);
    for (let i = 0; i < params.hidden; i++) {
      let s = 0;
      for (let c = 0; c < 2; c++) s += dOut[c] * W2[c][i];
      dH[i] = s * (1 - h[i] * h[i]);
    }
    // 梯度(W1, b1):dW1[i][0] += dH[i] * x; dW1[i][1] += dH[i] * y
    const dW1 = Array.from({ length: params.hidden }, () => [0, 0]);
    for (let i = 0; i < params.hidden; i++) {
      dW1[i][0] = dH[i] * s.x;
      dW1[i][1] = dH[i] * s.y;
    }
    // 更新
    const lr = params.lr;
    for (let i = 0; i < params.hidden; i++) {
      W1[i][0] -= lr * dW1[i][0];
      W1[i][1] -= lr * dW1[i][1];
      b1[i] -= lr * dH[i];
    }
    for (let c = 0; c < 2; c++) {
      for (let i = 0; i < params.hidden; i++) W2[c][i] -= lr * dW2[c][i];
      b2[c] -= lr * dOut[c];
    }
    // 损失
    const loss = -Math.log(Math.max(out[target], 1e-10));
    lossHistory.push(loss);
    if (lossHistory.length > MAX_LOSS) lossHistory.shift();
  }

  // 准确率
  function accuracy() {
    if (samples.length === 0) return 0;
    let correct = 0;
    for (const s of samples) {
      const { out } = forward(s.x, s.y);
      const pred = out[0] > out[1] ? 0 : 1;
      if (pred === s.label) correct++;
    }
    return correct / samples.length;
  }

  const ctx = canvas.getContext('2d');

  function draw(elapsed, dt) {
    paramsFromHidden();
    if (training) {
      for (let i = 0; i < 20; i++) trainStep();  // 每帧 20 步
    }

    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    const ox = W / 2, oy = H / 2;
    const scale = Math.min(W, H) * 0.40;

    // 决策热图(背景,50×50 网格)
    const GW = 60, GH = 40;
    const imgData = ctx.createImageData(GW, GH);
    const data = imgData.data;
    for (let py = 0; py < GH; py++) {
      for (let px = 0; px < GW; px++) {
        const x = (px / GW) * 2 - 1;
        const y = -((py / GH) * 2 - 1);
        const { out } = forward(x, y);
        // 蓝色 0 / 红色 1
        const t = out[1];  // P(red)
        const r = Math.floor(20 + 180 * t);
        const g = Math.floor(40 + 60 * (1 - Math.abs(t - 0.5) * 2));
        const b = Math.floor(20 + 180 * (1 - t));
        const idx = (py * GW + px) * 4;
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 80;
      }
    }
    const tmp = document.createElement('canvas');
    tmp.width = GW; tmp.height = GH;
    tmp.getContext('2d').putImageData(imgData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tmp, ox - scale, oy - scale, scale * 2, scale * 2);

    // 决策边界(50% 等高线)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let py = 0; py < GH; py++) {
      for (let px = 0; px < GW; px++) {
        const x = (px / GW) * 2 - 1;
        const y = -((py / GH) * 2 - 1);
        const { out } = forward(x, y);
        if (Math.abs(out[1] - 0.5) < 0.04) {
          const cx = ox + x * scale, cy = oy + y * scale;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(cx - 0.5, cy - 0.5, 1, 1);
        }
      }
    }

    // 坐标轴
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, oy); ctx.lineTo(W, oy);
    ctx.moveTo(ox, 0); ctx.lineTo(ox, H);
    ctx.stroke();

    // 样本点
    for (const s of samples) {
      const px = ox + s.x * scale, py = oy + s.y * scale;
      ctx.fillStyle = s.label === 0 ? '#4ea1ff' : '#ff6b6b';
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0e1116';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 损失曲线(右下角)
    if (lossHistory.length > 1) {
      const lx0 = W - 200, ly0 = H - 80, lw = 180, lh = 60;
      ctx.fillStyle = 'rgba(20, 24, 32, 0.7)';
      ctx.fillRect(lx0, ly0, lw, lh);
      ctx.strokeStyle = '#2a3140';
      ctx.strokeRect(lx0, ly0, lw, lh);
      const maxL = Math.max(...lossHistory, 0.1);
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < lossHistory.length; i++) {
        const px = lx0 + (i / MAX_LOSS) * lw;
        const py = ly0 + lh - (lossHistory[i] / maxL) * (lh - 6);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.fillStyle = '#8a93a6';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('损失 ↓', lx0 + 4, ly0 + 12);
      const acc = accuracy();
      ctx.fillStyle = '#f0c040';
      ctx.fillText(`准确率: ${(acc * 100).toFixed(0)}%`, lx0 + 4, ly0 + lh - 4);
    }

    // 信息
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`隐藏层: ${params.hidden} · 学习率: ${params.lr.toFixed(2)} · ${training ? '▶ 训练中' : '⏸ 暂停'}`, 20, 28);
    ctx.fillStyle = '#4ea1ff';
    ctx.fillText('🔵 蓝 0 · 🔴 红 1', 20, 48);
    ctx.fillText('左键空白=加蓝 · 右键=加红 · 拖样本=移动', 20, H - 18);

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // 交互
  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) - rect.width / 2) / (rect.width / 2),
             y: -((e.clientY - rect.top) - rect.height / 2) / (rect.height / 2) };
  }
  function hitSample(p) {
    for (let i = 0; i < samples.length; i++) {
      if (Math.hypot(p.x - samples[i].x, p.y - samples[i].y) < 0.1) return i;
    }
    return -1;
  }
  let dragIdx = null;
  canvas.addEventListener('mousedown', (e) => {
    const p = getMousePos(e);
    if (e.button === 2) {  // 右键
      e.preventDefault();
      const idx = hitSample(p);
      if (idx >= 0) samples.splice(idx, 1);
      else samples.push({ x: p.x, y: p.y, label: 1 });
      return;
    }
    const idx = hitSample(p);
    if (idx >= 0) dragIdx = idx;
    else samples.push({ x: p.x, y: p.y, label: 0 });
  });
  window.addEventListener('mousemove', (e) => {
    if (dragIdx === null) return;
    const p = getMousePos(e);
    samples[dragIdx].x = p.x;
    samples[dragIdx].y = p.y;
  });
  window.addEventListener('mouseup', () => { dragIdx = null; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  ctrls.querySelector('[data-train]').addEventListener('click', () => training = !training);
  ctrls.querySelector('[data-reset]').addEventListener('click', () => {
    samples = [
      { x: -0.6, y: 0.5, label: 0 }, { x: -0.7, y: -0.2, label: 0 },
      { x: -0.3, y: 0.7, label: 0 }, { x: -0.1, y: -0.5, label: 0 },
      { x: 0.5, y: 0.3, label: 1 }, { x: 0.7, y: -0.4, label: 1 },
      { x: 0.3, y: -0.6, label: 1 }, { x: 0.1, y: 0.6, label: 1 },
    ];
    initWeights();
  });
  const _lrInp = ctrls.querySelector('[data-lr]');
  const _lrV = ctrls.querySelector('[data-lr-v]');
  const _hInp = ctrls.querySelector('[data-hidden]');
  const _hV = ctrls.querySelector('[data-hidden-v]');
  _lrInp.addEventListener('input', (e) => { params.lr = parseFloat(e.target.value); _lrV.textContent = params.lr.toFixed(2); });
  _hInp.addEventListener('input', (e) => { params.hidden = parseInt(e.target.value); _hV.textContent = params.hidden; });

  return {
    sceneId: 'neural-net',
    getFormula() { return 'y = softmax(W₂·tanh(W₁x + b₁) + b₂)'; },
    // v0.6.10: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { lr: params.lr, hidden: params.hidden, training, samples: [...samples] }; },
    setState(s) {
      if (!s) return;
      if (typeof s.lr === 'number') { params.lr = s.lr; _lrInp.value = s.lr; _lrV.textContent = s.lr.toFixed(2); }
      if (typeof s.hidden === 'number') { params.hidden = s.hidden; _hInp.value = s.hidden; _hV.textContent = s.hidden; paramsFromHidden(); }
      if (typeof s.training === 'boolean') training = s.training;
      if (s.samples) samples = s.samples.map(x => ({ ...x }));
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
