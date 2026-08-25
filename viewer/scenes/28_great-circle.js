// viewer/scenes/28_great-circle.js
// MathematicsWeb v0.6.24 — 球面大圆 (数学 × 球面几何)
// 2D Canvas 场景:经纬网 + 城市 + 大圆航线
//   - 中心:正交投影(地球俯视图)
//   - 上方:大圆航线(球面最短路径) — 弯向高纬的弧线
//   - 下方:同 2 点恒向线(经线直行 + 纬线直行拼接) — 锯齿感
//   - 数字:大圆距离 vs 恒向线距离(km)+ 节省百分比
//
// 数学:
//   球面距离(haversine): d = 2R·atan2(√(sin²(Δφ/2) + cos φ₁ cos φ₂ sin²(Δλ/2)), √(1−...))
//   大圆 = 过 2 点 + 球心的平面交球面的圆(最短路径)
//   恒向线(rhumb line) = 与所有经线交角相等(罗盘航向不变,但不是最短)
//   球面三角:cos(d/R) = sin φ₁ sin φ₂ + cos φ₁ cos φ₂ cos(Δλ)
//
// 应用:
//   - 航空:跨洋航班走大圆省油省时(PEK→NYC 不走太平洋直走,绕北极圈)
//   - 航海:大圆海图(gnomonic 投影)
//   - 定位:GPS 距离计算
//   - 通信:卫星轨道

import { makeLoop, fitCanvas } from '../../kernel/02_animation.js';

const R = 6371; // 地球半径 km

// 城市经纬度(简化,挑有跨洋航线代表性的)
const CITIES = [
  { name: '北京 PEK',   lon: 116.4,  lat: 39.9 },
  { name: '纽约 JFK',   lon: -74.0,  lat: 40.7 },
  { name: '伦敦 LHR',   lon: -0.45,  lat: 51.5 },
  { name: '东京 HND',   lon: 139.8,  lat: 35.7 },
  { name: '悉尼 SYD',   lon: 151.2,  lat: -33.9 },
  { name: '巴黎 CDG',   lon: 2.55,   lat: 49.0 },
  { name: '上海 PVG',   lon: 121.8,  lat: 31.2 },
  { name: '洛杉矶 LAX', lon: -118.4, lat: 33.9 },
  { name: '新加坡 SIN', lon: 103.8,  lat: 1.35 },
  { name: '开普敦 CPT', lon: 18.6,   lat: -33.9 },
];

