// viewer/scenes/15_lsystem.js
// MathematicsWeb v0.6.0 — L-系统分形植物 (数学 × 生物)
// 2D Canvas 场景:L-system 递归生成植物
//   - 起始符 + 产生式 + 迭代次数 N → 字符串 → turtle graphics 画
//   - 经典规则(树):F → F[+F]F[-F]F
//   - 调规则 / 迭代数 / 角度看植物形态变化
//   - 实时画分形植物(树、灌木、海草、雪花)
//
// 数学:L-system = 字符串重写系统
//   axiom 起始符:F
//   rule:F → F[+F]F[-F][F]
//   迭代 N 次 → 长度指数级增长的字符串 → turtle 解释
//
// 应用:植物建模(Lindenmayer 1968)、分形艺术、城市规划、程序化生成

import { makeLoop, fitCanvas } from '../../kernel/02_animation.js';

export function createScene(host, opts = {}) {
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
    <div class="mathw-lesson-title">数学 × 生物 · L-系统分形植物</div>
    <div class="mathw-lesson-content">
      <div class="mathw-lesson-headline">字符串重写系统 → 植物</div>
      <div class="mathw-lesson-formula">axiom: F   rule: F → F[+F]F[-F]F</div>
      <div class="mathw-lesson-text">
        L-system(1968,Lindenmayer)用 <strong>字符串重写</strong> 模拟植物生长。<br>
        起始符 + 产生式,迭代 N 次后字符串长度指数级增长,再用 turtle 画出来。<br>
        调 4 个预设规则 + 迭代数 + 角度,看树/灌木/海草/雪花。
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
    <div class="mathw-controls-title">参数 · L-系统</div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">规则</span>
      <select data-rule>
        <option value="tree" selected>树(F → F[+F]F[-F]F)</option>
        <option value="bush">灌木(F → FF+[+F-F-F]-[-F+F+F])</option>
        <option value="weed">海草(F → F[+F]F[-F][F])</option>
        <option value="snowflake">Koch 雪花(F → F+F−F−F+F)</option>
      </select>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">迭代 N</span>
      <input type="range" min="1" max="6" step="1" value="4" data-n />
      <span class="mathw-control-value" data-n-v>4</span>
    </div>
    <div class="mathw-control-row">
      <span class="mathw-control-label">角度</span>
      <input type="range" min="10" max="45" step="1" value="25" data-angle />
      <span class="mathw-control-value" data-angle-v>25°</span>
    </div>
    <div class="mathw-control-row">
      <button data-color>🎨 换色</button>
    </div>
  `;
  host.appendChild(ctrls);

  let params = { rule: 'tree', n: 4, angle: 25, hue: 120 };
  const RULES = {
    tree: { axiom: 'F', rule: 'F[+F]F[-F]F' },
    bush: { axiom: 'F', rule: 'FF+[+F-F-F]-[-F+F+F]' },
    weed: { axiom: 'F', rule: 'F[+F]F[-F][F]' },
    snowflake: { axiom: 'F', rule: 'F+F-F-F+F' },
  };
  function colorStops() {
    return [`hsl(${params.hue}, 70%, 35%)`, `hsl(${params.hue + 30}, 60%, 55%)`, `hsl(${params.hue - 30}, 80%, 25%)`];
  }

  // 字符串重写
  function rewrite(axiom, rule, n) {
    let s = axiom;
    for (let i = 0; i < n; i++) {
      let next = '';
      for (const c of s) {
        next += (c === 'F' ? rule : c);
      }
      s = next;
      if (s.length > 200000) break;  // 防护
    }
    return s;
  }

  // Turtle 解释器
  function drawLSystem(ctx, str, startX, startY, startAngle, stepLen, angle) {
    const stack = [];
    let x = startX, y = startY;
    let theta = startAngle;
    let depth = 0;
    const colors = colorStops();
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    for (const c of str) {
      if (c === 'F') {
        const nx = x + stepLen * Math.cos(theta);
        const ny = y + stepLen * Math.sin(theta);
        ctx.strokeStyle = depth < 3 ? colors[0] : (depth < 6 ? colors[1] : colors[2]);
        ctx.lineWidth = Math.max(0.5, 5 - depth * 0.5);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        x = nx; y = ny;
      } else if (c === '+') {
        theta += angle * Math.PI / 180;
      } else if (c === '-') {
        theta -= angle * Math.PI / 180;
      } else if (c === '[') {
        stack.push({ x, y, theta, depth });
        depth++;
      } else if (c === ']') {
        const s = stack.pop();
        x = s.x; y = s.y; theta = s.theta; depth = s.depth;
      }
    }
  }

  const ctx = canvas.getContext('2d');

  function draw(elapsed, dt) {
    const { w, h, dpr } = fitCanvas(canvas, host);
    const W = w, H = h;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    const rule = RULES[params.rule];
    const str = rewrite(rule.axiom, rule.rule, params.n);
    // stepLen 跟 N 反相关(防止 N 大时爆画面)
    const stepLen = Math.max(2, 200 / Math.pow(1.6, params.n));

    drawLSystem(ctx, str, W / 2, H * 0.95, -Math.PI / 2, stepLen, params.angle);

    // 信息
    ctx.fillStyle = '#8a93a6';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`规则: ${params.rule} · 迭代 N=${params.n} · 角度=${params.angle}°`, 20, 30);
    ctx.fillText(`字符串长度: ${str.length.toLocaleString()}`, 20, 48);

    ctx.restore();
  }

  const loop = makeLoop(draw, { maxFps: 30 });

  // 交互
  const _rSel = ctrls.querySelector('[data-rule]');
  const _nInp = ctrls.querySelector('[data-n]');
  const _nV = ctrls.querySelector('[data-n-v]');
  const _aInp = ctrls.querySelector('[data-angle]');
  const _aV = ctrls.querySelector('[data-angle-v]');
  _rSel.addEventListener('change', (e) => params.rule = e.target.value);
  _nInp.addEventListener('input', (e) => { params.n = parseInt(e.target.value); _nV.textContent = params.n; });
  _aInp.addEventListener('input', (e) => { params.angle = parseInt(e.target.value); _aV.textContent = params.angle + '°'; });
  ctrls.querySelector('[data-color]').addEventListener('click', () => {
    params.hue = (params.hue + 47) % 360;
  });

  return {
    sceneId: 'lsystem',
    getFormula() { return 'axiom → 产生式 → turtle'; },
    // v0.6.16: 教学要点(给 AI 上下文用)—— 读 .mathw-lesson 卡片纯文本
    getLesson() {
      const content = lesson.querySelector('.mathw-lesson-content');
      if (!content) return '';
      return content.textContent.replace(/\s+/g, ' ').trim();
    },
    getState() { return { ...params }; },
    setState(s) {
      if (!s) return;
      if (s.rule) { params.rule = s.rule; _rSel.value = s.rule; }
      if (typeof s.n === 'number') { params.n = s.n; _nInp.value = s.n; _nV.textContent = s.n; }
      if (typeof s.angle === 'number') { params.angle = s.angle; _aInp.value = s.angle; _aV.textContent = s.angle + '°'; }
    },
    destroy() {
      loop.stop();
      wrap.remove();
      lesson.remove();
      ctrls.remove();
    },
  };
}
