# MathematicsWeb · v0.6.0 · 一体化服务器
# 用法:
#   set M3_API_KEY=sk-cp-...          (Windows PowerShell)
#   export M3_API_KEY=sk-cp-...        (macOS/Linux)
#   python server.py                   # 启动 http://localhost:8765
#
# 职责:
#   1) 静态文件服务(index.html / viewer/ / kernel/ / vendor/...)
#   2) POST /api/chat — M3 代理(后端持有 key,不暴露给浏览器)
#   3) GET  /api/health  — 健康检查
#
# 跟 canvasweb 一样,key 不进 git(_llm_config.json 是本地配置,gitignore)。
# 优先用 M3_API_KEY 环境变量(更安全),其次 _llm_config.json。

import http.server
import json
import os
import re
import sys
import urllib.request
import urllib.error
from http import HTTPStatus
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
PORT = int(os.environ.get('MATHW_PORT', '8765'))


# ---------- 加载 M3 配置(优先 env,其次 _llm_config.json) ----------
def load_m3_config():
    cfg = {
        'enabled': False,
        'base_url': os.environ.get('M3_BASE', 'https://api.minimaxi.com/v1'),
        'api_key': os.environ.get('M3_API_KEY', ''),
        'model': os.environ.get('M3_MODEL', 'Minimax-M3'),
        'system_prompt': os.environ.get('M3_SYSTEM', ''),
    }
    config_path = ROOT / '_llm_config.json'
    if config_path.exists():
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            for k in ('enabled', 'base_url', 'api_key', 'model', 'system_prompt'):
                if k in data and data[k]:
                    cfg[k] = data[k]
        except Exception as e:
            print(f'⚠️  读 _llm_config.json 失败:{e}', file=sys.stderr)
    cfg['enabled'] = bool(cfg['api_key']) and cfg.get('enabled', True)
    return cfg


M3 = load_m3_config()


