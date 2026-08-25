// viewer/scenes/16_wave-interference.js
// MathematicsWeb v0.6.0 — 波叠加/干涉 (数学 × 物理)
// 2D Canvas 场景:两列波从不同位置源发出,叠加产生干涉条纹
//   - 每点 P(x,y) = Σ Aᵢ · cos(k·rᵢ − ωt)
//   - 2D 颜色图:亮 = 波峰相遇(建设性干涉),暗 = 波谷+波峰(破坏性)
//   - 移动源位置看驻波 vs 行波
//
// 数学:线性叠加原理
//   建设性干涉:相位差 = 2πn(同相)
//   破坏性干涉:相位差 = π(2n+1)(反相)
//   双缝干涉:条纹间距 d = λL/D
//
// 应用:光学干涉仪 · 声学 · 量子力学 · 任何波的现象

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
    <div class="mathw-lesson-title">数学 × 物理 · 波叠加 / 干涉</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">两列波相遇 → 建设性 + 破坏性干涉</div>
      <div class="mathw-lesson-formula">P(x,y,t) = Σ Aᵢ·cos(k·rᵢ − ω·t)</div>
      <div class="mathw-lesson-text">
        <strong>线性叠加原理</strong>:任意点的总扰动 = 各列波的代数和。
        <strong>建设性</strong>(亮带):两列波<strong>同相</strong>相遇,振幅相加(峰对峰);
        <strong>破坏性</strong>(暗带):两列波<strong>反相</strong>相遇,振幅相消(峰对谷)。<br>
        <strong>双缝实验</strong>(1801 Young):屏幕到缝距离 L、缝距 d,条纹间距 Δy = λL/d —
        波长越短条纹越密,缝距越宽条纹越稀。验证了光的<strong>波动说</strong>。<br>
        <strong>关键参数</strong>:波长 λ(0.02-0.30,改 λ 看条纹疏密)+ 源 1/源 2 x 位置(改 D 看条纹方向)+ 分辨率(80-240)。<br>
        <strong>应用</strong>:光学干涉仪(Michelson 测光速 / 激光干涉引力波 LIGO)/ 声学驻波(乐器共鸣腔)/ 量子力学双缝实验(波粒二象性基础)/ 全息摄影。
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
    <div class="mathw-controls-title">参数 · 波叠加</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">波长 λ</span>
      <input type="range" min="0.02" max="0.3" step="0.01" value="0.08" data-lambda />
      <span class="mathw-control-value" data-lambda-v>0.080</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">源 1 x</span>
      <input type="range" min="0.1" max="0.9" step="0.05" value="0.35" data-s1x />
      <span class="mathw-control-value" data-s1x-v>0.35</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">源 2 x</span>
      <input type="range" min="0.1" max="0.9" step="0.05" value="0.65" data-s2x />
      <span class="mathw-control-value" data-s2x-v>0.65</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">分辨率</span>
      <input type="range" min="80" max="240" step="20" value="160" data-res />
      <span class="mathw-control-value" data-res-v>160</span>
    </div>
  `;
  host.appendChild(ctrls);

  let params = { lambda: 0.08, s1x: 0.35, s2x: 0.65, res: 160 };

  // 离屏 ImageData(降分辨率渲染)
  let imgData = null, imgCtx = null, offCanvas = null;

  function ensureOffscreen() {
    if (!offCanvas || offCanvas.width !== params.res || offCanvas.height !== params.res) {
      offCanvas = document.createElement('canvas');
      offCanvas.width = params.res;
      offCanvas.height = params.res;
      imgCtx = offCanvas.getContext('2d');
      imgData = imgCtx.createImageData(params.res, params.res);
    }
  }

  const ctx = canvas.getContext('2d');

  function draw(elapsed, dt) {
    ensureOffscreen();
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    // 离屏渲染干涉图
    const N = params.res;
    const lambda = params.lambda;
    const k = 2 * Math.PI / lambda;     // 波数
    const omega = 2.0;                 // 角频率
    const t = elapsed * 2;
    const s1 = { x: params.s1x, y: 0.5 };
    const s2 = { x: params.s2x, y: 0.5 };
    const data = imgData.data;

    for (let py = 0; py < N; py++) {
      for (let px = 0; px < N; px++) {
        const u = px / N, v = py / N;
        const r1 = Math.hypot(u - s1.x, v - s1.y);
        const r2 = Math.hypot(u - s2.x, v - s2.y);
        // 两列波叠加
        const w1 = Math.cos(k * r1 * 5 - omega * t);
        const w2 = Math.cos(k * r2 * 5 - omega * t);
        const amp = (w1 + w2) / 2;  // 范围 -1..1
        // 颜色:亮=黄白(峰相遇),暗=深蓝(谷)
        const t01 = (amp + 1) / 2;
        const r = Math.floor(15 + t01 * 240);
        const g = Math.floor(20 + t01 * 235);
        const b = Math.floor(40 + (1 - t01) * 215);
        const idx = (py * N + px) * 4;
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
      }
    }
    imgCtx.putImageData(imgData, 0, 0);

    // 拉伸到全屏
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(offCanvas, 0, 0, W, H);

    // 画源点
    const s1px = s1.x * W;
    const s2px = s2.x * W;
    const spy = s1.y * H;
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath(); ctx.arc(s1px, spy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4ea1ff';
    ctx.beginPath(); ctx.arc(s2px, spy, 8, 0, Math.PI * 2); ctx.fill();

    // 信息
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`λ=${params.lambda.toFixed(2)} · 源距 D=${(params.s2x - params.s1x).toFixed(2)}`, 20, 30);
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText('亮=建设性干涉(同相) · 暗=破坏性干涉(反相)', 20, H - 20);

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // 交互
  const _lInp = ctrls.querySelector('[data-lambda]');
  const _lV = ctrls.querySelector('[data-lambda-v]');
  const _s1Inp = ctrls.querySelector('[data-s1x]');
  const _s1V = ctrls.querySelector('[data-s1x-v]');
  const _s2Inp = ctrls.querySelector('[data-s2x]');
  const _s2V = ctrls.querySelector('[data-s2x-v]');
  const _rInp = ctrls.querySelector('[data-res]');
  const _rV = ctrls.querySelector('[data-res-v]');
  _lInp.addEventListener('input', (e) => { params.lambda = parseFloat(e.target.value); _lV.textContent = params.lambda.toFixed(3); });
  _s1Inp.addEventListener('input', (e) => { params.s1x = parseFloat(e.target.value); _s1V.textContent = params.s1x.toFixed(2); });
  _s2Inp.addEventListener('input', (e) => { params.s2x = parseFloat(e.target.value); _s2V.textContent = params.s2x.toFixed(2); });
  _rInp.addEventListener('input', (e) => { params.res = parseInt(e.target.value); _rV.textContent = params.res; imgData = null; offCanvas = null; });

  return {
    sceneId: 'wave-interference',
    getFormula() { return 'P = Σ Aᵢ·cos(k·rᵢ − ωt)'; },
    // v0.6.27: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { ...params }; },
    setState(s) {
      if (!s) return;
      if (typeof s.lambda === 'number') { params.lambda = s.lambda; _lInp.value = s.lambda; _lV.textContent = s.lambda.toFixed(3); }
      if (typeof s.s1x === 'number') { params.s1x = s.s1x; _s1Inp.value = s.s1x; _s1V.textContent = s.s1x.toFixed(2); }
      if (typeof s.s2x === 'number') { params.s2x = s.s2x; _s2Inp.value = s.s2x; _s2V.textContent = s.s2x.toFixed(2); }
      if (typeof s.res === 'number') { params.res = s.res; _rInp.value = s.res; _rV.textContent = s.res; imgData = null; offCanvas = null; }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
