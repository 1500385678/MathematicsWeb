// viewer/scenes/30_crystal-lattice.js
// MathematicsWeb v0.6.25 — 晶体格 / Bravais 格子 (数学 × 材料科学)
// 3D 场景:four 种基本晶系对比
//   - 简单立方 SC (1 原子/晶胞, 配位 6, APF 0.52)
//   - 体心立方 BCC (2 原子/晶胞, 配位 8, APF 0.68)
//   - 面心立方 FCC (4 原子/晶胞, 配位 12, APF 0.74) — 最密
//   - 六方密堆 HCP (2 原子/晶胞, 配位 12, APF 0.74) — 与 FCC 同密度
//   控件:格子类型 + 晶格常数 a + 原子半径 r(看原子接触转变)
//   显示:晶胞(线框) + 原子(球) + 配位数 + APF 数字
//   例子面板:NaCl = FCC / α-Fe = BCC / Cu-Au-Ag = FCC / Mg-Zn-Ti = HCP
//
// 数学:
//   SC:    8 角各 1/8 → 1 原子/晶胞  ·  配位 6  ·  r = a/2  ·  APF = π/6 ≈ 0.5236
//   BCC:   8 角各 1/8 + 1 体心 → 2 原子  ·  配位 8  ·  r = √3 a/4  ·  APF = √3 π/8 ≈ 0.6802
//   FCC:   8 角各 1/8 + 6 面心各 1/2 → 4 原子  ·  配位 12  ·  r = √2 a/2  ·  APF = √2 π/6 ≈ 0.7405
//   HCP:   简单表示,2 原子  ·  配位 12  ·  APF ≈ 0.7405
//
// 应用:
//   - 材料科学:金属/陶瓷/半导体基础
//   - 半导体:硅单晶(钻石型, FCC 子集)/GaAs 等 III-V 族
//   - X 射线衍射:XRD 测晶体结构
//   - 金属加工:铁素体(BCC)/奥氏体(FCC)相变

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 4 种晶系的原子相对位置(以 a 为单位的晶胞内位置)
const LATTICES = {
  SC: {
    name: '简单立方 SC',
    color: 0x6ee7b7,
    desc: 'P / Primitive · 8 角各 1/8 原子 → 1 原子/晶胞',
    sites: [[0, 0, 0]],  // 角位置等价
    coordination: 6,
    atomsPerCell: 1,
    formula: 'r = a/2',
    apf: Math.PI / 6,
    apfStr: 'π/6 ≈ 0.5236',
    examples: 'α-Po (钋)· 仅此一种纯元素单质',
  },
  BCC: {
    name: '体心立方 BCC',
    color: 0x4ea1ff,
    desc: 'I / Body-centered · 8 角 + 1 体心 → 2 原子/晶胞',
    sites: [[0, 0, 0], [0.5, 0.5, 0.5]],
    coordination: 8,
    atomsPerCell: 2,
    formula: 'r = √3 a/4 ≈ 0.433 a',
    apf: Math.sqrt(3) * Math.PI / 8,
    apfStr: '√3 π/8 ≈ 0.6802',
    examples: 'α-Fe (铁素体)· Cr · Mo · W · Na · K · V',
  },
  FCC: {
    name: '面心立方 FCC',
    color: 0xfbbf24,
    desc: 'F / Face-centered · 8 角 + 6 面心 → 4 原子/晶胞',
    sites: [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]],
    coordination: 12,
    atomsPerCell: 4,
    formula: 'r = √2 a/2 ≈ 0.707 a',
    apf: Math.sqrt(2) * Math.PI / 6,
    apfStr: '√2 π/6 ≈ 0.7405',
    examples: 'Cu · Al · Au · Ag · Pb · Ni · γ-Fe (奥氏体)· 食盐 NaCl(双 FCC)',
  },
  HCP: {
    name: '六方密堆 HCP',
    color: 0xf472b6,
    desc: '六方柱 · 12 角各 1/6 + 2 体心 → 2 原子/晶胞 · 与 FCC 同密度',
    sites: [
      [0, 0, 0], [0, 0, 0.5],           // 上下六边形中心
      [0.5, 0, 0.25], [0.5, 0, 0.75],   // 中间层 2 原子
    ],
    coordination: 12,
    atomsPerCell: 2,
    formula: 'r = a/2 (理想 c/a = √8/3 ≈ 1.633)',
    apf: Math.sqrt(2) * Math.PI / 6,
    apfStr: '≈ 0.7405 (与 FCC 相同)',
    examples: 'Mg · Zn · Ti · Co · Cd · Be · Zr',
  },
};

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
    <div class="mathw-lesson-title">数学 × 材料科学 · 晶体格</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">4 种 Bravais 晶系,APF 0.52 → 0.74</div>
      <div class="mathw-lesson-formula">SC: 1 原子/a³  ·  BCC: 2  ·  FCC: 4  ·  HCP: 2  ·  APF = N·(4πr³/3)/a³</div>
      <div class="mathw-lesson-text">
        自然界 <strong>92.4% 金属单质</strong>是 <strong>FCC / BCC / HCP</strong> 三选一(SC 仅 α-Po)。<br>
        切换 <strong>4 种格子</strong>看原子的不同堆法:SC 最疏(APF 0.52),FCC/HCP 最密(0.74)。<br>
        拖动 <strong>原子半径 r</strong>:r 增 → 原子相互接触 → 不能再增(否则重叠)。<br>
        拖动 <strong>晶格常数 a</strong>:看原子间距 = 多少 a 倍数。<br>
        <strong>配位数</strong>(最近邻原子数):SC=6, BCC=8, FCC=12。<br>
        应用:半导体(Si 单晶)· 金属相变(α-Fe BCC ↔ γ-Fe FCC)· X 射线衍射。
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
    <div class="mathw-controls-title">参数 · 晶体格</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">格子类型</span>
      <select data-type style="background:var(--mathw-bg-2);color:var(--mathw-fg);border:1px solid var(--mathw-line);border-radius:4px;padding:2px 6px;font-size:11px">
        <option value="SC">SC 简单立方</option>
        <option value="BCC">BCC 体心立方</option>
        <option value="FCC" selected>FCC 面心立方</option>
        <option value="HCP">HCP 六方密堆</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">晶格常数 a</span>
      <input type="range" min="2" max="6" step="0.1" value="3" data-a />
      <span class="mathw-control-value" data-a-v>3.0</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">原子半径 r</span>
      <input type="range" min="0.05" max="1.0" step="0.01" value="0.35" data-r />
      <span class="mathw-control-value" data-r-v>0.35</span>
    </div>
    <div class="mathw-control-row">
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--mathw-muted)">
        <input type="checkbox" data-cell checked /> 显示晶胞(线框)
      </label>
    </div>
    <div class="mathw-control-row" data-info style="flex-direction:column;align-items:flex-start;font-size:11px;color:var(--mathw-muted);line-height:1.5">
    </div>
  `;
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

  // ---------- 晶胞与原子容器 ----------
  const latticeGroup = new THREE.Group();
  scene.add(latticeGroup);

  let params = { type: 'FCC', a: 3.0, r: 0.35, showCell: true };

  function clearGroup() {
    while (latticeGroup.children.length) {
      const c = latticeGroup.children.pop();
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    }
  }

  function addCellBox(size) {
    // 晶胞线框盒
    const boxGeom = new THREE.BoxGeometry(size, size, size);
    const edges = new THREE.EdgesGeometry(boxGeom);
    const mat = new THREE.LineBasicMaterial({ color: 0x8a93a6, transparent: true, opacity: 0.5 });
    const wire = new THREE.LineSegments(edges, mat);
    wire.position.set(0, 0, 0);
    latticeGroup.add(wire);
    boxGeom.dispose();
  }

  function addHCPBox(size) {
    // HCP 用六方棱柱:1 顶面六边形 + 6 侧棱 + 1 底面六边形
    const r = size / 2;
    const pts = [];
    // 顶面六边形
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      pts.push(new THREE.Vector3(r * Math.cos(a), size / 2, r * Math.sin(a)));
    }
    // 底面六边形
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      pts.push(new THREE.Vector3(r * Math.cos(a), -size / 2, r * Math.sin(a)));
    }
    // 6 条侧棱
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      pts.push(new THREE.Vector3(r * Math.cos(a), -size / 2, r * Math.sin(a)));
      pts.push(new THREE.Vector3(r * Math.cos(a), size / 2, r * Math.sin(a)));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x8a93a6, transparent: true, opacity: 0.5 });
    const lines = new THREE.LineSegments(geom, mat);
    latticeGroup.add(lines);
  }

  function addAtom(x, y, z, radius, color) {
    const geom = new THREE.SphereGeometry(radius, 24, 16);
    const mat = new THREE.MeshStandardMaterial({
      color, roughness: 0.35, metalness: 0.25,
      emissive: color, emissiveIntensity: 0.08,
    });
    const sphere = new THREE.Mesh(geom, mat);
    sphere.position.set(x, y, z);
    latticeGroup.add(sphere);
  }

  function rebuild() {
    clearGroup();
    const def = LATTICES[params.type];
    const a = params.a;
    const halfA = a / 2;
    // 调整 HCP 的 c/a 比约为 1.633,但为了简单画成立方盒 + 中间层
    // 实际 HCP 应该用六方棱柱,这里把 HCP 晶胞视作 a = b ≠ c,简化 c = 2a·√(2/3) ≈ 1.633a
    const c = (params.type === 'HCP') ? a * Math.sqrt(8 / 3) : a;
    const halfC = c / 2;

    // 1. 晶胞线框
    if (params.showCell) {
      if (params.type === 'HCP') {
        // HCP 用菱形棱柱
        addHCPBox(a);
      } else {
        addCellBox(a);
      }
    }

    // 2. 原子(每个 site 位置画一个球)
    // 角位置:8 角各画一个完整球(角平分到 8 个相邻晶胞,这里画示意完整球)
    // 体心 / 面心:按 def.sites 平移复制
    // 为简化:对每个 site,画 site 本身 + 周期邻居以体现"晶格"
    if (params.type === 'HCP') {
      // HCP 用六方柱内的 sites,直接画
      for (const site of def.sites) {
        const x = (site[0] - 0.5) * a;
        const y = (site[1] - 0.5) * c;
        const z = (site[2] - 0.5) * a;
        addAtom(x, y, z, params.r, def.color);
      }
      // 加 6 角位置(各 1/3 在晶胞内)
      const corners = [
        [0, 0], [0, a], [0.5, 0], [0.5, a], [a, 0], [a, a],
      ];
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const x = (a / 2) * Math.cos(ang);
        const z = (a / 2) * Math.sin(ang);
        addAtom(x, -halfC, params.r, def.color);
        addAtom(x, halfC, params.r, def.color);
      }
    } else {
      // SC / BCC / FCC:用 2x2x2 邻居晶胞显示周期性
      // 中心晶胞 + 周围 26 个邻居
      const cellSites = [];
      // 中心晶胞内的 site
      for (const site of def.sites) {
        cellSites.push([site[0] * a, site[1] * a, site[2] * a]);
      }
      // FCC / BCC 还需加角(角是每个晶胞都有的 1/8 贡献,但中心晶胞 8 角各画 1 个)
      if (params.type === 'SC' || params.type === 'BCC' || params.type === 'FCC') {
        // 8 角
        for (let ix = 0; ix <= 1; ix++)
          for (let iy = 0; iy <= 1; iy++)
            for (let iz = 0; iz <= 1; iz++) {
              cellSites.push([ix * a, iy * a, iz * a]);
            }
      }
      // FCC 还需 6 面心
      if (params.type === 'FCC') {
        cellSites.push([halfA, halfA, 0]);
        cellSites.push([halfA, halfA, a]);
        cellSites.push([halfA, 0, halfA]);
        cellSites.push([halfA, a, halfA]);
        cellSites.push([0, halfA, halfA]);
        cellSites.push([a, halfA, halfA]);
      }

      // 把中心晶胞 8 角的球和 6 面心平移到 -a..+a 邻居格子里(看周期性)
      // 简化:对每个中心晶胞内的 site,生成 [-a, 0, +a] 三轴邻居(27 个邻居位置)
      const sitesToRepeat = cellSites.slice();
      const offsetBase = cellSites.slice(); // 中心晶胞自身

      for (const off of offsetBase) {
        // 中心
        addAtom(off[0] - halfA, off[1] - halfA, off[2] - halfA, params.r, def.color);
        // 26 邻居
        for (let dx = -1; dx <= 1; dx++)
          for (let dy = -1; dy <= 1; dy++)
            for (let dz = -1; dz <= 1; dz++) {
              if (dx === 0 && dy === 0 && dz === 0) continue;
              addAtom(
                off[0] - halfA + dx * a,
                off[1] - halfA + dy * a,
                off[2] - halfA + dz * a,
                params.r,
                def.color
              );
            }
      }
    }

    // 3. 更新信息面板
    const info = ctrls.querySelector('[data-info]');
    if (info) {
      const apfPct = (def.apf * 100).toFixed(2);
      info.innerHTML = `
        <div><strong>${def.name}</strong> — ${def.desc}</div>
        <div>• 配位数: <strong style="color:var(--mathw-accent)">${def.coordination}</strong>  ·  原子/晶胞: <strong style="color:var(--mathw-accent)">${def.atomsPerCell}</strong>  ·  APF: <strong style="color:var(--mathw-accent)">${def.apfStr}</strong></div>
        <div>• 接触关系: <code>${def.formula}</code></div>
        <div>• 例子: <span style="color:#cbd5e1">${def.examples}</span></div>
      `;
    }
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
    // 慢速自转,看出 3D 结构
    latticeGroup.rotation.y = t * 0.2;
    latticeGroup.rotation.x = Math.sin(t * 0.1) * 0.1;
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
  const _type = ctrls.querySelector('[data-type]');
  const _aInp = ctrls.querySelector('[data-a]');
  const _aV = ctrls.querySelector('[data-a-v]');
  const _rInp = ctrls.querySelector('[data-r]');
  const _rV = ctrls.querySelector('[data-r-v]');
  const _cell = ctrls.querySelector('[data-cell]');

  _type.addEventListener('change', (e) => { params.type = e.target.value; rebuild(); });
  _aInp.addEventListener('input', (e) => { params.a = parseFloat(e.target.value); _aV.textContent = params.a.toFixed(1); rebuild(); });
  _rInp.addEventListener('input', (e) => { params.r = parseFloat(e.target.value); _rV.textContent = params.r.toFixed(2); rebuild(); });
  _cell.addEventListener('change', (e) => { params.showCell = e.target.checked; rebuild(); });

  return {
    sceneId: 'crystal-lattice',
    getFormula() {
      const def = LATTICES[params.type];
      return `${def.name}: 配位 ${def.coordination} · 原子/晶胞 ${def.atomsPerCell} · ${def.formula} · APF ${def.apfStr}`;
    },
    getLesson() {
      const c = lesson.querySelector('.mathw-lesson-content');
      return c ? c.textContent.replace(/\s+/g, ' ').trim() : '';
    },
    getState() { return { type: params.type, a: params.a, r: params.r, showCell: params.showCell }; },
    setState(s) {
      if (!s) return;
      if (typeof s.type === 'string' && LATTICES[s.type]) { params.type = s.type; _type.value = s.type; }
      if (typeof s.a === 'number') { params.a = s.a; _aInp.value = s.a; _aV.textContent = s.a.toFixed(1); }
      if (typeof s.r === 'number') { params.r = s.r; _rInp.value = s.r; _rV.textContent = s.r.toFixed(2); }
      if (typeof s.showCell === 'boolean') { params.showCell = s.showCell; _cell.checked = s.showCell; }
      rebuild();
    },
    destroy() {
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      controls.dispose();
      renderer.dispose();
      clearGroup();
      grid.geometry.dispose();
      grid.material.dispose();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