# ---------- HTTP 处理器 ----------
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        # 自定义日志格式(简化,ASCII only)
        try:
            sys.stderr.write(f'  [{self.command}] {self.path}\n')
        except Exception:
            pass

    # 静音默认 access log
    def end_headers(self):
        # 防止浏览器缓存(开发友好)
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        # CORS(允许任意 origin,本地 dev 用)
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/chat':
            self.handle_chat()
        elif self.path == '/api/health':
            self.handle_health()
        else:
            self.send_json({'error': f'Not found: {self.path}'}, 404)

    def do_GET(self):
        if self.path == '/api/health':
            self.handle_health()
        else:
            super().do_GET()

    def handle_health(self):
        self.send_json({
            'ok': True,
            'm3_enabled': M3['enabled'],
            'm3_model': M3['model'],
            'm3_base': M3['base_url'],
            'm3_has_key': bool(M3['api_key']),
            'version': '0.6.0',
        })

    def handle_chat(self):
        # 读 body
        length = int(self.headers.get('Content-Length', 0))
        try:
            body = self.rfile.read(length).decode('utf-8')
            req = json.loads(body) if body else {}
        except Exception as e:
            self.send_json({'error': f'Invalid JSON: {e}'}, 400)
            return

        prompt = req.get('prompt', '').strip()
        system = req.get('system', '').strip()
        temperature = float(req.get('temperature', 0.7))
        max_tokens = int(req.get('max_tokens', 1024))
        scene_context = req.get('scene_context', '')  # 场景名/公式等

        if not prompt:
            self.send_json({'error': 'No prompt'}, 400)
            return

        # 如果有场景上下文,追加到 system
        if scene_context:
            system = (system or M3.get('system_prompt') or '') + '\n\n' + scene_context

        # 没有 key → 返回 mock
        if not M3['enabled'] or not M3['api_key']:
            self.send_json(self._mock_reply(prompt, scene_context))
            return

        # 调 M3
        try:
            url = M3['base_url'].rstrip('/') + '/chat/completions'
            payload = {
                'model': M3['model'],
                'messages': [
                    {'role': 'system', 'content': system or M3.get('system_prompt') or '你是数学老师。'},
                    {'role': 'user', 'content': prompt},
                ],
                'temperature': temperature,
                'max_tokens': max_tokens,
            }
            req2 = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + M3['api_key'],
                },
            )
            with urllib.request.urlopen(req2, timeout=30) as r:
                data = json.loads(r.read())
            text = data['choices'][0]['message']['content']
            # 提取 ```formula ... ```
            m = re.search(r'```formula\s*([\s\S]+?)```', text)
            formula = m.group(1).strip() if m else ''
            if m:
                text = text.replace(m.group(0), '').strip()
            self.send_json({
                'text': text,
                'formula': formula,
                'source': 'm3',
                'model': M3['model'],
            })
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8', errors='replace')[:300]
            self.send_json({
                'error': f'M3 API HTTP {e.code}: {err_body}',
                'source': 'm3-error',
            }, 502)
        except Exception as e:
            self.send_json({
                'error': f'M3 调用失败: {type(e).__name__}: {e}',
                'source': 'm3-error',
            }, 500)

    def _mock_reply(self, prompt, scene_context):
        """无 key 时的本地兜底回复,保证断网/无 key 也能用。"""
        text = ''
        formula = ''
        # 简单关键词匹配(跟 mock/01_llm-mock.js 一致)
        if '当前场景' in scene_context or scene_context:
            if '悬链' in scene_context or 'cosh' in scene_context:
                text = '悬链线 y = a·cosh(x/a) 是均匀绳子只受重力时自然下垂的形状。高迪把它用在圣家族大教堂。'
                formula = 'y = a·cosh(x/a)'
            elif '行星' in scene_context or '开普勒' in scene_context:
                text = '行星轨道是椭圆,太阳在焦点。T² 与 a³ 成正比(开普勒第三定律)。'
                formula = 'T² ∝ a³'
            elif '傅里叶' in scene_context:
                text = '任何周期函数 = 多个 sin/cos 之和。'
                formula = 'f(t) = Σ aₙ·sin(nωt+φₙ)'
            elif '曼德尔布罗' in scene_context or 'Mandelbrot' in scene_context:
                text = '复数迭代 z = z² + c,边界是分形。'
                formula = 'z_{n+1} = z_n² + c'
            elif '梯度' in scene_context or 'Gradient' in scene_context:
                text = 'θ ← θ − η·∇f(θ)。学习率大震荡,小慢。'
                formula = 'θ ← θ − η·∇f(θ)'
            else:
                text = f'[mock - 没设 M3_API_KEY]\n场景:{scene_context[:80]}'
        else:
            text = f'[mock - 没设 M3_API_KEY]\n你的问题:{prompt[:80]}...'
        return {
            'text': text,
            'formula': formula,
            'source': 'mock',
        }

    def send_json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        try:
            self.wfile.write(body)
        except BrokenPipeError:
            pass


def main():
    # 强制 UTF-8 输出(Windows GBK 不认 emoji)
    import sys
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

    print('=' * 60)
    print('MathematicsWeb v0.6.0 · integrated server')
    print('=' * 60)
    print(f'  Port:       {PORT}')
    print(f'  Root:       {ROOT}')
    print(f'  M3 endpoint:{M3["base_url"]}')
    print(f'  M3 model:   {M3["model"]}')
    if M3['api_key']:
        print(f'  M3 key:     set ({M3["api_key"][:8]}...)')
    else:
        print('  M3 key:     [NOT SET]  (AI will use local mock)')
    print(f'  Health:     http://localhost:{PORT}/api/health')
    print()
    if not M3['enabled'] or not M3['api_key']:
        print('  [INFO] No M3_API_KEY detected - AI panel will use local mock')
        print('  To enable M3: set M3_API_KEY env var and restart')
        print('    PowerShell:  $env:M3_API_KEY = "sk-cp-..."')
        print('    macOS/Linux: export M3_API_KEY="sk-cp-..."')
        print()
    print('  Press Ctrl+C to stop')
    print('=' * 60)

    server = http.server.ThreadingHTTPServer(('0.0.0.0', PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('  Stopping...')
        server.shutdown()


if __name__ == '__main__':
    main()
