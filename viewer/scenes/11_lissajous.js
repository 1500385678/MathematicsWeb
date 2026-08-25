// viewer/scenes/11_lissajous.js
// MathematicsWeb v0.6.0 — Lissajous 曲线 (数学 × 音乐/物理)
// 2D Canvas 场景:画 Lissajous 图形 + 实时双摆轨迹叠加
//   - x(t) = A·sin(a·t + δ)
//   - y(t) = B·sin(b·t)
//   - 频率比 a:b + 相位 δ 决定图形
//   - a/b 为整数比 → 闭合曲线
//   - 实际应用:示波器 X-Y 模式 / 两相互垂直的简谐运动合成
//
// 调参数:频率 a、b、相位 δ、画笔颜色

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
    <div class="mathw-lesson-title">数学 × 音乐 · Lissajous 曲线</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">两个相互垂直的简谐运动叠加</div>
      <div class="mathw-lesson-formula">x = A·sin(at + δ)   y = B·sin(bt)</div>
      <div class="mathw-lesson-text">
        频率比 <strong>a:b</strong>(整数比)决定图形:1:1 椭圆/圆/直线,1:2 抛物线,1:3 三叶,3:2 蝴蝶结...
        <strong>相位 δ</strong> 旋转移位。<br>
        实际应用:示波器 X-Y 模式、立体声信号分析、振动分析。
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
    <div class="mathw-controls-title">参数 · Lissajous</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">频率 a</span>
      <input type="range" min="1" max="8" step="1" value="3" data-a />
      <span class="mathw-control-value" data-a-v>3</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">频率 b</span>
      <input type="range" min="1" max="8" step="1" value="2" data-b />
      <span class="mathw-control-value" data-b-v>2</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">相位 δ</span>
      <input type="range" min="0" max="6.28" step="0.05" value="1.57" data-delta />
      <span class="mathw-control-value" data-delta-v>1.57</span>
    </div>
    <div class="mathw-control-row">
      <button data-preset="3-2">3:2 蝴蝶结</button>
      <button data-preset="1-2">1:2 抛物线</button>
    </div>
    <div class="mathw-control-row">
      <button data-preset="3-1">3:1 三叶</button>
      <button data-preset="1-1">1:1 圆</button>
    </div>
  `;
  host.appendChild(ctrls);

  let params = { a: 3, b: 2, delta: 1.57 };
  const ctx = canvas.getContext('2d');

  function draw(elapsed, dt) {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    // 网格
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * 0.40;
    ctx.strokeStyle = '#1c2230';
    ctx.lineWidth = 1;
    // 矩形框
    ctx.strokeRect(cx - R, cy - R, R * 2, R * 2);
    // 坐标轴
    ctx.beginPath();
    ctx.moveTo(cx - R - 20, cy);
    ctx.lineTo(cx + R + 20, cy);
    ctx.moveTo(cx, cy - R - 20);
    ctx.lineTo(cx, cy + R + 20);
    ctx.stroke();

    // Lissajous 曲线
    const A = R, B = R;
    const N = 800;
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * 2 * Math.PI;
      const x = A * Math.sin(params.a * t + params.delta);
      const y = B * Math.sin(params.b * t);
      if (i === 0) ctx.moveTo(cx + x, cy - y);
      else ctx.lineTo(cx + x, cy - y);
    }
    ctx.stroke();

    // 运动点(当前 t)
    const tNow = (elapsed * 0.5) % (2 * Math.PI);
    const px = A * Math.sin(params.a * tNow + params.delta);
    const py = B * Math.sin(params.b * tNow);
    ctx.fillStyle = '#f0c040';
    ctx.beginPath();
    ctx.arc(cx + px, cy - py, 6, 0, Math.PI * 2);
    ctx.fill();

    // 标签
    ctx.fillStyle = '#8a93a6';
    ctx.font = '13px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`x = sin(${params.a}·t + ${params.delta.toFixed(2)})`, cx - R, cy - R - 50);
    ctx.fillText(`y = sin(${params.b}·t)`, cx - R, cy - R - 32);
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText(`频率比 a:b = ${params.a}:${params.b}`, cx - R, cy + R + 30);

    // 中心
    ctx.fillStyle = '#4ea1ff';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 60 });

  // 交互
  const _aInp = ctrls.querySelector('[data-a]');
  const _aV = ctrls.querySelector('[data-a-v]');
  const _bInp = ctrls.querySelector('[data-b]');
  const _bV = ctrls.querySelector('[data-b-v]');
  const _dInp = ctrls.querySelector('[data-delta]');
  const _dV = ctrls.querySelector('[data-delta-v]');
  _aInp.addEventListener('input', (e) => { params.a = parseInt(e.target.value); _aV.textContent = params.a; });
  _bInp.addEventListener('input', (e) => { params.b = parseInt(e.target.value); _bV.textContent = params.b; });
  _dInp.addEventListener('input', (e) => { params.delta = parseFloat(e.target.value); _dV.textContent = params.delta.toFixed(2); });
  ctrls.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const [a, b] = btn.dataset.preset.split('-').map(Number);
      params.a = a; params.b = b;
      _aInp.value = a; _aV.textContent = a;
      _bInp.value = b; _bV.textContent = b;
    });
  });

  return {
    sceneId: 'lissajous',
    getFormula() { return 'x = A·sin(at + δ)   y = B·sin(bt)'; },
    // v0.6.9: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { ...params }; },
    setState(s) {
      if (!s) return;
      if (typeof s.a === 'number') { params.a = s.a; _aInp.value = s.a; _aV.textContent = s.a; }
      if (typeof s.b === 'number') { params.b = s.b; _bInp.value = s.b; _bV.textContent = s.b; }
      if (typeof s.delta === 'number') { params.delta = s.delta; _dInp.value = s.delta; _dV.textContent = s.delta.toFixed(2); }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
