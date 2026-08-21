// kernel/03_llm-client.js
// MathematicsWeb v0.1.0 — LLM API 客户端
// 跟 three.jsWeb kernel/03_llm-client.js 同模式(读 _llm_config.json + 兼容 OpenAI 协议)
// 但调用面更简单:chat(prompt) → { text, formula }
//
// v0.1.0 范围:支持 OpenAI 兼容协议(本地 LLM 端点, 走 base_url + api_key)
//           mock 模式走 mock/01_llm-mock.js

const DEFAULT_CONFIG = {
  enabled: false,
  base_url: '',
  api_key: '',
  model: 'gpt-4o-mini',
  timeout_ms: 30000,
};

export async function loadLLMConfig() {
  // 浏览器里 fetch 不到 _llm_config.json(本地静态资源,得通过 http server)
  // 跟 three.jsWeb 一样,失败时返回默认禁用状态
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
    this.baseUrl = (cfg.base_url || '').replace(/\/+$/, '');
    this.apiKey = cfg.api_key || '';
    this.model = cfg.model || 'gpt-4o-mini';
    this.timeout = cfg.timeout_ms || 30000;
  }

  async ping() {
    if (!this.baseUrl || !this.apiKey) {
      return { ok: false, msg: 'base_url 或 api_key 为空', latency_ms: 0 };
    }
    const t0 = performance.now();
    try {
      // 尝试 models 端点(OpenAI 兼容)
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch(this.baseUrl + '/models', {
        headers: { 'Authorization': 'Bearer ' + this.apiKey },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const dt = Math.round(performance.now() - t0);
      if (r.ok) return { ok: true, msg: '连通', latency_ms: dt };
      return { ok: false, msg: `HTTP ${r.status}`, latency_ms: dt };
    } catch (e) {
      const dt = Math.round(performance.now() - t0);
      return { ok: false, msg: e.name === 'AbortError' ? '超时' : (e.message || String(e)), latency_ms: dt };
    }
  }

  // v0.1.0 简化:prompt → { text, formula }
  // 让 LLM 在回复里用 ```formula ... ``` 标注公式(可选)
  async chat(prompt, opts = {}) {
    if (!this.baseUrl || !this.apiKey) throw new Error('LLM 未配置');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeout);
    try {
      const r = await fetch(this.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.apiKey,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: this._systemPrompt() },
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
      return this._parse(text);
    } catch (e) {
      clearTimeout(timer);
      if (e.name === 'AbortError') throw new Error('请求超时');
      throw e;
    }
  }

  _systemPrompt() {
    return '你是一位擅长把数学讲活的老师。回答要短(100-200 字),用直觉,举生活例子。如果涉及公式,放在 ```formula ... ``` 块里。';
  }

  _parse(text) {
    const m = /```formula\s*([\s\S]+?)```/.exec(text);
    const formula = m ? m[1].trim() : '';
    const plain = m ? text.replace(m[0], '').trim() : text;
    return { text: plain, formula };
  }
}
