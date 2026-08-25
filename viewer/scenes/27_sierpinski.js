// viewer/scenes/27_sierpinski.js
// MathematicsWeb v0.6.24 — 谢尔宾斯基三角 (数学 × 分形几何)
// 2D Canvas 场景:谢尔宾斯基三角双视图
//   - 上方:Chaos Game 随机点云演示(任意点 → 随机选顶点跳中点 → 全部落在分形上)
//   - 下方:N 步确定性迭代构造(每层三等分挖中间)
//
// 数学:递归细分 + 自相似性
//   构造 1(确定性):N 步后小三角形数 = 3^N,边长 = 1/2^N,面积 = 0
//   构造 2(随机):Chaos Game — 任意点,反复"跳到当前点与随机顶点中点"
//   两种构造结果完全相同(分形性质)
//   Hausdorff 维数 = log3/log2 ≈ 1.585(分数维)
//
// 应用:
//   - 数据结构:递归树、Sierpinski 堆栈
//   - 通信:天线阵列分形
//   - 艺术:M.C. Escher 极限版画
//   - 概率:经典混沌游戏演示吸引子

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
    <div class="mathw-lesson-title">数学 × 分形几何 · 谢尔宾斯基三角</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">挖掉中间的无限递归 · 1915</div>
      <div class="mathw-lesson-formula">N 步后: 3ⁿ 三角形 · 边长 1/2ⁿ · 维数 log₃/log₂ ≈ 1.585</div>
      <div class="mathw-lesson-text">
        <strong>谢尔宾斯基三角</strong>(Sierpiński Triangle) 是 Wacław Sierpiński 1915 年提出的<strong>经典分形</strong>。<br>
        <strong>确定性构造</strong>(下方):N 步迭代,每步把每个三角形<strong>三等分挖中间</strong>。3ⁿ 个小三角,边长 1/2ⁿ,面积 → 0。<br>
        <strong>混沌游戏</strong>(上方):任意起一点,反复<strong>跳到当前点与随机顶点的中点</strong>,所有落点都收敛到分形。<br>
        <strong>Hausdorff 维数 = log3/log2 ≈ 1.585</strong> — 比一维"长"、比二维"小"。<br>
        应用:递归数据结构 · 分形天线 · M.C. Escher 极限版画。
      </div>
    </div>
  `;
  host.appendChild(lesson);
  lesson.querySelector('[data-toggle]').addEventListener('click', () => {
    lesson.classList.toggle('collapsed');
    lesson.querySelector('[data-toggle]').textContent = lesson.classList.contains('collapsed') ? '+' : '−';
  });

  const ctrls = document.createElement('div');
  ctrls.innerHTML = `
    <div class="mathw-controls-title">参数 · 谢尔宾斯基</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">迭代 N</span>
      <input type="range" min="0" max="6" step="1" value="4" data-n />
      <span class="mathw-control-value" data-n-v>4</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">投点/帧</span>
      <input type="range" min="1" max="200" step="1" value="40" data-ppf />
      <span class="mathw-control-value" data-ppf-v>40</span>
    </div>
    <div class="mathw-control-row">
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--mathw-muted)">
        <input type="checkbox" data-anim checked /> 动画(混沌游戏)
      </label>
      <button data-reset style="font-size:11px;padding:2px 8px">清点</button>
    </div>
    <div class="mathw-control-row" style="font-size:11px;color:var(--mathw-muted)">
      提示: 调 N 看下方挖几次,上方混沌游戏慢慢填出形状
    </div>
  `;
  ctrls.className = 'mathw-controls';
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let params = { n: 4, ppf: 40, anim: true };
  // 混沌游戏状态
  let chaos = { x: 0.5, y: 0.866, has: false }; // 起点(0.5, √3/2)中央
  // 上方视图像素缓冲(避免每帧重画所有点 — 但因量级可控,直接画)
  const triColors = ['#6ee7b7', '#4ea1ff', '#fbbf24']; // 3 顶点配色

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  // 顶等边三角形(单位)
  function triVerts(size) {
    return [
      { x: 0.5, y: 0.05 },                          // 顶点
      { x: 0.5 - size / 2, y: 0.05 + size * 0.866 }, // 左下
      { x: 0.5 + size / 2, y: 0.05 + size * 0.866 }, // 右下
    ];
  }
  // 递归画谢尔宾斯基(0..N 层)
  function drawSierpinski(verts, level) {
    if (level === 0) {
      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      ctx.lineTo(verts[1].x, verts[1].y);
      ctx.lineTo(verts[2].x, verts[2].y);
      ctx.closePath();
      ctx.fill();
      return;
    }
    // 3 个中点
    const m01 = { x: (verts[0].x + verts[1].x) / 2, y: (verts[0].y + verts[1].y) / 2 };
    const m12 = { x: (verts[1].x + verts[2].x) / 2, y: (verts[1].y + verts[2].y) / 2 };
    const m20 = { x: (verts[2].x + verts[0].x) / 2, y: (verts[2].y + verts[0].y) / 2 };
    // 挖中间 — 在背景色下画中间三角形
    ctx.beginPath();
    ctx.moveTo(m01.x, m01.y);
    ctx.lineTo(m12.x, m12.y);
    ctx.lineTo(m20.x, m20.y);
    ctx.closePath();
    ctx.fillStyle = '#0e1116';
    ctx.fill();
    // 递归 3 个角
    drawSierpinski([verts[0], m01, m20], level - 1);
    drawSierpinski([verts[1], m01, m12], level - 1);
    drawSierpinski([verts[2], m12, m20], level - 1);
  }

  // 画三顶点(大)
  function drawVertices(verts, labels) {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = triColors[i];
      ctx.beginPath();
      ctx.arc(verts[i].x, verts[i].y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e6e8ec';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], verts[i].x, verts[i].y - 10);
    }
  }

  function draw(elapsed, dt) {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    const topH = H * 0.55;
    const botStart = topH;

    // === 上方:Chaos Game ===
    // 三角形占据上方区域
    const topSize = Math.min(W * 0.7, topH * 0.85);
    const tVerts = triVerts(topSize).map(v => ({
      x: v.x * W,
      y: (v.y - 0.05) * topH / 0.92 + topH * 0.05,
    }));
    // 把"单位"坐标重新映射:让 (0,0) 在 (0,0),(1,1) 在 (topSize, topSize)
    const baseX = (W - topSize) / 2;
    const baseY = topH * 0.05;
    const V = [
      { x: baseX + topSize / 2, y: baseY },
      { x: baseX, y: baseY + topSize * 0.866 },
      { x: baseX + topSize, y: baseY + topSize * 0.866 },
    ];

    // 画三色半透明底
    ctx.fillStyle = 'rgba(110, 231, 183, 0.04)';
    ctx.beginPath();
    ctx.moveTo(V[0].x, V[0].y); ctx.lineTo(V[1].x, V[1].y); ctx.lineTo(V[2].x, V[2].y);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 标题
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('混沌游戏 · Chaos Game', 20, 22);
    ctx.fillStyle = '#8a93a6';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillText('任意点 → 反复跳到当前点与随机顶点中点 → 落点全部收敛到分形', 20, 40);

    // 画谢尔宾斯基(浅色描线,提示吸引子)
    ctx.strokeStyle = 'rgba(110, 231, 183, 0.15)';
    ctx.lineWidth = 0.5;
    if (params.n <= 4) {
      // 用 line 模式:不填色,只描"剩余"小三角
      drawSierpinskiOutline(V, params.n);
    }

    // 画顶点
    drawVertices(V, ['V₀', 'V₁', 'V₂']);

    // 投点
    if (params.anim) {
      for (let k = 0; k < params.ppf; k++) {
        if (!chaos.has) {
          // 第一次:在三角形内随机
          let r1 = Math.random(), r2 = Math.random();
          if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
          chaos.x = V[0].x + r1 * (V[1].x - V[0].x) + r2 * (V[2].x - V[0].x);
          chaos.y = V[0].y + r1 * (V[1].y - V[0].y) + r2 * (V[2].y - V[0].y);
          chaos.has = true;
        } else {
          const vi = Math.floor(Math.random() * 3);
          chaos.x = (chaos.x + V[vi].x) / 2;
          chaos.y = (chaos.y + V[vi].y) / 2;
        }
        // 画点(按最近顶点染色)
        const d0 = (chaos.x - V[0].x) ** 2 + (chaos.y - V[0].y) ** 2;
        const d1 = (chaos.x - V[1].x) ** 2 + (chaos.y - V[1].y) ** 2;
        const d2 = (chaos.x - V[2].x) ** 2 + (chaos.y - V[2].y) ** 2;
        const ci = d0 < d1 && d0 < d2 ? 0 : (d1 < d2 ? 1 : 2);
        ctx.fillStyle = triColors[ci];
        ctx.fillRect(chaos.x - 1, chaos.y - 1, 2, 2);
      }
    }

    // 分割线
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, botStart);
    ctx.lineTo(W, botStart);
    ctx.stroke();

    // === 下方:确定性构造 ===
    const botH = H - topH;
    const botCx = W / 2;
    const botCy = botStart + botH / 2;
    const botSize = Math.min(W * 0.55, botH * 0.75);
    const BV = [
      { x: botCx, y: botCy - botSize * 0.5 },
      { x: botCx - botSize * 0.5, y: botCy + botSize * 0.433 },
      { x: botCx + botSize * 0.5, y: botCy + botSize * 0.433 },
    ];
    // 标题
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`确定性构造 · N=${params.n}`, 20, botStart + 20);
    ctx.fillStyle = '#8a93a6';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillText(`3^N = ${Math.pow(3, params.n)} 个小三角 · 边长 = 1/${Math.pow(2, params.n)} · 面积 = ${Math.pow(0.75, params.n).toFixed(4)}`, 20, botStart + 38);
    // 填色
    ctx.fillStyle = '#4ea1ff';
    drawSierpinski(BV, params.n);

    // 维数
    ctx.fillStyle = '#fbbf24';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Hausdorff 维数 = log3/log2 ≈ 1.585`, W - 20, botStart + 20);
    ctx.fillStyle = '#8a93a6';
    ctx.textAlign = 'right';
    ctx.fillText('比 1 维"长" · 比 2 维"小"(分数维)', W - 20, botStart + 38);

    ctx.restore();
  }

  // 浅色描边版本(用于上方提示吸引子形状,不填色)
  function drawSierpinskiOutline(verts, level) {
    if (level === 0) {
      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      ctx.lineTo(verts[1].x, verts[1].y);
      ctx.lineTo(verts[2].x, verts[2].y);
      ctx.closePath();
      ctx.stroke();
      return;
    }
    const m01 = { x: (verts[0].x + verts[1].x) / 2, y: (verts[0].y + verts[1].y) / 2 };
    const m12 = { x: (verts[1].x + verts[2].x) / 2, y: (verts[1].y + verts[2].y) / 2 };
    const m20 = { x: (verts[2].x + verts[0].x) / 2, y: (verts[2].y + verts[0].y) / 2 };
    drawSierpinskiOutline([verts[0], m01, m20], level - 1);
    drawSierpinskiOutline([verts[1], m01, m12], level - 1);
    drawSierpinskiOutline([verts[2], m12, m20], level - 1);
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // ---------- 交互 ----------
  const _nInp = ctrls.querySelector('[data-n]');
  const _nV = ctrls.querySelector('[data-n-v]');
  const _ppfInp = ctrls.querySelector('[data-ppf]');
  const _ppfV = ctrls.querySelector('[data-ppf-v]');
  const _anim = ctrls.querySelector('[data-anim]');
  const _reset = ctrls.querySelector('[data-reset]');
  _nInp.addEventListener('input', (e) => { params.n = parseInt(e.target.value); _nV.textContent = params.n; });
  _ppfInp.addEventListener('input', (e) => { params.ppf = parseInt(e.target.value); _ppfV.textContent = params.ppf; });
  _anim.addEventListener('change', (e) => { params.anim = e.target.checked; });
  _reset.addEventListener('click', () => { chaos.has = false; });

  return {
    sceneId: 'sierpinski',
    getFormula() { return 'N 步迭代: 3ⁿ 三角 / 边长 1/2ⁿ / 维数 log3/log2 ≈ 1.585 (Sierpiński 1915)'; },
    getLesson() {
      const c = lesson.querySelector('.mathw-lesson-content');
      return c ? c.textContent.replace(/\s+/g, ' ').trim() : '';
    },
    getState() { return { n: params.n, ppf: params.ppf, anim: params.anim }; },
    setState(s) {
      if (!s) return;
      if (typeof s.n === 'number') { params.n = s.n; _nInp.value = s.n; _nV.textContent = s.n; }
      if (typeof s.ppf === 'number') { params.ppf = s.ppf; _ppfInp.value = s.ppf; _ppfV.textContent = s.ppf; }
      if (typeof s.anim === 'boolean') { params.anim = s.anim; _anim.checked = s.anim; }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
