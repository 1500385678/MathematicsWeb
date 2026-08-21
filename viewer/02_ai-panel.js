// viewer/02_ai-panel.js
// MathematicsWeb v0.6.2 — AI 助手面板
// 设计目标:
//   - 跟 three.jsWeb 02_ai-panel.js 同结构(支持 mock/real LLM 切换)
//   - 教学场景化:把"当前场景"作为上下文传给 LLM
//   - 收到公式时,自动用 <div class="mathw-ai-msg-formula"> 渲染
//
// 用法:
//   const panel = new AIPanel({ root });
//   panel.mount();
//   panel.setActiveScene(scene, instance);
//   panel.appendUserMsg('这个公式怎么理解?');

import { LLMMock } from '../mock/01_llm-mock.js';

const MATHW = (typeof window !== 'undefined') ? (window.MATHW = window.MATHW || {}) : {};

export class AIPanel {
  constructor(opts = {}) {
    this.root = opts.root || document.body;
    this.container = null;
    this.listEl = null;
    this.inputEl = null;
    this.sendBtn = null;
    this.collapsed = false;
    this.messages = [];
    this._running = false;
    this.llm = opts.llm || new LLMMock();
    this.activeScene = null;       // 当前场景元数据(SCENES 项)
    this.activeInstance = null;    // 当前场景实例(暴露 getLesson/getState)
    this.onLLMStatusChange = null; // 外部订阅:状态变化
    this._listeners = [];
  }

  _on(elem, event, handler, opts) {
    if (!elem) return;
    elem.addEventListener(event, handler, opts);
    this._listeners.push([elem, event, handler, opts]);
  }

