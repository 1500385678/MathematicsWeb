// viewer/scenes/02_planetary-orbits.js
// MathematicsWeb v0.2.0 — 行星轨道 (数学 × 物理)· 多星体版
// 3D 场景:4 颗不同 e 的行星绕太阳(默认 1 颗 + 3 颗可加)
//   - 太阳固定在椭圆焦点
//   - 用 Velocity Verlet 数值积分
//   - 每颗行星独立的偏心率 e、半长轴 a
//   - 调开普勒第三定律:T² ∝ a³ → a 越大 T 越长
//   - 时间倍率可加速,暂停/重置
//   - 显示每颗行星的当前速度大小(近日点快 / 远日点慢)
//
// 数学:开普勒三定律
//   第一:椭圆轨道,太阳在焦点
//   第二:扫面积速度恒定(角动量守恒)
//   第三:T² ∝ a³(开普勒常量,所有行星共享)
// 物理:F = G·M·m/r²(反平方引力)
//
// 数值:Velocity Verlet — 能量守恒比欧拉好得多

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
    <div class="mathw-lesson-title">数学 × 物理 · 开普勒轨道 · 多星体</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">4 颗行星,4 种椭圆,同一颗太阳</div>
      <div class="mathw-lesson-formula">F = G·M·m/r²   T² ∝ a³</div>
      <div class="mathw-lesson-text">
        <strong>开普勒第一定律</strong>:每颗行星轨道都是椭圆,太阳在焦点。
        <strong>第二定律</strong>:扫面积速度恒定 — 离太阳近时跑得快,远时跑得慢。
        <strong>第三定律</strong>:T² 与 a³ 成正比 — 离太阳越远,周期越长(<strong>越远越慢</strong>)。
        调<strong>时间倍率</strong>看大椭圆(高 a)走得明显慢。
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
    <div class="mathw-controls-title">参数 · 行星系统</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">时间倍率</span>
      <input type="range" min="0.1" max="3" step="0.1" value="1" data-speed />
      <span class="mathw-control-value" data-speed-v>1.0×</span>
    </div>
    <div class="mathw-control-row">
      <button data-reset>重置</button>
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
  camera.position.set(0, 18, 26);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  // 灯光
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const sunLight = new THREE.PointLight(0xfff5d0, 2, 0, 2);
  scene.add(sunLight);

  // 太阳
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff5d0 });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), sunMat);
  scene.add(sun);

  // 太阳光晕
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 128; glowCanvas.height = 128;
  const gctx = glowCanvas.getContext('2d');
  const grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 230, 150, 0.8)');
  grad.addColorStop(0.4, 'rgba(255, 200, 100, 0.3)');
  grad.addColorStop(1, 'rgba(255, 200, 100, 0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 128, 128);
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, transparent: true });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(3, 3, 1);
  scene.add(glow);

  // 网格地面
  const grid = new THREE.GridHelper(40, 40, 0x2a3140, 0x222732);
  grid.position.y = -3;
  scene.add(grid);

  // ---------- 行星系统 ----------
  // 4 颗:水星式(小 a, 中 e) · 地球式(中 a, 小 e) · 木星式(大 a, 很小 e) · 彗星(中 a, 极大 e)
  const GM = 60;     // 引力常数 × 太阳质量(数值实验用,调出来轨道好看)
  const planets = [
    { name: '小 a · 中 e',  a: 4,  e: 0.40, color: 0x6ee7b7, size: 0.18, speedHint: '快' },
    { name: '中 a · 小 e',  a: 7,  e: 0.10, color: 0x4ea1ff, size: 0.25, speedHint: '中' },
    { name: '大 a · 圆',    a: 11, e: 0.05, color: 0xf0c040, size: 0.35, speedHint: '慢' },
    { name: '彗星 · 极大 e', a: 9,  e: 0.78, color: 0xff6b6b, size: 0.15, speedHint: '极慢/近极快' },
  ];

  const planetStates = planets.map(() => ({ pos: new THREE.Vector3(), vel: new THREE.Vector3() }));
  const trails = planets.map(() => []);
  const MAX_TRAIL = 500;
  const planetMeshes = [];
  const planetTrails = [];
  const ellipseRefs = [];

  planets.forEach((p, idx) => {
    // 行星
    const mat = new THREE.MeshStandardMaterial({
      color: p.color,
      roughness: 0.4,
      metalness: 0.2,
      emissive: p.color,
      emissiveIntensity: 0.25,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.size, 24, 24), mat);
    scene.add(mesh);
    planetMeshes.push(mesh);

    // 轨迹
    const tmat = new THREE.LineBasicMaterial({ color: p.color, transparent: true, opacity: 0.65 });
    const tgeom = new THREE.BufferGeometry();
    const tline = new THREE.Line(tgeom, tmat);
    scene.add(tline);
    planetTrails.push({ line: tline, geom: tgeom, mat: tmat });

    // 参考椭圆(先创建空,后面 rebuildEllipseRef 填充)
    const emat = new THREE.LineDashedMaterial({ color: p.color, dashSize: 0.3, gapSize: 0.2, transparent: true, opacity: 0.3 });
    const egeom = new THREE.BufferGeometry();
    const eline = new THREE.Line(egeom, emat);
    scene.add(eline);
    ellipseRefs.push({ line: eline, geom: egeom, mat: emat });
  });

  // ---------- 物理 ----------
  function accelFor(pos, target) {
    const r = pos.clone().sub(sun.position);
    const d2 = r.lengthSq();
    const d = Math.sqrt(d2);
    if (d < 0.1) { target.set(0, 0, 0); return; }
    target.copy(r).multiplyScalar(-GM / (d2 * d));
  }

  function initState(idx) {
    const p = planets[idx];
    const c = p.a * p.e;
    // 太阳在 (0, 0, 0) 是简化;这里用太阳在 (c, 0, 0),行星从 (a, 0, 0) 开始
    sun.position.set(0, 0, 0);
    glow.position.set(0, 0, 0);
    planetStates[idx].pos.set(p.a, 0, 0);
    // 近日点速度
    const v = Math.sqrt(GM * (1 + p.e) / (p.a * (1 - p.e)));
    planetStates[idx].vel.set(0, 0, v);
    trails[idx].length = 0;
  }
  function initAll() { planets.forEach((_, i) => initState(i)); }
  initAll();

  function stepPlanet(idx, dt) {
    if (params.paused) return;
    const a1 = new THREE.Vector3();
    const a2 = new THREE.Vector3();
    accelFor(planetStates[idx].pos, a1);
    const newPos = planetStates[idx].pos.clone()
      .add(planetStates[idx].vel.clone().multiplyScalar(dt))
      .add(a1.clone().multiplyScalar(0.5 * dt * dt));
    accelFor(newPos, a2);
    const newVel = planetStates[idx].vel.clone().add(a1.clone().add(a2).multiplyScalar(0.5 * dt));
    planetStates[idx].pos.copy(newPos);
    planetStates[idx].vel.copy(newVel);
    trails[idx].push(planetStates[idx].pos.clone());
    if (trails[idx].length > MAX_TRAIL) trails[idx].shift();
  }

  function rebuildEllipseRef(idx) {
    const p = planets[idx];
    const c = p.a * p.e;
    const b = p.a * Math.sqrt(1 - p.e * p.e);
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const t = (i / 200) * 2 * Math.PI;
      const x = p.a * Math.cos(t) + c;
      const z = b * Math.sin(t);
      pts.push(new THREE.Vector3(x, 0, z));
    }
    const ref = ellipseRefs[idx];
    ref.geom.dispose();
    ref.geom = new THREE.BufferGeometry().setFromPoints(pts);
    ref.line.geometry = ref.geom;
    ref.line.computeLineDistances();
  }
  planets.forEach((_, i) => rebuildEllipseRef(i));

  // 周期信息(开普勒第三定律 T = 2π√(a³/GM))
  function getOrbitPeriod(a) { return 2 * Math.PI * Math.sqrt(a * a * a / GM); }

  // 状态信息 HUD
  const hud = document.createElement('div');
  hud.style.cssText = 'position:absolute;top:70px;left:24px;background:rgba(20,24,32,0.78);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px 14px;font-size:11px;color:#e6e8ec;line-height:1.7;z-index:15;min-width:220px;font-family:var(--mathw-font);';
  hud.innerHTML = `
    <div style="font-size:11px;color:#8a93a6;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;font-weight:600;">行星系统 · 4 颗</div>
    <div id="mathw-hud-list"></div>
  `;
  host.appendChild(hud);
  const hudList = hud.querySelector('#mathw-hud-list');

  function updateHud() {
    let html = '';
    planets.forEach((p, i) => {
      const T = getOrbitPeriod(p.a);
      const speed = planetStates[i].vel.length();
      const dist = planetStates[i].pos.distanceTo(sun.position);
      const colorHex = '#' + p.color.toString(16).padStart(6, '0');
      html += `
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${colorHex};box-shadow:0 0 4px ${colorHex};flex-shrink:0"></span>
          <span style="flex:1;color:#e6e8ec;">${p.name}</span>
        </div>
        <div style="padding-left:14px;color:#8a93a6;font-size:10px;margin-bottom:6px;">
          a = ${p.a} · e = ${p.e.toFixed(2)} · T ≈ ${T.toFixed(1)}s
        </div>
      `;
    });
    hudList.innerHTML = html;
  }
  updateHud();

  // ---------- 状态 ----------
  let params = { speed: 1.0, paused: false };

  // ---------- 交互 ----------
  const sInput = ctrls.querySelector('[data-speed]');
  const sVal = ctrls.querySelector('[data-speed-v]');
  sInput.addEventListener('input', (e) => {
    params.speed = parseFloat(e.target.value);
    sVal.textContent = params.speed.toFixed(1) + '×';
  });
  ctrls.querySelector('[data-reset]').addEventListener('click', () => {
    initAll();
  });
  const pauseBtn = ctrls.querySelector('[data-pause]');
  pauseBtn.addEventListener('click', () => {
    params.paused = !params.paused;
    pauseBtn.textContent = params.paused ? '继续' : '暂停';
    pauseBtn.classList.toggle('active', params.paused);
  });

  // getState/setState(v0.5 参数持久化)

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
  let frameCount = 0;
  function tick(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000) * params.speed;
    lastTs = ts;
    for (let i = 0; i < planets.length; i++) stepPlanet(i, dt);

    // 更新网格位置
    for (let i = 0; i < planets.length; i++) {
      planetMeshes[i].position.copy(planetStates[i].pos);
      // 轨迹
      const tr = trails[i];
      if (tr.length > 1) {
        const positions = new Float32Array(tr.length * 3);
        for (let j = 0; j < tr.length; j++) {
          positions[j * 3] = tr[j].x;
          positions[j * 3 + 1] = tr[j].y;
          positions[j * 3 + 2] = tr[j].z;
        }
        const ref = planetTrails[i];
        ref.geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      }
    }

    frameCount++;
    if (frameCount % 30 === 0) updateHud();

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  return {
    sceneId: 'planetary-orbits',
    getFormula() { return 'F = G·M·m/r²   T² ∝ a³'; },
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
      grid.geometry.dispose(); grid.material.dispose();
      planetMeshes.forEach((m, i) => { m.material.dispose(); m.geometry.dispose(); });
      planetTrails.forEach(t => { t.geom.dispose(); t.mat.dispose(); });
      ellipseRefs.forEach(e => { e.geom.dispose(); e.mat.dispose(); });
      hud.remove();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
