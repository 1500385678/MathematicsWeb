// viewer/scenes/03_fourier-synth.js
// MathematicsWeb v0.1.0 — 傅里叶合成器 (数学 × 音乐)
// 2D Canvas 场景:左半屏画转圈的"傅里叶箭头",右半屏画最终函数图
// 用户选波形(方波/锯齿/三角/自定义),调谐波数 N,看任意周期函数怎么拆成 sin/cos 之和
//
// 数学:f(t) = a₀/2 + Σ[aₙ·cos(nωt) + bₙ·sin(nωt)]
// 直觉:每个箭头 = 一个旋转矢量,把很多箭头首尾相连,最终位置画出函数
//
// 关键点:
//   - 方波只有奇数次谐波,且 bₙ = 4/(nπ) — 经典教学例子
//   - 锯齿波所有谐波都有
//   - N 越大越接近原函数(Gibbs 现象在跳变点 ~9% 过冲)

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
    <div class="mathw-lesson-title">数学 × 音乐 · 傅里叶合成</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">任何波形 = 一堆转圈的箭头</div>
      <div class="mathw-lesson-formula">f(t) = a₀/2 + Σ[aₙ·cos(nωt) + bₙ·sin(nωt)]</div>
      <div class="mathw-lesson-text">
        <strong>左边</strong>:每个箭头以自己的频率转圈,长度 = 振幅。<br>
        <strong>右边</strong>:所有箭头首尾相连,最终位置画出函数图像。<br>
        调<strong>谐波数 N</strong>看近似精度,选不同<strong>波形</strong>看分解。
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
    <div class="mathw-controls-title">参数 · 傅里叶</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">波形</span>
      <select data-wave>
        <option value="square">方波</option>
        <option value="sawtooth" selected>锯齿波</option>
        <option value="triangle">三角波</option>
        <option value="pulse">脉冲(50% 占空比)</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">谐波 N</span>
      <input type="range" min="1" max="40" step="1" value="10" data-n />
      <span class="mathw-control-value" data-n-v>10</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">频率</span>
      <input type="range" min="0.5" max="3" step="0.1" value="1" data-freq />
      <span class="mathw-control-value" data-freq-v>1.0Hz</span>
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let params = { wave: 'sawtooth', n: 10, freq: 1 };

  // 各种波形的傅里叶系数(归一化)
  // 周期 = 1,所以 ω = 2π
  function coefficients(wave, n) {
    // 返回 { freqs: [...], amps: [...], phases: [...] }
    const result = { freqs: [], amps: [], phases: [] };
    for (let k = 1; k <= n; k++) {
      let amp, phase;
      if (wave === 'square') {
        // b_k = 4/(kπ) (k 奇数),偶数 = 0
        if (k % 2 === 0) { amp = 0; }
        else { amp = 4 / (k * Math.PI); }
        phase = -Math.PI / 2;  // sin 项主导
      } else if (wave === 'sawtooth') {
        // b_k = 2·(-1)^(k+1) / (kπ),所有 k 都有
        amp = 2 * (k % 2 === 1 ? 1 : -1) / (k * Math.PI);
        phase = -Math.PI / 2;
      } else if (wave === 'triangle') {
        // a_k = 8·(-1)^((k-1)/2) / (π²k²) (k 奇数),偶数 = 0
        if (k % 2 === 0) { amp = 0; }
        else { amp = 8 * ((k - 1) / 2 % 2 === 0 ? 1 : -1) / (Math.PI * Math.PI * k * k); }
        phase = 0;  // cos 项主导
      } else if (wave === 'pulse') {
        // 占空比 50% 的脉冲串,展开类似方波但符号分布
        if (k % 2 === 0) { amp = 0; }
        else { amp = 4 * Math.sin(k * Math.PI / 2) / (k * Math.PI); }
        phase = -Math.PI / 2;
      }
      if (amp !== 0) {
        result.freqs.push(k);
        result.amps.push(amp);
        result.phases.push(phase);
      }
    }
    // 按振幅降序排,大箭头先画
    const idx = result.amps.map((_, i) => i)
      .sort((a, b) => Math.abs(result.amps[b]) - Math.abs(result.amps[a]));
    return {
      freqs: idx.map(i => result.freqs[i]),
      amps: idx.map(i => result.amps[i]),
      phases: idx.map(i => result.phases[i]),
    };
  }

  let coeffs = coefficients(params.wave, params.n);

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  function draw(elapsed, dt) {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);

    // 背景
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    // 左右分屏
    const halfW = W / 2;
    const margin = 40;
    const t = (elapsed * params.freq) % 1;  // 时间 0-1,周期 = 1

    // 复用一组箭头连接点(画箭头 + 画函数)
    const arrowPath = [{ x: halfW * 0.55, y: H * 0.5 }];
    const omega = 2 * Math.PI;

    // 画左边箭头
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(halfW * 0.1, H * 0.5);
    ctx.lineTo(halfW * 0.95, H * 0.5);
    ctx.stroke();

    // 标题
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('傅里叶箭头(频率↑, 振幅↓)', halfW * 0.1, 24);

    let cx = halfW * 0.5;
    let cy = H * 0.5;
    const scale = Math.min(halfW, H) * 0.30;

    for (let i = 0; i < coeffs.freqs.length; i++) {
      const f = coeffs.freqs[i];
      const a = coeffs.amps[i];
      const ph = coeffs.phases[i];
      const r = Math.abs(a) * scale;
      const angle = omega * f * t + ph;
      const dx = r * Math.cos(angle);
      const dy = r * Math.sin(angle);

      // 画箭头:从 (cx, cy) 到 (cx+dx, cy+dy)
      ctx.strokeStyle = a > 0 ? '#6ee7b7' : '#ff6b6b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + dx, cy + dy);
      ctx.stroke();

      // 圆弧提示旋转方向
      ctx.strokeStyle = 'rgba(110, 231, 183, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, angle);
      ctx.stroke();

      // 标频率
      ctx.fillStyle = '#8a93a6';
      ctx.font = '10px monospace';
      ctx.fillText(`f=${f}`, cx + 4, cy - r - 4);

      // 累积到下一段起点
      cx += dx;
      cy += dy;
      arrowPath.push({ x: cx, y: cy });
    }

    // 最终端点
    ctx.fillStyle = '#f0c040';
    ctx.beginPath();
    ctx.arc(arrowPath[arrowPath.length - 1].x, arrowPath[arrowPath.length - 1].y, 5, 0, Math.PI * 2);
    ctx.fill();

    // 画右边:把上面所有箭头端点连成函数曲线
    const funcW = halfW;
    const funcH = H;
    const funcOriginX = halfW + funcW * 0.05;
    const funcScaleY = funcH * 0.35;
    const funcScaleX = funcW * 0.9;

    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(halfW, funcH * 0.5);
    ctx.lineTo(W, funcH * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(halfW + funcW * 0.5, 20);
    ctx.lineTo(halfW + funcW * 0.5, H - 20);
    ctx.stroke();

    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('合成函数 f(t)', halfW + funcW * 0.5, 24);

    // 实时当前位置(亮点)
    const finalX = arrowPath[arrowPath.length - 1].x;
    const finalY = arrowPath[arrowPath.length - 1].y;
    const finalOffX = finalX - halfW * 0.5;
    const funcY = funcH * 0.5 - finalOffX * (funcH * 0.3 / (halfW * 0.5));

    // 画完整函数曲线
    ctx.strokeStyle = '#4ea1ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const ti = (i / 200) * 1;  // 一个周期
      let y = 0;
      for (let j = 0; j < coeffs.freqs.length; j++) {
        const f = coeffs.freqs[j];
        const a = coeffs.amps[j];
        const ph = coeffs.phases[j];
        y += a * Math.sin(omega * f * ti + ph);
      }
      const px = halfW + funcW * 0.05 + (ti * funcScaleX);
      const py = funcH * 0.5 - y * funcScaleY;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 当前位置
    const curPx = halfW + funcW * 0.05 + (t * funcScaleX);
    ctx.fillStyle = '#f0c040';
    ctx.beginPath();
    ctx.arc(curPx, funcY, 5, 0, Math.PI * 2);
    ctx.fill();

    // 当前 t 的引导线
    ctx.strokeStyle = 'rgba(240, 192, 64, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(curPx, 20);
    ctx.lineTo(curPx, H - 20);
    ctx.stroke();

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 60 });

  // ---------- 交互 ----------
  const nInput = ctrls.querySelector('[data-n]');
  const nVal = ctrls.querySelector('[data-n-v]');
  nInput.addEventListener('input', (e) => {
    params.n = parseInt(e.target.value);
    nVal.textContent = params.n;
    coeffs = coefficients(params.wave, params.n);
  });
  const fInput = ctrls.querySelector('[data-freq]');
  const fVal = ctrls.querySelector('[data-freq-v]');
  fInput.addEventListener('input', (e) => {
    params.freq = parseFloat(e.target.value);
    fVal.textContent = params.freq.toFixed(1) + 'Hz';
  });
  const wSelect = ctrls.querySelector('[data-wave]');
  wSelect.addEventListener('change', (e) => {
    params.wave = e.target.value;
    coeffs = coefficients(params.wave, params.n);
  });

  return {
    sceneId: 'fourier-synth',
    getFormula() { return 'f(t) = Σ aₙ·sin(nωt + φₙ)'; },
    // v0.6.21: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { wave: params.wave, n: params.n, freq: params.freq }; },
    setState(s) {
      if (!s) return;
      if (s.wave) { params.wave = s.wave; wSelect.value = s.wave; }
      if (typeof s.n === 'number') { params.n = s.n; nInput.value = s.n; nVal.textContent = s.n; }
      if (typeof s.freq === 'number') { params.freq = s.freq; fInput.value = s.freq; fVal.textContent = s.freq.toFixed(1) + 'Hz'; }
      coeffs = coefficients(params.wave, params.n);
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
