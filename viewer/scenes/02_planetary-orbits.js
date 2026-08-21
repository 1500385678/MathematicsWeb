// viewer/scenes/02_planetary-orbits.js
// MathematicsWeb v0.6.2 — 太阳系版行星轨道 (数学 × 物理)
// 3D 场景:真实的太阳系布局(Sun + 6 行星 + 月球绕地球)
//   - 太阳在中心固定
//   - 6 行星各自椭圆轨道(用开普勒 T² ∝ a³ 关系)
//   - 月球绕地球(地球是月球轨道的"中心")
//   - 实时画轨迹 + 当前点 + 名字
//   - 时间倍率可调,暂停/重置
//
// 物理:简化开普勒(每个轨道用半长轴 a + 偏心率 e + 初始相位 θ₀ 描述)
//   位置 x = a·cos(θ) − a·e, y = a·√(1−e²)·sin(θ)
//   速度由开普勒第二定律决定(角速度 = 2π/T,t 越大角速度越小)
//   月球用相对坐标:earthPos + moonOrbit
//
// 实际数据(简化用于可视化):
//   Sun 中心固定
//   Mercury a=1.5  T=1.0   e=0.21
//   Venus   a=2.0  T=1.9   e=0.01
//   Earth   a=2.7  T=3.0   e=0.02  + Moon (a=0.3, T=0.08)
//   Mars    a=3.5  T=4.8   e=0.09
//   Jupiter a=5.5  T=14    e=0.05
//   Saturn  a=7.5  T=25    e=0.06

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
    <div class="mathw-lesson-title">数学 × 物理 · 太阳系 · v0.6.2</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">Sun + 6 行星 + 月球绕地球</div>
      <div class="mathw-lesson-formula">T² ∝ a³   (开普勒第三定律)</div>
      <div class="mathw-lesson-text">
        真实的太阳系:水/金/地/火/木/土 + 月球绕地球。<br>
        每颗行星按真实比例的<strong>压缩</strong> a 排列(否则水星看不见),T 用 a^1.5 算出。<br>
        椭圆用 a + e 描述,角度按 T 实时推进。<br>
        调时间倍率(0.1x-5x)看<strong>外圈行星跑得慢</strong>的视觉效果(开普勒第三定律)。
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
    <div class="mathw-controls-title">参数 · 太阳系</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">时间倍率</span>
      <input type="range" min="0.1" max="5" step="0.1" value="1" data-speed />
      <span class="mathw-control-value" data-speed-v>1.0×</span>
    </div>
    <div class="mathw-control-row">
      <button data-reset>重置</button>
      <button data-pause>暂停</button>
    </div>
    <div class="mathw-control-row">
      <button data-focus="earth">聚焦地球</button>
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- three.js ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05080f);   // 更深的太空黑

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
  camera.position.set(0, 12, 22);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 0, 0);

  // 灯光
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));
  const sunLight = new THREE.PointLight(0xfff5d0, 2.0, 0, 2);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  // ---------- 太阳系数据 ----------
  // 每个天体: name(中文+英文), a(半长轴), e(偏心率), T(周期,相对单位), size(可视化半径), color, hasMoon
  // 真实数据:水 0.39/88d,金 0.72/225d,地 1.00/365d,火 1.52/687d,木 5.20/4333d,土 9.58/10759d
  // 压缩:Mercury a=1.5(真实 0.39,但太小看不到),Earth a=2.7(基准),Saturn a=7.5(否则画不下)
  const SOLAR_SYSTEM = [
    { name: '水星',  en: 'Mercury', a: 1.5, e: 0.21, T: 1.0,  size: 0.10, color: 0x8c7853 },
    { name: '金星',  en: 'Venus',   a: 2.0, e: 0.01, T: 1.9,  size: 0.18, color: 0xe8b563 },
    { name: '地球',  en: 'Earth',   a: 2.7, e: 0.02, T: 3.0,  size: 0.20, color: 0x4ea1ff, hasMoon: true },
    { name: '火星',  en: 'Mars',    a: 3.5, e: 0.09, T: 4.8,  size: 0.14, color: 0xc1502e },
    { name: '木星',  en: 'Jupiter', a: 5.5, e: 0.05, T: 14,   size: 0.45, color: 0xc4a484 },
    { name: '土星',  en: 'Saturn',  a: 7.5, e: 0.06, T: 25,   size: 0.40, color: 0xe5c39e, hasRings: true },
  ];
  const MOON = { name: '月球', en: 'Moon', a: 0.4, e: 0.05, T: 0.10, size: 0.06, color: 0xcccccc };
  // 月球相对地球的 a(地球是基准 2.7 时,月球距地球 0.4 让它清晰可见)
  // 月球周期 0.10 → 大约 27 天 vs 地球 365 天

  // 星空背景(星空点)
  const starCount = 800;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 150;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i * 3 + 2] = r * Math.cos(phi);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3, transparent: true, opacity: 0.7 });
  scene.add(new THREE.Points(starGeo, starMat));

  // ---------- 太阳 ----------
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff5d0 });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 32), sunMat);
  scene.add(sun);
  // 太阳光晕
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 128; glowCanvas.height = 128;
  const gctx = glowCanvas.getContext('2d');
  const grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 230, 150, 0.8)');
  grad.addColorStop(0.3, 'rgba(255, 200, 100, 0.4)');
  grad.addColorStop(1, 'rgba(255, 200, 100, 0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 128, 128);
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, transparent: true });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(3.5, 3.5, 1);
  scene.add(glow);

  // ---------- 行星 + 轨道 ----------
  // 每个行星:net(本体), trail(轨迹), ellipseRef(参考椭圆), label(名字)
  const bodies = [];
  for (const p of SOLAR_SYSTEM) {
    // 球
    const mat = new THREE.MeshStandardMaterial({
      color: p.color,
      roughness: 0.5,
      metalness: 0.2,
      emissive: p.color,
      emissiveIntensity: 0.05,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.size, 24, 24), mat);
    scene.add(mesh);

    // 轨迹
    const tmat = new THREE.LineBasicMaterial({ color: p.color, transparent: true, opacity: 0.5 });
    const tgeom = new THREE.BufferGeometry();
    const tline = new THREE.Line(tgeom, tmat);
    scene.add(tline);

    // 参考椭圆(虚线)
    const emat = new THREE.LineDashedMaterial({ color: p.color, dashSize: 0.3, gapSize: 0.2, transparent: true, opacity: 0.3 });
    const egeom = new THREE.BufferGeometry();
    const eline = new THREE.Line(egeom, emat);
    eline.computeLineDistances();
    scene.add(eline);

    // 名字标签(Sprite)
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256; labelCanvas.height = 64;
    const lctx = labelCanvas.getContext('2d');
    lctx.fillStyle = 'rgba(0,0,0,0.6)';
    lctx.fillRect(0, 0, 256, 64);
    lctx.font = 'bold 32px sans-serif';
    lctx.fillStyle = '#' + p.color.toString(16).padStart(6, '0');
    lctx.textAlign = 'center';
    lctx.textBaseline = 'middle';
    lctx.fillText(p.name, 128, 32);
    const labelTex = new THREE.CanvasTexture(labelCanvas);
    const labelMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true });
    const label = new THREE.Sprite(labelMat);
    label.scale.set(1.4, 0.35, 1);
    scene.add(label);

    // 土星环
    let rings = null;
    if (p.hasRings) {
      const ringGeo = new THREE.RingGeometry(p.size * 1.3, p.size * 1.9, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xc9a87c, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
      rings = new THREE.Mesh(ringGeo, ringMat);
      rings.rotation.x = Math.PI / 2 - 0.3;
      mesh.add(rings);
    }

    bodies.push({
      data: p,
      mesh, trail: { line: tline, geom: tgeom, mat: tmat, points: [] },
      ellipse: { line: eline, geom: egeom, mat: emat },
      label,
      rings,
      moon: null,    // 后面填(地球有)
      angle: Math.random() * Math.PI * 2,  // 随机起始相位
    });
  }

  // ---------- 月球(绑在地球上) ----------
  const earthBody = bodies.find(b => b.data.hasMoon);
  let moon = null;
  if (earthBody) {
    const moonMat = new THREE.MeshStandardMaterial({
      color: MOON.color,
      roughness: 0.6,
      metalness: 0.1,
      emissive: 0x444444,
      emissiveIntensity: 0.05,
    });
    const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(MOON.size, 16, 16), moonMat);
    scene.add(moonMesh);

    // 月球轨道(相对地球)
    const moonTrailMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.6 });
    const moonTrailGeom = new THREE.BufferGeometry();
    const moonTrailLine = new THREE.Line(moonTrailGeom, moonTrailMat);
    scene.add(moonTrailLine);

    // 月球名字
    const moonLabelCanvas = document.createElement('canvas');
    moonLabelCanvas.width = 128; moonLabelCanvas.height = 32;
    const mlctx = moonLabelCanvas.getContext('2d');
    mlctx.fillStyle = 'rgba(0,0,0,0.6)';
    mlctx.fillRect(0, 0, 128, 32);
    mlctx.font = 'bold 16px sans-serif';
    mlctx.fillStyle = '#cccccc';
    mlctx.textAlign = 'center';
    mlctx.textBaseline = 'middle';
    mlctx.fillText('月球', 64, 16);
    const moonLabelTex = new THREE.CanvasTexture(moonLabelCanvas);
    const moonLabelMat = new THREE.SpriteMaterial({ map: moonLabelTex, transparent: true });
    const moonLabel = new THREE.Sprite(moonLabelMat);
    moonLabel.scale.set(0.7, 0.18, 1);
    scene.add(moonLabel);

    moon = {
      data: MOON,
      mesh: moonMesh,
      trail: { line: moonTrailLine, geom: moonTrailGeom, mat: moonTrailMat, points: [] },
      label: moonLabel,
      angle: 0,
    };
    earthBody.moon = moon;
  }

  // ---------- 状态 ----------
  let params = { speed: 1.0, paused: false };
  let simT = 0;
  const MAX_TRAIL = 500;

  function reset() {
    simT = 0;
    for (const b of bodies) {
      b.angle = Math.random() * Math.PI * 2;
      b.trail.points = [];
    }
    if (moon) { moon.angle = 0; moon.trail.points = []; }
  }

  // ---------- 物理 ----------
  // 给定 a, e, θ(真近点角),位置
  function orbitPos(a, e, theta) {
    // 椭圆极坐标:r = a(1-e²)/(1+e·cosθ)
    // 简化:用 a(1-e·cosθ) ... 不,标准是 r = a(1-e²)/(1+e·cosθ)
    const r = a * (1 - e * e) / (1 + e * Math.cos(theta));
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    return new THREE.Vector3(x, 0, z);
  }

  // 给定 a, e 画参考椭圆(200 点)
  function makeEllipsePoints(a, e) {
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const t = (i / 200) * 2 * Math.PI;
      pts.push(orbitPos(a, e, t));
    }
    return pts;
  }

  // 初始化参考椭圆
  for (const b of bodies) {
    const ref = b.ellipse;
    const pts = makeEllipsePoints(b.data.a, b.data.e);
    ref.geom.dispose();
    ref.geom = new THREE.BufferGeometry().setFromPoints(pts);
    ref.line.geometry = ref.geom;
    ref.line.computeLineDistances();
  }
  // 月球参考轨道(在 earthBody 的 mesh 里,跟着地球走)
  // 但参考轨道是相对地球的,我们在 tick 里重新算

  // ---------- 交互 ----------
  const sInput = ctrls.querySelector('[data-speed]');
  const sVal = ctrls.querySelector('[data-speed-v]');
  sInput.addEventListener('input', (e) => {
    params.speed = parseFloat(e.target.value);
    sVal.textContent = params.speed.toFixed(1) + '×';
  });
  ctrls.querySelector('[data-reset]').addEventListener('click', () => reset());
  const pauseBtn = ctrls.querySelector('[data-pause]');
  pauseBtn.addEventListener('click', () => {
    params.paused = !params.paused;
    pauseBtn.textContent = params.paused ? '继续' : '暂停';
    pauseBtn.classList.toggle('active', params.paused);
  });
  ctrls.querySelector('[data-focus]').addEventListener('click', () => {
    // 聚焦地球
    if (earthBody) {
      const p = earthBody.mesh.position;
      controls.target.set(p.x, p.y, p.z);
      camera.position.set(p.x + 3, p.y + 2, p.z + 3);
    }
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

  let lastTs = 0;
  function tick(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000) * params.speed;
    lastTs = ts;
    if (!params.paused) simT += dt;

    // 更新每个行星
    for (const b of bodies) {
      if (!params.paused) {
        // 按开普勒第三定律:T 越大角速度越小
        const omega = (2 * Math.PI) / b.data.T;
        b.angle = (b.angle + omega * dt) % (2 * Math.PI);
      }
      const pos = orbitPos(b.data.a, b.data.e, b.angle);
      b.mesh.position.copy(pos);
      b.label.position.set(pos.x, pos.y + b.data.size + 0.3, pos.z);

      // 轨迹
      if (!params.paused) b.trail.points.push(pos.clone());
      if (b.trail.points.length > MAX_TRAIL) b.trail.points.shift();
      if (b.trail.points.length > 1) {
        const positions = new Float32Array(b.trail.points.length * 3);
        for (let j = 0; j < b.trail.points.length; j++) {
          positions[j * 3] = b.trail.points[j].x;
          positions[j * 3 + 1] = 0;
          positions[j * 3 + 2] = b.trail.points[j].z;
        }
        b.trail.geom.dispose();
        b.trail.geom = new THREE.BufferGeometry();
        b.trail.geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        b.trail.line.geometry = b.trail.geom;
      }
    }

    // 更新月球(绑在地球上)
    if (moon && earthBody) {
      if (!params.paused) {
        const moonOmega = (2 * Math.PI) / moon.data.T;
        moon.angle = (moon.angle + moonOmega * dt) % (2 * Math.PI);
      }
      const earthPos = earthBody.mesh.position;
      const moonOrbit = orbitPos(moon.data.a, moon.data.e, moon.angle);
      const moonPos = new THREE.Vector3(
        earthPos.x + moonOrbit.x,
        0,
        earthPos.z + moonOrbit.z
      );
      moon.mesh.position.copy(moonPos);
      moon.label.position.set(moonPos.x, moonPos.y + moon.data.size + 0.2, moonPos.z);
      // 月球轨迹(相对地球,跟着地球动)
      if (!params.paused) moon.trail.points.push(moonPos.clone());
      if (moon.trail.points.length > 200) moon.trail.points.shift();
      if (moon.trail.points.length > 1) {
        const positions = new Float32Array(moon.trail.points.length * 3);
        for (let j = 0; j < moon.trail.points.length; j++) {
          positions[j * 3] = moon.trail.points[j].x;
          positions[j * 3 + 1] = 0;
          positions[j * 3 + 2] = moon.trail.points[j].z;
        }
        moon.trail.geom.dispose();
        moon.trail.geom = new THREE.BufferGeometry();
        moon.trail.geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        moon.trail.line.geometry = moon.trail.geom;
      }
    }

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  return {
    sceneId: 'planetary-orbits',
    getFormula() { return 'T² ∝ a³   (开普勒)'; },
    getState() { return { speed: params.speed, paused: params.paused }; },
    setState(s) {
      if (!s) return;
      if (typeof s.speed === 'number') { params.speed = s.speed; sInput.value = s.speed; sVal.textContent = s.speed.toFixed(1) + '×'; }
      if (typeof s.paused === 'boolean') { params.paused = s.paused; pauseBtn.textContent = s.paused ? '继续' : '暂停'; pauseBtn.classList.toggle('active', s.paused); }
    },
    destroy() {
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      sunMat.dispose(); sun.geometry.dispose();
      glowMat.dispose(); glowTex.dispose();
      starGeo.dispose(); starMat.dispose();
      for (const b of bodies) {
        b.mesh.material.dispose(); b.mesh.geometry.dispose();
        b.trail.geom.dispose(); b.trail.mat.dispose();
        b.ellipse.geom.dispose(); b.ellipse.mat.dispose();
        b.label.material.map.dispose(); b.label.material.dispose();
      }
      if (moon) {
        moon.mesh.material.dispose(); moon.mesh.geometry.dispose();
        moon.trail.geom.dispose(); moon.trail.mat.dispose();
        moon.label.material.map.dispose(); moon.label.material.dispose();
      }
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
