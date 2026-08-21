// viewer/scenes/19_electric-field.js
// MathematicsWeb v0.6.0 — 电场可视化 (数学 × 物理)
// 2D Canvas 场景:2D 平面放点电荷,看电场线 + 等势线
//   - 左键点击空白:放正电荷
//   - 右键点击空白:放负电荷
//   - 左键点电荷:拖动
//   - 电场线:从 + 出发到 -,自动避开
//   - 等势线:垂直于电场线
//   - 实时算电势 V = Σ qᵢ/rᵢ,叠加画彩色等势面
//
// 数学:
//   电场 E = -∇V(电势梯度)
//   点电荷电势 V = q / (4πε·r),简化 V = q/r
//   库仑力 F = qE,同号相斥,异号相吸
//   物理:电场线密度 ∝ 场强大小

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
    <div class="mathw-lesson-title">数学 × 物理 · 电场可视化</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">电场线 + 等势线</div>
      <div class="mathw-lesson-formula">V = Σ qᵢ/rᵢ   E = -∇V</div>
      <div class="mathw-lesson-text">
        点电荷电势 <code>V = q/r</code>(简化),电场是电势的负梯度。<br>
        <strong>左键</strong> 空白处 = 放正电荷 · <strong>右键</strong> = 放负电荷 · <strong>左键拖电荷</strong> = 移动。<br>
        黄色 = 正电,蓝色 = 负电,亮 = 高电势。<br>
        调电荷数看电场叠加 — 偶极子、四极子、平行板电容器。
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
    <div class="mathw-controls-title">参数 · 电场</div>
    <div class="mathw-control-row">
      <button data-mode="add">➕ 正电(默认)</button>
      <button data-mode="sub">➖ 负电</button>
    </div>
    <div class="mathw-control-row">
      <button data-clear>清空</button>
      <button data-preset="dipole">预设:偶极子</button>
      <button data-preset="quad">预设:四极子</button>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">等势面</span>
      <input type="range" min="5" max="30" step="1" value="14" data-levels />
      <span class="mathw-control-value" data-levels-v>14</span>
    </div>
  `;
  host.appendChild(ctrls);

  let mode = 'add';   // 'add' | 'sub'
  let params = { levels: 14 };
  // 电荷数组:{x, y, q}  q=+1 正,-1 负
  let charges = [{ x: -0.4, y: 0, q: 1 }, { x: 0.4, y: 0, q: -1 }];  // 默认偶极子
  let draggingCharge = null;

  // 计算电势 + 电场
  function potential(x, y) {
    let v = 0;
    for (const c of charges) {
      const r = Math.hypot(x - c.x, y - c.y);
      if (r < 0.01) continue;
      v += c.q / r;
    }
    return v;
  }
  function field(x, y) {
    let ex = 0, ey = 0;
    for (const c of charges) {
      const dx = x - c.x, dy = y - c.y;
      const r2 = dx * dx + dy * dy;
      if (r2 < 0.0001) continue;
      const r = Math.sqrt(r2);
      const f = c.q / (r2 * r);
      ex += f * dx; ey += f * dy;
    }
    return { ex, ey };
  }

  const ctx = canvas.getContext('2d');

  function drawFieldLines(c, W, H, sx, sy, ox, oy) {
    // 从每个 + 电荷出发,沿电场方向画线
    for (const ch of charges) {
      if (ch.q <= 0) continue;
      // 起始角度
      for (let i = 0; i < 16; i++) {
        const a0 = (i / 16) * 2 * Math.PI;
        let x = ch.x + 0.15 * Math.cos(a0);
        let y = ch.y + 0.15 * Math.sin(a0);
        const step = 0.03;
        c.strokeStyle = 'rgba(240, 192, 64, 0.5)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(ox + x * sx, oy - y * sy);
        for (let s = 0; s < 200; s++) {
          const f = field(x, y);
          const mag = Math.hypot(f.ex, f.ey);
          if (mag < 0.01) break;
          x += (f.ex / mag) * step;
          y += (f.ey / mag) * step;
          // 出界
          if (Math.abs(x) > 3.5 || Math.abs(y) > 2.5) break;
          // 进了负电荷 → 停
          let inNeg = false;
          for (const c2 of charges) {
            if (c2.q < 0 && Math.hypot(x - c2.x, y - c2.y) < 0.1) { inNeg = true; break; }
          }
          if (inNeg) break;
          c.lineTo(ox + x * sx, oy - y * sy);
        }
        c.stroke();
      }
    }
  }

  function drawPotentialMap(c, W, H, sx, sy, ox, oy) {
    // 用 80x60 网格 + 线性插值
    const GW = 80, GH = 50;
    const imgData = c.createImageData(GW, GH);
    const data = imgData.data;
    let vMax = 0, vMin = 0;
    for (let py = 0; py < GH; py++) {
      for (let px = 0; px < GW; px++) {
        const x = (px / GW) * 6 - 3;
        const y = -((py / GH) * 4 - 2);
        const v = potential(x, y);
        if (v > vMax) vMax = v;
        if (v < vMin) vMin = v;
      }
    }
    const vScale = Math.max(Math.abs(vMax), Math.abs(vMin), 0.5);
    for (let py = 0; py < GH; py++) {
      for (let px = 0; px < GW; px++) {
        const x = (px / GW) * 6 - 3;
        const y = -((py / GH) * 4 - 2);
        const v = potential(x, y);
        const t = Math.max(-1, Math.min(1, v / vScale));  // -1..1
        // 红/黄(正) → 蓝/青(负)
        let r, g, b;
        if (t > 0) { r = Math.floor(20 + 220 * t); g = Math.floor(60 + 180 * t); b = 40; }
        else { r = 40; g = Math.floor(60 + 180 * (1 + t)); b = Math.floor(20 + 220 * (-t)); }
        const idx = (py * GW + px) * 4;
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 100;
      }
    }
    const tmp = document.createElement('canvas');
    tmp.width = GW; tmp.height = GH;
    tmp.getContext('2d').putImageData(imgData, 0, 0);
    c.imageSmoothingEnabled = true;
    c.drawImage(tmp, ox - 3 * sx, oy - 2 * sy, 6 * sx, 4 * sy);
  }

  function draw(elapsed, dt) {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    const ox = W / 2, oy = H / 2;
    const sx = W / 6, sy = H / 4;

    drawPotentialMap(ctx, W, H, sx, sy, ox, oy);
    drawFieldLines(ctx, W, H, sx, sy, ox, oy);

    // 坐标轴
    ctx.strokeStyle = 'rgba(42, 49, 64, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, oy); ctx.lineTo(W, oy);
    ctx.moveTo(ox, 0); ctx.lineTo(ox, H);
    ctx.stroke();

    // 电荷
    for (const c of charges) {
      const x = ox + c.x * sx, y = oy - c.y * sy;
      ctx.fillStyle = c.q > 0 ? '#f0c040' : '#4ea1ff';
      ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0e1116';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.q > 0 ? '+' : '−', x, y);
      ctx.textBaseline = 'alphabetic';
    }

    // 信息
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`电荷: ${charges.length} 个 · 模式: ${mode === 'add' ? '正电' : '负电'}`, 20, 28);
    ctx.fillText('左键空白=放正 · 右键空白=放负 · 左键拖电荷=移动 · 黄=正,蓝=负', 20, H - 20);

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // 交互
  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) - rect.width / 2) / (rect.width / 6),
             y: -((e.clientY - rect.top) - rect.height / 2) / (rect.height / 4) };
  }
  function hitCharge(p) {
    for (let i = 0; i < charges.length; i++) {
      if (Math.hypot(p.x - charges[i].x, p.y - charges[i].y) < 0.2) return i;
    }
    return -1;
  }
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) {  // 右键
      e.preventDefault();
      const p = getMousePos(e);
      const idx = hitCharge(p);
      if (idx >= 0) {
        charges.splice(idx, 1);
      } else {
        charges.push({ x: p.x, y: p.y, q: -1 });
      }
      return;
    }
    const p = getMousePos(e);
    const idx = hitCharge(p);
    if (idx >= 0) {
      draggingCharge = idx;
    } else {
      charges.push({ x: p.x, y: p.y, q: mode === 'add' ? 1 : -1 });
    }
  });
  window.addEventListener('mousemove', (e) => {
    if (draggingCharge === null) return;
    const p = getMousePos(e);
    charges[draggingCharge].x = p.x;
    charges[draggingCharge].y = p.y;
  });
  window.addEventListener('mouseup', () => { draggingCharge = null; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  ctrls.querySelector('[data-mode="add"]').addEventListener('click', () => mode = 'add');
  ctrls.querySelector('[data-mode="sub"]').addEventListener('click', () => mode = 'sub');
  ctrls.querySelector('[data-clear]').addEventListener('click', () => { charges = []; });
  ctrls.querySelector('[data-preset="dipole"]').addEventListener('click', () => {
    charges = [{ x: -0.4, y: 0, q: 1 }, { x: 0.4, y: 0, q: -1 }];
  });
  ctrls.querySelector('[data-preset="quad"]').addEventListener('click', () => {
    charges = [{ x: -0.5, y: -0.5, q: 1 }, { x: 0.5, y: 0.5, q: 1 },
               { x: 0.5, y: -0.5, q: -1 }, { x: -0.5, y: 0.5, q: -1 }];
  });
  const _lvlInp = ctrls.querySelector('[data-levels]');
  const _lvlV = ctrls.querySelector('[data-levels-v]');
  _lvlInp.addEventListener('input', (e) => { params.levels = parseInt(e.target.value); _lvlV.textContent = params.levels; });

  return {
    sceneId: 'electric-field',
    getFormula() { return 'V = Σ qᵢ/rᵢ   E = -∇V'; },
    getState() { return { levels: params.levels, charges: [...charges] }; },
    setState(s) {
      if (!s) return;
      if (typeof s.levels === 'number') { params.levels = s.levels; _lvlInp.value = s.levels; _lvlV.textContent = s.levels; }
      if (s.charges) charges = s.charges.map(c => ({ ...c }));
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
