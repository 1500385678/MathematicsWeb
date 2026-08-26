// viewer/scenes/32_pythagorean-theorem.js
// MathematicsWeb v0.6.36 — 勾股定理 (数学 × 初中几何 · 8 年级 · 王炸)
// 2D Canvas 场景:3 种经典证法可视化,拖动 a/b 滑块实时看 a² + b² = c²
//   - 3-squares:直角三角形 3 边上画 3 个正方形,展示 a² + b² = c² 面积守恒
//   - Garfield 1876:梯形证法 — 2 个相同直角三角 + 1 个等腰三角拼成梯形
//   - 赵爽弦图 (~100BC):外接大正方形 = 4 个直角三角 + 内接正方形 c² + 4 个小矩形
//
// 数学(勾股定理):
//   直角三角形: a² + b² = c² (c 为斜边)
//   证明超过 400 种,涵盖代数/几何/微积分/向量/分形/三角函数
//   经典证法:
//     1. Euclid 《几何原本》 I.47 (~300BC) 面积减法
//     2. 赵爽 《周髀算经》 弦图 (~100BC) 4 三角拼外正方形
//     3. 刘徽 勾股圆方图 (263AD) 圆面积几何
//     4. al-Nayrizi (~900AD) 拼图
//     5. President Garfield 1876 梯形证法
//     6. Perigal 1830s 切分证法
//     7. Bhaskara 12 世纪无字证法
//
// 应用:
//   - 测量:距离/高度/坡度计算
//   - GPS:坐标距离 √(Δx² + Δy² + Δz²)
//   - 物理:力分解 / 速度合成
//   - 统计学:欧氏距离 / 向量范数
//   - 工程:直角定位(建筑/木工)

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
    <div class="mathw-lesson-title">数学 × 初中几何 · 勾股定理</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">a² + b² = c² · 400+ 种证法</div>
      <div class="mathw-lesson-formula">a² + b² = c²  (c 为斜边)</div>
      <div class="mathw-lesson-text">
        <strong>勾股定理</strong>(Pythagorean Theorem):直角三角形两<strong>直角边</strong>平方和 = <strong>斜边</strong>平方。<br>
        <strong>a² + b² = c²</strong> — 公元前 6 世纪毕达哥拉斯,中国古代《周髀算经》(商高)有类似记载。<br>
        现有 <strong>400+ 种证法</strong>:<br>
        ① <strong>欧几里得</strong>《几何原本》I.47 (~300BC) 面积减法 · ② <strong>赵爽弦图</strong> (~100BC) 4 三角拼大正方形 · ③ <strong>刘徽</strong> 勾股圆方图 (263AD) · ④ <strong>Garfield</strong> 1876 梯形证法 · ⑤ <strong>Perigal</strong> 1830s 切分 · ⑥ <strong>Bhaskara</strong> 12 世纪无字证 · ⑦ <strong>达·芬奇</strong> 切分证法。<br>
        拖动 a / b 滑块,看 a² + b² = c² 实时守恒。<br>
        应用:距离测量 · GPS · 力分解 · 欧氏距离 · 直角定位(建筑/木工)。
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
    <div class="mathw-controls-title">参数 · 勾股定理</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">证法视图</span>
      <select data-view>
        <option value="squares" selected>3-squares (a² + b² + c²)</option>
        <option value="garfield">Garfield 1876 梯形</option>
        <option value="zhao">赵爽弦图 (~100BC)</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">a (直角边)</span>
      <input type="range" min="2" max="10" step="0.5" value="3" data-a />
      <span class="mathw-control-value" data-a-v>3.0</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">b (直角边)</span>
      <input type="range" min="2" max="10" step="0.5" value="4" data-b />
      <span class="mathw-control-value" data-b-v>4.0</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">预设</span>
      <button data-p345>3-4-5</button>
      <button data-p558>5-12-13</button>
      <button data-p6810>6-8-10</button>
      <button data-p7910>7-24-25</button>
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let params = { a: 3, b: 4, view: 'squares' };

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  // 画 a×a 网格小方块(用斜线纹理)
  function drawTileGrid(x, y, size, color) {
    const cell = size / Math.max(1, Math.round(size));
    if (cell < 4) {
      // 太密只填色
      ctx.fillStyle = color;
      ctx.fillRect(x, y, size, size);
    } else {
      const n = Math.round(size / cell);
      const realCell = size / n;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          ctx.fillStyle = (i + j) % 2 === 0 ? color : shade(color, 0.85);
          ctx.fillRect(x + i * realCell, y + j * realCell, realCell, realCell);
        }
      }
    }
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
  }
  function shade(hex, factor) {
    // 简化:把 hex 当 0xRRGGBB 调亮度
    if (typeof hex !== 'number') return hex;
    const r = ((hex >> 16) & 0xff) * factor;
    const g = ((hex >> 8) & 0xff) * factor;
    const b = (hex & 0xff) * factor;
    return `rgb(${r|0},${g|0},${b|0})`;
  }

  // === 视图 1: 3-squares ===
  function viewSquares(W, H) {
    const c = Math.hypot(params.a, params.b);
    const scale = Math.min(
      (W * 0.35) / Math.max(params.a, params.b),
      (H * 0.6) / (Math.max(params.a, params.b) + c)
    );
    const aPx = params.a * scale, bPx = params.b * scale, cPx = c * scale;

    // 中心三角 (放在 (W/2, H/2 - 30))
    const tcx = W / 2, tcy = H * 0.45;
    // 直角在 C: A=(0,0), B=(a,0), C=(0,b) — 这里画在 tcx/tcy 周围
    const Ax = tcx - aPx / 2, Ay = tcy + bPx / 2;
    const Bx = tcx + aPx / 2, By = tcy + bPx / 2;
    const Cx = tcx - aPx / 2, Cy = tcy - bPx / 2;

    // a² 在下方(AB 边)
    drawTileGrid(Ax, Ay, aPx, 0x6ee7b7);
    // b² 在左侧(AC 边)
    drawTileGrid(Ax - bPx, Cy, bPx, 0x4ea1ff);
    // c² 在斜边外(BC 边)
    // BC 边方向: from B(tcx+aPx/2, tcy+bPx/2) to C(tcx-aPx/2, tcy-bPx/2)
    // 沿 BC 外侧放一个正方形 (法线方向外侧)
    const dx = Cx - Bx, dy = Cy - By;
    const len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;     // BC 单位向量
    const nx = -uy, ny = ux;                // 外法线(左转 90°)
    // 4 角
    const sqA = { x: Ax - bPx + bPx, y: Ay - bPx + bPx };  // 不用
    const sB1 = { x: Bx, y: By };
    const sB2 = { x: Bx + cPx * nx, y: By + cPx * ny };
    const sC1 = { x: Cx, y: Cy };
    const sC2 = { x: Cx + cPx * nx, y: Cy + cPx * ny };

    // 画 c² 方块(用多边形 fill + 网格纹理)
    // 先填充底色
    ctx.beginPath();
    ctx.moveTo(sB1.x, sB1.y);
    ctx.lineTo(sB2.x, sB2.y);
    ctx.lineTo(sC2.x, sC2.y);
    ctx.lineTo(sC1.x, sC1.y);
    ctx.closePath();
    ctx.fillStyle = '#fbbf24';
    ctx.fill();

    // c² 内画网格
    const cN = Math.round(c);
    if (cN >= 2) {
      // 用 BC 方向为 u, 外法线为 n
      for (let i = 0; i < cN; i++) {
        for (let j = 0; j < cN; j++) {
          const fx = (i + 0.5) / cN, fy = (j + 0.5) / cN;
          // 点: B1 + fx*(C1-B1) + fy*(B2-B1)
          const px = sB1.x + fx * (sC1.x - sB1.x) + fy * (sB2.x - sB1.x);
          const py = sB1.y + fx * (sC1.y - sB1.y) + fy * (sB2.y - sB1.y);
          ctx.fillStyle = (i + j) % 2 === 0 ? '#fbbf24' : '#d97706';
          ctx.fillRect(px - 1, py - 1, 2, 2);
        }
      }
    }
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 画直角三角形
    ctx.strokeStyle = '#e6e8ec';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Ax, Ay);
    ctx.lineTo(Bx, By);
    ctx.lineTo(Cx, Cy);
    ctx.closePath();
    ctx.stroke();

    // 直角标记
    ctx.strokeStyle = '#e6e8ec';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(Ax - 10, Ay - 10, 10, 10);

    // 顶点标签
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('A', Ax, Ay + 22);
    ctx.fillText('B', Bx + 12, By + 16);
    ctx.fillText('C', Cx - 12, Cy);

    // 边长标签
    ctx.font = '12px monospace';
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText(`a = ${params.a.toFixed(1)}  →  a² = ${(params.a * params.a).toFixed(1)}`, Ax + aPx / 2, Ay + aPx + 18);
    ctx.fillStyle = '#4ea1ff';
    ctx.save();
    ctx.translate(Ax - bPx / 2 - 22, Cy + bPx / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`b = ${params.b.toFixed(1)}  →  b² = ${(params.b * params.b).toFixed(1)}`, 0, 0);
    ctx.restore();
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`c = ${c.toFixed(2)}  →  c² = ${(c * c).toFixed(1)}`, (sB2.x + sC2.x) / 2, (sB2.y + sC2.y) / 2 + 16);

    // 等式大字
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`a² + b² = ${(params.a * params.a).toFixed(1)} + ${(params.b * params.b).toFixed(1)} = ${(params.a * params.a + params.b * params.b).toFixed(1)}  =  c²  ✓`,
      W / 2, H - 30);
  }

  // === 视图 2: Garfield 1876 梯形 ===
  function viewGarfield(W, H) {
    // 梯形: 上底 a, 下底 b, 高 (a+b); 内含 2 个直角三角 + 1 个等腰三角(c 边)
    // 面积: (a+b)²/2 = a²/2 + b²/2 + ab(2 个直角三角总面积) = c²/2 + ab
    // 推: a² + b² = c²
    const a = params.a, b = params.b, c = Math.hypot(params.a, params.b);
    const scale = Math.min(W / (a + b + 2), H / (a + b + 4));
    const aPx = a * scale, bPx = b * scale, cPx = c * scale;
    const ox = (W - (aPx + bPx + 2)) / 2 + 1;  // 居中
    const oy = H * 0.15;
    // 梯形 4 角: TL(ox, oy), TR(ox+aPx, oy), BR(ox+aPx+bPx, oy+(aPx+bPx)), BL(ox, oy+(aPx+bPx))
    const TL = { x: ox, y: oy };
    const TR = { x: ox + aPx, y: oy };
    const BR = { x: ox + aPx + bPx, y: oy + aPx + bPx };
    const BL = { x: ox, y: oy + aPx + bPx };

    // 内部点:左下角 = TL 直角,右下 = BR 直角,内点 = (ox+aPx, oy+aPx+bPx) 是等腰三角顶点
    const innerTop = { x: TR.x, y: oy };
    const innerBot = { x: TR.x, y: oy + aPx + bPx };

    // 背景梯形
    ctx.fillStyle = 'rgba(110, 231, 183, 0.05)';
    ctx.beginPath();
    ctx.moveTo(TL.x, TL.y); ctx.lineTo(TR.x, TR.y);
    ctx.lineTo(BR.x, BR.y); ctx.lineTo(BL.x, BL.y);
    ctx.closePath(); ctx.fill();

    // 画 2 个直角三角(对角线)+ 1 个等腰三角(底部)
    // 三角 1: TL, TR, innerBot
    ctx.fillStyle = 'rgba(78, 161, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(TL.x, TL.y); ctx.lineTo(TR.x, TR.y);
    ctx.lineTo(innerBot.x, innerBot.y);
    ctx.closePath(); ctx.fill();

    // 三角 2: TR, BR, innerTop
    ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.beginPath();
    ctx.moveTo(TR.x, TR.y); ctx.lineTo(BR.x, BR.y);
    ctx.lineTo(innerTop.x, innerTop.y);
    ctx.closePath(); ctx.fill();

    // 中间等腰三角: innerTop, innerBot, BR → 实际是 (TR.x, oy), (TR.x, oy+aPx+bPx), BR
    // 等等,看 Garfield 原图: 梯形 = 2 个相同直角三角(镜像)+ 1 个等腰三角(底)
    // 让我重画:梯形左下角 = 直角,梯形右上 = 直角,内点 = 等腰三角顶点
    // 左下角三角: TL(ox, oy+a+b), BL?(不,BL就是TL+向下)
    // 让我简化为标准画法:
    //   梯形顶点: P1=(0,0) P2=(a,0) P3=(a+b, a+b) P4=(0, a+b)
    //   内顶点: P2=(a,0) [中线上], P2'=(a, a+b) [中线下]
    //   三角1: P1, P2, P2'  (左下三角, 直角在 P1)
    //   三角2: P2, P3, P2' (右下三角, 直角在 P2... no)
    //   中间等腰: P2, P3, P4   no
    // 标准 Garfield: 梯形 = 3 块: 2 个全等直角三角 + 1 个等腰三角(直角边 = a/b, 底 = c)
    // 重新画:
    //   梯形 = P1(0,0), P2(a,0), P3(a+b, a+b), P4(0, a+b)
    //   P1P2 = a (上底), P4P3 = b (下底? 不, P4P3 长度 = sqrt((a+b)² + (a+b)²) = ...)
    // OK Garfield 经典:
    //   等腰梯形: 上底 a, 下底 b, 两腰 = 两腰, 高 = a+b
    //   两个相同直角三角(直角边 a, b, 斜边 c)放在两侧
    //   中间剩余 1 个等腰三角(三边为 a, b, c)
    //   面积: 梯形 (a+b)²/2 = 2·(ab/2) + c²/2 → (a+b)² = 2ab + c² → a² + 2ab + b² = 2ab + c² → a² + b² = c² ✓

    // 清除重画(用 clearRect)
    ctx.save();
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    const A1 = { x: 0, y: 0 }, B1 = { x: aPx, y: 0 };     // 上底端点
    const D = { x: aPx, y: aPx + bPx };                    // 内分点(斜线交点)
    const C = { x: aPx + bPx, y: aPx + bPx };             // 右下
    const A2 = { x: 0, y: aPx + bPx };                    // 左下

    const ox2 = (W - (aPx + bPx)) / 2;
    const oy2 = H * 0.18;
    function P(p) { return { x: p.x + ox2, y: p.y + oy2 }; }

    const _A1 = P(A1), _B1 = P(B1), _D = P(D), _C = P(C), _A2 = P(A2);

    // 梯形背景
    ctx.fillStyle = 'rgba(110, 231, 183, 0.05)';
    ctx.beginPath();
    ctx.moveTo(_A1.x, _A1.y); ctx.lineTo(_B1.x, _B1.y);
    ctx.lineTo(_C.x, _C.y); ctx.lineTo(_A2.x, _A2.y);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 三角 1: A1, B1, D (左半, 直角在 A1)
    ctx.fillStyle = 'rgba(78, 161, 255, 0.30)';
    ctx.beginPath();
    ctx.moveTo(_A1.x, _A1.y); ctx.lineTo(_B1.x, _B1.y);
    ctx.lineTo(_D.x, _D.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#4ea1ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 三角 2: A2, D, C (左下, 直角在 A2)
    ctx.fillStyle = 'rgba(251, 191, 36, 0.30)';
    ctx.beginPath();
    ctx.moveTo(_A2.x, _A2.y); ctx.lineTo(_D.x, _D.y);
    ctx.lineTo(_C.x, _C.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 三角 3: B1, D, C (右下, 直角在 D? 实际 B1→D 垂直,因为 B1=(a,0), D=(a, a+b) → x 同)
    // 实际: 三角 B1 D C 是 (a,0) → (a,a+b) → (a+b,a+b), 边长 BD=b, DC=a, B1C = √(b²+a²) = c → 等腰
    ctx.fillStyle = 'rgba(244, 114, 182, 0.30)';
    ctx.beginPath();
    ctx.moveTo(_B1.x, _B1.y); ctx.lineTo(_D.x, _D.y);
    ctx.lineTo(_C.x, _C.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 标签
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('a', (_A1.x + _B1.x) / 2, _A1.y - 8);
    ctx.fillText('b', (_A2.x + _C.x) / 2, _A2.y + 20);
    ctx.fillText('c', (_A1.x + _D.x) / 2 - 8, (_A1.y + _D.y) / 2);
    ctx.fillText('c', (_B1.x + _C.x) / 2 + 12, (_B1.y + _C.y) / 2);

    // 推导
    ctx.fillStyle = '#e6e8ec';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`梯形面积 = (a+b)·(a+b)/2 = (a+b)²/2 = ${((a + b) * (a + b) / 2).toFixed(2)}`, W / 2, H * 0.85);
    ctx.fillText(`= 2·(ab/2) + c²/2 = ab + c²/2 = ${(a * b + c * c / 2).toFixed(2)}  →  a² + b² = c² ✓`, W / 2, H * 0.85 + 22);
  }

  // === 视图 3: 赵爽弦图 ===
  function viewZhao(W, H) {
    // 4 个相同直角三角(直角边 a, b, 斜边 c)拼成外正方形(边 a+b),中间留 c² 内正方形
    const a = params.a, b = params.b, c = Math.hypot(params.a, params.b);
    const scale = Math.min(W / (a + b + 4), H / (a + b + 4));
    const aPx = a * scale, bPx = b * scale;
    const side = aPx + bPx;
    const ox = (W - side) / 2;
    const oy = (H - side) / 2 - 10;

    // 外正方形
    ctx.fillStyle = 'rgba(110, 231, 183, 0.05)';
    ctx.fillRect(ox, oy, side, side);
    ctx.strokeStyle = '#2a3140';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ox, oy, side, side);

    // 4 个三角:
    //   上方: (ox, oy) → (ox+bPx, oy) → (ox, oy+bPx) [左下, 直角边 a=沿左, b=沿下?]
    //   标准画法: 外正方形 4 角, 每角放 1 个三角, 4 个斜边拼成内 c² 正方形
    //   三角顶点位置:
    //     顶角三角: V1=(ox, oy), V2=(ox+bPx, oy), V3=(ox, oy+bPx)  — 直角边 a沿? 这里换:三角(ox,oy)-(ox+b,oy)-(ox,oy+b)
    //     这个三角斜边长 √(b²+b²)=b√2, 不是 c。重新:
    //   赵爽弦图正确画法: 外正方形 = (a+b)², 4 个三角(直角边 a, b), 内 c² 正方形
    //   4 个三角顶点: 外正方形 4 角, 直角顶点在 4 角, 直角边沿外边
    //   三角 1 (左上): 顶点 (ox, oy), 直角边 a 沿上边 → (ox+a, oy), 直角边 b 沿左边 → (ox, oy+b), 斜边 → (ox+a, oy+b)
    //   等等,这就是说斜边长 = √(a²+b²) = c, 端点 (ox+a, oy+b)
    //   内正方形 4 角: 4 个 (a,b) 点

    // 4 个三角(斜边 = c)
    const corners = [
      { p: { x: ox, y: oy }, u: 'right', v: 'down' },           // 左上: 沿右 + 沿下
      { p: { x: ox + side, y: oy }, u: 'left', v: 'down' },     // 右上: 沿左 + 沿下
      { p: { x: ox + side, y: oy + side }, u: 'left', v: 'up' },// 右下
      { p: { x: ox, y: oy + side }, u: 'right', v: 'up' },      // 左下
    ];
    const innerPts = [];
    for (let i = 0; i < 4; i++) {
      const c = corners[i];
      const ux = c.u === 'right' ? 1 : -1;
      const uy = c.v === 'down' ? 1 : -1;
      // 直角边 a (水平方向) + 直角边 b (垂直方向) → 但要保证斜边 = c
      // 哪个是 a 哪个是 b 取决于象限。统一: 第 i 角的两条直角边方向(沿外边向外指向相邻角)
      // 左上角:水平向右 = 邻角(右上),垂直向下 = 邻角(左下)
      // 邻角间距离 = side = a+b, 所以一段是 a 一段是 b
      // 距水平方向 a 处的点 = (ox + a, oy)
      // 距垂直方向 b 处的点 = (ox, oy + b)
      // 简化: 4 角的内接 c² 正方形顶点 = (ox+a, oy), (ox+side, oy+b), (ox+b, oy+side), (ox, oy+a)
      // 4 角是按顺序: 左上 → 右上 → 右下 → 左下
      const inner = [
        { x: ox + aPx, y: oy },           // 上边 a 处
        { x: ox + side, y: oy + bPx },    // 右边 b 处
        { x: ox + bPx, y: oy + side },    // 下边 b 处
        { x: ox, y: oy + aPx },           // 左边 a 处
      ];
      innerPts.push(inner[i]);
    }

    // 画 4 个三角
    const triColors = ['rgba(78, 161, 255, 0.3)', 'rgba(110, 231, 183, 0.3)', 'rgba(244, 114, 182, 0.3)', 'rgba(251, 191, 36, 0.3)'];
    for (let i = 0; i < 4; i++) {
      const c = corners[i].p;
      const ip = innerPts[i];
      ctx.fillStyle = triColors[i];
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(ip.x, ip.y);
      // 邻角的 inner: i=0 (左上),邻接 i=1 (右上) 的内点 (ox+side, oy+b)
      const nextInner = innerPts[(i + 1) % 4];
      ctx.lineTo(nextInner.x, nextInner.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2a3140';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 内 c² 正方形
    ctx.fillStyle = 'rgba(251, 191, 36, 0.20)';
    ctx.beginPath();
    ctx.moveTo(innerPts[0].x, innerPts[0].y);
    for (let i = 1; i < 4; i++) ctx.lineTo(innerPts[i].x, innerPts[i].y);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 标签
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`外正方形 = (a + b)² = ${((a + b) * (a + b)).toFixed(1)}`, W / 2, oy - 18);
    ctx.fillText(`= 4 · (ab/2) + c² = 2ab + c²  =  ${(2 * a * b + c * c).toFixed(1)}`, W / 2, oy - 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`c² = ${(c * c).toFixed(1)}`, (innerPts[0].x + innerPts[2].x) / 2, (innerPts[0].y + innerPts[2].y) / 2);

    // a / b 标签(在外正方形边上)
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText('a', (ox + innerPts[0].x) / 2, oy - 4);
    ctx.fillText('b', (innerPts[0].x + ox + side) / 2, oy - 4);
    ctx.fillText('a', (ox + side) + 10, (oy + innerPts[1].y) / 2);
    ctx.fillText('b', (ox + side) + 10, (innerPts[1].y + oy + side) / 2);

    // 推导
    ctx.fillStyle = '#e6e8ec';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`(a+b)² = 2ab + c²  →  a² + 2ab + b² = 2ab + c²  →  a² + b² = c² ✓`, W / 2, oy + side + 32);
  }

  function draw() {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    // 视图标题
    const titles = {
      squares: '3-squares · 经典面积守恒 (欧几里得 I.47)',
      garfield: 'Garfield 1876 · 梯形证法 (美国第 20 任总统)',
      zhao: '赵爽弦图 · ~100BC 《周髀算经》',
    };
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(titles[params.view] || '', W / 2, 24);
    ctx.fillStyle = '#8a93a6';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillText(`a = ${params.a.toFixed(1)}, b = ${params.b.toFixed(1)}, c = √(a² + b²) = ${Math.hypot(params.a, params.b).toFixed(3)}`, W / 2, 42);

    if (params.view === 'squares') viewSquares(W, H);
    else if (params.view === 'garfield') viewGarfield(W, H);
    else if (params.view === 'zhao') viewZhao(W, H);

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // ---------- 交互 ----------
  const aInp = ctrls.querySelector('[data-a]');
  const aV = ctrls.querySelector('[data-a-v]');
  const bInp = ctrls.querySelector('[data-b]');
  const bV = ctrls.querySelector('[data-b-v]');
  const viewSel = ctrls.querySelector('[data-view]');

  aInp.addEventListener('input', (e) => { params.a = parseFloat(e.target.value); aV.textContent = params.a.toFixed(1); });
  bInp.addEventListener('input', (e) => { params.b = parseFloat(e.target.value); bV.textContent = params.b.toFixed(1); });
  viewSel.addEventListener('change', (e) => { params.view = e.target.value; });

  function setPreset(a, b) {
    params.a = a; params.b = b;
    aInp.value = a; aV.textContent = a.toFixed(1);
    bInp.value = b; bV.textContent = b.toFixed(1);
  }
  ctrls.querySelector('[data-p345]').addEventListener('click', () => setPreset(3, 4));
  ctrls.querySelector('[data-p558]').addEventListener('click', () => setPreset(5, 12));
  ctrls.querySelector('[data-p6810]').addEventListener('click', () => setPreset(6, 8));
  ctrls.querySelector('[data-p7910]').addEventListener('click', () => setPreset(7, 24));

  return {
    sceneId: 'pythagorean-theorem',
    getFormula() { return 'a² + b² = c²  (c = 斜边, 直角三角形)'; },
    getLesson() {
      const c = lesson.querySelector('.mathw-lesson-content');
      return c ? c.textContent.replace(/\s+/g, ' ').trim() : '';
    },
    getState() { return { a: params.a, b: params.b, view: params.view }; },
    setState(s) {
      if (!s) return;
      if (typeof s.a === 'number') { params.a = s.a; aInp.value = s.a; aV.textContent = s.a.toFixed(1); }
      if (typeof s.b === 'number') { params.b = s.b; bInp.value = s.b; bV.textContent = s.b.toFixed(1); }
      if (s.view) { params.view = s.view; viewSel.value = s.view; }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
