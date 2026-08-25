// viewer/scenes/29_mobius-strip.js
// MathematicsWeb v0.6.24 — 莫比乌斯带 (数学 × 拓扑几何)
// 3D 场景:three.js 渲染莫比乌斯参数曲面
//   - 沿中心线"走"一只小蚂蚁(实为 u 参数 0..2π,带子连续翻面)
//   - 显示"单面"性质:沿带走一周回到起点时已翻面
//   - 控件:带宽 w / 半径 R / 走带速度 / 显示单面动画
//
// 数学(参数方程):
//   x(u,v) = (R + v·cos(u/2)) · cos(u)
//   y(u,v) = (R + v·cos(u/2)) · sin(u)
//   z(u,v) = v · sin(u/2)
//   u ∈ [0, 2π] 周向,v ∈ [-w/2, w/2] 带宽
// 关键性质:虽然 u ∈ [0, 2π] 走完一周,但带子整体只有"1 个面" —
//   蚂蚁沿带子爬一圈,会"翻"到另一侧,再走一圈才回原面
//   拓扑:欧拉示性数 χ = 0(环面 0,球面 2,莫比乌斯 0)
//
// 应用:
//   - 传送带:延长寿命(双面磨损均匀)
//   - 电阻:无感电阻(无端接)
//   - 拓扑学:经典非可定向曲面
//   - 印刷:莫比乌斯环书

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
    <div class="mathw-lesson-title">数学 × 拓扑几何 · 莫比乌斯带</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">一个面、一条边、一张纸的拓扑奇迹</div>
      <div class="mathw-lesson-formula">x = (R + v·cos(u/2))·cos(u),  y = (R + v·cos(u/2))·sin(u),  z = v·sin(u/2)</div>
      <div class="mathw-lesson-text">
        把一张纸条<strong>拧 180°</strong>再粘起来,就得到<strong>莫比乌斯带</strong>(August Möbius 1858)。<br>
        神奇:虽然有<strong>两面</strong>的纸张做的,现在<strong>只有一个面</strong>、<strong>一条边</strong>。<br>
        沿带子爬一圈的小蚂蚁(下方红点走 u ∈ [0, 4π] 才回到原面)证明<strong>非可定向</strong>。<br>
        拖动 <strong>带宽 w</strong> 调胖瘦,看拓扑结构保持不变。<br>
        应用:传送带(双面磨损均匀)· 无感电阻 · 莫比乌斯环书。
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
    <div class="mathw-controls-title">参数 · 莫比乌斯</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">带宽 w</span>
      <input type="range" min="0.2" max="2" step="0.1" value="1" data-w />
      <span class="mathw-control-value" data-w-v>1.0</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">半径 R</span>
      <input type="range" min="1" max="3" step="0.1" value="2" data-r />
      <span class="mathw-control-value" data-r-v>2.0</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">走带速度</span>
      <input type="range" min="0" max="3" step="0.1" value="1" data-spd />
      <span class="mathw-control-value" data-spd-v>1.0</span>
    </div>
    <div class="mathw-control-row">
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--mathw-muted)">
        <input type="checkbox" data-walk checked /> 显示沿带走的"蚂蚁"
      </label>
    </div>
    <div class="mathw-control-row" style="font-size:11px;color:var(--mathw-muted)">
      提示: 蚂蚁走 4π 回到原面 — 莫比乌斯是单面
    </div>
  `;
  ctrls.className = 'mathw-controls';
  host.appendChild(ctrls);

  // ---------- three.js ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14181f);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(4, 3, 5);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  // 光照
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(5, 8, 4);
  scene.add(dir);
  const dir2 = new THREE.DirectionalLight(0x6ee7b7, 0.3);
  dir2.position.set(-4, 2, -3);
  scene.add(dir2);

  // 网格地面
  const grid = new THREE.GridHelper(16, 16, 0x2a3140, 0x222732);
  grid.position.y = -2;
  scene.add(grid);

  // 莫比乌斯带
  let mobiusMesh = null;
  const mobiusMaterial = new THREE.MeshStandardMaterial({
    color: 0x4ea1ff,
    roughness: 0.5,
    metalness: 0.15,
    side: THREE.DoubleSide,  // 关键:双面渲染,展示"单面"拓扑
  });

  // 中心参考圆(用 LineLoop)
  const ringPts = [];
  for (let i = 0; i <= 200; i++) {
    const u = (i / 200) * Math.PI * 2;
    ringPts.push(new THREE.Vector3(2 * Math.cos(u), 0, 2 * Math.sin(u)));
  }
  const ringGeom = new THREE.BufferGeometry().setFromPoints(ringPts);
  const ringLine = new THREE.Line(ringGeom, new THREE.LineBasicMaterial({ color: 0x8a93a6, transparent: true, opacity: 0.4 }));
  scene.add(ringLine);

  // 蚂蚁(小球)
  const ant = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.5 })
  );
  scene.add(ant);
  // 蚂蚁轨迹
  const trailGeom = new THREE.BufferGeometry();
  trailGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 300), 3));
  const trailMat = new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.6 });
  const trail = new THREE.Line(trailGeom, trailMat);
  scene.add(trail);

  let params = { w: 1.0, r: 2.0, spd: 1.0, walk: true };
  let trailIdx = 0;
  let trailLen = 0;

  function buildMobius(R, w) {
    // 参数化网格:Nu × Nv 顶点的矩形 uv 网格,生成三角面
    const Nu = 240, Nv = 20;
    const positions = [];
    const uvs = [];
    for (let i = 0; i <= Nu; i++) {
      const u = (i / Nu) * Math.PI * 2;
      // 注意:沿 u 走完 [0, 2π] 后 z 已经反向,所以 u 要延伸到 [0, 4π] 才是真"莫比乌斯"
      // 但用 [0, 2π] + uv 闭合就行(顶点的 z 翻转会自动粘接)
      for (let j = 0; j <= Nv; j++) {
        const v = -w / 2 + (j / Nv) * w;
        const x = (R + v * Math.cos(u / 2)) * Math.cos(u);
        const y = v * Math.sin(u / 2);
        const z = (R + v * Math.cos(u / 2)) * Math.sin(u);
        positions.push(x, y, z);
        uvs.push(i / Nu, j / Nv);
      }
    }
    const indices = [];
    for (let i = 0; i < Nu; i++) {
      for (let j = 0; j < Nv; j++) {
        const a = i * (Nv + 1) + j;
        const b = a + 1;
        const c = (i + 1) * (Nv + 1) + j;
        const d = c + 1;
        indices.push(a, b, d);
        indices.push(a, d, c);
      }
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  function rebuild() {
    if (mobiusMesh) {
      scene.remove(mobiusMesh);
      mobiusMesh.geometry.dispose();
    }
    const geom = buildMobius(params.r, params.w);
    mobiusMesh = new THREE.Mesh(geom, mobiusMaterial);
    mobiusMesh.castShadow = false;
    mobiusMesh.receiveShadow = false;
    scene.add(mobiusMesh);
    // 更新中心圆
    scene.remove(ringLine);
    const newPts = [];
    for (let i = 0; i <= 200; i++) {
      const u = (i / 200) * Math.PI * 2;
      newPts.push(new THREE.Vector3(params.r * Math.cos(u), 0, params.r * Math.sin(u)));
    }
    ringLine.geometry = new THREE.BufferGeometry().setFromPoints(newPts);
    scene.add(ringLine);
  }
  rebuild();

  // ---------- 渲染循环 ----------
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

  let t = 0;
  function tick(dt) {
    t += dt;
    controls.update();
    // 蚂蚁走带:沿 v = 0(中心),u 从 0 到 4π(走两圈才回原面 — 莫比乌斯性质)
    if (params.walk && params.spd > 0) {
      const u = (t * params.spd * 0.5) % (Math.PI * 4);
      const v = 0; // 中心线
      const x = (params.r + v * Math.cos(u / 2)) * Math.cos(u);
      const y = v * Math.sin(u / 2);
      const z = (params.r + v * Math.cos(u / 2)) * Math.sin(u);
      ant.position.set(x, y, z);
      // 轨迹
      const arr = trail.geometry.attributes.position.array;
      arr[trailIdx * 3] = x; arr[trailIdx * 3 + 1] = y; arr[trailIdx * 3 + 2] = z;
      trailIdx = (trailIdx + 1) % 300;
      trailLen = Math.min(trailLen + 1, 300);
      // 重新排序轨迹:从最老到最新
      // 简化:直接每帧重排 — 性能可接受
      trail.geometry.attributes.position.needsUpdate = true;
      trail.geometry.setDrawRange(0, trailLen);
    } else {
      ant.position.set(100, 100, 100); // 移出视野
    }
    renderer.render(scene, camera);
  }

  let rafId = null, lastTs = 0;
  function loop(ts) {
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    if (dt > 0.1) dt = 0.1;
    lastTs = ts;
    tick(dt);
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);

  // ---------- 交互 ----------
  const _wInp = ctrls.querySelector('[data-w]');
  const _wV = ctrls.querySelector('[data-w-v]');
  const _rInp = ctrls.querySelector('[data-r]');
  const _rV = ctrls.querySelector('[data-r-v]');
  const _spdInp = ctrls.querySelector('[data-spd]');
  const _spdV = ctrls.querySelector('[data-spd-v]');
  const _walk = ctrls.querySelector('[data-walk]');
  _wInp.addEventListener('input', (e) => { params.w = parseFloat(e.target.value); _wV.textContent = params.w.toFixed(1); rebuild(); });
  _rInp.addEventListener('input', (e) => { params.r = parseFloat(e.target.value); _rV.textContent = params.r.toFixed(1); rebuild(); });
  _spdInp.addEventListener('input', (e) => { params.spd = parseFloat(e.target.value); _spdV.textContent = params.spd.toFixed(1); });
  _walk.addEventListener('change', (e) => { params.walk = e.target.checked; });

  return {
    sceneId: 'mobius-strip',
    getFormula() { return 'x=(R+v·cos(u/2))·cos(u), y=v·sin(u/2), z=(R+v·cos(u/2))·sin(u), u∈[0,4π] (Möbius 1858)'; },
    getLesson() {
      const c = lesson.querySelector('.mathw-lesson-content');
      return c ? c.textContent.replace(/\s+/g, ' ').trim() : '';
    },
    getState() { return { w: params.w, r: params.r, spd: params.spd, walk: params.walk }; },
    setState(s) {
      if (!s) return;
      if (typeof s.w === 'number') { params.w = s.w; _wInp.value = s.w; _wV.textContent = s.w.toFixed(1); }
      if (typeof s.r === 'number') { params.r = s.r; _rInp.value = s.r; _rV.textContent = s.r.toFixed(1); }
      if (typeof s.spd === 'number') { params.spd = s.spd; _spdInp.value = s.spd; _spdV.textContent = s.spd.toFixed(1); }
      if (typeof s.walk === 'boolean') { params.walk = s.walk; _walk.checked = s.walk; }
      rebuild();
    },
    destroy() {
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      controls.dispose();
      renderer.dispose();
      if (mobiusMesh) mobiusMesh.geometry.dispose();
      mobiusMaterial.dispose();
      ringLine.geometry.dispose();
      ringLine.material.dispose();
      ant.geometry.dispose();
      ant.material.dispose();
      trail.geometry.dispose();
      trail.material.dispose();
      grid.geometry.dispose();
      grid.material.dispose();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
