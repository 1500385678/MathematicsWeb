// viewer/scenes/05_mandelbrot.js
// MathematicsWeb v0.1.0 — 曼德尔布罗分形 (数学 × 艺术)
// 2D Canvas 场景:实时渲染 Mandelbrot 集,鼠标拖动平移,滚轮缩放
//
// 数学:对每个复数 c:
//   z₀ = 0, zₙ₊₁ = zₙ² + c
//   如果 |zₙ| > 2 永远会发散,在第 n 步逃逸
//   上色:逃逸越早 = 越亮(收敛 = 黑)
//
// 性能:用 worker 渲染? v0.1 简化:分块 + requestIdleCallback
//      或者直接用低分辨率 + 线性插值(像素块)
//
// v0.1.0 简化:低分辨率渲染(画布降采样),CSS 拉伸,够快

import { makeLoop, fitCanvas } from '../../kernel/02_animation.js';
import { mandelbrot } from '../../kernel/01_math-core.js';

export function createScene(host, opts = {}) {
  // ---------- DOM ----------
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
    <div class="mathw-lesson-title">数学 × 艺术 · 曼德尔布罗</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">最简单的迭代,最复杂的边界</div>
      <div class="mathw-lesson-formula">z_{n+1} = z_n² + c,  z₀ = 0</div>
      <div class="mathw-lesson-text">
        对每个复数 <strong>c</strong>(= 实部 + 虚部,对应画布上一个像素),从 z=0 反复做 z²+c。
        如果 |z| 永远不超 2 → 涂黑(属于 Mandelbrot 集,简称 <strong>M 集</strong>);
        否则看第几步逃逸(归一化) → 调色板着色 — 逃逸越快越亮,收敛越慢越深。<br>
        <strong>M 集连通</strong>(Douady-Hubbard 1982),但<strong>边界是分形</strong>:
        每放大一处都看到新的自相似细节,边长 = ∞ 但面积有限。
        Hausdorff 维数猜想 = 2(未证),<strong>1984 发现</strong>边界附近藏着缩小的 M 集副本。<br>
        <strong>关键参数</strong>:迭代次数(20-200,越大越精细) + 4 套配色(海洋/火焰/灰度/彩虹) + 缩放演示按钮(自动螺旋到 seahorse valley 看分形细节)。<br>
        <strong>应用</strong>:复动力系统核心对象(对每个 c 派生一个 Julia 集族)、海岸线/云朵/星系等自然分形基准、计算机图形学噪声与 L-system、芯片天线分形设计。
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
    <div class="mathw-controls-title">参数 · 曼德尔布罗</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">最大迭代</span>
      <input type="range" min="20" max="200" step="10" value="80" data-iter />
      <span class="mathw-control-value" data-iter-v>80</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">配色</span>
      <select data-palette>
        <option value="ocean">海洋(蓝绿)</option>
        <option value="fire" selected>火焰(红黄)</option>
        <option value="grayscale">灰度</option>
        <option value="rainbow">彩虹</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <button data-reset>重置</button>
      <button data-anim>🎬 缩放演示</button>
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let view = { cx: -0.5, cy: 0, scale: 3 };   // 当前视口
  let params = { iter: 80, palette: 'fire' };
  let animating = false;
  let animT = 0;
  let lastMouse = { x: 0, y: 0 };
  let dragging = false;

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');
  // 用低分辨率 canvas 加速
  let renderScale = 0.25;          // 渲染分辨率 = 屏幕 × 0.25
  let rW = 0, rH = 0;

  function resize() {
    const { w, h, dpr } = fitCanvas(canvas, host);
    // 渲染分辨率:屏幕 / 4(够顺滑)
    rW = Math.max(1, Math.floor(w * renderScale));
    rH = Math.max(1, Math.floor(h * renderScale));
    canvas.width = rW;
    canvas.height = rH;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }
  resize();

  const ro = new ResizeObserver(resize);
  ro.observe(host);

  // 配色函数(返回 RGB 数组)
  function color(t, palette) {
    // t: 归一化 0..1(逃逸时间 / 最大迭代)
    t = Math.min(1, t);
    if (palette === 'ocean') {
      // 蓝绿渐变
      const r = Math.floor(20 + 30 * t);
      const g = Math.floor(80 + 175 * t);
      const b = Math.floor(180 + 75 * (1 - t));
      return [r, g, b];
    } else if (palette === 'fire') {
      // 红黄
      const r = Math.floor(40 + 215 * t);
      const g = Math.floor(10 + 200 * Math.pow(t, 1.5));
      const b = Math.floor(20 + 30 * Math.pow(t, 4));
      return [r, g, b];
    } else if (palette === 'grayscale') {
      const v = Math.floor(t * 255);
      return [v, v, v];
    } else {  // rainbow
      // HSV to RGB,hue 跟随 t
      const h = (1 - t) * 270;  // 270°(紫)→ 0°(红)
      const s = 0.8, v = t > 0.05 ? 0.9 : 0;
      return hsvToRgb(h, s, v);
    }
  }
  function hsvToRgb(h, s, v) {
    h = ((h % 360) + 360) % 360;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r, g, b;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return [Math.floor((r + m) * 255), Math.floor((g + m) * 255), Math.floor((b + m) * 255)];
  }

  // 渲染 ImageData
  let imageData = null;
  function renderFrame() {
    if (rW <= 0 || rH <= 0) return;
    if (!imageData || imageData.width !== rW || imageData.height !== rH) {
      imageData = ctx.createImageData(rW, rH);
    }
    const data = imageData.data;
    const { cx, cy, scale } = view;
    const aspect = rW / rH;
    // 视口范围
    const xMin = cx - scale * aspect / 2;
    const xMax = cx + scale * aspect / 2;
    const yMin = cy - scale / 2;
    const yMax = cy + scale / 2;

    for (let py = 0; py < rH; py++) {
      const y0 = yMax - (py / rH) * (yMax - yMin);
      for (let px = 0; px < rW; px++) {
        const x0 = xMin + (px / rW) * (xMax - xMin);
        const n = mandelbrot(x0, y0, params.iter);
        const idx = (py * rW + px) * 4;
        if (n === params.iter) {
          // 属于 M 集:黑
          data[idx] = 10;
          data[idx + 1] = 10;
          data[idx + 2] = 16;
        } else {
          const t = n / params.iter;
          const [r, g, b] = color(t, params.palette);
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
        }
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function draw(elapsed, dt) {
    // 动画:zoom into "seahorse valley" 演示分形细节
    if (animating) {
      animT += dt * 0.3;
      // 螺旋缩放到 c = -0.745, 0.113(seahorse)
      const targetCx = -0.745;
      const targetCy = 0.113;
      const t = Math.min(1, animT);
      const easeT = t * t * (3 - 2 * t);  // smoothstep
      view.cx = -0.5 + (targetCx - -0.5) * easeT;
      view.cy = 0 + (targetCy - 0) * easeT;
      view.scale = 3 * Math.pow(0.02, easeT);  // 缩到 1/50
      if (t >= 1) { animating = false; animT = 0; }
    }
    renderFrame();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // ---------- 交互 ----------
  function screenToWorld(sx, sy) {
    const rect = canvas.getBoundingClientRect();
    const ux = sx - rect.left;
    const uy = sy - rect.top;
    const aspect = rW / rH;
    return {
      x: view.cx + (ux / rect.width - 0.5) * view.scale * aspect,
      y: view.cy + (0.5 - uy / rect.height) * view.scale,
    };
  }
  function worldToScreenDelta(dx, dy) {
    const rect = canvas.getBoundingClientRect();
    const aspect = rW / rH;
    return {
      x: dx / view.scale / aspect * rect.width,
      y: -dy / view.scale * rect.height,
    };
  }
  canvas.addEventListener('mousedown', (e) => {
    dragging = true;
    lastMouse = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    lastMouse = { x: e.clientX, y: e.clientY };
    const { x: sdx, y: sdy } = worldToScreenDelta(dx, dy);
    view.cx -= sdx / (canvas.getBoundingClientRect().width) * view.scale;
    view.cy += sdy / (canvas.getBoundingClientRect().height) * view.scale;
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
    canvas.style.cursor = 'grab';
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.2 : 0.8;
    const before = screenToWorld(e.clientX, e.clientY);
    view.scale *= factor;
    const after = screenToWorld(e.clientX, e.clientY);
    view.cx += before.x - after.x;
    view.cy += before.y - after.y;
  }, { passive: false });

  ctrls.querySelector('[data-iter]').addEventListener('input', (e) => {
    params.iter = parseInt(e.target.value);
    ctrls.querySelector('[data-iter-v]').textContent = params.iter;
  });
  ctrls.querySelector('[data-palette]').addEventListener('change', (e) => {
    params.palette = e.target.value;
  });
  const _iInp = ctrls.querySelector('[data-iter]');
  const _iV = ctrls.querySelector('[data-iter-v]');
  const _pSel = ctrls.querySelector('[data-palette]');
  ctrls.querySelector('[data-reset]').addEventListener('click', () => {
    view = { cx: -0.5, cy: 0, scale: 3 };
  });
  ctrls.querySelector('[data-anim]').addEventListener('click', () => {
    animating = true;
    animT = 0;
  });

  return {
    sceneId: 'mandelbrot',
    getFormula() { return 'z_{n+1} = z_n² + c,  z₀ = 0'; },
    // v0.6.27: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { iter: params.iter, palette: params.palette, view: { ...view } }; },
    setState(s) {
      if (!s) return;
      if (typeof s.iter === 'number') { params.iter = s.iter; _iInp.value = s.iter; _iV.textContent = s.iter; }
      if (s.palette) { params.palette = s.palette; _pSel.value = s.palette; }
      if (s.view && typeof s.view.cx === 'number') { view = { ...s.view }; }
    },
    destroy() {
      loop.stop();
      ro.disconnect();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