// 球面距离(haversine),返回 km
function sphereDist(lon1, lat1, lon2, lat2) {
  const toR = (d) => d * Math.PI / 180;
  const φ1 = toR(lat1), φ2 = toR(lat2);
  const dφ = toR(lat2 - lat1), dλ = toR(lon2 - lon1);
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 初始方位角 bearing(从 1 到 2,正北 0° 顺时针)
function bearing(lon1, lat1, lon2, lat2) {
  const toR = (d) => d * Math.PI / 180, toD = (r) => r * 180 / Math.PI;
  const φ1 = toR(lat1), φ2 = toR(lat2), dλ = toR(lon2 - lon1);
  const y = Math.sin(dλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ);
  return (toD(Math.atan2(y, x)) + 360) % 360;
}

// 在大圆上从 (lon1,lat1) 走 fraction(0..1) — 中点插值用 slerp
function greatCirclePoint(lon1, lat1, lon2, lat2, f) {
  const toR = (d) => d * Math.PI / 180, toD = (r) => r * 180 / Math.PI;
  const φ1 = toR(lat1), φ2 = toR(lat2), λ1 = toR(lon1), λ2 = toR(lon2);
  const d = 2 * Math.asin(Math.sqrt(Math.sin((φ2 - φ1) / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2));
  if (d === 0) return [lon1, lat1];
  const A = Math.sin((1 - f) * d) / Math.sin(d);
  const B = Math.sin(f * d) / Math.sin(d);
  const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
  const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
  const z = A * Math.sin(φ1) + B * Math.sin(φ2);
  const φ = Math.atan2(z, Math.sqrt(x * x + y * y));
  const λ = Math.atan2(y, x);
  return [toD(λ), toD(φ)];
}

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
    <div class="mathw-lesson-title">数学 × 球面几何 · 大圆航线</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">两点之间,球面最短不是直线</div>
      <div class="mathw-lesson-formula">d = 2R · atan2(√(sin²(Δφ/2) + cosφ₁cosφ₂ sin²(Δλ/2)), √(1−…))</div>
      <div class="mathw-lesson-text">
        地球上两点之间的<strong>最短路径</strong>是<strong>大圆</strong>(过 2 点 + 球心的平面交球面)。<br>
        地图上看着是<strong>弯的弧线</strong>向着高纬(例如 PEK→NYC 飞越北极圈),实际是球面直线。<br>
        下方是<strong>恒向线</strong>(rhumb line)— 罗盘航向不变,但比大圆<strong>长 5-15%</strong>。<br>
        <strong>haversine 公式</strong>算球面距离,R = 6371 km 地球平均半径。<br>
        应用:跨洋航班 · GPS 定位 · 大圆海图 · 卫星轨道。
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
    <div class="mathw-controls-title">参数 · 大圆航线</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">起点</span>
      <select data-from>${CITIES.map((c, i) => `<option value="${i}" ${i === 0 ? 'selected' : ''}>${c.name}</option>`).join('')}</select>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">终点</span>
      <select data-to>${CITIES.map((c, i) => `<option value="${i}" ${i === 1 ? 'selected' : ''}>${c.name}</option>`).join('')}</select>
    </div>
    <div class="mathw-control-row">
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--mathw-muted)">
        <input type="checkbox" data-rhumb checked /> 显示恒向线对比
      </label>
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--mathw-muted)">
        <input type="checkbox" data-grid checked /> 经纬网
      </label>
    </div>
    <div class="mathw-control-row" style="font-size:11px;color:var(--mathw-muted)">
      提示: 选不同城市,看大圆如何"弯"向高纬
    </div>
  `;
  ctrls.className = 'mathw-controls';
  host.appendChild(ctrls);

  // ---------- 状态 ----------
  let params = { from: 0, to: 1, rhumb: true, grid: true };

  // ---------- 渲染 ----------
  const ctx = canvas.getContext('2d');

  // (lon, lat) → canvas 坐标(equirectangular 正交)
  function project(lon, lat, W, H) {
    const x = (lon + 180) / 360 * W;
    const y = (90 - lat) / 180 * H;
    return { x, y };
  }

  // 恒向线:从 (lon1,lat1) 沿恒定方位角走到 (lon2,lat2) — 用 bearing 反推
  // 简化:分段(经度按 1° 一步),维护恒定方位角
  function drawRhumb(lon1, lat1, lon2, lat2, W, H) {
    const toR = (d) => d * Math.PI / 180, toD = (r) => r * 180 / Math.PI;
    const brg = bearing(lon1, lat1, lon2, lat2);
    const brgR = toR(brg);
    // 用经度步进
    const dlon = lon2 - lon1;
    const absDlon = Math.abs(dlon);
    const steps = Math.max(2, Math.ceil(absDlon));
    const sign = dlon >= 0 ? 1 : -1;
    let curLon = lon1, curLat = lat1;
    ctx.beginPath();
    const p0 = project(curLon, curLat, W, H);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i <= steps; i++) {
      const nextLon = lon1 + sign * (i / steps) * absDlon;
      // 由方位角和经度差反推纬度
      // dφ = (cos(brg) / tan(φ)) ... 简化:用解析求新 lat
      // 更稳:用 Euler 步进
      const Δλ = toR(nextLon - curLon);
      const φ = toR(curLat);
      const dφ = Δλ * Math.tan(brgR) * Math.cos(φ); // 简化近似
      curLat = curLat + toD(dφ);
      curLon = nextLon;
      const p = project(curLon, curLat, W, H);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  function draw(elapsed, dt) {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    // 经纬网
    if (params.grid) {
      ctx.strokeStyle = 'rgba(138, 147, 166, 0.18)';
      ctx.lineWidth = 1;
      // 纬线(每 30°)
      for (let lat = -60; lat <= 60; lat += 30) {
        const y = (90 - lat) / 180 * H;
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.lineTo(W, y);
        ctx.stroke();
      }
      // 经线(每 30°)
      for (let lon = -150; lon <= 150; lon += 30) {
        const x = (lon + 180) / 360 * W;
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, H);
        ctx.stroke();
      }
      // 赤道加粗
      ctx.strokeStyle = 'rgba(110, 231, 183, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
      ctx.stroke();
      // 标签
      ctx.fillStyle = '#8a93a6';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('赤道 0°', 6, H / 2 - 4);
      ctx.fillText('30°', 4, (90 - 30) / 180 * H - 2);
      ctx.fillText('-30°', 4, (90 - (-30)) / 180 * H + 12);
    }

    // 画所有城市
    CITIES.forEach((c, idx) => {
      const p = project(c.lon, c.lat, W, H);
      const isFrom = idx === params.from, isTo = idx === params.to;
      ctx.fillStyle = (isFrom || isTo) ? '#fbbf24' : '#8a93a6';
      ctx.beginPath();
      ctx.arc(p.x, p.y, isFrom || isTo ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isFrom ? '#6ee7b7' : (isTo ? '#fbbf24' : '#8a93a6');
      ctx.font = isFrom || isTo ? 'bold 11px -apple-system, sans-serif' : '10px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(c.name, p.x + 7, p.y + 4);
    });

    // 大圆航线
    const A = CITIES[params.from], B = CITIES[params.to];
    const gcDist = sphereDist(A.lon, A.lat, B.lon, B.lat);
    const brg = bearing(A.lon, A.lat, B.lon, B.lat);
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const N = 200;
    for (let i = 0; i <= N; i++) {
      const [lon, lat] = greatCirclePoint(A.lon, A.lat, B.lon, B.lat, i / N);
      const p = project(lon, lat, W, H);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // 恒向线对比
    let rhumbDist = 0;
    if (params.rhumb) {
      ctx.strokeStyle = '#fbbf24';
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.5;
      // 用经纬线拼接近似(走经线到目标纬度,再走纬线到目标经度)
      const segDist1 = sphereDist(A.lon, A.lat, B.lon, A.lat); // 经线段
      const segDist2 = sphereDist(B.lon, A.lat, B.lon, B.lat); // 纬线段
      rhumbDist = segDist1 + segDist2;
      // 画两段
      const pA = project(A.lon, A.lat, W, H);
      const pMid = project(B.lon, A.lat, W, H);
      const pB = project(B.lon, B.lat, W, H);
      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y); ctx.lineTo(pMid.x, pMid.y); ctx.lineTo(pB.x, pB.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 顶部信息
    ctx.fillStyle = '#e6e8ec';
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${A.name} → ${B.name}`, 20, 24);
    ctx.fillStyle = '#6ee7b7';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.fillText(`大圆距离 = ${gcDist.toFixed(0)} km · 初始航向 = ${brg.toFixed(1)}°`, 20, 44);
    if (params.rhumb) {
      const saved = ((rhumbDist - gcDist) / rhumbDist * 100);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`恒向线距离 = ${rhumbDist.toFixed(0)} km · 大圆省 ${saved.toFixed(1)}%`, 20, 62);
    }
    ctx.fillStyle = '#8a93a6';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillText('大圆(绿实线)·恒向线(黄虚线,经纬拼接)·球面 R = 6371 km', 20, 80);

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // ---------- 交互 ----------
  const _from = ctrls.querySelector('[data-from]');
  const _to = ctrls.querySelector('[data-to]');
  const _rhumb = ctrls.querySelector('[data-rhumb]');
  const _grid = ctrls.querySelector('[data-grid]');
  _from.addEventListener('change', (e) => { params.from = parseInt(e.target.value); if (params.from === params.to) { params.to = (params.from + 1) % CITIES.length; _to.value = params.to; } });
  _to.addEventListener('change', (e) => { params.to = parseInt(e.target.value); if (params.from === params.to) { params.from = (params.to + 1) % CITIES.length; _from.value = params.from; } });
  _rhumb.addEventListener('change', (e) => { params.rhumb = e.target.checked; });
  _grid.addEventListener('change', (e) => { params.grid = e.target.checked; });

  return {
    sceneId: 'great-circle',
    getFormula() { return 'd = 2R·atan2(√(sin²(Δφ/2)+cosφ₁cosφ₂sin²(Δλ/2)), √(1−…)), R=6371km'; },
    getLesson() {
      const c = lesson.querySelector('.mathw-lesson-content');
      return c ? c.textContent.replace(/\s+/g, ' ').trim() : '';
    },
    getState() { return { from: params.from, to: params.to, rhumb: params.rhumb, grid: params.grid }; },
    setState(s) {
      if (!s) return;
      if (typeof s.from === 'number') { params.from = s.from; _from.value = s.from; }
      if (typeof s.to === 'number') { params.to = s.to; _to.value = s.to; }
      if (typeof s.rhumb === 'boolean') { params.rhumb = s.rhumb; _rhumb.checked = s.rhumb; }
      if (typeof s.grid === 'boolean') { params.grid = s.grid; _grid.checked = s.grid; }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
