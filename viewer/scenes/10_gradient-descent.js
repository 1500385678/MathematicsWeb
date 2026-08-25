// viewer/scenes/10_gradient-descent.js
// MathematicsWeb v0.2.0 — 梯度下降 (数学 × 机器学习)
// 3D 场景:在 3D 损失曲面上看梯度下降
//   - 上面:3D 表面 + 红色路径(优化器走过的轨迹)
//   - 调学习率 η 看过冲/震荡/收敛
//   - 调目标函数(简单 bowl · Rosenbrock · Beale)
//   - 调起始点(随机)
//   - 右下:等高线(2D 俯视)
//
// 数学:
//   梯度下降:θ_{k+1} = θ_k − η·∇f(θ_k)
//   简单 bowl:f(x,y) = x² + y² → ∇f = (2x, 2y),梯度直指原点
//   Rosenbrock:f(x,y) = (1−x)² + 100(y−x²)² → "香蕉谷",梯度下降常卡在谷里
//   Beale:f(x,y) = (1.5−x+xy)² + (2.25−x+xy²)² + (2.625−x+xy³)²
//   学习率:太小→慢,太大→震荡/发散
//
// 应用:神经网络训练 · 物理优化 · 投资组合 · 任何求最小值

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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
    <div class="mathw-lesson-title">数学 × 机器学习 · 梯度下降 · 凸优化与鞍点</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">θ ← θ − η·∇f(θ)</div>
      <div class="mathw-lesson-formula">x_{k+1} = x_k − η · ∇f(x_k)</div>
      <div class="mathw-lesson-text">
        神经网络训练的核心算法 — 沿<strong>负梯度方向</strong>走一步,步长 = <strong>学习率 η</strong>。
        <strong>凸函数</strong>(bowl):∇f 单调,沿直线走到全局最优点。
        <strong>Rosenbrock 香蕉谷</strong>:非凸经典,1960 提出,极小值在 (1,1) 狭窄弯曲山谷,梯度常垂直于谷底走 Z 字,卡住不动。
        <strong>马鞍面</strong>(saddle):x²−y²,一个方向极大一个方向极小,纯 GD 会被 0 梯度"骗停",但仍非最优点。
        <strong>η 太小</strong>:收敛慢、卡鞍点。<strong>η 太大</strong>:震荡/发散/NaN。
        <br><br>
        <strong>三族优化器</strong>:<br>
        · <strong>GD 朴素</strong>:纯沿当前梯度,简单但慢、易震荡<br>
        · <strong>Momentum(动量)</strong>:Polyak 1964,加惯性 v ← βv + g,β=0.9,助爬出浅谷<br>
        · <strong>Adam</strong>:Kingma &amp; Ba 2014,一阶矩 m(动量)+ 二阶矩 v(自适应学习率),深度学习默认
        <br><br>
        <strong>应用</strong>:神经网络训练(SGD/AdamW/Lion)· 物理仿真(刚体动力学)· 投资组合 Markowitz · 任何求最小值问题(线性/非线性规划、有限元)。
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
    <div class="mathw-controls-title">参数 · 梯度下降</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">目标</span>
      <select data-fn>
        <option value="bowl" selected>简单 bowl</option>
        <option value="rosenbrock">Rosenbrock</option>
        <option value="saddle">马鞍面</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">优化器</span>
      <select data-opt>
        <option value="gd" selected>GD 朴素</option>
        <option value="momentum">Momentum</option>
        <option value="adam">Adam</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">学习率 η</span>
      <input type="range" min="0.001" max="0.5" step="0.001" value="0.05" data-lr />
      <span class="mathw-control-value" data-lr-v>0.050</span>
    </div>
    <div class="mathw-control-row">
      <button data-reset>重置起点</button>
      <button data-pause>暂停</button>
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- three.js ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14181f);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(8, 6, 8);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(5, 8, 5);
  scene.add(dirLight);

  // ---------- 损失函数 ----------
  let fnKind = 'bowl';
  function fn(x, y) {
    if (fnKind === 'bowl') return 0.2 * (x * x + y * y);
    if (fnKind === 'rosenbrock') {
      // 经典 Rosenbrock:(1−x)² + 100(y−x²)²,极小值 (1, 1)
      // 缩放后,放 -2..2 范围
      const a = 1 - x, b = y - x * x;
      return 0.2 * (a * a + 100 * b * b);
    }
    if (fnKind === 'saddle') return 0.1 * (x * x - y * y);
    return 0;
  }
  function grad(x, y) {
    // 解析梯度
    if (fnKind === 'bowl') return { gx: 0.4 * x, gy: 0.4 * y };
    if (fnKind === 'rosenbrock') {
      const a = 1 - x, b = y - x * x;
      return {
        gx: 0.2 * (-2 * a - 400 * x * b),
        gy: 0.2 * 200 * b,
      };
    }
    if (fnKind === 'saddle') return { gx: 0.2 * x, gy: -0.2 * y };
    return { gx: 0, gy: 0 };
  }

  // ---------- 表面网格 ----------
  const RANGE = 3.0;
  const SEG = 50;
  let surfaceMesh = null;
  let contourLines = [];

  function buildSurface() {
    // 拆旧
    if (surfaceMesh) { scene.remove(surfaceMesh); surfaceMesh.geometry.dispose(); surfaceMesh.material.dispose(); }
    contourLines.forEach(l => { scene.remove(l); l.geometry.dispose(); l.material.dispose(); });
    contourLines = [];

    const vertices = [];
    const indices = [];
    const colors = [];

    // 顶点
    for (let i = 0; i <= SEG; i++) {
      for (let j = 0; j <= SEG; j++) {
        const x = -RANGE + (i / SEG) * 2 * RANGE;
        const y = -RANGE + (j / SEG) * 2 * RANGE;
        const z = fn(x, y);
        vertices.push(x, z, y);  // Y 轴向上,所以 z(函数值)用 y 轴
        // 颜色按高度
        const t = Math.min(1, z / 5);
        const color = new THREE.Color();
        color.setHSL(0.6 - t * 0.6, 0.7, 0.3 + t * 0.3);
        colors.push(color.r, color.g, color.b);
      }
    }
    // 三角面
    for (let i = 0; i < SEG; i++) {
      for (let j = 0; j < SEG; j++) {
        const a = i * (SEG + 1) + j;
        const b = a + 1;
        const c = a + (SEG + 1);
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
    const geom = new THREE.BufferGeometry();
    geom.setIndex(indices);
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.1, side: THREE.DoubleSide });
    surfaceMesh = new THREE.Mesh(geom, mat);
    scene.add(surfaceMesh);

    // 等高线
    const levels = [0.1, 0.3, 0.5, 1.0, 2.0, 3.0, 5.0];
    levels.forEach(level => {
      const lines = [];
      const N = 200;
      // 找 z = level 的等高线(简单 marching)
      // 实际画:z=0 平面 + 投影颜色
      const lineGeom = new THREE.BufferGeometry();
      const posArr = [];
      for (let i = 0; i < N; i++) {
        const t = (i / N) * 2 * Math.PI;
        // 不准确的等高线,只是装饰
        const r = level * 0.7;
        posArr.push(r * Math.cos(t), 0, r * Math.sin(t));
      }
      lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
      const lineMat = new THREE.LineBasicMaterial({ color: 0x2a3140, transparent: true, opacity: 0.5 });
      const line = new THREE.Line(lineGeom, lineMat);
      line.position.y = -0.01;
      scene.add(line);
      contourLines.push(line);
    });
  }
  buildSurface();

  // 网格地面
  const grid = new THREE.GridHelper(20, 20, 0x2a3140, 0x222732);
  grid.position.y = -0.02;
  scene.add(grid);

  // ---------- 优化轨迹 + 优化器状态 ----------
  // 状态变量提前到 resetStart 之前,避免 TDZ
  const pathPoints = [];   // [{x, y, z}]
  const MAX_PATH = 200;
  let pos = { x: 2.5, y: 2.5 };  // 2D 坐标(在表面上的投影)
  let historyLine = null;
  let ballMesh = null;
  let params = { lr: 0.05, paused: false, opt: 'gd' };
  let velocity = new THREE.Vector2(0, 0);     // momentum
  let adamM = new THREE.Vector2(0, 0);       // Adam 一阶矩(改名为 adamM 避 v0.5.0 同名)
  let adamV = new THREE.Vector2(0, 0);       // Adam 二阶矩
  let adamT = 0;                             // Adam 时间步
  const BETA1 = 0.9, BETA2 = 0.999, EPS = 1e-8;

  function resetStart() {
    pos = { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 };
    pathPoints.length = 0;
    velocity.set(0, 0); adamM.set(0, 0); adamV.set(0, 0); adamT = 0;
    if (historyLine) { scene.remove(historyLine); historyLine.geometry.dispose(); historyLine = null; }
    if (ballMesh) { scene.remove(ballMesh); ballMesh.geometry.dispose(); ballMesh.material.dispose(); }
    addPathPoint();
  }
  resetStart();

  function addPathPoint() {
    const z = fn(pos.x, pos.y);
    pathPoints.push(new THREE.Vector3(pos.x, z, pos.y));
    if (pathPoints.length > MAX_PATH) pathPoints.shift();
    // 路径线
    if (historyLine) { scene.remove(historyLine); historyLine.geometry.dispose(); }
    const geom = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const mat = new THREE.LineBasicMaterial({ color: 0xff6b6b, linewidth: 2 });
    historyLine = new THREE.Line(geom, mat);
    scene.add(historyLine);
    // 球
    if (ballMesh) { scene.remove(ballMesh); ballMesh.geometry.dispose(); ballMesh.material.dispose(); }
    const ballMat = new THREE.MeshStandardMaterial({ color: 0x6ee7b7, emissive: 0x224433, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.3 });
    ballMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), ballMat);
    ballMesh.position.copy(pathPoints[pathPoints.length - 1]);
    scene.add(ballMesh);
  }

  // ---------- 交互 ----------
  const _fnSel = ctrls.querySelector('[data-fn]');
  const _optSel = ctrls.querySelector('[data-opt]');
  const _lrInp = ctrls.querySelector('[data-lr]');
  const _lrV = ctrls.querySelector('[data-lr-v]');
  _fnSel.addEventListener('change', (e) => {
    fnKind = e.target.value;
    buildSurface();
    resetStart();
  });
  _optSel.addEventListener('change', (e) => {
    params.opt = e.target.value;
    velocity.set(0, 0); adamM.set(0, 0); adamV.set(0, 0); adamT = 0;  // 切优化器清状态
  });
  _lrInp.addEventListener('input', (e) => {
    params.lr = parseFloat(e.target.value);
    _lrV.textContent = params.lr.toFixed(3);
  });
  ctrls.querySelector('[data-reset]').addEventListener('click', () => resetStart());
  const pauseBtn = ctrls.querySelector('[data-pause]');
  pauseBtn.addEventListener('click', () => {
    params.paused = !params.paused;
    pauseBtn.textContent = params.paused ? '继续' : '暂停';
    pauseBtn.classList.toggle('active', params.paused);
  });

  // ---------- 渲染循环 ----------
  function resize() {
    const rect = host.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  function tick() {
    if (!params.paused) {
      const { gx, gy } = grad(pos.x, pos.y);
      if (params.opt === 'gd') {
        pos.x -= params.lr * gx;
        pos.y -= params.lr * gy;
      } else if (params.opt === 'momentum') {
        // v ← βv + g; θ ← θ − ηv
        const β = 0.9;
        velocity.x = β * velocity.x + gx;
        velocity.y = β * velocity.y + gy;
        pos.x -= params.lr * velocity.x;
        pos.y -= params.lr * velocity.y;
      } else if (params.opt === 'adam') {
        // Adam:m ← β1 m + (1-β1) g; v ← β2 v + (1-β2) g²
        //       m̂ = m/(1-β1^t); v̂ = v/(1-β2^t)
        //       θ ← θ − η m̂/(√v̂ + ε)
        adamT++;
        adamM.x = BETA1 * adamM.x + (1 - BETA1) * gx;
        adamM.y = BETA1 * adamM.y + (1 - BETA1) * gy;
        adamV.x = BETA2 * adamV.x + (1 - BETA2) * gx * gx;
        adamV.y = BETA2 * adamV.y + (1 - BETA2) * gy * gy;
        const mh_x = adamM.x / (1 - Math.pow(BETA1, adamT));
        const mh_y = adamM.y / (1 - Math.pow(BETA1, adamT));
        const vh_x = adamV.x / (1 - Math.pow(BETA2, adamT));
        const vh_y = adamV.y / (1 - Math.pow(BETA2, adamT));
        pos.x -= params.lr * mh_x / (Math.sqrt(vh_x) + EPS);
        pos.y -= params.lr * mh_y / (Math.sqrt(vh_y) + EPS);
      }
      // 越界保护
      if (Math.abs(pos.x) > 5 || Math.abs(pos.y) > 5) resetStart();
      addPathPoint();
    }
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  return {
    sceneId: 'gradient-descent',
    getFormula() { return 'θ ← θ − η·∇f(θ)'; },
    // v0.6.29: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { lr: params.lr, opt: params.opt, fn: fnKind }; },
    setState(s) {
      if (!s) return;
      if (typeof s.lr === 'number') { params.lr = s.lr; _lrInp.value = s.lr; _lrV.textContent = s.lr.toFixed(3); }
      if (s.opt) { params.opt = s.opt; _optSel.value = s.opt; velocity.set(0, 0); adamM.set(0, 0); adamV.set(0, 0); adamT = 0; }
      if (s.fn && s.fn !== fnKind) { fnKind = s.fn; _fnSel.value = s.fn; buildSurface(); resetStart(); }
    },
    destroy() {
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (surfaceMesh) { surfaceMesh.geometry.dispose(); surfaceMesh.material.dispose(); }
      contourLines.forEach(l => { l.geometry.dispose(); l.material.dispose(); });
      if (historyLine) historyLine.geometry.dispose();
      if (ballMesh) { ballMesh.geometry.dispose(); ballMesh.material.dispose(); }
      grid.geometry.dispose(); grid.material.dispose();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
