// viewer/scenes/02_planetary-orbits.js
// MathematicsWeb v0.6.3 — 太阳系版行星轨道(数学 × 物理)
// 3D 场景:完整的 9 大行星 + 月球绕地球 + 土星环
//   - Sun 中心固定
//   - 9 行星:水/金/地/火/木/土/天王/海王/冥王(真实名称 + 真实相对位置压缩)
//   - 月球绕地球(地球的"次级中心")
//   - 每颗都有 Sprite 中文名标签 + 椭圆参考虚线 + 轨迹拖尾
//   - 调时间倍率看外圈跑得慢(开普勒第三定律)
//
// 数据(可视化压缩,真实相对位置 log 压缩,v0.6.3 调小调慢调大):
//   水星  a=3.0  T=1.2   e=0.21  size=0.18
//   金星  a=4.0  T=2.1   e=0.01  size=0.32
//   地球  a=5.4  T=3.0   e=0.02  size=0.36 + 月球 (a=1.0, T=0.12)
//   火星  a=7.0  T=4.5   e=0.09  size=0.22
//   木星  a=11   T=15    e=0.05  size=0.95
//   土星  a=15   T=30    e=0.06  size=0.85 + 星环
//   天王  a=19   T=60    e=0.05  size=0.60
//   海王  a=22   T=90    e=0.01  size=0.55
//   冥王  a=25   T=120   e=0.25  size=0.14

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
    <div class="mathw-lesson-title">数学 × 物理 · 太阳系 · v0.6.3</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">9 大行星 + 月球绕地球</div>
      <div class="mathw-lesson-formula">T² ∝ a³   (开普勒第三定律)</div>
      <div class="mathw-lesson-text">
        完整太阳系:水/金/地/火/木/土/天王/海王/冥王 + 月球。<br>
        a 用 log 压缩(冥王实际 40 AU,木星 5.2,差 8 倍,画不下),T 按 a^1.5 算。<br>
        椭圆用真公式 r = a(1-e²)/(1+e·cosθ),焦点在太阳。<br>
        <strong>月球</strong>绕地球(地球是月球轨道的"中心")。<br>
        调时间倍率,外圈行星明显<strong>慢</strong>(开普勒第三定律直观体验)。<br>
        <span style="color:#6ee7b7">v0.6.3 调档</span>:球小一半 · 轨道翻倍 · 周期 ×3,跑得更慢更稳。
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
      <input type="range" min="0.1" max="5" step="0.1" value="0.5" data-speed />
      <span class="mathw-control-value" data-speed-v>0.5×</span>
    </div>
    <div class="mathw-control-row">
      <button data-reset>重置</button>
      <button data-pause>暂停</button>
    </div>
    <div class="mathw-control-row">
      <button data-focus="earth">聚焦地球+月球</button>
      <button data-focus="pluto">聚焦冥王</button>
    </div>
  `;
  host.appendChild(ctrls);

  // ---------- three.js ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05080f);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
  camera.position.set(0, 40, 65);   // 拉远看整个太阳系
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 0, 0);
  controls.maxDistance = 150;  // 允许拉到很远看冥王

  // 灯光
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const sunLight = new THREE.PointLight(0xfff5d0, 2.0, 0, 2);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  // ---------- 9 大行星数据 ----------
  // 行星大小:基于真实半径(Mercury=0.38, Venus=0.95, Earth=1.00, Mars=0.53, Jupiter=11, Saturn=9.4, Uranus=4, Neptune=3.9, Pluto=0.18)
  // 压缩(比 v0.6.2 缩小 ~50%):Mars 0.22, Mercury 0.18, Venus 0.32, Earth 0.36, Jupiter 0.95, Saturn 0.85, Uranus 0.6, Neptune 0.55, Pluto 0.14
  // 颜色:真实颜色近似
  const SOLAR_SYSTEM = [
    { name: '水星',  en: 'Mercury', a: 3.0,  e: 0.21, T: 1.2,  size: 0.18, color: 0xa89580 },
    { name: '金星',  en: 'Venus',   a: 4.0,  e: 0.01, T: 2.1,  size: 0.32, color: 0xe8c47a },
    { name: '地球',  en: 'Earth',   a: 5.4,  e: 0.02, T: 3.0,  size: 0.36, color: 0x4ea1ff, hasMoon: true },
    { name: '火星',  en: 'Mars',    a: 7.0,  e: 0.09, T: 4.5,  size: 0.22, color: 0xc1502e },
    { name: '木星',  en: 'Jupiter', a: 11.0, e: 0.05, T: 15,   size: 0.95, color: 0xc4a484 },
    { name: '土星',  en: 'Saturn',  a: 15.0, e: 0.06, T: 30,   size: 0.85, color: 0xe5c39e, hasRings: true },
    { name: '天王星', en: 'Uranus',  a: 19.0, e: 0.05, T: 60,   size: 0.60, color: 0x9fd9e8 },
    { name: '海王星', en: 'Neptune', a: 22.0, e: 0.01, T: 90,   size: 0.55, color: 0x3d6cd6 },
    { name: '冥王星', en: 'Pluto',   a: 25.0, e: 0.25, T: 120,  size: 0.14, color: 0xc9b8a3 },
  ];
  // 月球(相对地球):a=1.0,T=0.12
  const MOON = { name: '月球', en: 'Moon', a: 1.0, e: 0.05, T: 0.12, size: 0.10, color: 0xdddddd };

  // ---------- 星空背景 ----------
  const starCount = 1000;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 200;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i * 3 + 2] = r * Math.cos(phi);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, transparent: true, opacity: 0.7 });
  scene.add(new THREE.Points(starGeo, starMat));

  // ---------- 太阳(大一点,显眼) ----------
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff5d0 });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 32), sunMat);
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
  glow.scale.set(6, 6, 1);
  scene.add(glow);

  // 工具:画文字 label(Sprite)
  function makeLabel(name, color, scale = 1.4) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const ctx = c.getContext('2d');
    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    const radius = 12;
    ctx.beginPath();
    ctx.roundRect(0, 0, 256, 64, radius);
    ctx.fill();
    // 文字
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 128, 32);
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(scale, 0.35, 1);
    return sp;
  }

  // ---------- 创建行星 ----------
  const bodies = [];
  for (const p of SOLAR_SYSTEM) {
    const mat = new THREE.MeshStandardMaterial({
      color: p.color,
      roughness: 0.5,
      metalness: 0.2,
      emissive: p.color,
      emissiveIntensity: 0.15,  // 提高一点,暗背景下看得见
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.size, 32, 32), mat);
    scene.add(mesh);

    // 轨迹
    const tmat = new THREE.LineBasicMaterial({ color: p.color, transparent: true, opacity: 0.6 });
    const tgeom = new THREE.BufferGeometry();
    const tline = new THREE.Line(tgeom, tmat);
    scene.add(tline);

    // 参考椭圆(空 geom,等后面 fill 再 computeLineDistances)
    const emat = new THREE.LineDashedMaterial({ color: p.color, dashSize: 0.3, gapSize: 0.2, transparent: true, opacity: 0.35 });
    const egeom = new THREE.BufferGeometry();
    const eline = new THREE.Line(egeom, emat);
    scene.add(eline);

    // 名字(背景半透明黑底,行星颜色字)
    const label = makeLabel(p.name, p.color, p.size > 0.6 ? 1.5 : 1.0);
    scene.add(label);

    // 土星环
    let rings = null;
    if (p.hasRings) {
      const ringGeo = new THREE.RingGeometry(p.size * 1.4, p.size * 2.0, 64);
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
      moon: null,
      angle: Math.random() * Math.PI * 2,
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
      emissive: 0x666666,
      emissiveIntensity: 0.2,
    });
    const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(MOON.size, 20, 20), moonMat);
    scene.add(moonMesh);

    // 月球轨道
    const moonTrailMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.7 });
    const moonTrailGeom = new THREE.BufferGeometry();
    const moonTrailLine = new THREE.Line(moonTrailGeom, moonTrailMat);
    scene.add(moonTrailLine);

    const moonLabel = makeLabel(MOON.name, MOON.color, 0.6);
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
  let params = { speed: 0.5, paused: false };
  let simT = 0;
  const MAX_TRAIL = 600;

  function reset() {
    simT = 0;
    for (const b of bodies) {
      b.angle = Math.random() * Math.PI * 2;
      b.trail.points = [];
    }
    if (moon) { moon.angle = 0; moon.trail.points = []; }
  }

  // ---------- 物理 ----------
  function orbitPos(a, e, theta) {
    // 真近点角版本:r = a(1-e²)/(1+e·cosθ)
    const r = a * (1 - e * e) / (1 + e * Math.cos(theta));
    return new THREE.Vector3(r * Math.cos(theta), 0, r * Math.sin(theta));
  }

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
    const pts = makeEllipsePoints(b.data.a, b.data.e);
    b.ellipse.geom.dispose();
    b.ellipse.geom = new THREE.BufferGeometry().setFromPoints(pts);
    b.ellipse.line.geometry = b.ellipse.geom;
    b.ellipse.line.computeLineDistances();
  }

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
  ctrls.querySelector('[data-focus="earth"]').addEventListener('click', () => {
    if (earthBody) {
      const p = earthBody.mesh.position;
      controls.target.set(p.x, p.y, p.z);
      camera.position.set(p.x + 4, p.y + 2, p.z + 4);
    }
  });
  ctrls.querySelector('[data-focus="pluto"]').addEventListener('click', () => {
    const pluto = bodies.find(b => b.data.en === 'Pluto');
    if (pluto) {
      const p = pluto.mesh.position;
      controls.target.set(p.x, p.y, p.z);
      camera.position.set(p.x + 6, p.y + 3, p.z + 6);
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

    for (const b of bodies) {
      if (!params.paused) {
        const omega = (2 * Math.PI) / b.data.T;
        b.angle = (b.angle + omega * dt) % (2 * Math.PI);
      }
      const pos = orbitPos(b.data.a, b.data.e, b.angle);
      b.mesh.position.copy(pos);
      // label 跟着,贴在行星上方
      b.label.position.set(pos.x, pos.y + b.data.size + 0.3, pos.z);

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

    // 月球(绑地球)
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
      moon.label.position.set(moonPos.x, moonPos.y + moon.data.size + 0.25, moonPos.z);
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
    // v0.6.26: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
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
