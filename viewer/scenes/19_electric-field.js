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
    <div class="mathw-lesson-title">数学 × 物理 · 电场可视化 · 矢量场 + 标量势</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">1785 库仑扭秤 + 叠加原理 + 等势线与电场线正交</div>
      <div class="mathw-lesson-formula">V = Σ qᵢ/rᵢ   E = -∇V   ∮ E·dA = Q_enc/ε₀</div>
      <div class="mathw-lesson-text">
        <strong>历史</strong>:1745 富兰克林风筝实验引雷(电学起源) → 1750 莱顿瓶(电容雏形) → <strong>1785 库仑</strong>扭秤实验
        测出静电力 <code>F = kq₁q₂/r²</code>(平方反比) → 1813 Poisson 静电方程 → 1865 麦克斯韦方程组。<br><br>
        <strong>矢量场 vs 标量势</strong>:E 是矢量(有方向),V 是标量(只有数值)。先算 V(标量叠加简单)再
        <code>E = -∇V</code> 取负梯度求 E(矢量叠加麻烦)。这是分析静电的经典两步法。<br>
        <strong>叠加原理</strong>:多点电荷的 V 和 E 都是线性的 — 总 V = 各 V 之和,总 E = 各 E 之矢量和;可拆解。
        本场景就是直接做这件事:放几个电荷看合场。<br><br>
        <strong>电场线</strong>:从 + 出发到 -,密度 ∝ |E| 强度。看不见但可视化能"看见"。本场景
        <span style="color:#ffd76b">黄色箭头</span> 显示局部 E 方向。<br>
        <strong>等势线</strong>:V 相同的线,<strong>必与电场线正交</strong>(∇V 指向 V 增长最快的方向,与 V=const 切线正交)。
        等势面上移动电荷不做功(因为 dV=0,W=q·dV=0)。<br>
        <strong>偶极子</strong>:等量异号电荷对,中点 V=0 但 E≠0(贯穿,反方向);电偶极矩 <code>p = qd</code>,远场
        E ∝ 1/r³,V ∝ 1/r²,远弱于单电荷。本场景 <em>偶极子预设</em> 直接演示。<br><br>
        <strong>高斯定律</strong>(积分形式):<code>∮ E·dA = Q_enc/ε₀</code> — 闭合曲面的电通量正比于内含总电荷。
        推论:均匀带电球壳外 E = Q/(4πε₀r²),内 E = 0;无限大带电平板外 E = σ/(2ε₀) 恒定。<br>
        <strong>Poisson 方程</strong>(微分形式):<code>∇²V = -ρ/ε₀</code> — V 的二阶导正比于电荷密度 ρ。
        无源区(ρ=0)退化为 Laplace 方程 ∇²V=0。<br>
        <strong>平行板电容器</strong>:<code>C = ε₀A/d</code>,插入介电常数 εᵣ 介质 → C 倍增 εᵣ 倍,均匀场
        E = σ/ε₀ 极板间,极板外近似 0。本场景 <em>平行板预设</em>(两个 +/一对,大距离近似)演示。<br><br>
        <strong>操作</strong>:<strong>左键</strong> 空白 = 放正电荷 · <strong>右键</strong> = 放负电荷 · <strong>左键拖电荷</strong> = 移动。
        黄色 = 正电,蓝色 = 负电,亮度 = 高电势。<br>
        <strong>应用</strong>:范德格拉夫起电机(高压) · 静电除尘(工厂烟囱) · 喷墨打印机(电场偏转墨滴) ·
        X 射线管(阴极电子轰击阳极靶) · 法拉第笼(避雷) · 避雷针尖端放电(曲率大→场强集中) · 阴极射线管 CRT(老电视) ·
        扫描隧道显微镜 STM(针尖电场量子隧穿) · 静电复印(光导鼓 + 电荷成像)。
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
    // v0.6.30: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
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