  mount() {
    if (this.container) return this.container;
    const c = document.createElement('div');
    c.className = 'mathw-ai-panel';
    c.innerHTML = `
      <div class="mathw-ai-header">
        <div class="mathw-ai-title">
          <div class="mathw-ai-mark">AI</div>
          <div class="mathw-ai-title-text">
            <div class="mathw-ai-title-main">数学老师 · 大模型</div>
            <div class="mathw-ai-title-sub">
              <span class="mathw-ai-dot" data-status="mock"></span>
              <span data-sub>v0.6.2 · mock</span>
            </div>
          </div>
        </div>
        <div class="mathw-ai-tools">
          <button data-act="ask" title="讲讲当前场景">💡 讲讲</button>
          <button data-act="ping" title="测 LLM 连通">⚡</button>
          <button data-act="clear" title="清空对话">🗑</button>
        </div>
      </div>
      <div class="mathw-ai-list" data-list>
        <div class="mathw-ai-welcome">
          <div class="mathw-ai-welcome-title">👋 数学可视化助手</div>
          <div class="mathw-ai-welcome-sub">左侧选场景,这里问问题。试试"讲讲"按钮让 AI 解读当前画面。</div>
          <div class="mathw-ai-suggest">
            <button data-quick="讲讲当前场景的数学原理">讲讲当前场景的数学原理</button>
            <button data-quick="给我一个现实中的应用例子">给我一个现实中的应用例子</button>
            <button data-quick="背后的公式怎么推导?">背后的公式怎么推导?</button>
            <button data-quick="调一下参数能看到什么?">调一下参数能看到什么?</button>
          </div>
        </div>
      </div>
      <div class="mathw-ai-input">
        <input data-input type="text" placeholder="问点什么…" />
        <button data-send>发送</button>
      </div>
    `;
    this.root.appendChild(c);
    this.container = c;
    this.listEl = c.querySelector('[data-list]');
    this.inputEl = c.querySelector('[data-input]');
    this.sendBtn = c.querySelector('[data-send]');

    this._on(this.sendBtn, 'click', () => this._handleSend());
    this._on(this.inputEl, 'keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._handleSend(); } });
    this._on(c.querySelector('[data-act="ask"]'), 'click', () => {
      this.appendUserMsg('讲讲当前场景的数学原理');
      this._callLLM('讲讲当前场景的数学原理');
    });
    this._on(c.querySelector('[data-act="ping"]'), 'click', () => this._pingLLM());
    this._on(c.querySelector('[data-act="clear"]'), 'click', () => this._clear());
    c.querySelectorAll('[data-quick]').forEach(btn => {
      this._on(btn, 'click', () => {
        const q = btn.dataset.quick;
        this.appendUserMsg(q);
        this._callLLM(q);
      });
    });
    return c;
  }

  setActiveScene(scene, instance) {
    this.activeScene = scene;
    this.activeInstance = instance;
  }

  setLLMStatus(status, label = '') {
    const dot = this.container?.querySelector('.mathw-ai-dot');
    const sub = this.container?.querySelector('[data-sub]');
    if (dot) dot.dataset.status = status;
    if (sub) sub.textContent = `v0.6.2 · ${label || status}`;
    this._status = status;
    this._statusLabel = label;
    this.onLLMStatusChange && this.onLLMStatusChange(status, label);
  }

  _setHint(msg) {
    this.appendSystem(msg);
  }

  appendSystem(text) {
    if (!this.listEl) return;
    const el = document.createElement('div');
    el.className = 'mathw-ai-msg mathw-ai-msg-system';
    el.textContent = text;
    this.listEl.appendChild(el);
    this._scrollDown();
  }

  appendUserMsg(text) {
    if (!this.listEl) return;
    this.messages.push({ role: 'user', content: text });
    const el = document.createElement('div');
    el.className = 'mathw-ai-msg mathw-ai-msg-user';
    el.textContent = text;
    this.listEl.appendChild(el);
    this._scrollDown();
  }

  _appendAssistantMsg() {
    const el = document.createElement('div');
    el.className = 'mathw-ai-msg mathw-ai-msg-assistant';
    el.innerHTML = '<span class="mathw-ai-thinking">思考中</span>';
    this.listEl.appendChild(el);
    this._scrollDown();
    return el;
  }

  _appendFormula(text) {
    if (!this.listEl) return;
    const el = document.createElement('div');
    el.className = 'mathw-ai-msg mathw-ai-msg-formula';
    el.textContent = text;
    this.listEl.appendChild(el);
    this._scrollDown();
  }

  _scrollDown() {
    if (this.listEl) this.listEl.scrollTop = this.listEl.scrollHeight;
  }

  _clear() {
    if (!this.listEl) return;
    this.listEl.innerHTML = '';
    this.messages = [];
    this.appendSystem('对话已清空');
  }

  async _pingLLM() {
    this.appendSystem('⚡ 测 LLM 连通…');
    try {
      const t0 = performance.now();
      const r = await this.llm.ping();
      const dt = Math.round(performance.now() - t0);
      if (r.ok) {
        this.appendSystem(`✅ LLM 连通 · ${r.msg} · ${r.latency_ms || dt}ms`);
      } else {
        this.appendSystem(`❌ LLM 未连通: ${r.msg} · ${r.latency_ms || dt}ms`);
      }
    } catch (e) {
      this.appendSystem(`❌ 测 LLM 失败: ${e.message || e}`);
    }
  }

  async _handleSend() {
    const text = (this.inputEl.value || '').trim();
    if (!text || this._running) return;
    this.inputEl.value = '';
    this.appendUserMsg(text);
    await this._callLLM(text);
  }

  async _callLLM(prompt) {
    if (this._running) return;
    this._running = true;
    this.sendBtn.disabled = true;
    this.inputEl.disabled = true;
    const el = this._appendAssistantMsg();

    // 构造上下文:当前场景 + 公式(如果有)+ 状态
    const sceneCtx = this._buildSceneContext();
    const fullPrompt = sceneCtx
      ? `[当前场景: ${sceneCtx.title} (${sceneCtx.domain})]\n[场景公式: ${sceneCtx.formula || '无'}]\n[用户问题] ${prompt}`
      : prompt;

    try {
      const res = await this.llm.chat(fullPrompt, { messages: this.messages });
      // mock 返回 {text, formula}
      // 渲染
      el.innerHTML = '';
      const textEl = document.createElement('div');
      textEl.textContent = res.text || '(无回复)';
      el.appendChild(textEl);
      if (res.formula) this._appendFormula(res.formula);
      this.messages.push({ role: 'assistant', content: res.text || '' });
    } catch (e) {
      el.innerHTML = '';
      el.textContent = '❌ LLM 错误: ' + (e.message || e);
    } finally {
      this._running = false;
      this.sendBtn.disabled = false;
      this.inputEl.disabled = false;
      this.inputEl.focus();
    }
  }

  _buildSceneContext() {
    if (!this.activeScene) return null;
    let formula = '';
    if (this.activeInstance && typeof this.activeInstance.getFormula === 'function') {
      try { formula = this.activeInstance.getFormula() || ''; } catch (_) {}
    }
    return {
      title: this.activeScene.title,
      domain: this.activeScene.domain,
      formula,
    };
  }

  destroy() {
    this._listeners.forEach(([el, ev, fn, opts]) => {
      try { el.removeEventListener(ev, fn, opts); } catch (_) {}
    });
    this._listeners = [];
    if (this.container) this.container.remove();
  }
}
