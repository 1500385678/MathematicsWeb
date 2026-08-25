// viewer/scenes/01_catenary-arch.js
// MathematicsWeb v0.1.0 — 悬链拱顶 (数学 × 建筑)
// 3D 场景:用 three.js 渲染一根悬链线(可调 a),翻转成拱顶
// 交互:拖动 a 改变"瘦高/矮胖",左右拖动相机轨道
//
// 数学:y = a · cosh(x/a) — 倒置后 y' = a · cosh(x/a) - 2a (让最低点 = 0)
// 物理:悬链只受张力(切线方向),反转后只受压力(法线方向)→ 零弯矩拱

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { catenary } from '../../kernel/01_math-core.js';

export function createScene(host, opts = {}) {
  const aiPanel = opts.aiPanel;

  // ---------- DOM ----------
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;inset:0;';
  host.appendChild(wrap);

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;';
  wrap.appendChild(canvas);

  // 教学卡片
  const lesson = document.createElement('div');
  lesson.className = 'mathw-lesson';
  lesson.innerHTML = `
    <button class="mathw-lesson-toggle" data-toggle>−</button>
    <div class="mathw-lesson-title">数学 × 建筑 · 悬链线</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">自然下垂的曲线,倒过来就是拱</div>
      <div class="mathw-lesson-formula">y = a · cosh(x / a)</div>
      <div class="mathw-lesson-text">
        均匀绳子只受重力时,自然形状就是 <strong>悬链线</strong>(catenary)。
        把它<strong>倒过来</strong>就得到悬链拱——石块只受<strong>压力</strong>,不受弯矩。
        古代没有钢筋混凝土,就用这招盖大跨度。
        拖下面的 <strong>a</strong> 看拱变胖变瘦。<br><br>
        著名例子:<strong>高迪 · 圣家族大教堂</strong>,<strong>罗马万神殿</strong>理论模型。
      </div>
    </div>
  `;
  host.appendChild(lesson);
  lesson.querySelector('[data-toggle]').addEventListener('click', () => {
    lesson.classList.toggle('collapsed');
    lesson.querySelector('[data-toggle]').textContent = lesson.classList.contains('collapsed') ? '+' : '−';
  });

  // 控件
  const ctrls = document.createElement('div');
  ctrls.className = 'mathw-controls';
  ctrls.innerHTML = `
    <div class="mathw-controls-title">参数 · 悬链线</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">a (粗细)</span>
      <input type="range" min="0.5" max="3" step="0.1" value="1.5" data-a />
      <span class="mathw-control-value" data-a-v>1.5</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">跨度</span>
      <input type="range" min="2" max="8" step="0.5" value="5" data-span />
      <span class="mathw-control-value" data-span-v>5.0</span>
    </div>
    <div class="mathw-control-row">
      <button data-toggle-flip>翻转(拱 / 垂链)</button>
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- three.js ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14181f);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(5, 3, 7);
  camera.lookAt(0, 1, 0);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.85;
  controls.target.set(0, 1, 0);

  // 光照
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(5, 8, 4);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  dir.shadow.camera.left = -8;
  dir.shadow.camera.right = 8;
  dir.shadow.camera.top = 8;
  dir.shadow.camera.bottom = -8;
  scene.add(dir);

  // 地面
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x1c2230, roughness: 0.9 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  // 网格地面
  const grid = new THREE.GridHelper(20, 20, 0x2a3140, 0x222732);
  scene.add(grid);

  // 悬链线(动态生成)
  const curveMaterial = new THREE.LineBasicMaterial({ color: 0x6ee7b7, linewidth: 2 });
  let curveLine = null;

  // 拱体(用 TubeGeometry 把悬链曲线做成厚实的"链")
  const archMaterial = new THREE.MeshStandardMaterial({
    color: 0x4ea1ff,
    roughness: 0.4,
    metalness: 0.1,
  });
  let archMesh = null;

  // 支撑(两端的"墙")
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x8a93a6, roughness: 0.6 });
  const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.5, 0.4), wallMat);
  const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.5, 0.4), wallMat);
  scene.add(wallL, wallR);

  let params = { a: 1.5, span: 5, flipped: true };

  function buildCatenaryCurve() {
    const a = params.a, span = params.span;
    const points = [];
    const yMin = a * Math.cosh(0); // 最低点 y = a (cosh(0) = 1)
    for (let i = 0; i <= 200; i++) {
      const x = -span + (i / 200) * (span * 2);
      const y = a * Math.cosh(x / a); // 悬链原始
      // 翻转 / 拱:让最低点贴地
      const finalY = params.flipped ? (y - yMin) : -y + yMin;
      points.push(new THREE.Vector3(x, finalY, 0));
    }
    return new THREE.CatmullRomCurve3(points);
  }

  function rebuild() {
    const curve = buildCatenaryCurve();

    // 拆旧
    if (curveLine) { scene.remove(curveLine); curveLine.geometry.dispose(); curveLine = null; }
    if (archMesh) { scene.remove(archMesh); archMesh.geometry.dispose(); archMesh = null; }

    // 描点
    const pts = curve.getPoints(200);
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    curveLine = new THREE.Line(geom, curveMaterial);
    scene.add(curveLine);

    // 拱体
    const tubeGeom = new THREE.TubeGeometry(curve, 120, 0.12, 16, false);
    archMesh = new THREE.Mesh(tubeGeom, archMaterial);
    archMesh.castShadow = true;
    archMesh.receiveShadow = true;
    scene.add(archMesh);

    // 支撑位置
    const h = a_h();
    wallL.position.set(-params.span, h / 2, 0);
    wallR.position.set(params.span, h / 2, 0);
  }
  function a_h() {
    const a = params.a;
    return params.flipped ? 0 : (2 * a); // 翻转后贴地,不翻转顶高
  }

  rebuild();

  // ---------- 交互 ----------
  const aInput = ctrls.querySelector('[data-a]');
  const aVal = ctrls.querySelector('[data-a-v]');
  aInput.addEventListener('input', (e) => {
    params.a = parseFloat(e.target.value);
    aVal.textContent = params.a.toFixed(1);
    rebuild();
  });
  const sInput = ctrls.querySelector('[data-span]');
  const sVal = ctrls.querySelector('[data-span-v]');
  sInput.addEventListener('input', (e) => {
    params.span = parseFloat(e.target.value);
    sVal.textContent = params.span.toFixed(1);
    rebuild();
  });
  ctrls.querySelector('[data-toggle-flip]').addEventListener('click', (e) => {
    params.flipped = !params.flipped;
    e.target.textContent = params.flipped ? '翻转(拱 / 垂链)' : '翻转(当前:垂链)';
    e.target.classList.toggle('active', !params.flipped);
    rebuild();
  });

  // ---------- 渲染循环 ----------
  let rafId = null;
  function resize() {
    const rect = host.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  function tick() {
    controls.update();
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  }
  tick();

  // ---------- 清理 ----------
  return {
    sceneId: 'catenary-arch',
    getFormula() { return 'y = a · cosh(x / a)'; },
    // v0.6.17: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { a: params.a, span: params.span, flipped: params.flipped }; },
    setState(s) {
      if (!s) return;
      if (typeof s.a === 'number') { params.a = s.a; aInput.value = s.a; aVal.textContent = s.a.toFixed(1); }
      if (typeof s.span === 'number') { params.span = s.span; sInput.value = s.span; sVal.textContent = s.span.toFixed(1); }
      if (typeof s.flipped === 'boolean') {
        params.flipped = s.flipped;
        const btn = ctrls.querySelector('[data-toggle-flip]');
        btn.textContent = params.flipped ? '翻转(拱 / 垂链)' : '翻转(当前:垂链)';
        btn.classList.toggle('active', !params.flipped);
      }
      rebuild();
    },
    destroy() {
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      controls.dispose();
      renderer.dispose();
      if (curveLine) curveLine.geometry.dispose();
      if (archMesh) archMesh.geometry.dispose();
      curveMaterial.dispose();
      archMaterial.dispose();
      wallMat.dispose();
      ground.geometry.dispose();
      ground.material.dispose();
      grid.geometry.dispose();
      grid.material.dispose();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
