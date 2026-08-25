// viewer/scenes/17_julia.js
// MathematicsWeb v0.6.0 — 朱利亚集 (数学 × 艺术)
// 2D Canvas 场景:朱利亚集(曼德尔布罗的"亲戚")
//   - 复数迭代 z = z² + c(c 是常数,每个 c 决定一个朱利亚集)
//   - 拖动 / 滚轮缩放
//   - 调 c 的实部/虚部看不同形态
//   - 经典 c 值:-0.8+0.156i(螺旋)、-0.4+0.6i(树)、-0.835-0.2321i(西尔平斯基)
//
// 数学:跟曼德尔布罗共用公式,但 c 固定,z 起始 = 每个像素
//   → 固定 c 下,每个 c 对应一片分形,跟曼德尔布罗是"对偶"

import { makeLoop, fitCanvas } from '../../kernel/02_animation.js';
import { mandelbrot } from '../../kernel/01_math-core.js';

export function createScene(host, opts = {}) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;inset:0;overflow:hidden;';
  host.appendChild(wrap);

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;image-rendering:pixelated;cursor:grab;';
  wrap.appendChild(canvas);

  const lesson = document.createElement('div');
  lesson.className = 'mathw-lesson';
  lesson.innerHTML = `
    <button class="mathw-lesson-toggle" data-toggle>−</button>
    <div class="mathw-lesson-title">数学 × 艺术 · 朱利亚集 · 复动力系统的"另一面"</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">跟曼德尔布罗同公式,不同视角</div>
      <div class="mathw-lesson-formula">z_{n+1} = z_n² + c   (c 固定,扫 z₀)</div>
      <div class="mathw-lesson-text">
        <strong>曼德尔布罗</strong>(M 集):每个 c 一像素,扫所有 c 看哪些 c 让 z₀=0 收敛 — 给出"参数空间"地图。
        <strong>朱利亚集</strong>(J 集):固定 c,每个像素一个 z₀,看哪些起点逃逸到 ∞ — 给出"相空间"边界。
        两者对偶:<strong>c 在 M 集内 ↔ 对应 J 集连通</strong>;c 在 M 集外 ↔ J 集是康托尘埃。
        <br><br>
        <strong>历史</strong>:Gaston Julia 1918 在一战受伤住院时研究复迭代,获法兰西科学院大奖;
        当时无法可视化,1980 年代 <strong>Mandelbrot</strong> 用 IBM 计算机画出震撼图像,引发分形热潮。
        <strong>1982 Douady-Hubbard</strong> 证明 M 集连通且内部每点 c 都对应连通 J 集。
        <br><br>
        <strong>经典 c 值</strong>:<br>
        · c = −0.8 + 0.156i · 螺旋盘绕收敛(默认)<br>
        · c = −0.4 + 0.6i · 树状对称分形<br>
        · c = −0.835 − 0.2321i · 谢尔宾斯基镂空相似(连接 M 集和谢尔宾斯基)
        <br><br>
        <strong>调 c 看形态巨变</strong>:实部/虚部滑块微调,集从连通 → 粉状 → 全黑;迭代数 20-200 控制细节。
        <strong>应用</strong>:复动力系统 + M 集可视化 + 图形学分形噪声 + 加密伪随机 + 艺术生成(Aaron、DeepDream 早期思想)。
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
    <div class="mathw-controls-title">参数 · 朱利亚集</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">c 实部</span>
      <input type="range" min="-1.2" max="0.5" step="0.01" value="-0.8" data-cre />
      <span class="mathw-control-value" data-cre-v>-0.80</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">c 虚部</span>
      <input type="range" min="-0.8" max="0.8" step="0.01" value="0.156" data-cim />
      <span class="mathw-control-value" data-cim-v>0.156</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">最大迭代</span>
      <input type="range" min="20" max="200" step="10" value="100" data-iter />
      <span class="mathw-control-value" data-iter-v>100</span>
    </div>
    <div class="mathw-control-row">
      <button data-preset="spiral">螺旋</button>
      <button data-preset="tree">树</button>
      <button data-reset>重置</button>
    </div>
  `;
  host.appendChild(ctrls);

  let params = { cRe: -0.8, cIm: 0.156, iter: 100 };
  let view = { cx: 0, cy: 0, scale: 3 };

  // 离屏渲染
  let renderScale = 0.30;
  let rW = 0, rH = 0;
  let offCanvas = null, offCtx = null, imgData = null;

  function ensureOffscreen() {
    const { w, h } = fitCanvas(canvas, host);
    rW = Math.max(1, Math.floor(w * renderScale));
    rH = Math.max(1, Math.floor(h * renderScale));
    if (!offCanvas || offCanvas.width !== rW || offCanvas.height !== rH) {
      offCanvas = document.createElement('canvas');
      offCanvas.width = rW; offCanvas.height = rH;
      offCtx = offCanvas.getContext('2d');
      imgData = offCtx.createImageData(rW, rH);
    }
  }

  function renderFrame() {
    if (rW <= 0 || rH <= 0) return;
    const data = imgData.data;
    const { cx, cy, scale } = view;
    const aspect = rW / rH;
    const xMin = cx - scale * aspect / 2;
    const xMax = cx + scale * aspect / 2;
    const yMin = cy - scale / 2;
    const yMax = cy + scale / 2;
    const cRe = params.cRe, cIm = params.cIm, maxIter = params.iter;

    for (let py = 0; py < rH; py++) {
      const zy0 = yMax - (py / rH) * (yMax - yMin);
      for (let px = 0; px < rW; px++) {
        const zx0 = xMin + (px / rW) * (xMax - xMin);
        // 朱利亚集:每个 z₀ 独立迭代,共用 c
        // 用 mandelbrot 函数:传入 c 但每次 z₀ 起点不一样
        // 直接写迭代
        let zr = zx0, zi = zy0;
        let n = 0;
        while (n < maxIter && zr * zr + zi * zi <= 4) {
          const nzr = zr * zr - zi * zi + cRe;
          zi = 2 * zr * zi + cIm;
          zr = nzr;
          n++;
        }
        const idx = (py * rW + px) * 4;
        if (n === maxIter) {
          data[idx] = 10; data[idx + 1] = 10; data[idx + 2] = 16;  // 黑
        } else {
          const t = n / maxIter;
          // 火焰配色
          const r = Math.floor(40 + 215 * t);
          const g = Math.floor(10 + 200 * Math.pow(t, 1.5));
          const b = Math.floor(20 + 30 * Math.pow(t, 4));
          data[idx] = r; data[idx + 1] = g; data[idx + 2] = b;
        }
        data[idx + 3] = 255;
      }
    }
    offCtx.putImageData(imgData, 0, 0);
  }

  const ctx = canvas.getContext('2d');
  function draw(elapsed, dt) {
    ensureOffscreen();
    renderFrame();
    const { w, h, dpr } = fitCanvas(canvas, host);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.drawImage(offCanvas, 0, 0, w, h);
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`c = ${params.cRe.toFixed(3)} + ${params.cIm.toFixed(3)}i · 迭代 ${params.iter}`, 20, 28);
    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // 拖动 + 缩放
  let dragging = false, lastMx = 0, lastMy = 0;
  canvas.addEventListener('mousedown', (e) => { dragging = true; lastMx = e.clientX; lastMy = e.clientY; canvas.style.cursor = 'grabbing'; });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastMx, dy = e.clientY - lastMy;
    lastMx = e.clientX; lastMy = e.clientY;
    const rect = canvas.getBoundingClientRect();
    const aspect = rW / rH;
    view.cx -= (dx / rect.width) * view.scale * aspect;
    view.cy += (dy / rect.height) * view.scale;
  });
  window.addEventListener('mouseup', () => { dragging = false; canvas.style.cursor = 'grab'; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const ux = (e.clientX - rect.left) / rect.width;
    const uy = (e.clientY - rect.top) / rect.height;
    const wx = view.cx + (ux - 0.5) * view.scale * (rW / rH);
    const wy = view.cy - (uy - 0.5) * view.scale;
    const factor = e.deltaY > 0 ? 1.2 : 0.8;
    view.scale *= factor;
    const wx2 = view.cx + (ux - 0.5) * view.scale * (rW / rH);
    const wy2 = view.cy - (uy - 0.5) * view.scale;
    view.cx += wx - wx2;
    view.cy += wy - wy2;
  }, { passive: false });

  // 交互
  const _creInp = ctrls.querySelector('[data-cre]');
  const _creV = ctrls.querySelector('[data-cre-v]');
  const _cimInp = ctrls.querySelector('[data-cim]');
  const _cimV = ctrls.querySelector('[data-cim-v]');
  const _itInp = ctrls.querySelector('[data-iter]');
  const _itV = ctrls.querySelector('[data-iter-v]');
  _creInp.addEventListener('input', (e) => { params.cRe = parseFloat(e.target.value); _creV.textContent = params.cRe.toFixed(2); });
  _cimInp.addEventListener('input', (e) => { params.cIm = parseFloat(e.target.value); _cimV.textContent = params.cIm.toFixed(2); });
  _itInp.addEventListener('input', (e) => { params.iter = parseInt(e.target.value); _itV.textContent = params.iter; });
  ctrls.querySelector('[data-preset="spiral"]').addEventListener('click', () => { params.cRe = -0.8; params.cIm = 0.156; _creInp.value = -0.8; _creV.textContent = '-0.80'; _cimInp.value = 0.156; _cimV.textContent = '0.16'; });
  ctrls.querySelector('[data-preset="tree"]').addEventListener('click', () => { params.cRe = -0.4; params.cIm = 0.6; _creInp.value = -0.4; _creV.textContent = '-0.40'; _cimInp.value = 0.6; _cimV.textContent = '0.60'; });
  ctrls.querySelector('[data-reset]').addEventListener('click', () => { view = { cx: 0, cy: 0, scale: 3 }; });

  return {
    sceneId: 'julia',
    getFormula() { return 'z = z² + c   (c 固定)'; },
    // v0.6.29: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { ...params, view: { ...view } }; },
    setState(s) {
      if (!s) return;
      if (typeof s.cRe === 'number') { params.cRe = s.cRe; _creInp.value = s.cRe; _creV.textContent = s.cRe.toFixed(2); }
      if (typeof s.cIm === 'number') { params.cIm = s.cIm; _cimInp.value = s.cIm; _cimV.textContent = s.cIm.toFixed(2); }
      if (typeof s.iter === 'number') { params.iter = s.iter; _itInp.value = s.iter; _itV.textContent = s.iter; }
      if (s.view && typeof s.view.cx === 'number') view = { ...s.view };
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
