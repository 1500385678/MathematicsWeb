// kernel/02_animation.js
// MathematicsWeb v0.1.0 — rAF 动画循环 helper
// 提供:makeLoop(canvas, draw, options)
//      - 自动处理 canvas 尺寸(像素比)
//      - 提供 start/stop/setSpeed
//      - 时间累积 dt 防止标签页切换卡顿

export function makeLoop(draw, options = {}) {
  const cfg = {
    speed: 1.0,            // 时间倍率
    autostart: true,
    maxFps: 60,
    ...options,
  };

  let rafId = null;
  let running = false;
  let lastTs = 0;
  let elapsed = 0;          // 累计时间(秒)
  let frameCount = 0;
  let fpsAccum = 0;
  let fpsLastTs = 0;
  let fps = 0;

  function tick(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    // 防止后台标签页 dt 爆炸,封顶 0.1s
    if (dt > 0.1) dt = 0.1;
    dt *= cfg.speed;
    elapsed += dt;

    draw(elapsed, dt);

    // FPS 计算
    frameCount++;
    fpsAccum++;
    if (ts - fpsLastTs > 500) {
      fps = (fpsAccum * 1000) / (ts - fpsLastTs);
      fpsAccum = 0;
      fpsLastTs = ts;
    }

    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    lastTs = 0;
    fpsLastTs = 0;
    fpsAccum = 0;
    frameCount = 0;
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function reset() {
    elapsed = 0;
    lastTs = 0;
  }

  function setSpeed(s) { cfg.speed = s; }
  function getFps() { return Math.round(fps); }
  function getElapsed() { return elapsed; }

  if (cfg.autostart) start();

  return { start, stop, reset, setSpeed, getFps, getElapsed };
}

// ============================================================
// Canvas 高 DPI 自适应(把设备像素比应用到画布)
// ============================================================
export function fitCanvas(canvas, host) {
  const rect = host.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.floor(rect.width * dpr));
  const h = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }
  return { w: rect.width, h: rect.height, dpr };
}
