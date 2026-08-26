// viewer/scenes/37_three-views-3d.js
// MathematicsWeb v0.6.39 — 立体几何三视图 (数学 × 初中几何 · 9 年级)
// 3D three.js 场景:左半 3D 立体(可旋转) + 右半 2D 三视图(主/俯/左,中国第一角投影)
//   - 模式 1:长方体 (Box) — a × b × c
//   - 模式 2:圆柱 (Cylinder) — r × h
//   - 模式 3:四棱锥 (Square Pyramid) — 底面 a × a,高 h
//   - 模式 4:组合体 (L-shape) — 大长方体+顶部小长方体(工字形/L形)
//
// 数学(三视图 Orthographic Projection):
//   1. 正投影(orthographic projection):平行投影,投影线⊥投影面,长度不变
//   2. 三视图:从 3 个互相垂直方向看立体
//      - 主视图 V(Front View):从前向后 → 投影到 V 面(XY 平面)
//      - 俯视图 H(Top View):从上向下 → 投影到 H 面(XZ 平面)
//      - 左视图 W(Left/Side View):从左向右 → 投影到 W 面(YZ 平面)
//   3. 中国第一角投影:三视图布局 — 俯视在主视下,左视在主视右
//      规律:长对正(主俯长相等)、高平齐(主左高相等)、宽相等(俯左宽相等)
//   4. 投影规律(线/面):
//      - 直线⊥投影面 → 积聚成点
//      - 平面⊥投影面 → 积聚成线
//      - 平面∥投影面 → 投影反映实形(长方形→长方形)
//
// 历史:
//   - Gaspard Monge(1746-1818) 法国数学家,1795 创立画法几何学
//   - 中国第一角投影:前苏联传入,与国际 ISO 标准的第三角投影(美/英)布局相反
//   - 9 年级初中"投影与视图"是课标要求
//
// 应用:
//   - 工程制图(机械/建筑/电路):用三视图表达复杂零件
//   - 建筑设计:平面图(俯视) + 立面图(主视) + 剖面图(左视)
//   - 3D 建模逆向:从三视图反推 3D 形状
//   - CT/MRI 医学影像:三个正交切片重建 3D

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createScene(host, opts = {}) {
  // ---------- DOM ----------
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;inset:0;display:flex;';
  host.appendChild(wrap);

  // 左半 3D
  const left = document.createElement('div');
  left.style.cssText = 'position:relative;flex:1 1 60%;height:100%;border-right:1px solid #2a3140;';
  wrap.appendChild(left);

  const canvas3d = document.createElement('canvas');
  canvas3d.style.cssText = 'display:block;width:100%;height:100%;';
  left.appendChild(canvas3d);

  // 右半 2D 三视图
  const right = document.createElement('div');
  right.style.cssText = 'position:relative;flex:1 1 40%;height:100%;background:#0a0d12;display:flex;flex-direction:column;';
  wrap.appendChild(right);

  // 三视图标题
  const viewHeader = document.createElement('div');
  viewHeader.style.cssText = 'padding:6px 12px;font-size:11px;color:#8a96b0;letter-spacing:0.5px;background:#14181f;border-bottom:1px solid #2a3140;';
  viewHeader.innerHTML = '<span style="color:#6ee7b7">主视图 V</span> · 俯视图 H · 左视图 W(中国第一角投影)';
  right.appendChild(viewHeader);

  // 3 个 2D canvas 容器
  const viewGrid = document.createElement('div');
  viewGrid.style.cssText = 'flex:1;display:grid;grid-template-rows:1fr 1fr;grid-template-columns:1fr 1fr;gap:1px;background:#2a3140;';
  right.appendChild(viewGrid);

  function makeViewPanel(label) {
    const cell = document.createElement('div');
    cell.style.cssText = 'position:relative;background:#0a0d12;';
    const tag = document.createElement('div');
    tag.style.cssText = 'position:absolute;top:4px;left:6px;font-size:10px;color:#8a96b0;letter-spacing:0.5px;z-index:1;pointer-events:none;';
    tag.textContent = label;
    cell.appendChild(tag);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'display:block;width:100%;height:100%;';
    cell.appendChild(cv);
    viewGrid.appendChild(cell);
    return { cell, cv, tag };
  }

  const panelFront = makeViewPanel('主视图 V (Front)');
  const panelTop = makeViewPanel('俯视图 H (Top)');
  const panelLeft = makeViewPanel('左视图 W (Side)');

  // ---------- 教学卡片 ----------
  const lesson = document.createElement('div');
  lesson.className = 'mathw-lesson';
  lesson.innerHTML = `
    <button class="mathw-lesson-toggle" data-toggle>−</button>
    <div class="mathw-lesson-title">数学 × 初中几何 · 立体几何三视图</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">主视图 V + 俯视图 H + 左视图 W · 长对正 / 高平齐 / 宽相等</div>
      <div class="mathw-lesson-formula">正投影:平行光⊥投影面 · 长度不变 · 实形保留(面∥投影面)</div>
      <div class="mathw-lesson-text">
        <strong>三视图</strong>是从 3 个互相垂直方向看立体的正交投影。<br>
        · <strong>主视图 V</strong>(Front):从前向后看 — 反映 长×高<br>
        · <strong>俯视图 H</strong>(Top):从上向下看 — 反映 长×宽<br>
        · <strong>左视图 W</strong>(Side):从左向右看 — 反映 宽×高<br>
        <strong>布局规律</strong>(中国第一角投影):俯视在主视<strong>下</strong>,左视在主视<strong>右</strong>。<br>
        <strong>对应关系</strong>:<br>
        · <strong>长对正</strong>:主视图与俯视图的<strong>长度</strong>相等(纵向对齐)<br>
        · <strong>高平齐</strong>:主视图与左视图的<strong>高度</strong>相等(横向对齐)<br>
        · <strong>宽相等</strong>:俯视图与左视图的<strong>宽度</strong>相等(对角线对齐)<br>
        <strong>积聚规律</strong>:<br>
        · 直线⊥投影面 → <strong>积聚成点</strong><br>
        · 平面⊥投影面 → <strong>积聚成线</strong><br>
        · 平面∥投影面 → <strong>投影反映实形</strong><br>
        <strong>历史</strong>:Gaspard Monge 1746-1818 法国数学家,1795 创立画法几何学,把 3D 立体映射到 2D 平面表达。中国采用第一角投影(前苏联传入,与国际 ISO 第三角投影布局相反)。<br>
        <strong>应用</strong>:工程制图(机械零件/电路板)· 建筑设计(平面图+立面图+剖面图)· CT/MRI 医学三维重建 · 3D 建模逆向。
      </div>
    </div>
  `;
  host.appendChild(lesson);
  lesson.querySelector('[data-toggle]').addEventListener('click', () => {
    lesson.classList.toggle('collapsed');
    lesson.querySelector('[data-toggle]').textContent = lesson.classList.contains('collapsed') ? '+' : '−';
  });

  // ---------- 控件 ----------
  const ctrls = document.createElement('div');
  ctrls.className = 'mathw-controls';
  ctrls.innerHTML = `
    <div class="mathw-controls-title">参数 · 立体几何三视图</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">立体形状</span>
      <select data-shape>
        <option value="box" selected>长方体 (a×b×c)</option>
        <option value="cylinder">圆柱 (r×h)</option>
        <option value="pyramid">四棱锥 (a²×h)</option>
        <option value="lshape">L 形组合体</option>
      </select>
    </div>
    <div class="mathw-control-row" data-row-size>
      <span class="mathw-control-label" data-size-label>长 a / 半径 r</span>
      <input type="range" min="40" max="140" step="2" value="100" data-a />
      <span class="mathw-control-value" data-a-v>100</span>
    </div>
    <div class="mathw-control-row" data-row-b>
      <span class="mathw-control-label" data-b-label>宽 b / 棱锥边 a</span>
      <input type="range" min="40" max="140" step="2" value="80" data-b />
      <span class="mathw-control-value" data-b-v>80</span>
    </div>
    <div class="mathw-control-row" data-row-c>
      <span class="mathw-control-label" data-c-label>高 c / 棱锥高 h</span>
      <input type="range" min="40" max="160" step="2" value="100" data-c />
      <span class="mathw-control-value" data-c-v>100</span>
    </div>
    <div class="mathw-control-row">
      <button data-toggle3d>显示/隐藏 3D 立体</button>
      <button data-togglegrid>显示/隐藏 投影网格</button>
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- three.js ----------
  const renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setClearColor(0x14181f, 1);

  const scene3d = new THREE.Scene();
  scene3d.background = new THREE.Color(0x14181f);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
  camera.position.set(180, 140, 200);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, canvas3d);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 0, 0);

  scene3d.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
  dirLight.position.set(80, 100, 60);
  scene3d.add(dirLight);
  const backLight = new THREE.DirectionalLight(0xa0c0ff, 0.3);
  backLight.position.set(-60, -40, -80);
  scene3d.add(backLight);

  // 3D 坐标轴(教学用,3 个箭头)
  function buildAxisHelper() {
    const g = new THREE.Group();
    const axes = [
      { v: new THREE.Vector3(140, 0, 0), c: 0xff6b6b, label: 'X 长' },
      { v: new THREE.Vector3(0, 120, 0), c: 0x6ee7b7, label: 'Y 高' },
      { v: new THREE.Vector3(0, 0, -140), c: 0x60a5fa, label: 'Z 宽' },  // 负 Z 朝向观察者
    ];
    axes.forEach(({ v, c, label }) => {
      const mat = new THREE.LineBasicMaterial({ color: c });
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), v]);
      g.add(new THREE.Line(geo, mat));
    });
    return g;
  }
  const axisHelper = buildAxisHelper();
  scene3d.add(axisHelper);

  // 投影网格地面
  const gridXZ = new THREE.GridHelper(280, 14, 0x2a3140, 0x222732);
  gridXZ.position.y = -80;  // 立体的底面
  scene3d.add(gridXZ);

  // 立体几何体组
  let solidGroup = null;
  const params = { shape: 'box', a: 100, b: 80, c: 100, show3d: true, showGrid: true };

  // 工具:画 2D 矩形框(主/俯/左视图通用)
  function strokeRect(ctx, x, y, w, h, color = '#6ee7b7', lw = 2) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.strokeRect(x, y, w, h);
  }
  function fillRect(ctx, x, y, w, h, color = 'rgba(110, 231, 183, 0.18)') {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }
  function drawCenterCross(ctx, W, H) {
    ctx.strokeStyle = 'rgba(138, 150, 176, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 各种形状的 2D 三视图绘制函数
  // 坐标约定:原点放在 canvas 中心,北向上(主视图)/北向下(俯视)/东向左(左视)
  // 实际画时,通过 translate 把图形居中

  function drawBox2D(ctx, W, H, a, b, c) {
    // a=长(X), b=宽(Z), c=高(Y)
    const s = 1.4;  // 缩放
    ctx.clearRect(0, 0, W, H);
    drawCenterCross(ctx, W, H);
    // 主视图(长×高) = a × c
    const fa = a * s, fc = c * s;
    const cx = W / 2, cy = H / 2;
    // 画在主视图位置
    fillRect(ctx, cx - fa / 2, cy - fc / 2, fa, fc);
    strokeRect(ctx, cx - fa / 2, cy - fc / 2, fa, fc, '#6ee7b7', 2);
    // 标尺寸
    ctx.fillStyle = '#8a96b0'; ctx.font = '11px monospace';
    ctx.fillText(`a=${a.toFixed(0)}`, cx, cy + fc / 2 + 14);
    ctx.fillText(`c=${c.toFixed(0)}`, cx - fa / 2 - 6, cy + 4);
  }

  function drawCylinder2D(ctx, W, H, r, h) {
    // 圆柱:r=半径, h=高
    const s = 1.4;
    ctx.clearRect(0, 0, W, H);
    drawCenterCross(ctx, W, H);
    const cx = W / 2, cy = H / 2;
    const rh = h * s, rr = r * s;
    // 主视图:长方形(高 h,宽 2r)
    const fa = 2 * rr;
    fillRect(ctx, cx - fa / 2, cy - rh / 2, fa, rh);
    strokeRect(ctx, cx - fa / 2, cy - rh / 2, fa, rh, '#6ee7b7', 2);
    // 中线(圆柱轴线)
    ctx.strokeStyle = 'rgba(110, 231, 183, 0.5)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, cy - rh / 2);
    ctx.lineTo(cx, cy + rh / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // 标尺寸
    ctx.fillStyle = '#8a96b0'; ctx.font = '11px monospace';
    ctx.fillText(`2r=${(2 * r).toFixed(0)}`, cx, cy + rh / 2 + 14);
    ctx.fillText(`h=${h.toFixed(0)}`, cx - fa / 2 - 6, cy + 4);
  }

  function drawPyramid2D(ctx, W, H, a, h) {
    // 四棱锥:底面 a×a,高 h(顶点朝上)
    const s = 1.4;
    ctx.clearRect(0, 0, W, H);
    drawCenterCross(ctx, W, H);
    const cx = W / 2, cy = H / 2;
    const aa = a * s, hh = h * s;
    // 主视图:等腰三角形
    ctx.beginPath();
    ctx.moveTo(cx, cy - hh / 2);                    // 顶点
    ctx.lineTo(cx - aa / 2, cy + hh / 2);           // 左下
    ctx.lineTo(cx + aa / 2, cy + hh / 2);           // 右下
    ctx.closePath();
    ctx.fillStyle = 'rgba(110, 231, 183, 0.18)';
    ctx.fill();
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 2;
    ctx.stroke();
    // 标尺寸
    ctx.fillStyle = '#8a96b0'; ctx.font = '11px monospace';
    ctx.fillText(`a=${a.toFixed(0)}`, cx, cy + hh / 2 + 14);
    ctx.fillText(`h=${h.toFixed(0)}`, cx - aa / 2 - 6, cy + 4);
  }

  function drawLShape2D(ctx, W, H, a, b, c) {
    // L 形组合体:大长方体(a×b×c)+ 顶部小长方体(0.4a × 0.4b × 0.4c)
    const s = 1.4;
    ctx.clearRect(0, 0, W, H);
    drawCenterCross(ctx, W, H);
    const cx = W / 2, cy = H / 2;
    const fa = a * s, fc = c * s;
    // 主视图(L 形):底下大长方 + 左上小长方
    ctx.beginPath();
    // 大长方体外框(整个 L 形底)
    ctx.moveTo(cx - fa / 2, cy + fc / 2);
    ctx.lineTo(cx - fa / 2, cy - fc / 2 + fc * 0.4);  // 上升到 0.4h
    ctx.lineTo(cx - fa / 2 + fa * 0.4, cy - fc / 2 + fc * 0.4);
    ctx.lineTo(cx - fa / 2 + fa * 0.4, cy - fc / 2);
    ctx.lineTo(cx + fa / 2, cy - fc / 2);
    ctx.lineTo(cx + fa / 2, cy + fc / 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(110, 231, 183, 0.18)';
    ctx.fill();
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 2;
    ctx.stroke();
    // 内部分隔线(小长方体下沿)
    ctx.beginPath();
    ctx.moveTo(cx - fa / 2 + fa * 0.4, cy - fc / 2 + fc * 0.4);
    ctx.lineTo(cx + fa / 2, cy - fc / 2 + fc * 0.4);
    ctx.stroke();
    // 标尺寸
    ctx.fillStyle = '#8a96b0'; ctx.font = '11px monospace';
    ctx.fillText(`a=${a.toFixed(0)}`, cx, cy + fc / 2 + 14);
    ctx.fillText(`c=${c.toFixed(0)}`, cx - fa / 2 - 6, cy + 4);
  }

  // 立体几何体 3D 构造
  function buildSolid() {
    if (solidGroup) {
      scene3d.remove(solidGroup);
      solidGroup.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
    solidGroup = new THREE.Group();

    const matSolid = new THREE.MeshStandardMaterial({
      color: 0x6ee7b7,
      emissive: 0x224433,
      emissiveIntensity: 0.3,
      roughness: 0.4,
      metalness: 0.2,
      transparent: true,
      opacity: 0.92,
    });
    const matEdge = new THREE.LineBasicMaterial({ color: 0x6ee7b7 });

    const { a, b, c, shape } = params;
    if (shape === 'box') {
      // 长方体
      const geom = new THREE.BoxGeometry(a, c, b);
      const mesh = new THREE.Mesh(geom, matSolid);
      mesh.position.set(0, 0, 0);
      solidGroup.add(mesh);
      // 边
      const edges = new THREE.EdgesGeometry(geom);
      solidGroup.add(new THREE.LineSegments(edges, matEdge));
    } else if (shape === 'cylinder') {
      // 圆柱
      const geom = new THREE.CylinderGeometry(a / 2, a / 2, c, 32);
      const mesh = new THREE.Mesh(geom, matSolid);
      solidGroup.add(mesh);
      const edges = new THREE.EdgesGeometry(geom, 30);
      solidGroup.add(new THREE.LineSegments(edges, matEdge));
    } else if (shape === 'pyramid') {
      // 四棱锥:底面在 XZ 平面,顶点朝上 Y
      const geom = new THREE.ConeGeometry(b * Math.SQRT2 / 2, c, 4);
      // ConeGeometry 默认轴向 Y,半径 b*sqrt(2)/2 让底面对角线长 b
      const mesh = new THREE.Mesh(geom, matSolid);
      mesh.rotation.y = Math.PI / 4;  // 让底面正方形边平行 X/Z
      solidGroup.add(mesh);
      const edges = new THREE.EdgesGeometry(geom);
      solidGroup.add(new THREE.LineSegments(edges, matEdge));
    } else if (shape === 'lshape') {
      // L 形组合体
      // 大长方体
      const big = new THREE.BoxGeometry(a, c * 0.4, b);
      const bigMesh = new THREE.Mesh(big, matSolid);
      bigMesh.position.set(0, -c * 0.3, 0);
      solidGroup.add(bigMesh);
      solidGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(big), matEdge));
      // 小长方体(顶左)
      const sa = a * 0.4, sh = c * 0.6, sb = b * 0.4;
      const small = new THREE.BoxGeometry(sa, sh, sb);
      const smallMesh = new THREE.Mesh(small, matSolid);
      smallMesh.position.set(-a / 2 + sa / 2, c * 0.1, -b / 2 + sb / 2);
      solidGroup.add(smallMesh);
      solidGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(small), matEdge));
    }
    scene3d.add(solidGroup);
  }
  buildSolid();

  // ---------- 2D 视图更新 ----------
  function updateViews() {
    const { a, b, c, shape } = params;
    // 主视图
    const ctxF = panelFront.cv.getContext('2d');
    const rectF = panelFront.cv.getBoundingClientRect();
    panelFront.cv.width = rectF.width * (window.devicePixelRatio || 1);
    panelFront.cv.height = rectF.height * (window.devicePixelRatio || 1);
    const ctxFScaled = panelFront.cv.getContext('2d');
    ctxFScaled.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    if (shape === 'box') drawBox2D(ctxFScaled, rectF.width, rectF.height, a, b, c);
    else if (shape === 'cylinder') drawCylinder2D(ctxFScaled, rectF.width, rectF.height, a, c);
    else if (shape === 'pyramid') drawPyramid2D(ctxFScaled, rectF.width, rectF.height, a, c);
    else if (shape === 'lshape') drawLShape2D(ctxFScaled, rectF.width, rectF.height, a, b, c);

    // 俯视图(主视图下方):形状根据 shape 不同
    const ctxT = panelTop.cv.getContext('2d');
    const rectT = panelTop.cv.getBoundingClientRect();
    panelTop.cv.width = rectT.width * (window.devicePixelRatio || 1);
    panelTop.cv.height = rectT.height * (window.devicePixelRatio || 1);
    const ctxTScaled = panelTop.cv.getContext('2d');
    ctxTScaled.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    if (shape === 'box') {
      // 俯视图:长方形(长 a,宽 b)
      const s = 1.4;
      const cx = rectT.width / 2, cy = rectT.height / 2;
      drawCenterCross(ctxTScaled, rectT.width, rectT.height);
      fillRect(ctxTScaled, cx - a * s / 2, cy - b * s / 2, a * s, b * s);
      strokeRect(ctxTScaled, cx - a * s / 2, cy - b * s / 2, a * s, b * s, '#60a5fa', 2);
      ctxTScaled.fillStyle = '#8a96b0'; ctxTScaled.font = '11px monospace';
      ctxTScaled.fillText(`a=${a.toFixed(0)}`, cx, cy + b * s / 2 + 14);
      ctxTScaled.fillText(`b=${b.toFixed(0)}`, cx - a * s / 2 - 6, cy + 4);
    } else if (shape === 'cylinder') {
      // 俯视图:圆
      const s = 1.4;
      const cx = rectT.width / 2, cy = rectT.height / 2;
      const rr = a * s / 2;
      drawCenterCross(ctxTScaled, rectT.width, rectT.height);
      ctxTScaled.strokeStyle = '#60a5fa';
      ctxTScaled.lineWidth = 2;
      ctxTScaled.beginPath();
      ctxTScaled.arc(cx, cy, rr, 0, Math.PI * 2);
      ctxTScaled.stroke();
      ctxTScaled.fillStyle = 'rgba(96, 165, 250, 0.18)';
      ctxTScaled.fill();
      ctxTScaled.fillStyle = '#8a96b0'; ctxTScaled.font = '11px monospace';
      ctxTScaled.fillText(`r=${a.toFixed(0) / 2}`, cx + rr + 6, cy + 4);
    } else if (shape === 'pyramid') {
      // 俯视图:正方形(底面) + 中心到角点连线
      const s = 1.4;
      const cx = rectT.width / 2, cy = rectT.height / 2;
      const aa = b * s;
      drawCenterCross(ctxTScaled, rectT.width, rectT.height);
      fillRect(ctxTScaled, cx - aa / 2, cy - aa / 2, aa, aa);
      strokeRect(ctxTScaled, cx - aa / 2, cy - aa / 2, aa, aa, '#60a5fa', 2);
      // 顶点投影(中心)
      ctxTScaled.fillStyle = '#facc15';
      ctxTScaled.beginPath();
      ctxTScaled.arc(cx, cy, 3, 0, Math.PI * 2);
      ctxTScaled.fill();
      ctxTScaled.fillStyle = '#8a96b0'; ctxTScaled.font = '11px monospace';
      ctxTScaled.fillText(`a=${b.toFixed(0)}`, cx, cy + aa / 2 + 14);
    } else if (shape === 'lshape') {
      // 俯视图:L 形底面
      const s = 1.4;
      const cx = rectT.width / 2, cy = rectT.height / 2;
      const fa = a * s, fb = b * s;
      drawCenterCross(ctxTScaled, rectT.width, rectT.height);
      ctxTScaled.beginPath();
      ctxTScaled.moveTo(cx - fa / 2, cy + fb / 2);
      ctxTScaled.lineTo(cx - fa / 2, cy - fb / 2 + fb * 0.4);
      ctxTScaled.lineTo(cx - fa / 2 + fa * 0.4, cy - fb / 2 + fb * 0.4);
      ctxTScaled.lineTo(cx - fa / 2 + fa * 0.4, cy - fb / 2);
      ctxTScaled.lineTo(cx + fa / 2, cy - fb / 2);
      ctxTScaled.lineTo(cx + fa / 2, cy + fb / 2);
      ctxTScaled.closePath();
      ctxTScaled.fillStyle = 'rgba(96, 165, 250, 0.18)';
      ctxTScaled.fill();
      ctxTScaled.strokeStyle = '#60a5fa';
      ctxTScaled.lineWidth = 2;
      ctxTScaled.stroke();
    }

    // 左视图(主视图右):形状根据 shape 不同
    const ctxL = panelLeft.cv.getContext('2d');
    const rectL = panelLeft.cv.getBoundingClientRect();
    panelLeft.cv.width = rectL.width * (window.devicePixelRatio || 1);
    panelLeft.cv.height = rectL.height * (window.devicePixelRatio || 1);
    const ctxLScaled = panelLeft.cv.getContext('2d');
    ctxLScaled.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    if (shape === 'box') {
      // 左视图:长方形(宽 b,高 c)
      const s = 1.4;
      const cx = rectL.width / 2, cy = rectL.height / 2;
      drawCenterCross(ctxLScaled, rectL.width, rectL.height);
      fillRect(ctxLScaled, cx - b * s / 2, cy - c * s / 2, b * s, c * s);
      strokeRect(ctxLScaled, cx - b * s / 2, cy - c * s / 2, b * s, c * s, '#facc15', 2);
      ctxLScaled.fillStyle = '#8a96b0'; ctxLScaled.font = '11px monospace';
      ctxLScaled.fillText(`b=${b.toFixed(0)}`, cx, cy + c * s / 2 + 14);
      ctxLScaled.fillText(`c=${c.toFixed(0)}`, cx - b * s / 2 - 6, cy + 4);
    } else if (shape === 'cylinder') {
      // 左视图:与主视图相同(对称)
      const s = 1.4;
      const cx = rectL.width / 2, cy = rectL.height / 2;
      const rh = c * s, rr = a * s;
      const fa = 2 * rr;
      drawCenterCross(ctxLScaled, rectL.width, rectL.height);
      fillRect(ctxLScaled, cx - fa / 2, cy - rh / 2, fa, rh);
      strokeRect(ctxLScaled, cx - fa / 2, cy - rh / 2, fa, rh, '#facc15', 2);
      ctxLScaled.strokeStyle = 'rgba(250, 204, 21, 0.5)';
      ctxLScaled.setLineDash([3, 3]);
      ctxLScaled.beginPath();
      ctxLScaled.moveTo(cx, cy - rh / 2);
      ctxLScaled.lineTo(cx, cy + rh / 2);
      ctxLScaled.stroke();
      ctxLScaled.setLineDash([]);
    } else if (shape === 'pyramid') {
      // 左视图:等腰三角形(与主视相同,因为是 4 棱锥对称)
      const s = 1.4;
      const cx = rectL.width / 2, cy = rectL.height / 2;
      const aa = b * s, hh = c * s;
      drawCenterCross(ctxLScaled, rectL.width, rectL.height);
      ctxLScaled.beginPath();
      ctxLScaled.moveTo(cx, cy - hh / 2);
      ctxLScaled.lineTo(cx - aa / 2, cy + hh / 2);
      ctxLScaled.lineTo(cx + aa / 2, cy + hh / 2);
      ctxLScaled.closePath();
      ctxLScaled.fillStyle = 'rgba(250, 204, 21, 0.18)';
      ctxLScaled.fill();
      ctxLScaled.strokeStyle = '#facc15';
      ctxLScaled.lineWidth = 2;
      ctxLScaled.stroke();
    } else if (shape === 'lshape') {
      // 左视图:大长方(整个宽 b,高 c*0.4) + 上面小长方(宽 0.4b,高 0.6c,左偏)
      const s = 1.4;
      const cx = rectL.width / 2, cy = rectL.height / 2;
      const fb = b * s, fc = c * s;
      drawCenterCross(ctxLScaled, rectL.width, rectL.height);
      // 大长方
      fillRect(ctxLScaled, cx - fb / 2, cy - fc / 2, fb, fc * 0.4);
      strokeRect(ctxLScaled, cx - fb / 2, cy - fc / 2, fb, fc * 0.4, '#facc15', 2);
      // 小长方(左偏,顶部)
      fillRect(ctxLScaled, cx - fb / 2, cy - fc / 2, fb * 0.4, fc * 0.6);
      strokeRect(ctxLScaled, cx - fb / 2, cy - fc / 2, fb * 0.4, fc * 0.6, '#facc15', 2);
      // 底边线
      ctxLScaled.beginPath();
      ctxLScaled.moveTo(cx - fb / 2, cy + fc / 2);
      ctxLScaled.lineTo(cx + fb / 2, cy + fc / 2);
      ctxLScaled.stroke();
    }
  }

  // ---------- 交互 ----------
  const _shapeSel = ctrls.querySelector('[data-shape]');
  const _aInp = ctrls.querySelector('[data-a]');
  const _aV = ctrls.querySelector('[data-a-v]');
  const _bInp = ctrls.querySelector('[data-b]');
  const _bV = ctrls.querySelector('[data-b-v]');
  const _cInp = ctrls.querySelector('[data-c]');
  const _cV = ctrls.querySelector('[data-c-v]');
  const _aLabel = ctrls.querySelector('[data-size-label]');
  const _bLabel = ctrls.querySelector('[data-b-label]');
  const _cLabel = ctrls.querySelector('[data-c-label]');

  function updateLabels() {
    if (params.shape === 'box') {
      _aLabel.textContent = '长 a'; _bLabel.textContent = '宽 b'; _cLabel.textContent = '高 c';
    } else if (params.shape === 'cylinder') {
      _aLabel.textContent = '半径 r'; _bLabel.textContent = '圆柱段数'; _cLabel.textContent = '高 h';
    } else if (params.shape === 'pyramid') {
      _aLabel.textContent = '底边 a'; _bLabel.textContent = '棱锥边 b'; _cLabel.textContent = '高 h';
    } else {
      _aLabel.textContent = '总长 a'; _bLabel.textContent = '总宽 b'; _cLabel.textContent = '总高 c';
    }
  }
  updateLabels();

  _shapeSel.addEventListener('change', (e) => {
    params.shape = e.target.value;
    updateLabels();
    buildSolid();
    updateViews();
  });
  _aInp.addEventListener('input', (e) => {
    params.a = parseFloat(e.target.value);
    _aV.textContent = params.a.toFixed(0);
    buildSolid();
    updateViews();
  });
  _bInp.addEventListener('input', (e) => {
    params.b = parseFloat(e.target.value);
    _bV.textContent = params.b.toFixed(0);
    buildSolid();
    updateViews();
  });
  _cInp.addEventListener('input', (e) => {
    params.c = parseFloat(e.target.value);
    _cV.textContent = params.c.toFixed(0);
    buildSolid();
    updateViews();
  });
  ctrls.querySelector('[data-toggle3d]').addEventListener('click', () => {
    params.show3d = !params.show3d;
    if (solidGroup) solidGroup.visible = params.show3d;
  });
  ctrls.querySelector('[data-togglegrid]').addEventListener('click', () => {
    params.showGrid = !params.showGrid;
    gridXZ.visible = params.showGrid;
    axisHelper.visible = params.showGrid;
  });

  // ---------- 渲染循环 ----------
  function resize() {
    const rect = left.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    updateViews();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(left);

  function tick() {
    controls.update();
    renderer.render(scene3d, camera);
    requestAnimationFrame(tick);
  }
  tick();

  return {
    sceneId: 'three-views-3d',
    getFormula() { return '主视图 V (长×高) + 俯视图 H (长×宽) + 左视图 W (宽×高) · 长对正/高平齐/宽相等'; },
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { shape: params.shape, a: params.a, b: params.b, c: params.c, show3d: params.show3d, showGrid: params.showGrid }; },
    setState(s) {
      if (!s) return;
      if (s.shape) { params.shape = s.shape; _shapeSel.value = s.shape; }
      if (typeof s.a === 'number') { params.a = s.a; _aInp.value = s.a; _aV.textContent = s.a.toFixed(0); }
      if (typeof s.b === 'number') { params.b = s.b; _bInp.value = s.b; _bV.textContent = s.b.toFixed(0); }
      if (typeof s.c === 'number') { params.c = s.c; _cInp.value = s.c; _cV.textContent = s.c.toFixed(0); }
      if (typeof s.show3d === 'boolean') { params.show3d = s.show3d; if (solidGroup) solidGroup.visible = s.show3d; }
      if (typeof s.showGrid === 'boolean') { params.showGrid = s.showGrid; gridXZ.visible = s.showGrid; axisHelper.visible = s.showGrid; }
      updateLabels();
      buildSolid();
      updateViews();
    },
    destroy() {
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (solidGroup) {
        scene3d.remove(solidGroup);
        solidGroup.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
      }
      gridXZ.geometry.dispose(); gridXZ.material.dispose();
      axisHelper.children.forEach(l => { l.geometry.dispose(); l.material.dispose(); });
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
