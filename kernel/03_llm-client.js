// kernel/03_llm-client.js
// MathematicsWeb v0.6.0 — LLM 客户端(走后端代理,key 不暴露到浏览器)
// v0.6.0 改:浏览器不再直连 api.minimaxi.com,改调本地 /api/chat
//   - key 放 server 端(环境变量 M3_API_KEY 或 _llm_config.json)
//   - 前端只看到"对端是 localhost",看不到 key
//   - 没 key 时 server 返回 mock 风格回复,app 仍然能跑(断网能跑)
//
// 用法:
//   const cfg = await loadLLMConfig();   // 读 _llm_config.json
//   const client = new LLMClient(cfg);    // 客户端(浏览器这边不需要 key)
//   const r = await client.chat(prompt, { messages });

const DEFAULT_CONFIG = {
  enabled: false,
  provider: 'minimaxi',
  // v0.6.0: 默认走本地 server 代理(不暴露 key)
  base_url: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8765'}/api/chat`,
  proxy_mode: true,           // v0.6.0 新增:true=走 server 代理,false=直连(危险,key 暴露)
  api_key: '',                // 浏览器端用不到,但保留兼容
  model: 'Minimax-M3',
  system_prompt: '你是一位擅长把数学讲活的老师。回答要短(100-200 字),用直觉,举生活例子。如果涉及公式,放在 ```formula ... ``` 块里。',
  timeout_ms: 30000,
};

export async function loadLLMConfig() {
  // 浏览器 fetch 读 _llm_config.json(只读,本地服务)
  // v0.6.0 起:配置主要在 server 端(env / 服务端文件),前端读这个文件主要是为了展示状态
  try {
    const r = await fetch('./_llm_config.json?_=' + Date.now());
    if (!r.ok) return { ...DEFAULT_CONFIG };
    const data = await r.json();
    return { ...DEFAULT_CONFIG, ...data };
  } catch (e) {
    return { ...DEFAULT_CONFIG };
  }
}

export class LLMClient {
  constructor(cfg) {
    this.cfg = cfg;
    this.baseUrl = (cfg.base_url || DEFAULT_CONFIG.base_url).replace(/\/+$/, '');
    this.timeout = cfg.timeout_ms || 30000;
    this.proxyMode = cfg.proxy_mode !== false;  // 默认 true
  }

  // 探测连通:用 GET /api/health(对 proxy 模式)或 /models(对直连)
  async ping() {
    if (this.proxyMode) {
      // proxy 模式:试 /api/health
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      try {
        const r = await fetch(this.baseUrl.replace(/\/api\/chat$/, '/api/health'), { signal: ctrl.signal });
        clearTimeout(timer);
        if (!r.ok) return { ok: false, msg: `HTTP ${r.status}`, latency_ms: 0 };
        const data = await r.json();
        const t0 = performance.now();
        return {
          ok: !!data.ok && !!data.m3_has_key,
          msg: data.m3_has_key ? `M3 ${data.m3_model} · ${data.m3_enabled ? 'enabled' : 'no key'}` : 'server up but no M3 key',
          latency_ms: Math.round(performance.now() - t0),
          source: 'proxy',
        };
      } catch (e) {
        clearTimeout(timer);
        return { ok: false, msg: e.name === 'AbortError' ? '超时' : (e.message || String(e)), latency_ms: 0 };
      }
    }
    // 直连模式(老路径,key 暴露,不推荐)
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const r = await fetch(this.baseUrl + '/models', {
        headers: { 'Authorization': 'Bearer ' + (this.cfg.api_key || '') },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const dt = Math.round(performance.now() - 0);
      if (r.ok) return { ok: true, msg: '连通(直连模式,key 已暴露)', latency_ms: dt };
      return { ok: false, msg: `HTTP ${r.status}`, latency_ms: dt };
    } catch (e) {
      clearTimeout(timer);
      return { ok: false, msg: e.name === 'AbortError' ? '超时' : (e.message || String(e)), latency_ms: 0 };
    }
  }

  // 聊天
  // opts: { system, messages, sceneContext, scene }
  async chat(prompt, opts = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeout);
    const sys = opts.system || this.cfg.system_prompt || DEFAULT_CONFIG.system_prompt;
    // 场景上下文
    let sceneContext = opts.sceneContext || '';
    if (!sceneContext && opts.scene) {
      const title = opts.scene.title || '';
      const domain = opts.scene.domain || '';
      const formula = opts.scene.formula || '';
      if (title) sceneContext = `[当前场景:${title}${domain ? ' · ' + domain : ''}]${formula ? '\n[场景公式] ' + formula : ''}`;
    }
    try {
      const r = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          system: sys,
          scene_context: sceneContext,
          temperature: 0.7,
          max_tokens: 1024,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!r.ok) {
        const body = await r.text();
        throw new Error(`HTTP ${r.status}: ${body.slice(0, 200)}`);
      }
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      return this._normalize(data);
    } catch (e) {
      clearTimeout(timer);
      if (e.name === 'AbortError') throw new Error('请求超时');
      throw e;
    }
  }

  // 直连模式(老路径,key 暴露)
  async _directChat(prompt, sys) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeout);
    try {
      const r = await fetch(this.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (this.cfg.api_key || ''),
        },
        body: JSON.stringify({
          model: this.cfg.model,
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!r.ok) {
        const body = await r.text();
        throw new Error(`HTTP ${r.status}: ${body.slice(0, 200)}`);
      }
      const data = await r.json();
      const text = data.choices?.[0]?.message?.content || '';
      return this._normalize({ text, formula: '', source: 'direct' });
    } catch (e) {
      clearTimeout(timer);
      if (e.name === 'AbortError') throw new Error('请求超时');
      throw e;
    }
  }

  _normalize(data) {
    // server 已经把 ```formula``` 块剥出来;前端再保险一次
    let text = data.text || '';
    let formula = data.formula || '';
    if (!formula) {
      const m = /```formula\s*([\s\S]+?)```/.exec(text);
      if (m) {
        formula = m[1].trim();
        text = text.replace(m[0], '').trim();
      }
    }
    return { text, formula, source: data.source || 'unknown', model: data.model };
  }
}
