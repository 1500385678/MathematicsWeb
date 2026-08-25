// viewer/scenes/07_golden-spiral.js
// MathematicsWeb v0.2.0 — 黄金螺旋 (数学 × 艺术)
// 2D Canvas 场景:画费波那契矩形 + 黄金螺旋
//   - 画一个矩形按黄金比例 1:φ 切分(φ = (1+√5)/2 ≈ 1.618)
//   - 在每个子矩形内画 1/4 圆弧,弧线连起来就是对数螺旋
//   - 动画:逐个拼出矩形
//   - 现实中的应用:鹦鹉螺、向日葵、松果、银河系旋臂、文艺复兴建筑比例
//
// 数学:
//   黄金比例 φ = (1+√5)/2 ≈ 1.6180339887
//   满足 φ² = φ + 1(自相似)
//   费波那契数列 F(n+2) = F(n+1) + F(n),F(n)/F(n-1) → φ
//   螺旋:对数螺旋 r(θ) = a·e^(bθ) — 黄金矩形切出来的就是这种
//
// 直觉:越切越小的方块,角上的弧连起来就是优雅的螺旋

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
    <div class="mathw-lesson-title">数学 × 艺术 · 黄金螺旋</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">φ = (1+√5)/2 ≈ 1.618 · 自相似 + 黄金角 137.5°</div>
      <div class="mathw-lesson-formula">φ² = φ + 1   F(n+2) = F(n+1) + F(n)   r(θ) = a·e^(bθ)</div>
      <div class="mathw-lesson-text">
        <strong>黄金比例</strong> = 一条线段被一点分成两段,长段/短段 = 全长/长段。解二次方程 x² = x + 1 得 <strong>φ ≈ 1.618</strong>(无理数)。<br>
        <strong>费波那契</strong>(F₁=1, F₂=1, Fₙ₊₂ = Fₙ₊₁ + Fₙ):1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144… 相邻两项之比 Fₙ/Fₙ₋₁ 越来越接近 φ(1/1=1, 2/1=2, 3/2=1.5, …, 144/89 ≈ 1.6180),数学归纳可证 lim = φ。<br>
        <strong>黄金矩形</strong>:把矩形按 φ 切掉一个正方形,剩下的还是黄金矩形(自相似);在每个正方形内画 1/4 圆弧,弧线连起来 = <strong>对数螺旋</strong> r(θ) = a·e^(bθ)(每转 90° 半径变 φ 倍)。<br>
        <strong>自然里的黄金角</strong>(137.5° = 360°/φ²):向日葵花盘松果的种子按这个角度螺旋排列,保证每颗种子获得最大生长空间且不重叠(Vogel 1979 公式);鹦鹉贝/鹦鹉螺切面近似对数螺旋;银河系旋臂也接近这个曲线。<br>
        <strong>历史</strong>:欧几里得《几何原本》定义"中外比" = φ;卢卡斯 1202《算术宝鉴》兔子问题引出 F 数列;达·芬奇《维特鲁威人》人体比例、帕特农神庙立面、文艺复兴油画构图三分法都用 φ。<br>
        <strong>关键参数</strong>:层数 N(3-15,越大越细密螺旋圈数多)+ 90° 旋转(看 4 种螺旋方向)+ 自动展开动画(逐层拼出过程)。<br>
        <strong>应用</strong>:摄影构图三分法、UI 设计的黄金分割比例、DNA 双螺旋每 34 Å 长度出现 21 Å 宽(34/21 ≈ φ)、股市分析的斐波那契回调(0.382/0.618 = 1/φ)、建筑立面比例(高迪圣家族大教堂、米罗的维纳斯雕塑)。
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
    <div class="mathw-controls-title">参数 · 黄金螺旋</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">层数 N</span>
      <input type="range" min="3" max="15" step="1" value="10" data-n />
      <span class="mathw-control-value" data-n-v>10</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">反转</span>
      <button data-flip>↻ 90° 旋转</button>
    </div>
    <div class="mathw-control-row">
      <button data-anim>🎬 自动展开</button>
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  const PHI = (1 + Math.sqrt(5)) / 2;
  let params = { n: 10, flip: 0, animT: 0, animating: false };
  const SIDES = ['left', 'top', 'right', 'bottom'];

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  function draw(elapsed, dt) {
    if (params.animating) {
      params.animT += dt * 0.8;
      if (params.animT > params.n) { params.animT = params.n; params.animating = false; }
    }

    const { w, h, dpr } = fitCanvasCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    // 居中 + 自适应
    const side = Math.min(W, H) * 0.85;
    const cx = W / 2, cy = H / 2;
    const rect = { x: cx - side / 2, y: cy - side / 2, w: side, h: side };

    // 矩形 + 弧线(N 层)
    const visibleN = Math.floor(params.animating ? params.animT : params.n);
    const layers = generateFibonacciLayers(rect, visibleN, params.flip);

    // 画矩形(从大到小叠)
    layers.forEach((layer, i) => {
      const r = layer.rect;
      const t = 1 - i / Math.max(layers.length, 1) * 0.4;
      ctx.strokeStyle = `rgba(110, 231, 183, ${t * 0.6})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    });

    // 画弧(用大粗线,连成螺旋)
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    let penDown = false;
    for (let i = 0; i < layers.length; i++) {
      const arc = layers[i].arc;
      if (!arc || arc.r < 0.5) continue;  // 跳过太小的弧
      if (!penDown) { ctx.moveTo(arc.start.x, arc.start.y); penDown = true; }
      else ctx.lineTo(arc.start.x, arc.start.y);
      ctx.arc(arc.cx, arc.cy, arc.r, arc.startAngle, arc.endAngle, !arc.ccw);
    }
    ctx.stroke();

    // 黄金比例参考线(虚线)
    if (params.n > 0) {
      ctx.strokeStyle = 'rgba(240, 192, 64, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(rect.x, cy);
      ctx.lineTo(rect.x + rect.w, cy);
      ctx.moveTo(cx, rect.y);
      ctx.lineTo(cx, rect.y + rect.h);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 标签
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`φ = ${PHI.toFixed(6)}`, 24, 24);
    ctx.fillText(`N = ${visibleN}/${params.n}`, 24, 42);
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText('黄金螺旋 (对数螺旋 r = a·e^(bθ))', 24, 60);

    // 应用例子(底部)
    const apps = ['🐚 鹦鹉螺', '🌻 向日葵', '🌌 银河系', '🏛️ 帕特农神庙'];
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    apps.forEach((a, i) => {
      ctx.fillStyle = 'rgba(138, 147, 166, 0.8)';
      ctx.fillText(a, W - 24, 24 + i * 18);
    });

    ctx.restore();
  }

  function fitCanvasCanvas(canvas, host) {
    const rect = host.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    }
    return { w, h, dpr };
  }

  // 生成费波那契黄金矩形链 + 对应的弧
  function generateFibonacciLayers(startRect, n, rot) {
    const layers = [];
    let r = { ...startRect };
    // 切法:横切或竖切
    let isVertical = true;  // 第一次竖切
    for (let i = 0; i < n; i++) {
      // 矩形太小就停(避免 arc 半径 0)
      if (r.w < 1 || r.h < 1) break;
      // 1) 画当前矩形 + 弧
      const arc = quarterArc(r, isVertical, rot);
      if (!arc) break;  // 弧太小停
      layers.push({ rect: r, arc, side: SIDES[i % 4] });

      // 2) 切:较大矩形留下,较小方块作下一轮
      let nextRect;
      if (isVertical) {
        // 竖切:左大右小或左小右大
        if (r.w / r.h > PHI) {
          // 竖切分左右
          const smallW = r.w / PHI;
          // 较小方块在右(下一个弧画在它的角上)
          // 但根据当前切法决定,这里用:较大块在左 = 整矩形 - 右侧方块
          const bigW = r.w - smallW;
          nextRect = { x: r.x, y: r.y, w: bigW, h: r.h };
          r = { x: r.x + bigW, y: r.y, w: smallW, h: r.h };
        } else {
          // 已经是正方形,无法再按 φ 切;但继续按最小边切
          const smallW = r.h;
          nextRect = { x: r.x, y: r.y, w: r.w - smallW, h: r.h };
          r = { x: r.x + r.w - smallW, y: r.y, w: smallW, h: r.h };
        }
      } else {
        // 横切:上大下小
        if (r.h / r.w > PHI) {
          const smallH = r.h / PHI;
          const bigH = r.h - smallH;
          nextRect = { x: r.x, y: r.y, w: r.w, h: bigH };
          r = { x: r.x, y: r.y + bigH, w: r.w, h: smallH };
        } else {
          const smallH = r.w;
          nextRect = { x: r.x, y: r.y, w: r.w, h: r.h - smallH };
          r = { x: r.x, y: r.y + r.h - smallH, w: r.w, h: smallH };
        }
      }
      r = nextRect;
      isVertical = !isVertical;
    }
    return layers;
  }

  // 在矩形 r 的某个角画 1/4 弧,使其内接于 r
  // 旋转 rot:0/1/2/3 (90° 倍数)
  function quarterArc(r, isVertical, rot) {
    // 默认画在右下角,弧心 = (r.x, r.y+r.h),半径 = r.h,角度从 0 到 π/2
    let cx, cy, radius, startAngle, endAngle;
    const minSide = Math.min(r.w, r.h);
    // 防护:半径太小(< 1px)就不画,返回 null 跳过
    radius = minSide;
    if (radius < 1) return null;
    // 简单实现:把弧心放在矩形的某一个角,半径 = 短边
    // 角位置由"下一步切的方向"决定
    if (isVertical) {
      cx = r.x;
      cy = r.y + r.h;
      startAngle = -Math.PI / 2;
      endAngle = 0;
    } else {
      cx = r.x + r.w;
      cy = r.y;
      startAngle = 0;
      endAngle = Math.PI / 2;
    }
    // 旋转
    if (rot === 1) {
      cx = r.x;
      cy = r.y;
      startAngle = 0;
      endAngle = Math.PI / 2;
    } else if (rot === 2) {
      cx = r.x + r.w;
      cy = r.y + r.h;
      startAngle = Math.PI;
      endAngle = Math.PI * 1.5;
    } else if (rot === 3) {
      cx = r.x + r.w;
      cy = r.y;
      startAngle = -Math.PI / 2;
      endAngle = 0;
    }
    const ccw = false;
    return {
      cx, cy, r: radius,
      startAngle, endAngle, ccw,
      start: { x: cx + radius * Math.cos(startAngle), y: cy + radius * Math.sin(startAngle) },
    };
  }

  const loop = makeLoopDraw(draw);

  function makeLoopDraw(drawFn) {
    let rafId = null;
    let lastTs = 0;
    function tick(ts) {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(0.1, (ts - lastTs) / 1000);
      lastTs = ts;
      drawFn(ts / 1000, dt);
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return { stop: () => rafId && cancelAnimationFrame(rafId) };
  }

  // ---------- 交互 ----------
  const _nInp = ctrls.querySelector('[data-n]');
  const _nV = ctrls.querySelector('[data-n-v]');
  _nInp.addEventListener('input', (e) => {
    params.n = parseInt(e.target.value);
    _nV.textContent = params.n;
  });
  ctrls.querySelector('[data-flip]').addEventListener('click', () => {
    params.flip = (params.flip + 1) % 4;
  });
  ctrls.querySelector('[data-anim]').addEventListener('click', () => {
    params.animating = true;
    params.animT = 0;
  });

  return {
    sceneId: 'golden-spiral',
    getFormula() { return 'φ = (1+√5)/2 ≈ 1.618   r(θ) = a·e^(bθ)'; },
    // v0.6.28: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { n: params.n, flip: params.flip }; },
    setState(s) {
      if (!s) return;
      if (typeof s.n === 'number') { params.n = s.n; _nInp.value = s.n; _nV.textContent = s.n; }
      if (typeof s.flip === 'number') { params.flip = s.flip; }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
