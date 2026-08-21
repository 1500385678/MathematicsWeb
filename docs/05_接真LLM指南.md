# 05_接真LLM指南 · MathematicsWeb v0.2.0

> MathematicsWeb 默认走本地 mock(无 key、断网能跑)。
> 想接真 LLM(OpenAI / Azure / 本地 llama.cpp / Ollama 之类 OpenAI 兼容端点),按下面 3 步走。

## 1. 复制模板

```powershell
# Windows
copy _llm_config.example.json _llm_config.json
```

```bash
# macOS / Linux
cp _llm_config.example.json _llm_config.json
```

## 2. 填 key

```json
{
  "enabled": true,
  "base_url": "https://api.openai.com/v1",
  "api_key": "sk-xxxxxxxxxxxx",
  "model": "gpt-4o-mini",
  "timeout_ms": 30000
}
```

字段说明:
- `enabled`: 总开关,改 `true` 启用真 LLM
- `base_url`: 任何 OpenAI 兼容协议的 base URL
  - OpenAI 官方:`https://api.openai.com/v1`
  - Azure OpenAI:`https://<your-resource>.openai.azure.com/openai/deployments/<your-deployment>`
  - Ollama 本地:`http://localhost:11434/v1`(Ollama 假装自己是 OpenAI)
  - llama.cpp server:`http://localhost:8080/v1`
  - 第三方中转(closeai 等):各家不一样
- `api_key`: 你的 key
- `model`: 模型名(看 base_url 服务端支持的)
- `timeout_ms`: 30 秒默认,本地 LLM 可以改小

## 3. 刷新页面

启动数学网站,右下角 AI 面板会:
1. 自动 ping `/models` 测连通
2. 通了就切到真 LLM(右上角状态点变绿 + 标真实模型名)
3. 不通就降级 mock + 提示

**`api_key` 写在 `_llm_config.json` 里,已经在 `.gitignore` 里,不会进 git。**

## 4. 测试 / 调试 URL

| URL | 行为 |
|---|---|
| `http://localhost:8765/` | 默认走配置,失败降级 mock |
| `http://localhost:8765/?force=mock` | 强制 mock,跳过配置 |
| `http://localhost:8765/?noai=1` | 关闭 AI 面板 |

## 5. 验证端到端

配完 key,刷新页面,问 AI "讲讲悬链拱顶"。如果回的内容是关于 `cosh` 的,就是真 LLM 通了;如果回的是 mock 的预设短文,就是 mock 模式。

调试路径:
1. 浏览器 console 看 `[mathw] LLM 未连通` / `已切到真 LLM` 提示
2. 右上角状态点:绿=真 LLM,黄=mock
3. 在 console 跑 `window.ai.llm.ping()` 看连通状态

## 6. 自带 mock 的设计意图

不开 API key、纯断网环境,所有场景仍然能跑 + AI 也能"假装讲课"。这跟 three.jsWeb / canvasweb 范式一致 — **断网能跑是底线**。
