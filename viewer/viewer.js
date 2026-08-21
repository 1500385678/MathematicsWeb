// viewer/viewer.js
// MathematicsWeb v0.5.0 — 主壳 + 场景切换器 + AI 面板宿主 + Workspace
// 暴露: import { initViewer, SCENES } from './viewer.js';
// 用法: const v = initViewer(container, { initialScene: 'catenary-arch', workspace });
//       v.switchScene('fourier-synth'); v.destroy();
//
// 设计要点(沿用 three.jsWeb 范式 + v0.5 加 Workspace 持久化):
//   - 0 构建(原生 ES Modules,改完即跑)
//   - 断网能跑(three.js 走 vendor,LLM 默认 mock)
//   - 场景独立模块,导出 createScene(host, opts) → { sceneId, getFormula, getState?, setState?, destroy }
//   - AI 面板原生支持,LLM 切换 mock/real
//   - v0.5:收藏 / 访问进度 / 场景参数持久化 / 最后访问恢复

import { AIPanel } from './02_ai-panel.js';

// v0.6.0: 场景清单 — 20 个跨学科应用(2D + 3D 混排)
export const SCENES = [
  {
    id: 'catenary-arch',
    title: '悬链拱顶',
    domain: '数学 × 建筑',
    icon: '🏛️',
    renderer: '3D',
    description: '悬链线 y = a·cosh(x/a) 是自然下垂的形状。倒过来就是拱顶——加泰罗尼亚建筑师高迪把它用在圣家族大教堂,只用直立石块就能搭出零弯矩拱。',
    loader: () => import('./scenes/01_catenary-arch.js'),
  },
  {
    id: 'planetary-orbits',
    title: '行星轨道',
    domain: '数学 × 物理',
    icon: '🪐',
    renderer: '3D',
    description: '开普勒三定律 + 4 颗行星(不同 e / a)同时跑,看 T² ∝ a³。',
    loader: () => import('./scenes/02_planetary-orbits.js'),
  },
  {
    id: 'fourier-synth',
    title: '傅里叶合成器',
    domain: '数学 × 音乐',
    icon: '🎵',
    renderer: '2D',
    description: '任何周期函数 = 多个 sin/cos 之和。把方波/锯齿/任意形状画成转圈的小箭头,转一圈画一圈。',
    loader: () => import('./scenes/03_fourier-synth.js'),
  },
  {
    id: 'population-dynamics',
    title: '种群动力学',
    domain: '数学 × 生物',
    icon: '🦊',
    renderer: '2D',
    description: '逻辑斯蒂增长 + 洛特卡-沃尔泰拉捕食模型。兔子和狐狸的数量会怎么互相牵制?',
    loader: () => import('./scenes/04_population-dynamics.js'),
  },
  {
    id: 'mandelbrot',
    title: '曼德尔布罗',
    domain: '数学 × 艺术',
    icon: '🌀',
    renderer: '2D',
    description: '复数 z = x + iy, 迭代 z = z² + c。哪些 c 收敛?哪些发散?边界就是分形。',
    loader: () => import('./scenes/05_mandelbrot.js'),
  },
  {
    id: 'simple-harmonic',
    title: '简谐振动',
    domain: '数学 × 物理',
    icon: '🎢',
    renderer: '2D',
    description: '弹簧 / 单摆 / 电路 + 阻尼 + 强迫振动。共振(ωF ≈ ω)时振幅暴涨。',
    loader: () => import('./scenes/06_simple-harmonic.js'),
  },
  {
    id: 'golden-spiral',
    title: '黄金螺旋',
    domain: '数学 × 艺术',
    icon: '🌻',
    renderer: '2D',
    description: 'φ = (1+√5)/2 ≈ 1.618。费波那契矩形切出来的对数螺旋。鹦鹉螺 / 向日葵 / 银河系。',
    loader: () => import('./scenes/07_golden-spiral.js'),
  },
  {
    id: 'monte-carlo',
    title: '蒙特卡洛',
    domain: '数学 × 概率',
    icon: '🎲',
    renderer: '2D',
    description: '随机投点算 π + 蒙特卡洛积分 ∫sin(x) dx。大数定律 → 投得越多越准。',
    loader: () => import('./scenes/08_monte-carlo.js'),
  },
  {
    id: 'double-pendulum',
    title: '双摆混沌',
    domain: '数学 × 物理',
    icon: '🌀',
    renderer: '2D',
    description: '两个摆串起来,初值差 0.001 几秒后轨迹完全不一样。蝴蝶效应。',
    loader: () => import('./scenes/09_double-pendulum.js'),
  },
  {
    id: 'gradient-descent',
    title: '梯度下降',
    domain: '数学 × 机器学习',
    icon: '⛰️',
    renderer: '3D',
    description: 'θ ← θ − η·∇f(θ)。3D 损失曲面 + 优化路径。学习率太大震荡,太小慢。',
    loader: () => import('./scenes/10_gradient-descent.js'),
  },
  // v0.6.0: 新增 10 个场景
  {
    id: 'lissajous',
    title: 'Lissajous 曲线',
    domain: '数学 × 音乐',
    icon: '🎼',
    renderer: '2D',
    description: '两个相互垂直的简谐运动叠加。频率比 a:b + 相位决定图形。示波器 X-Y 模式。',
    loader: () => import('./scenes/11_lissajous.js'),
  },
  {
    id: 'clt',
    title: '中心极限定理',
    domain: '数学 × 概率',
    icon: '🎯',
    renderer: '2D',
    description: '扔 N 个骰子,N 越大越像正态。独立同分布随机变量之和 → 正态分布(统计学第一定理)。',
    loader: () => import('./scenes/12_clt.js'),
  },
  {
    id: 'riemann-sum',
    title: '黎曼和',
    domain: '数学 × 工程',
    icon: '📐',
    renderer: '2D',
    description: '∫ 算不出来?用矩形/梯形/Simpson 抛物线堆。Simpson O(1/N⁴) 精度爆炸。',
    loader: () => import('./scenes/13_riemann-sum.js'),
  },
  {
    id: 'bayesian',
    title: '贝叶斯推断',
    domain: '数学 × 概率',
    icon: '🎲',
    renderer: '2D',
    description: '先验 Beta(α,β) + 似然 → 后验 Beta(α+k, β+N-k)。边观测边更新信念。',
    loader: () => import('./scenes/14_bayesian.js'),
  },
  {
    id: 'lsystem',
    title: 'L-系统植物',
    domain: '数学 × 生物',
    icon: '🌿',
    renderer: '2D',
    description: '字符串重写 + Turtle 解释。F → F[+F]F[-F]F → 树。Lindenmayer 1968 植物建模。',
    loader: () => import('./scenes/15_lsystem.js'),
  },
  {
    id: 'wave-interference',
    title: '波叠加/干涉',
    domain: '数学 × 物理',
    icon: '🌊',
    renderer: '2D',
    description: '两列波相遇 → 建设性(亮)+ 破坏性(暗)干涉条纹。移动源/改频率看图样。',
    loader: () => import('./scenes/16_wave-interference.js'),
  },
  {
    id: 'julia',
    title: '朱利亚集',
    domain: '数学 × 艺术',
    icon: '🌀',
    renderer: '2D',
    description: '跟曼德尔布罗同公式 z=z²+c,固定 c 扫 z₀。每个 c 生成独特分形。',
    loader: () => import('./scenes/17_julia.js'),
  },
  {
    id: 'lagrange',
    title: '拉格朗日乘子法',
    domain: '数学 × 优化',
    icon: '🎯',
    renderer: '2D',
    description: '约束优化:∇f = λ·∇g 切点处。固定周长围最大面积 → 圆(等周不等式)。',
    loader: () => import('./scenes/18_lagrange.js'),
  },
  {
    id: 'electric-field',
    title: '电场可视化',
    domain: '数学 × 物理',
    icon: '⚡',
    renderer: '2D',
    description: 'V = Σ qᵢ/rᵢ, E = -∇V。点电荷,看电场线 + 等势面。偶极子 / 四极子。',
    loader: () => import('./scenes/19_electric-field.js'),
  },
  {
    id: 'neural-net',
    title: '神经网络 2D 分类',
    domain: '数学 × 机器学习',
    icon: '🧠',
    renderer: '2D',
    description: '2 层 NN(2 → 8 → 2)做 2D 分类。反向传播 + SGD,看决策边界如何学出来。',
    loader: () => import('./scenes/20_neural-net.js'),
  },
];

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function initViewer(container, config = {}) {
  if (!container) throw new Error('initViewer: container 必填');
  const cfg = {
    initialScene: 'catenary-arch',
    workspace: null,             // 可选:外部传 Workspace
    callbacks: {},
    ...config,
  };

  // ---------- DOM 骨架 ----------
  const root = document.createElement('div');
  root.className = 'mathw-root';
  container.appendChild(root);

  // 顶部状态栏(v0.5 加进度)
  const statusBar = document.createElement('div');
  statusBar.className = 'mathw-statusbar';
  statusBar.innerHTML = `
    <div class="mathw-statusbar-left">
      <div class="mathw-statusbar-logo">∑</div>
      <div>
        <div style="font-weight:600;font-size:13px">MathematicsWeb</div>
        <div style="font-size:10px;color:var(--mathw-muted)">跨学科数学可视化 · v0.5.0</div>
      </div>
    </div>
    <div class="mathw-statusbar-center" data-scene-name>加载中…</div>
    <div class="mathw-statusbar-right">
      <span data-progress style="font-size:11px;color:var(--mathw-muted);margin-right:8px"></span>
      <div class="mathw-statusbar-dot" data-state="off" data-status-dot></div>
      <span style="font-size:11px;color:var(--mathw-muted)" data-status-text>未连接</span>
    </div>
  `;
  root.appendChild(statusBar);

  // 左侧场景列表(v0.5 加收藏 / 进度 / 过滤)
  const sceneList = document.createElement('div');
  sceneList.className = 'mathw-scene-list';
  sceneList.innerHTML = `
    <div class="mathw-scene-list-header">场景库 · ${SCENES.length} 个跨学科</div>
    <div class="mathw-scene-filter">
      <button class="mathw-filter-btn active" data-filter="all">全部</button>
      <button class="mathw-filter-btn" data-filter="fav">⭐ 收藏</button>
      <button class="mathw-filter-btn" data-filter="unvisited">未访问</button>
    </div>
    <div class="mathw-scene-items" data-list></div>
  `;
  root.appendChild(sceneList);

  // 中央画布 host
  const canvasHost = document.createElement('div');
  canvasHost.className = 'mathw-canvas-host';
  root.appendChild(canvasHost);

  // 右侧 AI 面板
  const aiPanel = new AIPanel({ root });
  aiPanel.mount();
  aiPanel.setLLMStatus('mock', 'mock');
  aiPanel.appendSystem('MathematicsWeb v0.5.0 启动…');

  // ---------- Workspace(v0.5) ----------
  const ws = cfg.workspace;
  let currentFilter = 'all';
  let currentScene = null;
  let currentSceneId = null;   // 提到 renderSceneList 之前,避免 let 暂时性死区

  function renderSceneList() {
    const list = sceneList.querySelector('[data-list]');
    const filtered = SCENES.filter(s => {
      if (currentFilter === 'fav') return ws && ws.isFavorite(s.id);
      if (currentFilter === 'unvisited') return !ws || !ws.isVisited(s.id);
      return true;
    });
    if (filtered.length === 0) {
      list.innerHTML = `<div style="padding:20px 12px;color:var(--mathw-muted);font-size:12px;text-align:center">${currentFilter === 'fav' ? '还没收藏场景' : '都访问过了 ✨'}</div>`;
      return;
    }
    list.innerHTML = filtered.map(s => {
      const isFav = ws && ws.isFavorite(s.id);
      const isVisited = ws && ws.isVisited(s.id);
      const isActive = s.id === currentSceneId;
      return `
        <div class="mathw-scene-item${isActive ? ' active' : ''}" data-scene-id="${s.id}">
          <span class="mathw-scene-icon">${s.icon}</span>
          <div class="mathw-scene-meta">
            <span class="mathw-scene-title">${escapeHtml(s.title)}</span>
            <span class="mathw-scene-domain">${escapeHtml(s.domain)} · ${s.renderer}</span>
          </div>
          <span class="mathw-scene-fav${isFav ? ' active' : ''}" data-fav="${s.id}" title="${isFav ? '取消收藏' : '收藏'}">${isFav ? '★' : '☆'}</span>
          ${isVisited ? '<span class="mathw-scene-visited" title="已访问">✓</span>' : ''}
        </div>
      `;
    }).join('');
  }

  function updateProgress() {
    const el = statusBar.querySelector('[data-progress]');
    if (!el || !ws) return;
    const total = SCENES.length;
    const visited = ws.visited.length;
    el.textContent = `进度 ${visited}/${total}`;
    el.title = `已访问 ${visited} / 总 ${total} 个场景`;
  }

  if (ws) {
    ws.onChange(() => {
      renderSceneList();
      updateProgress();
    });
    renderSceneList();
    updateProgress();
  } else {
    // 没有 workspace(向后兼容),降级渲染
    sceneList.querySelector('[data-list]').innerHTML = SCENES.map(s => `
      <div class="mathw-scene-item" data-scene-id="${s.id}">
        <span class="mathw-scene-icon">${s.icon}</span>
        <div class="mathw-scene-meta">
          <span class="mathw-scene-title">${escapeHtml(s.title)}</span>
          <span class="mathw-scene-domain">${escapeHtml(s.domain)} · ${s.renderer}</span>
        </div>
      </div>
    `).join('');
  }

  // 过滤器
  sceneList.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      sceneList.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b === btn));
      currentFilter = btn.dataset.filter;
      renderSceneList();
    });
  });

  // 收藏 + 场景项 点击
  sceneList.addEventListener('click', (e) => {
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      e.stopPropagation();
      if (ws) {
        ws.toggleFavorite(favBtn.dataset.fav);
      }
      return;
    }
    const item = e.target.closest('.mathw-scene-item');
    if (item) switchScene(item.dataset.sceneId);
  });

  // ---------- 场景切换 ----------

  async function switchScene(sceneId) {
    const scene = SCENES.find(s => s.id === sceneId);
    if (!scene) { console.warn('未知场景', sceneId); return; }
    if (currentSceneId === sceneId) return;

    // 旧场景:先 save state 再 destroy
    if (currentScene && typeof currentScene.destroy === 'function') {
      if (ws && typeof currentScene.getState === 'function') {
        try { await ws.saveSceneParams(currentSceneId, currentScene.getState()); } catch (_) {}
      }
      try { currentScene.destroy(); } catch (e) { console.warn('destroy', e); }
    }
    currentScene = null;
    canvasHost.innerHTML = '';

    // 高亮 + 状态栏
    sceneList.querySelectorAll('.mathw-scene-item').forEach(el => {
      el.classList.toggle('active', el.dataset.sceneId === sceneId);
    });
    statusBar.querySelector('[data-scene-name]').textContent = scene.title + ' · ' + scene.domain;

    // 加载新场景
    try {
      const mod = await scene.loader();
      const factory = mod.default || mod.createScene || mod.initScene;
      if (typeof factory !== 'function') {
        throw new Error(`场景 ${sceneId} 没导出 default/createScene/initScene 函数`);
      }
      const instance = factory(canvasHost, { aiPanel });
      currentScene = instance;
      currentSceneId = sceneId;

      // 恢复上次参数(如果有)
      if (ws && typeof instance.setState === 'function') {
        const saved = ws.getSceneParams(sceneId);
        if (saved) {
          try { instance.setState(saved); } catch (e) { console.warn('setState', e); }
        }
      }

      // 标记访问
      if (ws) ws.markVisited(sceneId);
      // 记 last scene
      if (ws) ws.setLastScene(sceneId);

      aiPanel.setActiveScene(scene, instance);
      aiPanel.appendSystem(`✅ 进入「${scene.title}」· ${scene.renderer}`);
      cfg.callbacks.onSceneChange && cfg.callbacks.onSceneChange(sceneId);
    } catch (e) {
      console.error('[mathw] 场景加载失败', e);
      aiPanel.appendSystem(`❌ 场景「${scene.title}」加载失败: ${e.message}`);
      cfg.callbacks.onError && cfg.callbacks.onError(e);
    }
  }

  // 状态栏
  const statusDot = statusBar.querySelector('[data-status-dot]');
  const statusText = statusBar.querySelector('[data-status-text]');
  aiPanel.onLLMStatusChange = (status, label) => {
    if (statusDot) {
      statusDot.dataset.state = ({ real: 'on', mock: 'busy', connecting: 'busy', error: 'error', 'no-key': 'off' })[status] || 'off';
    }
    if (statusText) statusText.textContent = label;
  };

  // 公开 API
  const viewer = {
    root,
    canvasHost,
    aiPanel,
    workspace: ws,
    switchScene,
    getCurrentSceneId: () => currentSceneId,
    getCurrentScene: () => currentScene,
    SCENES,
    destroy() {
      if (currentScene && typeof currentScene.destroy === 'function') {
        try { currentScene.destroy(); } catch (e) { /* noop */ }
      }
      aiPanel.destroy && aiPanel.destroy();
      root.remove();
    },
  };

  // 启动:优先用 last scene(有 ws 时),否则用 initialScene
  let startScene = cfg.initialScene;
  if (ws && ws.lastScene && SCENES.find(s => s.id === ws.lastScene)) {
    startScene = ws.lastScene;
    aiPanel.appendSystem(`📂 恢复上次: 「${SCENES.find(s => s.id === ws.lastScene).title}」`);
  }
  switchScene(startScene);

  return viewer;
}
